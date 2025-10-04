# Aider Setup and Usage

This document explains how to use Aider for AI-assisted code reviews in the MindVibe project.

## What is Aider?

Aider is an AI pair programming tool that can review code, suggest improvements, and help with development tasks. We've integrated it into the project to provide automated code reviews on pull requests.

## Components

### 1. DevContainer (`.devcontainer/devcontainer.json`)

VS Code DevContainer configuration that sets up a complete development environment with:
- Python 3.11
- Node.js 20
- Docker-in-Docker support
- Pre-configured VS Code extensions for Python, ESLint, Prettier, and Tailwind CSS

**Usage**: Open the project in VS Code and select "Reopen in Container" when prompted, or use the Command Palette (F1) → "Dev Containers: Reopen in Container"

### 2. Aider Configuration (`.aider/config.yml`)

Contains the Aider configuration including:
- Model settings (GPT-4 by default)
- Git commit preferences
- Custom code review prompt tailored for MindVibe's security and quality requirements

The `code-review` prompt focuses on:
- Security concerns (JWT, EdDSA keys, private data)
- Code quality and best practices
- Bug detection and edge cases
- Performance considerations
- Documentation and testing

### 3. Helper Script (`scripts/run-aider.sh`)

A bash script to run Aider code reviews locally.

**Usage**:
```bash
# Make sure the script is executable
chmod +x scripts/run-aider.sh

# Run the code review
./scripts/run-aider.sh
```

The script will:
1. Install/upgrade Aider
2. Create the `reports/` directory if needed
3. Run Aider with the code-review prompt
4. Save suggestions to `reports/aider-suggestions.txt`

**Note**: You'll need to set the `OPENAI_API_KEY` environment variable:
```bash
export OPENAI_API_KEY="your-api-key-here"
./scripts/run-aider.sh
```

### 4. GitHub Actions Workflow (`.github/workflows/aider.yml`)

Automatically runs Aider code reviews on pull requests.

**Features**:
- Triggers on PR open, synchronize, and reopen events
- Caches pip packages for faster runs
- Uploads suggestions as artifacts (retained for 30 days)
- Posts review comments directly on the PR (when suggestions are generated)

**Setup**:
1. Add the `OPENAI_API_KEY` secret to your GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key

2. The workflow will automatically run on new PRs

## Reports Directory

The `reports/` directory stores Aider output:
- `reports/aider-suggestions.txt` - Generated code review suggestions
- The directory structure is committed (via `.gitkeep`) but contents are ignored
- Suggestions are also available as GitHub Actions artifacts

## Security Notes

- **Never commit OpenAI API keys** to the repository
- Use GitHub Secrets for the workflow
- Use environment variables for local development
- The code review prompt enforces key security policies:
  - No private key files in commits
  - Proper error handling
  - Security-conscious JWT/EdDSA implementation

## Customization

To customize the code review behavior, edit `.aider/config.yml`:
- Change the AI model
- Adjust the code-review prompt
- Configure git commit behavior
- Add additional custom prompts

## Troubleshooting

**Aider not found after install**:
- Ensure Python pip is in your PATH
- Try: `python -m pip install --user aider-chat`

**Workflow not running**:
- Check that the `OPENAI_API_KEY` secret is set
- Verify workflow permissions in repository settings

**No suggestions generated**:
- Check the workflow logs for errors
- Ensure the API key is valid and has sufficient quota
- Review rate limits on the OpenAI API

## Resources

- [Aider Documentation](https://aider.chat/docs/)
- [Aider GitHub Repository](https://github.com/paul-gauthier/aider)
- [DevContainers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
