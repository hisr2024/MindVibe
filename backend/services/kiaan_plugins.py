"""
KIAAN Plugin System - Extensible Tool Framework

This module provides KIAAN with a plugin architecture:
1. Plugin Discovery - Auto-load plugins from directories
2. Plugin Validation - Ensure plugins meet requirements
3. Plugin Lifecycle - Install, enable, disable, uninstall
4. Custom Tools - User-defined tools via plugins
5. Plugin Marketplace - Share and discover plugins
"""

import asyncio
import hashlib
import importlib.util
import inspect
import json
import logging
import os
import shutil
import sys
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Optional, Type

from backend.services.kiaan_agent_tools import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class PluginStatus(str, Enum):
    """Plugin lifecycle status."""
    DISCOVERED = "discovered"
    VALIDATED = "validated"
    INSTALLED = "installed"
    ENABLED = "enabled"
    DISABLED = "disabled"
    ERROR = "error"
    INCOMPATIBLE = "incompatible"


class PluginCategory(str, Enum):
    """Categories of plugins."""
    TOOL = "tool"  # Adds new tools
    PROVIDER = "provider"  # Adds model providers
    MEMORY = "memory"  # Memory enhancements
    INTEGRATION = "integration"  # External integrations
    UTILITY = "utility"  # Utility functions


@dataclass
class PluginMetadata:
    """Metadata for a plugin."""
    name: str
    version: str
    description: str
    author: str
    category: PluginCategory
    dependencies: list[str] = field(default_factory=list)
    kiaan_version: str = ">=2.0.0"
    homepage: Optional[str] = None
    license: Optional[str] = None
    tags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "author": self.author,
            "category": self.category.value,
            "dependencies": self.dependencies,
            "kiaan_version": self.kiaan_version,
            "homepage": self.homepage,
            "license": self.license,
            "tags": self.tags
        }

    @classmethod
    def from_dict(cls, data: dict) -> "PluginMetadata":
        return cls(
            name=data["name"],
            version=data["version"],
            description=data["description"],
            author=data["author"],
            category=PluginCategory(data["category"]),
            dependencies=data.get("dependencies", []),
            kiaan_version=data.get("kiaan_version", ">=2.0.0"),
            homepage=data.get("homepage"),
            license=data.get("license"),
            tags=data.get("tags", [])
        )


@dataclass
class Plugin:
    """A loaded plugin."""
    metadata: PluginMetadata
    path: Path
    status: PluginStatus = PluginStatus.DISCOVERED
    module: Optional[Any] = None
    tools: list[BaseTool] = field(default_factory=list)
    error: Optional[str] = None
    loaded_at: Optional[datetime] = None
    checksum: Optional[str] = None

    @property
    def id(self) -> str:
        return f"{self.metadata.name}@{self.metadata.version}"


class KIAANPlugin(ABC):
    """
    Base class for KIAAN plugins.

    All plugins must inherit from this class and implement
    the required methods.
    """

    @property
    @abstractmethod
    def metadata(self) -> PluginMetadata:
        """Return plugin metadata."""
        pass

    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize the plugin.

        Returns:
            True if initialization successful
        """
        pass

    @abstractmethod
    async def shutdown(self) -> None:
        """Clean up plugin resources."""
        pass

    def get_tools(self) -> list[BaseTool]:
        """
        Return tools provided by this plugin.

        Override this method to provide custom tools.
        """
        return []

    def get_providers(self) -> list[Any]:
        """
        Return model providers provided by this plugin.

        Override this method to provide custom providers.
        """
        return []

    async def on_request(self, request: dict) -> Optional[dict]:
        """
        Hook called on each user request.

        Override to intercept/modify requests.
        """
        return None

    async def on_response(self, response: dict) -> Optional[dict]:
        """
        Hook called on each AI response.

        Override to intercept/modify responses.
        """
        return None


class PluginValidator:
    """Validates plugins before loading."""

    REQUIRED_METHODS = ["metadata", "initialize", "shutdown"]
    MAX_PLUGIN_SIZE_MB = 50

    def __init__(self):
        self.errors: list[str] = []

    def validate(self, plugin_path: Path) -> tuple[bool, list[str]]:
        """
        Validate a plugin.

        Args:
            plugin_path: Path to plugin directory or file

        Returns:
            (is_valid, list of errors)
        """
        self.errors = []

        # Check path exists
        if not plugin_path.exists():
            self.errors.append(f"Plugin path does not exist: {plugin_path}")
            return False, self.errors

        # Check plugin.json exists
        if plugin_path.is_dir():
            manifest_path = plugin_path / "plugin.json"
            main_path = plugin_path / "main.py"
        else:
            self.errors.append("Plugin must be a directory")
            return False, self.errors

        if not manifest_path.exists():
            self.errors.append("Missing plugin.json manifest")
            return False, self.errors

        if not main_path.exists():
            self.errors.append("Missing main.py entry point")
            return False, self.errors

        # Validate manifest
        try:
            with open(manifest_path) as f:
                manifest = json.load(f)

            required_fields = ["name", "version", "description", "author", "category"]
            for field in required_fields:
                if field not in manifest:
                    self.errors.append(f"Missing required field in manifest: {field}")

            # Validate category
            if manifest.get("category") not in [c.value for c in PluginCategory]:
                self.errors.append(f"Invalid category: {manifest.get('category')}")

        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON in plugin.json: {e}")

        # Check file sizes
        total_size = sum(
            f.stat().st_size for f in plugin_path.rglob("*") if f.is_file()
        )
        if total_size > self.MAX_PLUGIN_SIZE_MB * 1024 * 1024:
            self.errors.append(f"Plugin exceeds size limit of {self.MAX_PLUGIN_SIZE_MB}MB")

        # Check for dangerous patterns - comprehensive security scan
        dangerous_patterns = [
            # Command execution
            "os.system", "subprocess.run", "subprocess.Popen", "subprocess.call",
            "subprocess.check_output", "subprocess.check_call",
            # Code execution
            "eval(", "exec(", "compile(", "__import__",
            # File system danger
            "shutil.rmtree", "os.remove", "os.rmdir", "os.unlink",
            # Network danger
            "socket.socket", "urllib.request.urlopen",
            # Reflection/introspection abuse
            "getattr(", "setattr(", "__getattribute__",
            # Pickle deserialization (security risk)
            "pickle.load", "pickle.loads",
        ]

        for py_file in plugin_path.rglob("*.py"):
            try:
                content = py_file.read_text()
                for pattern in dangerous_patterns:
                    if pattern in content:
                        self.errors.append(
                            f"Potentially dangerous pattern '{pattern}' in {py_file.name}"
                        )
            except Exception as e:
                # SECURITY: Don't silently swallow errors during security scanning
                logger.warning(f"Security scan failed for {py_file}: {e}")
                self.errors.append(f"Could not scan {py_file.name}: {e}")

        return len(self.errors) == 0, self.errors


class PluginLoader:
    """Loads and manages plugin lifecycle."""

    def __init__(self, plugins_dir: Optional[str] = None):
        self.plugins_dir = Path(plugins_dir or os.getenv(
            "KIAAN_PLUGINS_DIR",
            "plugins"
        ))
        self.validator = PluginValidator()

    async def load_plugin(self, plugin_path: Path) -> Plugin:
        """
        Load a plugin from path.

        Args:
            plugin_path: Path to plugin directory

        Returns:
            Loaded Plugin object
        """
        # Validate first
        is_valid, errors = self.validator.validate(plugin_path)

        if not is_valid:
            # Load metadata for error reporting
            manifest_path = plugin_path / "plugin.json"
            if manifest_path.exists():
                with open(manifest_path) as f:
                    manifest = json.load(f)
                metadata = PluginMetadata.from_dict(manifest)
            else:
                metadata = PluginMetadata(
                    name=plugin_path.name,
                    version="unknown",
                    description="Invalid plugin",
                    author="unknown",
                    category=PluginCategory.UTILITY
                )

            return Plugin(
                metadata=metadata,
                path=plugin_path,
                status=PluginStatus.ERROR,
                error="; ".join(errors)
            )

        # Load manifest
        with open(plugin_path / "plugin.json") as f:
            manifest = json.load(f)

        metadata = PluginMetadata.from_dict(manifest)

        # Calculate checksum
        checksum = self._calculate_checksum(plugin_path)

        # Load module
        try:
            spec = importlib.util.spec_from_file_location(
                f"kiaan_plugin_{metadata.name}",
                plugin_path / "main.py"
            )
            module = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = module
            spec.loader.exec_module(module)

            # Find plugin class
            plugin_class = None
            for name, obj in inspect.getmembers(module):
                if (inspect.isclass(obj) and
                    issubclass(obj, KIAANPlugin) and
                    obj is not KIAANPlugin):
                    plugin_class = obj
                    break

            if not plugin_class:
                return Plugin(
                    metadata=metadata,
                    path=plugin_path,
                    status=PluginStatus.ERROR,
                    error="No KIAANPlugin subclass found in main.py",
                    checksum=checksum
                )

            # Instantiate plugin
            plugin_instance = plugin_class()

            # Get tools
            tools = plugin_instance.get_tools()

            return Plugin(
                metadata=metadata,
                path=plugin_path,
                status=PluginStatus.VALIDATED,
                module=plugin_instance,
                tools=tools,
                loaded_at=datetime.now(),
                checksum=checksum
            )

        except Exception as e:
            logger.error(f"Failed to load plugin {metadata.name}: {e}")
            return Plugin(
                metadata=metadata,
                path=plugin_path,
                status=PluginStatus.ERROR,
                error=str(e),
                checksum=checksum
            )

    def _calculate_checksum(self, plugin_path: Path) -> str:
        """Calculate checksum of plugin files."""
        hasher = hashlib.sha256()

        for file_path in sorted(plugin_path.rglob("*")):
            if file_path.is_file():
                hasher.update(file_path.read_bytes())

        return hasher.hexdigest()[:16]


class KIAANPluginManager:
    """
    Main plugin manager for KIAAN.

    Handles:
    - Plugin discovery and loading
    - Plugin lifecycle management
    - Tool registration from plugins
    - Hook execution
    """

    def __init__(self, plugins_dir: Optional[str] = None):
        self.plugins_dir = Path(plugins_dir or os.getenv(
            "KIAAN_PLUGINS_DIR",
            "plugins"
        ))
        self.loader = PluginLoader(str(self.plugins_dir))
        self.plugins: dict[str, Plugin] = {}
        self._tools_registry: dict[str, BaseTool] = {}
        self._hooks: dict[str, list[Callable]] = {
            "on_request": [],
            "on_response": []
        }
        self._lock = asyncio.Lock()

    async def initialize(self) -> None:
        """Initialize the plugin manager."""
        # Create plugins directory if it doesn't exist
        self.plugins_dir.mkdir(parents=True, exist_ok=True)

        # Discover and load all plugins
        await self.discover_plugins()

        logger.info(f"Plugin manager initialized with {len(self.plugins)} plugins")

    async def discover_plugins(self) -> list[Plugin]:
        """
        Discover all plugins in the plugins directory.

        Returns:
            List of discovered plugins
        """
        discovered = []

        if not self.plugins_dir.exists():
            return discovered

        for item in self.plugins_dir.iterdir():
            if item.is_dir() and (item / "plugin.json").exists():
                plugin = await self.loader.load_plugin(item)
                discovered.append(plugin)
                self.plugins[plugin.id] = plugin

        return discovered

    async def install_plugin(
        self,
        source: str,
        enable: bool = True
    ) -> Plugin:
        """
        Install a plugin from a source.

        Args:
            source: Path or URL to plugin
            enable: Whether to enable after install

        Returns:
            Installed plugin
        """
        async with self._lock:
            # Determine source type
            if source.startswith(("http://", "https://")):
                plugin_path = await self._download_plugin(source)
            elif os.path.exists(source):
                plugin_path = await self._copy_plugin(Path(source))
            else:
                raise ValueError(f"Invalid plugin source: {source}")

            # Load the plugin
            plugin = await self.loader.load_plugin(plugin_path)

            if plugin.status == PluginStatus.ERROR:
                # Cleanup failed install
                shutil.rmtree(plugin_path, ignore_errors=True)
                raise RuntimeError(f"Plugin installation failed: {plugin.error}")

            plugin.status = PluginStatus.INSTALLED
            self.plugins[plugin.id] = plugin

            if enable:
                await self.enable_plugin(plugin.id)

            logger.info(f"Installed plugin: {plugin.id}")
            return plugin

    async def uninstall_plugin(self, plugin_id: str) -> bool:
        """
        Uninstall a plugin.

        Args:
            plugin_id: Plugin identifier

        Returns:
            True if uninstalled successfully
        """
        async with self._lock:
            if plugin_id not in self.plugins:
                return False

            plugin = self.plugins[plugin_id]

            # Disable first
            if plugin.status == PluginStatus.ENABLED:
                await self.disable_plugin(plugin_id)

            # Shutdown
            if plugin.module:
                try:
                    await plugin.module.shutdown()
                except Exception as e:
                    logger.warning(f"Error during plugin shutdown: {e}")

            # Remove files
            if plugin.path.exists():
                shutil.rmtree(plugin.path, ignore_errors=True)

            # Remove from registry
            del self.plugins[plugin_id]

            logger.info(f"Uninstalled plugin: {plugin_id}")
            return True

    async def enable_plugin(self, plugin_id: str) -> bool:
        """
        Enable a plugin.

        Args:
            plugin_id: Plugin identifier

        Returns:
            True if enabled successfully
        """
        async with self._lock:
            if plugin_id not in self.plugins:
                return False

            plugin = self.plugins[plugin_id]

            if plugin.status == PluginStatus.ENABLED:
                return True

            if plugin.status == PluginStatus.ERROR:
                return False

            # Initialize plugin
            if plugin.module:
                try:
                    success = await plugin.module.initialize()
                    if not success:
                        plugin.status = PluginStatus.ERROR
                        plugin.error = "Initialization failed"
                        return False
                except Exception as e:
                    plugin.status = PluginStatus.ERROR
                    plugin.error = str(e)
                    return False

            # Register tools
            for tool in plugin.tools:
                tool_id = f"{plugin.metadata.name}.{tool.name}"
                self._tools_registry[tool_id] = tool

            # Register hooks
            if plugin.module:
                if hasattr(plugin.module, "on_request"):
                    self._hooks["on_request"].append(plugin.module.on_request)
                if hasattr(plugin.module, "on_response"):
                    self._hooks["on_response"].append(plugin.module.on_response)

            plugin.status = PluginStatus.ENABLED
            logger.info(f"Enabled plugin: {plugin_id}")
            return True

    async def disable_plugin(self, plugin_id: str) -> bool:
        """
        Disable a plugin.

        Args:
            plugin_id: Plugin identifier

        Returns:
            True if disabled successfully
        """
        async with self._lock:
            if plugin_id not in self.plugins:
                return False

            plugin = self.plugins[plugin_id]

            if plugin.status != PluginStatus.ENABLED:
                return True

            # Unregister tools
            for tool in plugin.tools:
                tool_id = f"{plugin.metadata.name}.{tool.name}"
                self._tools_registry.pop(tool_id, None)

            # Unregister hooks
            if plugin.module:
                if plugin.module.on_request in self._hooks["on_request"]:
                    self._hooks["on_request"].remove(plugin.module.on_request)
                if plugin.module.on_response in self._hooks["on_response"]:
                    self._hooks["on_response"].remove(plugin.module.on_response)

            plugin.status = PluginStatus.DISABLED
            logger.info(f"Disabled plugin: {plugin_id}")
            return True

    def get_plugin(self, plugin_id: str) -> Optional[Plugin]:
        """Get a plugin by ID."""
        return self.plugins.get(plugin_id)

    def list_plugins(
        self,
        status: Optional[PluginStatus] = None,
        category: Optional[PluginCategory] = None
    ) -> list[Plugin]:
        """
        List plugins with optional filtering.

        Args:
            status: Filter by status
            category: Filter by category

        Returns:
            List of matching plugins
        """
        plugins = list(self.plugins.values())

        if status:
            plugins = [p for p in plugins if p.status == status]

        if category:
            plugins = [p for p in plugins if p.metadata.category == category]

        return plugins

    def get_tools(self) -> dict[str, BaseTool]:
        """Get all registered tools from plugins."""
        return self._tools_registry.copy()

    async def execute_tool(self, tool_id: str, **kwargs) -> ToolResult:
        """
        Execute a tool from a plugin.

        Args:
            tool_id: Tool identifier (plugin.tool_name)
            **kwargs: Tool parameters

        Returns:
            Tool execution result
        """
        if tool_id not in self._tools_registry:
            return ToolResult(
                tool_name=tool_id,
                status=ToolStatus.ERROR,
                output=None,
                error=f"Tool not found: {tool_id}"
            )

        tool = self._tools_registry[tool_id]
        return await tool.execute(**kwargs)

    async def run_hooks(
        self,
        hook_name: str,
        data: dict
    ) -> dict:
        """
        Run all registered hooks.

        Args:
            hook_name: Name of hook (on_request, on_response)
            data: Data to pass to hooks

        Returns:
            Potentially modified data
        """
        if hook_name not in self._hooks:
            return data

        result = data
        for hook in self._hooks[hook_name]:
            try:
                modified = await hook(result)
                if modified is not None:
                    result = modified
            except Exception as e:
                logger.error(f"Hook error ({hook_name}): {e}")

        return result

    async def _download_plugin(self, url: str) -> Path:
        """Download a plugin from URL."""
        import aiohttp
        import tempfile
        import zipfile

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise RuntimeError(f"Failed to download plugin: {response.status}")

                content = await response.read()

        # Extract to plugins directory
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as f:
            f.write(content)
            zip_path = f.name

        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Get the root directory name
                names = zip_ref.namelist()
                root_dir = names[0].split('/')[0]

                # Extract to plugins directory
                zip_ref.extractall(self.plugins_dir)

            return self.plugins_dir / root_dir

        finally:
            os.unlink(zip_path)

    async def _copy_plugin(self, source_path: Path) -> Path:
        """Copy a plugin from local path."""
        dest_path = self.plugins_dir / source_path.name

        if dest_path.exists():
            shutil.rmtree(dest_path)

        shutil.copytree(source_path, dest_path)
        return dest_path

    async def shutdown(self) -> None:
        """Shutdown all plugins."""
        for plugin_id in list(self.plugins.keys()):
            plugin = self.plugins[plugin_id]
            if plugin.module and plugin.status == PluginStatus.ENABLED:
                try:
                    await plugin.module.shutdown()
                except Exception as e:
                    logger.error(f"Error shutting down plugin {plugin_id}: {e}")


# Singleton instance
kiaan_plugin_manager = KIAANPluginManager()


# Export
__all__ = [
    "KIAANPluginManager",
    "KIAANPlugin",
    "Plugin",
    "PluginMetadata",
    "PluginStatus",
    "PluginCategory",
    "PluginValidator",
    "kiaan_plugin_manager"
]
