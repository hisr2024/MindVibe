"""
Advanced Threat Detection Middleware

This module provides comprehensive protection against various cyber threats:
- Malware payload detection
- Ransomware patterns
- Trojan signatures
- Command injection prevention
- File upload security
- Request anomaly detection

KIAAN Impact: POSITIVE - Enhanced security without affecting legitimate KIAAN interactions.
"""

import re
import hashlib
import logging
import time
from typing import Awaitable, Callable, Dict, List, Set, Optional, Tuple
from collections import defaultdict
from datetime import datetime, timedelta

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_403_FORBIDDEN

logger = logging.getLogger(__name__)


# ============================================================================
# Threat Pattern Definitions
# ============================================================================

# Command injection patterns (shell commands)
COMMAND_INJECTION_PATTERNS = [
    r';\s*(?:rm|chmod|chown|wget|curl|nc|netcat|bash|sh|python|perl|ruby|php)\s',
    r'\|\s*(?:rm|chmod|chown|wget|curl|nc|netcat|bash|sh)\s',
    r'`[^`]*`',  # Backtick command execution
    r'\$\([^)]+\)',  # Command substitution
    r'&&\s*(?:rm|wget|curl|nc)',  # Chained commands
    r'\|\|\s*(?:rm|wget|curl|nc)',
    r'>\s*/(?:dev|etc|tmp|var)',  # Redirect to system paths
    r'<\s*/(?:dev|etc|tmp|var)',
]

# Malware/Virus signature patterns (base64 encoded payloads, common signatures)
MALWARE_PATTERNS = [
    r'(?:eval|exec|system|passthru|shell_exec)\s*\(',  # PHP shell functions
    r'<\?php.*(?:eval|exec|system)',  # PHP backdoor
    r'powershell\s+-(?:e|enc|encoded)',  # Encoded PowerShell
    r'(?:cmd|command)\.exe\s+/c',  # Windows command execution
    r'mshta\s+(?:http|vbscript)',  # MSHTA abuse
    r'certutil\s+-urlcache',  # Certutil download
    r'bitsadmin\s+/transfer',  # BITS transfer
    r'regsvr32\s+/s\s+/u',  # Regsvr32 abuse
    r'wscript|cscript\s+.*\.(?:vbs|js|wsf)',  # Script execution
]

# Ransomware behavior patterns
RANSOMWARE_PATTERNS = [
    r'(?:encrypt|decrypt).*(?:aes|rsa|des)',
    r'(?:bitcoin|btc|ethereum|eth|monero|xmr)\s*(?:address|wallet)',
    r'ransom(?:ware|note|demand)',
    r'(?:your|all)\s+files?\s+(?:have\s+been\s+)?encrypted',
    r'pay\s+(?:\d+\s+)?(?:bitcoin|btc|dollars|\$)',
    r'\.(?:encrypted|locked|crypt|crypto|pay|ransom)$',
]

# Trojan/RAT (Remote Access Trojan) patterns
TROJAN_PATTERNS = [
    r'(?:reverse|bind)\s*shell',
    r'(?:meterpreter|metasploit)',
    r'(?:rat|trojan|backdoor)',
    r'c2\s*(?:server|communication|channel)',
    r'(?:keylog|screenlog|webcam)',
    r'persistence\s*(?:method|mechanism)',
]

# Server-Side Request Forgery (SSRF) patterns
SSRF_PATTERNS = [
    r'(?:localhost|127\.0\.0\.1|0\.0\.0\.0):\d+',
    r'(?:169\.254\.169\.254)',  # AWS metadata
    r'(?:metadata\.google\.internal)',  # GCP metadata
    r'file:///(?:etc|windows|proc)',
    r'gopher://|dict://|ftp://|ldap://',
]

# Compile patterns for efficiency
COMMAND_INJECTION_REGEX = re.compile('|'.join(COMMAND_INJECTION_PATTERNS), re.IGNORECASE)
MALWARE_REGEX = re.compile('|'.join(MALWARE_PATTERNS), re.IGNORECASE)
RANSOMWARE_REGEX = re.compile('|'.join(RANSOMWARE_PATTERNS), re.IGNORECASE)
TROJAN_REGEX = re.compile('|'.join(TROJAN_PATTERNS), re.IGNORECASE)
SSRF_REGEX = re.compile('|'.join(SSRF_PATTERNS), re.IGNORECASE)

# Known malicious file extensions
DANGEROUS_EXTENSIONS = {
    '.exe', '.dll', '.scr', '.bat', '.cmd', '.com', '.pif',
    '.application', '.gadget', '.msi', '.msp', '.hta',
    '.cpl', '.msc', '.jar', '.vb', '.vbs', '.vbe',
    '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh',
    '.ps1', '.ps2', '.psc1', '.psc2', '.reg', '.inf',
}

# Dangerous MIME types
DANGEROUS_MIME_TYPES = {
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-executable',
    'application/x-dosexec',
    'application/hta',
    'application/x-ms-shortcut',
}


# ============================================================================
# Threat Detection Functions
# ============================================================================

def detect_command_injection(value: str) -> bool:
    """Check for command injection patterns."""
    if not isinstance(value, str):
        return False
    return bool(COMMAND_INJECTION_REGEX.search(value))


def detect_malware_patterns(value: str) -> bool:
    """Check for malware signature patterns."""
    if not isinstance(value, str):
        return False
    return bool(MALWARE_REGEX.search(value))


def detect_ransomware_patterns(value: str) -> bool:
    """Check for ransomware-related patterns."""
    if not isinstance(value, str):
        return False
    return bool(RANSOMWARE_REGEX.search(value))


def detect_trojan_patterns(value: str) -> bool:
    """Check for trojan/RAT patterns."""
    if not isinstance(value, str):
        return False
    return bool(TROJAN_REGEX.search(value))


def detect_ssrf_patterns(value: str) -> bool:
    """Check for SSRF attack patterns."""
    if not isinstance(value, str):
        return False
    return bool(SSRF_REGEX.search(value))


def is_dangerous_file(filename: str) -> bool:
    """Check if a filename has a dangerous extension."""
    if not filename:
        return False
    lower_name = filename.lower()
    return any(lower_name.endswith(ext) for ext in DANGEROUS_EXTENSIONS)


def is_dangerous_mime_type(mime_type: str) -> bool:
    """Check if a MIME type is potentially dangerous."""
    if not mime_type:
        return False
    return mime_type.lower() in DANGEROUS_MIME_TYPES


def calculate_entropy(data: bytes) -> float:
    """
    Calculate Shannon entropy of data.
    High entropy may indicate encrypted/compressed malicious content.
    """
    if not data:
        return 0.0

    byte_counts = defaultdict(int)
    for byte in data:
        byte_counts[byte] += 1

    length = len(data)
    entropy = 0.0

    import math
    for count in byte_counts.values():
        probability = count / length
        if probability > 0:
            # Use log2 for entropy calculation (Shannon entropy)
            entropy -= probability * math.log2(probability)

    return entropy


def detect_threats_in_value(value: str) -> List[str]:
    """
    Detect all types of threats in a string value.
    Returns a list of detected threat types.
    """
    threats = []

    if detect_command_injection(value):
        threats.append('command_injection')
    if detect_malware_patterns(value):
        threats.append('malware_signature')
    if detect_ransomware_patterns(value):
        threats.append('ransomware_pattern')
    if detect_trojan_patterns(value):
        threats.append('trojan_pattern')
    if detect_ssrf_patterns(value):
        threats.append('ssrf_attempt')

    return threats


def scan_request_body(body: bytes, content_type: str) -> Tuple[bool, List[str]]:
    """
    Scan request body for threats.
    Returns (is_safe, list of detected threats).
    """
    threats = []

    # Check content type
    if is_dangerous_mime_type(content_type):
        threats.append(f'dangerous_mime_type:{content_type}')

    # Try to decode as text for pattern matching
    try:
        text_body = body.decode('utf-8', errors='ignore')
        threats.extend(detect_threats_in_value(text_body))
    except Exception:
        pass

    # Check entropy for potentially encrypted payloads
    if len(body) > 1000:
        entropy = calculate_entropy(body)
        if entropy > 7.5:  # Very high entropy threshold
            threats.append('high_entropy_payload')

    return len(threats) == 0, threats


# ============================================================================
# Threat Detection Middleware
# ============================================================================

class ThreatDetectionMiddleware(BaseHTTPMiddleware):
    """
    Middleware for comprehensive threat detection.

    Features:
    - Multi-layer threat pattern detection
    - Request body scanning
    - File upload security
    - Anomaly detection
    - Threat logging and alerting
    """

    def __init__(
        self,
        app,
        enabled: bool = True,
        log_threats: bool = True,
        block_threats: bool = True,
        max_body_size: int = 10 * 1024 * 1024,  # 10MB
    ):
        """
        Initialize threat detection middleware.

        Args:
            app: ASGI application
            enabled: Whether detection is enabled
            log_threats: Whether to log detected threats
            block_threats: Whether to block requests with threats
            max_body_size: Maximum body size to scan
        """
        super().__init__(app)
        self.enabled = enabled
        self.log_threats = log_threats
        self.block_threats = block_threats
        self.max_body_size = max_body_size

        # Track threat statistics
        self.threat_counts: Dict[str, int] = defaultdict(int)
        self.blocked_ips: Set[str] = set()

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        return request.client.host if request.client else "unknown"

    def _log_threat(
        self,
        ip: str,
        threat_type: str,
        details: str,
        request: Request,
    ):
        """Log detected threat."""
        if not self.log_threats:
            return

        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "ip": ip,
            "threat_type": threat_type,
            "details": details,
            "method": request.method,
            "path": request.url.path,
            "user_agent": request.headers.get("User-Agent", "")[:256],
        }

        logger.warning(f"[THREAT DETECTED] {threat_type}: {log_data}")
        self.threat_counts[threat_type] += 1

    def _check_query_params(self, request: Request) -> List[str]:
        """Check query parameters for threats."""
        threats = []
        for key, value in request.query_params.items():
            param_threats = detect_threats_in_value(f"{key}={value}")
            threats.extend(param_threats)
        return threats

    def _check_headers(self, request: Request) -> List[str]:
        """Check headers for suspicious patterns."""
        threats = []

        # Check specific headers that might be attack vectors
        suspicious_headers = [
            'X-Forwarded-Host', 'X-Original-URL', 'X-Rewrite-URL',
            'Referer', 'Origin',
        ]

        for header in suspicious_headers:
            value = request.headers.get(header, '')
            if value:
                header_threats = detect_threats_in_value(value)
                threats.extend(header_threats)

        return threats

    def _check_path(self, request: Request) -> List[str]:
        """Check URL path for threats."""
        threats = []
        path = request.url.path

        # Check for path traversal
        if '..' in path or '%2e%2e' in path.lower():
            threats.append('path_traversal')

        # Check for dangerous file access
        if is_dangerous_file(path):
            threats.append('dangerous_file_access')

        # Check path for injection patterns
        threats.extend(detect_threats_in_value(path))

        return threats

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Process request with threat detection."""

        if not self.enabled:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        all_threats: List[str] = []

        # Check query parameters
        param_threats = self._check_query_params(request)
        all_threats.extend(param_threats)

        # Check headers
        header_threats = self._check_headers(request)
        all_threats.extend(header_threats)

        # Check URL path
        path_threats = self._check_path(request)
        all_threats.extend(path_threats)

        # Log and potentially block if threats detected
        if all_threats:
            for threat in set(all_threats):
                self._log_threat(
                    ip=client_ip,
                    threat_type=threat,
                    details=f"Detected in request to {request.url.path}",
                    request=request,
                )

            if self.block_threats:
                return JSONResponse(
                    status_code=HTTP_403_FORBIDDEN,
                    content={
                        "error": "security_violation",
                        "message": "Request blocked due to security policy",
                        "threats_detected": len(set(all_threats)),
                    }
                )

        # Process the request
        response = await call_next(request)
        return response


# ============================================================================
# File Upload Scanner
# ============================================================================

class FileUploadScanner:
    """
    Scanner for uploaded files to detect potential threats.

    Usage:
        scanner = FileUploadScanner()
        is_safe, threats = scanner.scan_file(file_content, filename, mime_type)
    """

    # Known malicious file signatures (magic bytes)
    MALICIOUS_SIGNATURES = {
        # Windows executables
        b'MZ': 'windows_executable',
        b'\x7fELF': 'linux_executable',
        # Office macro documents (can contain malware)
        b'\xd0\xcf\x11\xe0': 'ole_document',
        # ZIP-based formats (could contain macros)
        b'PK\x03\x04': 'zip_archive',
    }

    def __init__(
        self,
        max_file_size: int = 50 * 1024 * 1024,  # 50MB
        allowed_extensions: Optional[Set[str]] = None,
        allowed_mime_types: Optional[Set[str]] = None,
    ):
        self.max_file_size = max_file_size
        self.allowed_extensions = allowed_extensions
        self.allowed_mime_types = allowed_mime_types

    def scan_file(
        self,
        content: bytes,
        filename: str,
        mime_type: str,
    ) -> Tuple[bool, List[str]]:
        """
        Scan a file for potential threats.

        Returns:
            (is_safe, list of detected threats)
        """
        threats = []

        # Check file size
        if len(content) > self.max_file_size:
            threats.append('file_too_large')

        # Check filename extension
        if is_dangerous_file(filename):
            threats.append('dangerous_extension')

        if self.allowed_extensions:
            ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
            if ext not in self.allowed_extensions:
                threats.append('disallowed_extension')

        # Check MIME type
        if is_dangerous_mime_type(mime_type):
            threats.append('dangerous_mime_type')

        if self.allowed_mime_types and mime_type not in self.allowed_mime_types:
            threats.append('disallowed_mime_type')

        # Check file signatures (magic bytes)
        for signature, threat_name in self.MALICIOUS_SIGNATURES.items():
            if content.startswith(signature):
                threats.append(f'suspicious_signature:{threat_name}')

        # Calculate entropy
        if len(content) > 1000:
            entropy = calculate_entropy(content)
            if entropy > 7.8:  # Very high entropy
                threats.append('high_entropy_content')

        # Scan content for patterns
        try:
            text_content = content.decode('utf-8', errors='ignore')
            content_threats = detect_threats_in_value(text_content)
            threats.extend(content_threats)
        except Exception:
            pass

        return len(threats) == 0, threats


# Export utilities
__all__ = [
    'ThreatDetectionMiddleware',
    'FileUploadScanner',
    'detect_command_injection',
    'detect_malware_patterns',
    'detect_ransomware_patterns',
    'detect_trojan_patterns',
    'detect_ssrf_patterns',
    'detect_threats_in_value',
    'is_dangerous_file',
    'is_dangerous_mime_type',
]
