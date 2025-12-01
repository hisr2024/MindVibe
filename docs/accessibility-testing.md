# Accessibility and WCAG Alignment

This frontend ships with an automated accessibility smoke test that asserts critical WCAG affordances are present in the
codebase (skip links, labeled navigation toggles, and polite landmarks).

## Running the audit

```bash
npm run test:a11y
```

The command uses Jest and static assertions to verify that high-priority accessibility hooks remain in place. Tests are
fast, deterministic, and runnable in CI without browsers.

## Implementation checklist

- Keep semantic headings, skip links, and ARIA labels intact for navigation and status messaging.
- Preserve visible focus states and sufficient color contrast in Tailwind styles.
- Use `aria-live="polite"` or `role="status"` for dynamic updates.
- Prefer `<button>` elements for interactive controls and ensure keyboard focus order remains logical.
