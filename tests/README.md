# MindVibe Testing Infrastructure

This document describes the testing infrastructure for the MindVibe application.

## Overview

The MindVibe testing framework uses `pytest` as the primary test runner with support for:
- Unit tests for models and services
- Integration tests for API endpoints
- Test coverage reporting with `pytest-cov`
- Asynchronous testing with `pytest-asyncio`

## Directory Structure

```
tests/
├── __init__.py
├── conftest.py          # Shared test fixtures and configuration
├── unit/                # Unit tests
│   ├── __init__.py
│   ├── test_models.py   # Tests for ORM models
│   └── test_wisdom_kb.py # Tests for wisdom knowledge base service
└── integration/         # Integration tests
    ├── __init__.py
    ├── test_moods_api.py    # Tests for moods API endpoints
    ├── test_journal_api.py  # Tests for journal API endpoints
    └── test_content_api.py  # Tests for content API endpoints
```

## Running Tests

### Prerequisites

Install development dependencies:
```bash
pip install -r requirements-dev.txt
```

### Run All Tests

```bash
pytest
```

### Run Specific Test Categories

Run only unit tests:
```bash
pytest tests/unit/
```

Run only integration tests:
```bash
pytest tests/integration/
```

### Run Specific Test Files

```bash
pytest tests/unit/test_models.py
pytest tests/integration/test_moods_api.py
```

### Run with Coverage Report

```bash
pytest --cov=. --cov-report=html
```

This will generate an HTML coverage report in the `htmlcov/` directory.

### Run with Verbose Output

```bash
pytest -v
```

## Test Configuration

The test configuration is defined in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
minversion = "7.0"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "-v",
    "--strict-markers",
    "--cov=.",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-report=xml",
]
asyncio_mode = "auto"
```

## Test Fixtures

Common test fixtures are defined in `tests/conftest.py`:

- **test_db**: Provides an in-memory SQLite database session for testing
- **test_client**: Provides an AsyncClient for integration testing with dependency overrides
- **test_user_id**: Provides a test user ID
- **test_auth_uid**: Provides a test authentication UID

## Writing Tests

### Unit Tests

Unit tests should test individual components in isolation. Example:

```python
import pytest
from models import User

class TestUserModel:
    @pytest.mark.asyncio
    async def test_create_user(self, test_db):
        user = User(auth_uid="test-123", locale="en")
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        assert user.id is not None
        assert user.auth_uid == "test-123"
```

### Integration Tests

Integration tests should test API endpoints end-to-end. Example:

```python
import pytest
from httpx import AsyncClient

class TestMoodsEndpoints:
    @pytest.mark.asyncio
    async def test_create_mood(self, test_client: AsyncClient):
        response = await test_client.post(
            "/moods",
            json={"score": 2, "tags": ["happy"]},
            headers={"x-auth-uid": "test-user"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 2
```

## Test Coverage

Current test coverage focuses on:
- **Models**: User, Mood, EncryptedBlob, ContentPack, WisdomVerse, and SoftDeleteMixin
- **Services**: WisdomKnowledgeBase (sanitization, queries, search, formatting)
- **API Routes**: Moods, Journal, Content endpoints

### Coverage Reports

After running tests with coverage, you can view:
- Terminal report: Displays immediately after test run
- HTML report: Open `htmlcov/index.html` in a browser
- XML report: `coverage.xml` for CI/CD integration

## Continuous Integration

The GitHub Actions CI workflow automatically runs tests on:
- Push to main branch
- Pull requests to main branch

The workflow is defined in `.github/workflows/ci.yml` and includes:
- Python dependency installation
- Running mypy for type checking
- Running pytest for unit and integration tests

## Best Practices

1. **Write descriptive test names**: Test names should clearly indicate what they're testing
2. **Use fixtures**: Leverage pytest fixtures for common setup and teardown
3. **Test edge cases**: Include tests for error conditions and boundary cases
4. **Keep tests isolated**: Each test should be independent and not rely on other tests
5. **Use async/await properly**: Mark async tests with `@pytest.mark.asyncio`
6. **Mock external dependencies**: Use mocking for external API calls or services

## Troubleshooting

### Tests Fail to Import Modules

Make sure you're in the project root directory and have installed all dependencies:
```bash
cd /path/to/MindVibe
pip install -r requirements.txt -r requirements-dev.txt
```

### Async Tests Not Running

Ensure `pytest-asyncio` is installed and the test is marked with `@pytest.mark.asyncio`.

### Database Errors

Tests use an in-memory SQLite database. If you encounter database errors, check that:
- The `test_db` fixture is being used correctly
- Models are properly imported
- Database migrations are not required for testing

## Contributing

When adding new features:
1. Write unit tests for new models and services
2. Write integration tests for new API endpoints
3. Ensure all tests pass before submitting a pull request
4. Maintain or improve test coverage

## Additional Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-asyncio documentation](https://pytest-asyncio.readthedocs.io/)
- [pytest-cov documentation](https://pytest-cov.readthedocs.io/)
- [FastAPI testing documentation](https://fastapi.tiangolo.com/tutorial/testing/)
