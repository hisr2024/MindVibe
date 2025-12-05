# React Error #418 Fix Guide

## What is React Error #418?

React Error #418 is a hydration mismatch error that occurs in production builds when:
- Server-rendered HTML doesn't match what React expects to render on the client
- Text content appears directly without proper wrapper elements
- Conditional rendering produces inconsistent output between server and client

## Common Causes in MindVibe

### 1. Conditional Rendering with Unwrapped String Literals

**❌ Wrong:**
```tsx
{condition && "text"}
{isLoading && "Loading..."}
```

**✅ Correct:**
```tsx
{condition && <span>text</span>}
{isLoading && <span>Loading...</span>}
```

### 2. Ternary Operators with Unwrapped Strings

**❌ Wrong:**
```tsx
{isActive ? "Active" : "Inactive"}
{count > 0 ? "Items found" : "No items"}
```

**✅ Correct:**
```tsx
{isActive ? <span>Active</span> : <span>Inactive</span>}
{count > 0 ? <span>Items found</span> : <span>No items</span>}
```

### 3. Array Map Returning Unwrapped Text

**❌ Wrong:**
```tsx
{items.map(item => item.name)}
{moods.map(mood => mood.label)}
```

**✅ Correct:**
```tsx
{items.map(item => <span key={item.id}>{item.name}</span>)}
{moods.map(mood => <span key={mood.id}>{mood.label}</span>)}
```

### 4. Text Directly in Fragments

**❌ Wrong:**
```tsx
<>Text content</>
<>Welcome to MindVibe</>
```

**✅ Correct:**
```tsx
<><span>Text content</span></>
<><span>Welcome to MindVibe</span></>
```

### 5. Date/Time Rendering Without suppressHydrationWarning

**❌ Wrong:**
```tsx
<span>{new Date().toLocaleTimeString()}</span>
```

**✅ Correct:**
```tsx
<span suppressHydrationWarning>{new Date().toLocaleTimeString()}</span>
```

## Step-by-Step Debugging Guide

### 1. ESLint Rules (Recommended)

Add these rules to `.eslintrc.json` to catch hydration issues at lint time:
```json
{
  "rules": {
    "react/jsx-no-leaked-render": ["error", { "validStrategies": ["ternary", "coerce"] }],
    "react/jsx-key": ["error", { "checkFragmentShorthand": true }]
  }
}
```

**Note:** There is a known compatibility issue with `eslint-config-next@16.x` and ESLint 8.x that may cause circular reference errors. If you encounter this, either:
1. Upgrade to ESLint 9.x (requires updating other ESLint plugins)
2. Use the detection script below as an alternative

### 2. Run the Detection Script

```bash
node scripts/find-text-rendering-issues.js
```

This script scans your components and app directories for common patterns that cause Error #418.

### 3. Check Browser Console in Development

Run the development server:
```bash
npm run dev
```

React provides more detailed error messages in development mode, showing exactly which element has a hydration mismatch.

### 3. Look for Dynamic Content

Common sources of hydration mismatches:
- `Date.now()` or `new Date()` calls
- `Math.random()` usage
- Browser-only APIs (`window`, `localStorage`, `navigator`)
- Different timezone/locale settings

### 4. Use suppressHydrationWarning Sparingly

For content that legitimately differs between server and client (like timestamps), use:
```tsx
<span suppressHydrationWarning>
  {new Date(timestamp).toLocaleTimeString()}
</span>
```

## Prevention Strategies

### 1. ESLint Rules

The following rules are now enabled in `.eslintrc.json`:
```json
{
  "rules": {
    "react/jsx-no-leaked-render": "error",
    "react/jsx-key": "error"
  }
}
```

### 2. TypeScript Strict Mode

Enable strict mode in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "jsx": "preserve",
    "jsxImportSource": "react"
  }
}
```

### 3. Code Review Checklist

When reviewing React components, check:
- [ ] All conditional renders wrap text in JSX elements
- [ ] All ternary operators wrap text in JSX elements
- [ ] All array maps return JSX elements with proper keys
- [ ] Dynamic dates/times use suppressHydrationWarning
- [ ] No browser-only APIs used during initial render

## Testing After Fixes

```bash
# Build production bundle
npm run build

# Test production locally
npm start

# Check browser console - should be error-free
```

## MindVibe-Specific Patterns

### MessageBubble Component
The `MessageBubble` component in `/components/chat/MessageBubble.tsx` already uses `suppressHydrationWarning` for timestamps:
```tsx
<span suppressHydrationWarning>
  {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
</span>
```

### Mood Check-ins
When rendering mood labels, always wrap in span elements:
```tsx
{moods.map(mood => (
  <span key={mood.label} className="...">
    {mood.emoji} {mood.label}
  </span>
))}
```

### Journal Entries
Journal timestamps should use suppressHydrationWarning since they render locale-specific dates.

## Resources

- [React Hydration Documentation](https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content)
- [Next.js Hydration Errors](https://nextjs.org/docs/messages/react-hydration-error)
- [React Error Decoder](https://reactjs.org/docs/error-decoder.html?invariant=418)
