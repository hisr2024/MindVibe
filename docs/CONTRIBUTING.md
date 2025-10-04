# Contributing to MindVibe

Thank you for contributing!

This document outlines how to get started contributing to MindVibe, coding and testing conventions, and how we handle keys.

1. Fork the repository (if you are not a collaborator) and create a feature branch:
   git checkout -b feature/short-description

2. Write tests for your changes. We require tests for new behavior.

3. Run the test suite locally:
   pytest -q

4. Ensure type checking (if enabled) and linters pass:
   mypy .
   black --check .

5. Commit changes with clear messages and open a PR against `main`.
