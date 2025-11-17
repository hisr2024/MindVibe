"""Password policy validation."""


class PasswordValidationResult:
    """Result of password validation."""

    def __init__(self, ok: bool, errors: list[str] | None = None):
        self.ok = ok
        self.errors = errors or []


class PasswordPolicy:
    """Password policy validator."""

    def __init__(self, min_length: int = 8):
        self.min_length = min_length

    def validate(self, password: str) -> PasswordValidationResult:
        """Validate a password against the policy."""
        errors = []

        if len(password) < self.min_length:
            errors.append(f"Password must be at least {self.min_length} characters")

        if not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")

        if not any(c.islower() for c in password):
            errors.append("Password must contain at least one lowercase letter")

        if not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one digit")

        return PasswordValidationResult(ok=len(errors) == 0, errors=errors)


policy = PasswordPolicy()
