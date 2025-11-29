'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
  return (
    <Button variant="ghost" size="icon" aria-label={label} onClick={toggleTheme}>
      {theme === 'light' ? <Moon className="h-5 w-5" aria-hidden /> : <Sun className="h-5 w-5" aria-hidden />}
    </Button>
  )
}
