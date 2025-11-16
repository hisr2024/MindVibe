# Web Dependencies and Version Compatibility

## Overview

This document explains the dependency requirements and version compatibility for the MindVibe web frontend.

## Current Stack

- **Next.js**: ^13.4.19
- **React**: ^18.2.0
- **React DOM**: ^18.2.0
- **TypeScript**: ^5.9.3
- **Node.js**: >=20

## Next 13 ↔ React 18 Requirement

### Why React 18?

Next.js 13 requires React 18 for compatibility. Using React 19 with Next.js 13 causes type mismatches and build failures:

```
ERESOLVE unable to resolve dependency tree
peer react@"^18.2.0" from next@13.4.19
```

### Type Definitions

The following type definition versions are aligned with React 18:

- `@types/react`: ^18.2.79
- `@types/react-dom`: ^18.2.25

Using React 19 type definitions (`@types/react@^19.x`) with Next.js 13 creates TypeScript errors because the types don't match the expected API surface.

## Safe Upgrade Path to React 19

To upgrade to React 19, you **must** upgrade Next.js first:

### Step 1: Upgrade Next.js to >=15

React 19 is only supported in Next.js 15 and later.

```bash
npm install next@latest
```

### Step 2: Update React and Types

Once Next.js 15+ is installed, you can safely upgrade React:

```bash
npm install react@latest react-dom@latest
npm install --save-dev @types/react@latest @types/react-dom@latest
```

### Step 3: Address Breaking Changes

Review the official migration guides:

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

Common breaking changes to address:

- React Server Components API changes
- New `use` hook behavior
- Stricter TypeScript types
- Updated async component patterns

## Installation Commands

### Development

```bash
npm install
```

### CI/CD (Deterministic)

```bash
npm ci
```

### Fallback (Peer Dependency Issues)

```bash
npm install --legacy-peer-deps
```

## Troubleshooting

### ERESOLVE Errors

If you encounter dependency resolution errors:

1. Ensure `package.json` has the correct versions (see above)
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install`

### Type Errors After Upgrade

If TypeScript errors appear after upgrading:

1. Check that `@types/react` matches your React version
2. Clear the TypeScript cache: `rm -rf .next && npm run typecheck`
3. Ensure `next.config.js` is compatible with your Next.js version

### Vercel Build Failures

Vercel builds use the configuration in `vercel.json`. The current setup:

```json
{
  "framework": "nextjs",
  "installCommand": "npm ci || npm install --legacy-peer-deps",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

This provides a fallback installation method if `npm ci` fails.

## Version History

| Date | Next.js | React | Notes |
|------|---------|-------|-------|
| 2024-11 | 13.4.19 | 18.2.0 | Aligned versions for stability |

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Vercel Build Configuration](https://vercel.com/docs/projects/project-configuration)
