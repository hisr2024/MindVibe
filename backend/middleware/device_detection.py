"""
Device Detection Middleware

Detects mobile devices and optimizes API responses accordingly.

Features:
- User-Agent parsing for device detection
- Mobile-specific response optimizations
- Device capability detection
- Request context enrichment
- Analytics tracking

Security:
- No PII logging
- Header validation
- Rate limit awareness for mobile
"""

import re
import logging
from typing import Optional, Dict, Any
from enum import Enum
from dataclasses import dataclass
from functools import lru_cache

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class DeviceType(str, Enum):
    """Device type classification."""
    MOBILE = "mobile"
    TABLET = "tablet"
    DESKTOP = "desktop"
    BOT = "bot"
    UNKNOWN = "unknown"


class Platform(str, Enum):
    """Platform classification."""
    IOS = "ios"
    ANDROID = "android"
    WINDOWS = "windows"
    MACOS = "macos"
    LINUX = "linux"
    UNKNOWN = "unknown"


class Browser(str, Enum):
    """Browser classification."""
    SAFARI = "safari"
    CHROME = "chrome"
    FIREFOX = "firefox"
    EDGE = "edge"
    SAMSUNG = "samsung"
    IN_APP = "in_app"
    UNKNOWN = "unknown"


@dataclass
class DeviceInfo:
    """Device information extracted from request."""
    device_type: DeviceType
    platform: Platform
    browser: Browser
    is_mobile: bool
    is_pwa: bool
    is_native_app: bool
    supports_webp: bool
    supports_avif: bool
    supports_push: bool
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None
    pixel_ratio: Optional[float] = None
    connection_type: Optional[str] = None
    save_data: bool = False


# Compiled regex patterns for performance
MOBILE_PATTERNS = re.compile(
    r"(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|"
    r"compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |"
    r"maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|"
    r"phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|"
    r"up\.(browser|link)|vodafone|wap|windows ce|xda|xiino",
    re.IGNORECASE
)

TABLET_PATTERNS = re.compile(
    r"android|ipad|playbook|silk|tablet",
    re.IGNORECASE
)

BOT_PATTERNS = re.compile(
    r"bot|crawl|slurp|spider|mediapartners|googlebot|bingbot|yandex|"
    r"baidu|duckduckbot|facebot|twitterbot|linkedinbot|applebot",
    re.IGNORECASE
)

IOS_PATTERN = re.compile(r"(iphone|ipad|ipod)", re.IGNORECASE)
ANDROID_PATTERN = re.compile(r"android", re.IGNORECASE)
WINDOWS_PATTERN = re.compile(r"windows", re.IGNORECASE)
MACOS_PATTERN = re.compile(r"(macintosh|mac os x)", re.IGNORECASE)
LINUX_PATTERN = re.compile(r"linux", re.IGNORECASE)

CHROME_PATTERN = re.compile(r"chrome(?!.*edge)", re.IGNORECASE)
SAFARI_PATTERN = re.compile(r"safari(?!.*chrome)", re.IGNORECASE)
FIREFOX_PATTERN = re.compile(r"firefox", re.IGNORECASE)
EDGE_PATTERN = re.compile(r"edge|edg/", re.IGNORECASE)
SAMSUNG_PATTERN = re.compile(r"samsungbrowser", re.IGNORECASE)


@lru_cache(maxsize=1000)
def parse_user_agent(user_agent: str) -> DeviceInfo:
    """
    Parse user agent string to extract device information.

    Uses LRU cache to avoid repeated parsing of the same user agents.
    """
    if not user_agent:
        return DeviceInfo(
            device_type=DeviceType.UNKNOWN,
            platform=Platform.UNKNOWN,
            browser=Browser.UNKNOWN,
            is_mobile=False,
            is_pwa=False,
            is_native_app=False,
            supports_webp=False,
            supports_avif=False,
            supports_push=False,
        )

    # Detect device type
    if BOT_PATTERNS.search(user_agent):
        device_type = DeviceType.BOT
    elif MOBILE_PATTERNS.search(user_agent):
        device_type = DeviceType.MOBILE
    elif TABLET_PATTERNS.search(user_agent) and not MOBILE_PATTERNS.search(user_agent):
        device_type = DeviceType.TABLET
    else:
        device_type = DeviceType.DESKTOP

    # Detect platform
    if IOS_PATTERN.search(user_agent):
        platform = Platform.IOS
    elif ANDROID_PATTERN.search(user_agent):
        platform = Platform.ANDROID
    elif WINDOWS_PATTERN.search(user_agent):
        platform = Platform.WINDOWS
    elif MACOS_PATTERN.search(user_agent):
        platform = Platform.MACOS
    elif LINUX_PATTERN.search(user_agent):
        platform = Platform.LINUX
    else:
        platform = Platform.UNKNOWN

    # Detect browser
    if SAMSUNG_PATTERN.search(user_agent):
        browser = Browser.SAMSUNG
    elif EDGE_PATTERN.search(user_agent):
        browser = Browser.EDGE
    elif CHROME_PATTERN.search(user_agent):
        browser = Browser.CHROME
    elif FIREFOX_PATTERN.search(user_agent):
        browser = Browser.FIREFOX
    elif SAFARI_PATTERN.search(user_agent):
        browser = Browser.SAFARI
    else:
        browser = Browser.UNKNOWN

    # Check for native app user agents
    is_native_app = "MindVibe/" in user_agent or "MindVibeApp" in user_agent

    # WebP support (Chrome, Firefox, Edge, Safari 14+)
    supports_webp = browser in [Browser.CHROME, Browser.FIREFOX, Browser.EDGE]
    if browser == Browser.SAFARI:
        # Safari 14+ supports WebP
        safari_version_match = re.search(r"Version/(\d+)", user_agent)
        if safari_version_match and int(safari_version_match.group(1)) >= 14:
            supports_webp = True

    # AVIF support (Chrome 85+, Firefox 93+)
    supports_avif = browser in [Browser.CHROME, Browser.FIREFOX]

    # Push notification support
    supports_push = browser in [Browser.CHROME, Browser.FIREFOX, Browser.EDGE, Browser.SAFARI]

    return DeviceInfo(
        device_type=device_type,
        platform=platform,
        browser=browser,
        is_mobile=device_type in [DeviceType.MOBILE, DeviceType.TABLET],
        is_pwa=False,  # Will be set from headers
        is_native_app=is_native_app,
        supports_webp=supports_webp,
        supports_avif=supports_avif,
        supports_push=supports_push,
    )


def extract_device_hints(request: Request) -> Dict[str, Any]:
    """
    Extract Client Hints headers for more accurate device detection.

    See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Client_hints
    """
    hints = {}

    # Platform hints
    sec_ch_ua_platform = request.headers.get("Sec-CH-UA-Platform")
    if sec_ch_ua_platform:
        hints["platform"] = sec_ch_ua_platform.strip('"')

    # Mobile hint
    sec_ch_ua_mobile = request.headers.get("Sec-CH-UA-Mobile")
    if sec_ch_ua_mobile:
        hints["is_mobile"] = sec_ch_ua_mobile == "?1"

    # Device memory
    device_memory = request.headers.get("Device-Memory")
    if device_memory:
        try:
            hints["device_memory_gb"] = float(device_memory)
        except ValueError:
            pass

    # Viewport width
    viewport_width = request.headers.get("Viewport-Width")
    if viewport_width:
        try:
            hints["viewport_width"] = int(viewport_width)
        except ValueError:
            pass

    # DPR (Device Pixel Ratio)
    dpr = request.headers.get("DPR")
    if dpr:
        try:
            hints["pixel_ratio"] = float(dpr)
        except ValueError:
            pass

    # Save-Data preference
    save_data = request.headers.get("Save-Data")
    hints["save_data"] = save_data == "on"

    # Network Information
    ect = request.headers.get("ECT")  # Effective Connection Type
    if ect:
        hints["connection_type"] = ect

    return hints


class DeviceDetectionMiddleware(BaseHTTPMiddleware):
    """
    Middleware for detecting device type and capabilities.

    Enriches request state with device information for downstream handlers.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and add device context."""
        # Get user agent
        user_agent = request.headers.get("User-Agent", "")

        # Parse user agent
        device_info = parse_user_agent(user_agent)

        # Get client hints for more accurate detection
        hints = extract_device_hints(request)

        # Override with client hints if available
        if "is_mobile" in hints:
            device_info = DeviceInfo(
                device_type=DeviceType.MOBILE if hints["is_mobile"] else device_info.device_type,
                platform=device_info.platform,
                browser=device_info.browser,
                is_mobile=hints.get("is_mobile", device_info.is_mobile),
                is_pwa="display-mode: standalone" in request.headers.get("Sec-CH-Display-Mode", ""),
                is_native_app=device_info.is_native_app,
                supports_webp=device_info.supports_webp,
                supports_avif=device_info.supports_avif,
                supports_push=device_info.supports_push,
                screen_width=hints.get("viewport_width"),
                pixel_ratio=hints.get("pixel_ratio"),
                connection_type=hints.get("connection_type"),
                save_data=hints.get("save_data", False),
            )

        # Check for PWA header
        if request.headers.get("X-MindVibe-PWA") == "true":
            device_info = DeviceInfo(
                device_type=device_info.device_type,
                platform=device_info.platform,
                browser=device_info.browser,
                is_mobile=device_info.is_mobile,
                is_pwa=True,
                is_native_app=device_info.is_native_app,
                supports_webp=device_info.supports_webp,
                supports_avif=device_info.supports_avif,
                supports_push=device_info.supports_push,
                screen_width=device_info.screen_width,
                pixel_ratio=device_info.pixel_ratio,
                connection_type=device_info.connection_type,
                save_data=device_info.save_data,
            )

        # Store device info in request state
        request.state.device = device_info

        # Add device-specific response headers
        response = await call_next(request)

        # Request client hints for future requests
        response.headers["Accept-CH"] = "Sec-CH-UA-Platform, Sec-CH-UA-Mobile, Device-Memory, Viewport-Width, DPR, ECT, Save-Data"

        # Vary response by these headers for proper caching
        vary_headers = response.headers.get("Vary", "")
        if vary_headers:
            vary_headers += ", "
        vary_headers += "User-Agent, Sec-CH-UA-Mobile, Sec-CH-UA-Platform, Save-Data"
        response.headers["Vary"] = vary_headers

        return response


def get_device_info(request: Request) -> DeviceInfo:
    """
    Get device info from request state.

    Helper function for use in route handlers.
    """
    return getattr(request.state, "device", DeviceInfo(
        device_type=DeviceType.UNKNOWN,
        platform=Platform.UNKNOWN,
        browser=Browser.UNKNOWN,
        is_mobile=False,
        is_pwa=False,
        is_native_app=False,
        supports_webp=False,
        supports_avif=False,
        supports_push=False,
    ))


def is_mobile_request(request: Request) -> bool:
    """Check if request is from a mobile device."""
    device = get_device_info(request)
    return device.is_mobile


def should_optimize_for_mobile(request: Request) -> bool:
    """
    Determine if response should be optimized for mobile.

    Considers device type, connection quality, and save-data preference.
    """
    device = get_device_info(request)

    # Always optimize for mobile devices
    if device.is_mobile:
        return True

    # Optimize if user has save-data enabled
    if device.save_data:
        return True

    # Optimize for slow connections
    slow_connections = ["slow-2g", "2g", "3g"]
    if device.connection_type and device.connection_type in slow_connections:
        return True

    return False


def get_preferred_image_format(request: Request) -> str:
    """
    Get the preferred image format based on device capabilities.

    Returns the most efficient format supported by the client.
    """
    device = get_device_info(request)

    # Check Accept header for explicit format support
    accept = request.headers.get("Accept", "")

    if "image/avif" in accept and device.supports_avif:
        return "avif"

    if "image/webp" in accept and device.supports_webp:
        return "webp"

    return "jpeg"


def get_image_quality(request: Request) -> int:
    """
    Get recommended image quality based on device and connection.

    Returns quality percentage (1-100).
    """
    device = get_device_info(request)

    # Default quality
    quality = 85

    # Lower quality for slow connections
    slow_connections = {"slow-2g": 50, "2g": 60, "3g": 75}
    if device.connection_type and device.connection_type in slow_connections:
        quality = slow_connections[device.connection_type]

    # Lower quality if save-data is enabled
    if device.save_data:
        quality = min(quality, 60)

    # Higher quality for high DPR displays
    if device.pixel_ratio and device.pixel_ratio >= 2:
        # Slightly lower quality since pixels are smaller
        quality = max(quality - 10, 50)

    return quality
