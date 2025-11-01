# Scripts Package

This directory is a Python package containing utility scripts for the MindVibe project.

## Package Structure

The `scripts/` directory is now a Python package and can be imported or run as modules:

```python
# Import the package
from scripts import seed_wisdom, seed_content, verify_wisdom

# Or run as modules
python -m scripts.seed_wisdom
python -m scripts.generate_eddsa_key
```

## Available Scripts

### Python Scripts

#### `generate_eddsa_key.py`
Generates EdDSA (Edwards-curve Digital Signature Algorithm) cryptographic keys for enhanced security.

**Usage:**
```bash
python scripts/generate_eddsa_key.py
# OR
python -m scripts.generate_eddsa_key
```

This will create keys in the `keyset_eddsa/` directory (which is excluded from git).

#### `seed_wisdom.py`
Seeds the database with wisdom verses from the Bhagavad Gita for the AI Vibe Bot feature.

**Usage:**
```bash
python scripts/seed_wisdom.py
# OR
python -m scripts.seed_wisdom
```

**Requirements:**
- Database must be running
- `data/wisdom/verses.json` must exist

#### `seed_content.py`
Seeds the database with content packs for different locales (en, de, hi).

**Usage:**
```bash
python scripts/seed_content.py
# OR
python -m scripts.seed_content
```

**Requirements:**
- Database must be running

#### `verify_wisdom.py`
Verification script to test the wisdom guide implementation. Validates that all components can be imported and basic functionality works.

**Usage:**
```bash
python scripts/verify_wisdom.py
# OR
python -m scripts.verify_wisdom
```

**Tests:**
- Model imports
- Service imports
- Text sanitization
- Text similarity computation
- Verse data loading
- Route imports

### Shell Scripts

#### `run-aider.sh` (Bash)
Runs the Aider AI coding assistant for the project.

**Usage:**
```bash
npm run aider
# or
bash scripts/run-aider.sh
```

#### `run-aider.ps1` (PowerShell)
PowerShell version of the Aider runner for Windows users.

**Usage:**
```bash
npm run aider:ps
# or
pwsh -File scripts/run-aider.ps1
```

## OpenAPI Schema Export

To export the OpenAPI schema from the FastAPI backend:

### Method 1: Using FastAPI CLI (Recommended)

```bash
# Start the FastAPI server first
python -m uvicorn main:app --reload

# In another terminal, access the schema
curl http://localhost:8000/openapi.json > openapi.json
```

### Method 2: Using Python Script

```bash
# Create a simple script to export the schema
python -c "
from main import app
import json

schema = app.openapi()
with open('openapi.json', 'w') as f:
    json.dump(schema, f, indent=2)
print('OpenAPI schema exported to openapi.json')
"
```

### Method 3: From the Browser

1. Start the server: `uvicorn main:app --reload`
2. Navigate to: `http://localhost:8000/docs` (Swagger UI)
3. Or navigate to: `http://localhost:8000/redoc` (ReDoc)
4. Download schema from: `http://localhost:8000/openapi.json`

### Method 4: Create a Dedicated Export Script

Create `scripts/export_openapi.py`:

```python
#!/usr/bin/env python3
"""Export OpenAPI schema from FastAPI application."""

import json
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from main import app

def export_openapi_schema(output_file: str = "openapi.json"):
    """Export OpenAPI schema to a JSON file."""
    schema = app.openapi()
    
    with open(output_file, 'w') as f:
        json.dump(schema, f, indent=2)
    
    print(f"✓ OpenAPI schema exported to {output_file}")
    print(f"  Title: {schema.get('info', {}).get('title')}")
    print(f"  Version: {schema.get('info', {}).get('version')}")
    print(f"  Endpoints: {len(schema.get('paths', {}))}")

if __name__ == "__main__":
    output_file = sys.argv[1] if len(sys.argv) > 1 else "openapi.json"
    export_openapi_schema(output_file)
```

**Usage:**
```bash
python scripts/export_openapi.py
# or specify output file
python scripts/export_openapi.py docs/api/openapi.json
```

## Pre-commit Hooks

The project uses pre-commit hooks for code quality. To install them:

```bash
# Install pre-commit (if not already installed)
pip install pre-commit

# Install the git hooks
pre-commit install

# Run manually on all files
pre-commit run --all-files
```

Hooks include:
- **Black**: Python code formatting
- **Ruff**: Python linting
- **isort**: Python import sorting
- **mypy**: Python type checking
- **Prettier**: JavaScript/TypeScript formatting
- **ESLint**: JavaScript/TypeScript linting
- Various file checks (trailing whitespace, merge conflicts, etc.)

## Development Workflow

### Setting Up Development Environment

```bash
# 1. Clone the repository
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe

# 2. Create virtual environment (Python)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 4. Install Node.js dependencies
npm install

# 5. Set up pre-commit hooks
pre-commit install

# 6. Copy environment variables
cp .env.example .env
# Edit .env with your settings

# 7. Generate EdDSA keys
python scripts/generate_eddsa_key.py
```

### Running the Application

```bash
# Terminal 1: Start the backend
uvicorn main:app --reload

# Terminal 2: Start the frontend
npm run dev
```

### Running Tests

```bash
# Python tests
pytest

# With coverage
pytest --cov=. --cov-report=html

# Node.js tests (when available)
npm test
```

### Code Quality Checks

```bash
# Python
black .
ruff check . --fix
mypy .

# JavaScript/TypeScript
npm run lint
npm run format
npm run typecheck
```

## Adding New Scripts

When adding new scripts:

1. Place them in the `scripts/` directory
2. Add execute permissions: `chmod +x scripts/your_script.sh`
3. Document them in this README
4. Add them to package.json scripts if they should be easily accessible
5. Include usage examples

## Security Notes

- Never commit sensitive data or credentials
- Keep `.env` files local (they are gitignored)
- Use `.env.example` as a template
- Rotate EdDSA keys periodically for production environments
- Review security documentation in `/docs/SECURITY_ARCH.md`

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.
