# MindVibe Redesign Guide - Phase 1: Design System Foundation

## Overview

This document provides comprehensive guidance for the MindVibe platform redesign Phase 1, which establishes the foundational design system. The design system creates a clean, modern, multi-page experience while preserving all existing functionality including KIAAN, all guidance engines (Viyog, Ardha, Relationship Compass), Karma features (Tree, Footprint, Reset), and the complete MindVibe ecosystem.

## Design Philosophy

### Core Principles

1. **Calm & Minimal**: The design system prioritizes mental well-being with calming colors, generous whitespace, and uncluttered interfaces.

2. **Accessibility First**: All components meet WCAG AA standards with proper color contrast, keyboard navigation, and screen reader support.

3. **Mobile-First**: Designs start with mobile constraints and progressively enhance for larger screens.

4. **Consistency**: Shared tokens and components ensure visual and behavioral consistency across the platform.

5. **Performance**: Lazy loading, optimized images, and code splitting minimize bundle size and improve load times.

### Non-Negotiable Rules

- **DO NOT** alter or compromise KIAAN's functionality
- **DO NOT** break or reduce any part of the MindVibe ecosystem
- **DO NOT** modify MindVibe or KIAAN logos
- **MUST** maintain multi-page architecture
- **MUST** preserve all existing API routes and backend functionality

## Design Tokens

### Colors (`lib/design-tokens/colors.ts`)

#### Neutrals
The gray scale provides a calming foundation:
```typescript
gray: {
  50: '#F9FAFB',   // Backgrounds
  100: '#F3F4F6',  // Subtle backgrounds
  200: '#E5E7EB',  // Borders
  300: '#D1D5DB',
  400: '#9CA3AF',  // Disabled text
  500: '#6B7280',  // Secondary text
  600: '#4B5563',
  700: '#374151',
  900: '#111827',  // Primary text
}
```

#### Brand Colors
Core brand identity colors:
```typescript
brand: {
  primary: '#6366F1',   // Indigo - KIAAN accent
  secondary: '#8B5CF6', // Purple - Wisdom accent
  success: '#10B981',   // Green - Positive moods
  warning: '#F59E0B',   // Amber - Neutral moods
  calm: '#3B82F6',      // Blue - Calming elements
}
```

#### Tool-Specific Gradients
Each guidance engine and tool has its own gradient:
- **Viyog**: Cyan (#06B6D4) to Blue (#3B82F6)
- **Ardha**: Purple (#8B5CF6) to Indigo (#6366F1)
- **Relationship Compass**: Rose (#F43F5E) to Orange (#FB923C)
- **Karmic Tree**: Green (#10B981) to Emerald (#34D399)

### Typography (`lib/design-tokens/typography.ts`)

#### Font Families
```typescript
fonts: {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro", system-ui, sans-serif',
  display: '"SF Pro Display", "Inter", sans-serif',
}
```

#### Type Scale
| Style | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| Page Headings | 28px | 600 | 1.2 | -0.02em |
| Section Headings | 20px | 600 | 1.3 | - |
| Card Titles | 16px | 600 | 1.4 | - |
| Body | 15px | 400 | 1.6 | - |
| Small | 13px | 400 | 1.5 | - |
| Caption | 12px | 400 | 1.4 | - |

### Spacing (`lib/design-tokens/spacing.ts`)

```typescript
spacing: {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
}

borderRadius: {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
}
```

### Breakpoints (`lib/design-tokens/breakpoints.ts`)

```typescript
breakpoints: {
  mobile: '0px',       // 0-767px
  tablet: '768px',     // 768-1023px
  desktop: '1024px',   // 1024-1439px
  wide: '1440px',      // 1440px+
}
```

## Component Library

### UI Components (`components/ui/`)

#### Button
Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
Sizes: `sm`, `md`, `lg`

```tsx
import { Button } from '@/components/ui'

<Button variant="primary" size="md" loading={false}>
  Click Me
</Button>
```

#### Card
Variants: `default`, `elevated`, `bordered`, `ghost`

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui'

<Card variant="elevated">
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### Input
Types: `text`, `email`, `password`

```tsx
import { Input } from '@/components/ui'

<Input
  label="Email"
  type="email"
  error="Invalid email"
  hint="We'll never share your email"
/>
```

#### Modal
Sizes: `sm`, `md`, `lg`, `xl`

```tsx
import { Modal } from '@/components/ui'

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  description="Optional description"
  size="md"
>
  Modal content
</Modal>
```

#### PageHeader
```tsx
import { PageHeader } from '@/components/ui'

<PageHeader
  title="Page Title"
  subtitle="Optional subtitle"
  showBackButton
  onBack={() => router.back()}
  actions={<Button>Action</Button>}
/>
```

### Navigation Components (`components/navigation/`)

#### DesktopNav
Desktop top navigation with logo, main links, tools dropdown, and user profile.

```tsx
import { DesktopNav } from '@/components/navigation'

<DesktopNav />
```

#### MobileNav
Bottom tab navigation for mobile with 6 tabs: Chat, Journal, Home, Wisdom, Tools, Profile.

```tsx
import { MobileNav } from '@/components/navigation'

<MobileNav />
```

#### ToolsDropdown
Organized dropdown showing guidance engines and karma tools.

```tsx
import { ToolsDropdown } from '@/components/navigation'

<ToolsDropdown categories={toolCategories} />
```

### Layout Components (`components/layouts/`)

#### PageLayout
Standard page wrapper with navigation, header, and content area.

```tsx
import { PageLayout } from '@/components/layouts'

<PageLayout
  header={{ title: 'Dashboard', subtitle: 'Your wellness overview' }}
  maxWidth="6xl"
  padding="md"
>
  Page content
</PageLayout>
```

#### DashboardLayout
Grid-based layout for dashboard with responsive columns.

```tsx
import { DashboardLayout, DashboardSection } from '@/components/layouts'

<DashboardSection title="Quick Actions">
  <DashboardLayout columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
    {/* Tool cards */}
  </DashboardLayout>
</DashboardSection>
```

### Dashboard Components (`components/dashboard/`)

#### ToolCard
Reusable card for dashboard tools.

```tsx
import { ToolCard } from '@/components/dashboard'
import { colors } from '@/lib/design-tokens'

<ToolCard
  icon={<Icon />}
  title="Viyog"
  description="Detachment & mindfulness guidance"
  gradient={colors.viyog}
  href="/viyog"
  ctaText="Open"
/>
```

#### PrimaryActionCard
Eye-catching card for primary actions.

```tsx
import { PrimaryActionCard } from '@/components/dashboard'

<PrimaryActionCard
  title="Talk to KIAAN"
  description="Start a conversation with your AI companion"
  href="/kiaan"
  buttonText="Start Chat"
  variant="indigo"
/>
```

#### SecondaryActionCard
Compact card for secondary actions.

```tsx
import { SecondaryActionCard } from '@/components/dashboard'

<SecondaryActionCard
  icon={<Icon />}
  title="View Insights"
  description="Check your weekly progress"
  href="/insights"
  metric={{ value: '85%', label: 'mood score' }}
/>
```

## Accessibility Guidelines

### Color Contrast
- Text on backgrounds must meet minimum 4.5:1 contrast ratio
- Large text (18px+ or 14px+ bold) can use 3:1 ratio
- Use the design token colors which are pre-tested for contrast

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Focus indicators: 2px outline with brand color
- Tab order should follow visual layout
- Modal focus trapping when open

### Screen Readers
- All images need alt text
- Form inputs need associated labels
- ARIA labels for icon-only buttons
- Live regions for dynamic content

### Touch Targets
- Minimum 44x44px for all interactive elements
- Add padding if needed to meet minimum size
- Consider spacing between adjacent targets

## File Structure

```
lib/
  design-tokens/
    colors.ts         # Color palette
    typography.ts     # Typography scale
    spacing.ts        # Spacing & border radius
    breakpoints.ts    # Responsive breakpoints
    index.ts          # Barrel export

components/
  ui/
    Button.tsx        # Button component
    Card.tsx          # Card component
    Input.tsx         # Input component
    Modal.tsx         # Modal component
    PageHeader.tsx    # Page header component
    index.ts          # Barrel export
  navigation/
    DesktopNav.tsx    # Desktop navigation
    MobileNav.tsx     # Mobile bottom nav
    ToolsDropdown.tsx # Tools dropdown menu
    index.ts          # Barrel export
  layouts/
    PageLayout.tsx    # Standard page layout
    DashboardLayout.tsx # Dashboard grid layout
    index.ts          # Barrel export
  dashboard/
    ToolCard.tsx      # Tool card component
    PrimaryActionCard.tsx
    SecondaryActionCard.tsx
    index.ts          # Barrel export

docs/
  REDESIGN_GUIDE.md   # This document
```

## Contributing Guidelines

### Adding New Components

1. Create component file in appropriate directory
2. Export from directory's index.ts
3. Add TypeScript types for all props
4. Include JSDoc documentation
5. Ensure accessibility compliance
6. Test across breakpoints

### Code Style

- Use TypeScript for all components
- Follow existing naming conventions
- Use Tailwind CSS for styling
- Prefer design tokens over hardcoded values
- Include 'use client' directive for client components

### Testing

- Unit test each component
- Test props, states, and interactions
- Test keyboard navigation
- Test across breakpoints
- Run accessibility audits

## Technology Stack

- **Frontend**: Next.js 14+, React, TypeScript
- **Styling**: Tailwind CSS (extended with design tokens)
- **State**: React hooks, Context API
- **Testing**: Vitest, React Testing Library

---

## Phase 3: Specialized Tool Pages and Reusable Components

### Overview

Phase 3 adds specialized tool pages under `app/tools/` and introduces reusable components for consistent tool page development. This phase maintains all existing functionality while providing a structured approach for tool pages.

### Tool Pages

All specialized tools are accessible via dedicated routes:

| Tool | Primary Route | Tools Route | Description |
|------|---------------|-------------|-------------|
| Viyog | `/viyog` | `/tools/viyog` | Detachment Coach - Outcome anxiety reducer |
| Ardha | `/ardha` | `/tools/ardha` | Cognitive Reframing - Gita-aligned CBT precision |
| Relationship Compass | `/relationship-compass` | `/tools/relationship-compass` | Calm conflict guidance |
| Emotional Reset | `/emotional-reset` | `/tools/emotional-reset` | 7-step guided emotional processing |
| Karma Reset | `/karma-reset` | `/tools/karma-reset` | 4-part emotional repair ritual |
| Karma Footprint | `/karma-footprint` | `/tools/karma-footprint` | Daily action reflection analyzer |
| Karmic Tree | `/karmic-tree` | `/tools/karmic-tree` | Visual progress tracking |

### Reusable Components (`components/tools/`)

#### ToolHeader

Standard header component for tool pages with consistent styling.

```tsx
import { ToolHeader } from '@/components/tools'

<ToolHeader
  title="Viyog - Detachment Coach"
  subtitle="Outcome Anxiety Reducer"
  description="Shift from result-focused anxiety to grounded action."
  badge="🎯 New feature"
  backHref="/dashboard"
  backText="← Back to dashboard"
  showLogo={false}
/>
```

**Props:**
- `title` (required): Main heading text
- `subtitle`: Optional tagline above title
- `description`: Optional description below title
- `badge`: Optional badge content
- `backHref`: Back link URL (default: `/`)
- `backText`: Back link text (default: `← Back to home`)
- `showLogo`: Whether to show MindVibe logo
- `actions`: Additional action elements

#### ToolActionCard

Action card component with multiple color variants.

```tsx
import { ToolActionCard } from '@/components/tools'

<ToolActionCard
  title="Start Detachment Flow"
  description="Begin your journey to release outcome anxiety."
  icon="🎯"
  href="/viyog/start"
  variant="orange"
/>
```

**Props:**
- `title` (required): Card title
- `description`: Card description
- `icon`: Icon or emoji
- `href`: Link URL (makes card clickable)
- `onClick`: Click handler (alternative to href)
- `variant`: Color scheme (`orange`, `purple`, `green`, `blue`, `rose`)
- `disabled`: Disable interaction
- `children`: Additional content

#### KarmaPlant

SVG component with five growth stages for karma visualization.

```tsx
import { KarmaPlant } from '@/components/tools'

<KarmaPlant
  stage="seedling"  // 'seed' | 'seedling' | 'sapling' | 'branching' | 'canopy'
  size={120}
  animate={true}
/>
```

**Props:**
- `stage` (required): Growth stage
- `size`: SVG size in pixels (default: 120)
- `animate`: Enable pulse animation for canopy stage
- `className`: Additional CSS classes

#### KarmicTreeClient

Client component for fetching and displaying Karmic Tree progress with API fallback.

```tsx
import { KarmicTreeClient } from '@/components/tools'

<KarmicTreeClient
  apiEndpoint="/api/analytics/karmic_tree"
  onLoad={(data) => console.log('Loaded:', data)}
  onError={(error) => console.error('Error:', error)}
/>
```

**Features:**
- Fetches from `/api/analytics/karmic_tree` (configurable)
- Graceful fallback to mocked data on API failure
- Displays KarmaPlant visualization
- Shows progress bar and activity stats

**Props:**
- `apiEndpoint`: Custom API endpoint
- `onLoad`: Callback with loaded data
- `onError`: Callback with error message
- `className`: Additional CSS classes

#### ResetPlanCard

Card component for displaying reset plan steps (Karma Reset ritual).

```tsx
import { ResetPlanCard } from '@/components/tools'

<ResetPlanCard
  step={{
    step: 1,
    title: 'Pause and Breathe',
    content: 'Take four slow breaths; let each exhale soften the moment.',
    variant: 'orange',
  }}
  revealed={true}
/>
```

**Props:**
- `step` (required): Step data object
  - `step`: Step number
  - `title`: Step title
  - `content`: Step guidance text
  - `variant`: Color variant (`orange`, `purple`, `green`, `blue`)
- `revealed`: Controls opacity transition
- `className`: Additional CSS classes

### Page Structure

Each tool page follows a consistent structure:

1. **Header**: Uses `ToolHeader` with tool-specific content
2. **Main Content**: Two-column layout (input/response + info/widgets)
3. **Input Section**: Form for user input
4. **Response Section**: Displays API response
5. **Info Section**: About, flow steps, or related tools

### Accessibility Requirements

All tool pages must:
- Use semantic HTML (`<main>`, `<header>`, `<section>`)
- Include proper ARIA attributes (`role`, `aria-label`, `aria-describedby`)
- Support keyboard navigation
- Provide visible focus indicators
- Include form labels and error messages

### Testing

Tests are located in `tests/ui/tools/`:
- `ToolComponents.test.tsx`: Unit tests for reusable components
- `ToolPages.test.tsx`: Page rendering tests

Run tests with:
```bash
npm run test
```

### File Structure

```
app/
  tools/
    viyog/page.tsx          # Redirects to /viyog
    ardha/page.tsx          # Redirects to /ardha
    relationship-compass/   # Redirects to /relationship-compass
    emotional-reset/        # Redirects to /emotional-reset
    karma-reset/           # Redirects to /karma-reset
    karma-footprint/       # Redirects to /karma-footprint
    karmic-tree/           # Redirects to /karmic-tree
  karma-footprint/
    page.tsx               # Karma Footprint analyzer page

components/
  tools/
    ToolHeader.tsx         # Page header component
    ToolActionCard.tsx     # Action card component
    KarmaPlant.tsx         # SVG plant stages
    KarmicTreeClient.tsx   # Karmic Tree fetch component
    ResetPlanCard.tsx      # Reset plan step card
    index.ts               # Barrel export

tests/
  ui/
    tools/
      ToolComponents.test.tsx  # Component tests
      ToolPages.test.tsx       # Page tests
```

### Non-Negotiable Rules

- **DO NOT** modify backend or API routes
- **DO NOT** alter MindVibe or KIAAN logos
- **DO NOT** break existing tool functionality
- **MUST** use TypeScript for all components
- **MUST** include accessibility attributes
- **MUST** use mocked data fallback for Karma endpoints

---

## Related Documentation

- [Tech Summary](./TECH_SUMMARY.md)
- [KIAAN Wisdom Engine](./KIAAN_WISDOM_ENGINE.md)
- [Security Architecture](./SECURITY_ARCH.md)

---

# Phase 3: Specialized Tool Pages

## Overview

Phase 3 adds dedicated tool pages under `app/tools/` with reusable components, clear headings, and fast access to core actions. All pages use the shared design system tokens and maintain accessibility standards.

## New Pages

| Page | Route | Description |
|------|-------|-------------|
| Viyog | `/tools/viyog` | Detachment Coach - outcome anxiety reducer |
| Ardha | `/tools/ardha` | Cognitive Reframing - Gita-aligned CBT precision |
| Relationship Compass | `/tools/relationship-compass` | Calm conflict guidance |
| Emotional Reset | `/tools/emotional-reset` | 7-step guided processing flow |
| Karma Reset | `/tools/karma-reset` | 4-part reset ritual |
| Karma Footprint | `/tools/karma-footprint` | Daily action reflection analyzer |
| Karmic Tree | `/tools/karmic-tree` | Visual progress tracking visualization |

## Tool Components (`components/tools/`)

### ToolHeader

Small header with icon, title, subtitle, and optional CTA.

```tsx
import { ToolHeader } from '@/components/tools'

<ToolHeader
  icon="🎯"
  title="Viyog - Detachment Coach"
  subtitle="Shift from result-focused anxiety to grounded action."
  cta={{ label: 'Start Now', href: '/tools/viyog#start' }}
  backLink={{ label: 'Back to home', href: '/' }}
/>
```

### ToolActionCard

Icon, title, short line, and CTA for quick tool actions.

```tsx
import { ToolActionCard } from '@/components/tools'

<ToolActionCard
  icon="⏱️"
  title="Launch 60s Clarity Pause"
  description="A quick reset when outcome anxiety feels overwhelming."
  ctaLabel="Start Pause"
  href="/tools/viyog#clarity-pause"
  gradient="from-cyan-500/10 to-blue-500/10"
/>
```

### KarmaPlant

Visual SVG component for karma footprint states.

```tsx
import { KarmaPlant, type KarmaFootprintState } from '@/components/tools'

// States: 'strong_positive' | 'mild_positive' | 'neutral' | 'mild_heavy' | 'heavy'
<KarmaPlant state="mild_positive" size="md" />
```

### ResetPlanCard

Displays the 4-element reset plan from KIAAN.

```tsx
import { ResetPlanCard } from '@/components/tools'

<ResetPlanCard
  plan={{
    pauseAndBreathe: 'Take a deep breath and center yourself.',
    nameTheRipple: 'Your words created discomfort.',
    repair: 'A sincere apology can begin healing.',
    moveWithIntention: 'Next time, pause before speaking.',
  }}
  animated={true}
/>
```

### KarmicTreeClient

Client component fetching analytics and rendering tree visualization.

```tsx
import { KarmicTreeClient } from '@/components/tools'

<KarmicTreeClient />
```

## Navigation Updates

The Tools dropdown (`components/navigation/ToolsDropdown.tsx`) now links to the new `/tools/*` pages through updated constants in `lib/constants/tools.ts`.

## Tests

Tests are located at `tests/frontend/tools/ToolComponents.test.tsx` and cover:

- ToolHeader rendering and interactions
- ToolActionCard link/button modes
- KarmaPlant state visualizations
- ResetPlanCard step rendering

Run tests with: `npm test`

---

*Phase 3 of 5 - Specialized Tool Pages*
*Last Updated: December 2024*
