"""Password policy validation."""

# Common passwords list (top weak passwords to reject)
COMMON_PASSWORDS = frozenset({
    "password", "12345678", "123456789", "1234567890", "qwerty123",
    "password1", "password123", "iloveyou", "sunshine1", "princess1",
    "admin123", "welcome1", "monkey123", "dragon123", "master123",
    "qwerty12", "abc12345", "abcd1234", "1q2w3e4r", "letmein1",
    "football1", "baseball1", "shadow12", "michael1", "jennifer1",
    "trustno1", "superman1", "charlie1", "jessica1", "computer1",
    "changeme", "p@ssw0rd", "p@ssword", "passw0rd", "mindvibe",
})


class PasswordValidationResult:
    """Result of password validation."""

    def __init__(self, ok: bool, errors: list[str] | None = None):
        self.ok = ok
        self.errors = errors or []


class PasswordPolicy:
    """Password policy validator.

    Enforces:
    - Minimum length (default 8 characters)
    - Maximum length (128 chars, prevents bcrypt DoS since bcrypt truncates at 72 bytes)
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    - Not a common/breached password
    """

    def __init__(self, min_length: int = 8, max_length: int = 128):
        self.min_length = min_length
        self.max_length = max_length

    def validate(self, password: str) -> PasswordValidationResult:
        """Validate a password against the policy."""
        errors = []

        if len(password) < self.min_length:
            errors.append(f"Password must be at least {self.min_length} characters")

        if len(password) > self.max_length:
            errors.append(f"Password must be at most {self.max_length} characters")

        if not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")

        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")

        if not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one digit")

        if not any(not c.isalnum() for c in password):
            errors.append("Password must contain at least one special character")

        # Check against common passwords (case-insensitive)
        if password.lower() in COMMON_PASSWORDS:
            errors.append("This password is too common. Please choose a stronger password")

        return PasswordValidationResult(ok=len(errors) == 0, errors=errors)


policy = PasswordPolicy()
