const fs = require('fs')
const path = require('path')

describe('Accessibility guardrails', () => {
  const root = process.cwd()

  it('keeps skip link in the root layout for keyboard users', () => {
    const layoutPath = path.join(root, 'app', 'layout.tsx')
    const content = fs.readFileSync(layoutPath, 'utf8')

    expect(content).toContain('href="#main-content"')
    expect(content).toContain('Skip to content')
  })

  it('ensures navigation elements advertise their roles', () => {
    const navPath = path.join(root, 'app', 'components', 'SiteNav.tsx')
    const content = fs.readFileSync(navPath, 'utf8')

    expect(content).toContain('aria-label="Primary"')
    expect(content).toContain('aria-label={t(\'nav.menuToggle\')}')
  })
})
