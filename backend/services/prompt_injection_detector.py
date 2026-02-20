"""Semantic prompt injection detection for KIAAN chat.

Goes beyond basic HTML escaping to detect sophisticated prompt injection
attacks that attempt to manipulate KIAAN's system prompt or behavior.

Detection layers:
1. Pattern-based: Known injection phrases and role-switching attempts
2. Structural: Unusual formatting that mimics system prompts
3. Behavioral: Commands that try to override KIAAN's instructions

Returns a risk score (0.0–1.0) and a list of detected threat indicators.
Messages above the configurable threshold (default: 0.7) are flagged.
"""

import logging
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class InjectionResult:
    """Result of prompt injection analysis."""
    is_suspicious: bool = False
    risk_score: float = 0.0
    threats: list[str] = field(default_factory=list)
    should_block: bool = False


# Patterns that attempt to override system instructions
_ROLE_SWITCH_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)",
    r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)",
    r"forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)",
    r"you\s+are\s+now\s+(?:a|an)\s+",
    r"act\s+as\s+(?:if\s+you\s+are|a|an)\s+",
    r"pretend\s+(?:to\s+be|you\s+are)\s+",
    r"from\s+now\s+on\s*[,:]?\s*you\s+(?:are|will|must|should)",
    r"new\s+(?:instructions?|prompt|rules?)\s*:",
    r"system\s*:\s*",
    r"<<\s*sys\s*>>",
    r"\[INST\]",
    r"\[/INST\]",
    r"<\|im_start\|>",
    r"<\|system\|>",
]

# Patterns that try to extract system prompt or internal information
_EXTRACTION_PATTERNS = [
    r"(?:what|show|tell|repeat|print|output|reveal|display)\s+(?:me\s+)?(?:your|the)\s+(?:system\s+)?(?:prompt|instructions?|rules?|guidelines?)",
    r"(?:what|how)\s+(?:are|were)\s+you\s+(?:instructed|told|programmed|prompted)",
    r"output\s+(?:your|the)\s+(?:initial|first|original)\s+(?:prompt|message|instructions?)",
    r"(?:print|echo|output|show)\s+(?:everything|all)\s+(?:above|before)\s+(?:this|my)",
]

# Patterns that attempt code execution or data exfiltration
_EXFIL_PATTERNS = [
    r"(?:fetch|curl|wget|http|https)://",
    r"(?:import|require|eval|exec)\s*\(",
    r"subprocess|os\.system|os\.popen",
    r"(?:read|write|open|delete)\s+(?:file|database|db)",
    r"api[_\s]?key|secret[_\s]?key|password|token",
]

# Compiled for performance
_ROLE_SWITCH_RE = re.compile("|".join(_ROLE_SWITCH_PATTERNS), re.IGNORECASE)
_EXTRACTION_RE = re.compile("|".join(_EXTRACTION_PATTERNS), re.IGNORECASE)
_EXFIL_RE = re.compile("|".join(_EXFIL_PATTERNS), re.IGNORECASE)


def detect_prompt_injection(
    message: str,
    threshold: float = 0.7,
) -> InjectionResult:
    """Analyze a user message for prompt injection attempts.

    Args:
        message: The user's raw message (before HTML escaping).
        threshold: Risk score above which the message is flagged.

    Returns:
        InjectionResult with risk_score, threats, and block recommendation.
    """
    if not message:
        return InjectionResult()

    result = InjectionResult()
    score = 0.0

    # Layer 1: Role-switching / instruction override
    if _ROLE_SWITCH_RE.search(message):
        score += 0.5
        result.threats.append("role_switch_attempt")

    # Layer 2: System prompt extraction
    if _EXTRACTION_RE.search(message):
        score += 0.4
        result.threats.append("prompt_extraction_attempt")

    # Layer 3: Code execution / data exfiltration
    if _EXFIL_RE.search(message):
        score += 0.3
        result.threats.append("exfiltration_attempt")

    # Layer 4: Structural anomalies (mimicking system messages)
    structural_score = _check_structural_anomalies(message)
    score += structural_score
    if structural_score > 0.1:
        result.threats.append("structural_anomaly")

    # Layer 5: Excessive special characters (obfuscation attempts)
    special_ratio = sum(1 for c in message if not c.isalnum() and not c.isspace()) / max(len(message), 1)
    if special_ratio > 0.3:
        score += 0.2
        result.threats.append("obfuscation_attempt")

    # Cap at 1.0
    result.risk_score = min(score, 1.0)
    result.is_suspicious = result.risk_score >= 0.3
    result.should_block = result.risk_score >= threshold

    if result.is_suspicious:
        logger.warning(
            f"Prompt injection detected: score={result.risk_score:.2f}, "
            f"threats={result.threats}"
        )

    return result


def _check_structural_anomalies(message: str) -> float:
    """Check for structural patterns that mimic system prompts."""
    score = 0.0

    # Multiple lines that look like instructions
    lines = message.strip().split("\n")
    instruction_lines = sum(
        1 for line in lines
        if re.match(r"^\s*[-*•]\s+(?:you|always|never|do not|must|should)", line, re.IGNORECASE)
    )
    if instruction_lines >= 3:
        score += 0.3

    # Contains role markers
    if re.search(r"(assistant|system|user)\s*:", message, re.IGNORECASE):
        score += 0.2

    # Contains markdown-style headers that look like prompt sections
    header_count = len(re.findall(r"^#{1,3}\s+", message, re.MULTILINE))
    if header_count >= 2:
        score += 0.15

    return score
