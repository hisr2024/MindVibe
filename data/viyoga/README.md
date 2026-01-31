# Viyoga Session Store

This directory holds the lightweight JSON store created by the Viyoga API route to
persist session history, messages, and citations for the Detachment Centre assistant.

Runtime files created:

- `store.json`: sessions + messages (including citations)
- `gita_index.json`: optional vector index created by the indexing script

These files are generated at runtime and can be safely deleted in local development.
