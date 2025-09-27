import re
from dataclasses import dataclass
from typing import List
from core.settings import settings


@dataclass
class PasswordPolicyResult:
    ok: bool
    errors: List[str]


class PasswordPolicy:
    def __init__(self, min_length: int, require_digit: bool, require_letter: bool):
        self.min_length = min_length
        self.require_digit = require_digit
        self.require_letter = require_letter

    def validate(self, password: str) -> PasswordPolicyResult:
        errs: List[str] = []
        if len(password) < self.min_length:
            errs.append(f"Password must be at least {self.min_length} characters long.")
        if self.require_digit and not re.search(r"\d", password):
            errs.append("Password must contain at least one digit.")
        if self.require_letter and not re.search(r"[A-Za-z]", password):
            errs.append("Password must contain at least one letter.")
        return PasswordPolicyResult(ok=not errs, errors=errs)


policy = PasswordPolicy(
    min_length=settings.PASSWORD_MIN_LENGTH,
    require_digit=settings.PASSWORD_REQUIRE_DIGIT,
    require_letter=settings.PASSWORD_REQUIRE_LETTER,
)