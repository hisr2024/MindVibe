'use client'

/**
 * Mobile Journal Page — Sacred Reflections.
 *
 * Mounts the 4-tab JournalScreen orchestrator inside MobileAppShell.
 * The legacy single-screen MobileJournal has been superseded; see
 * /root/.claude/plans/starry-sparking-ember.md for context.
 */

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import JournalScreen from './JournalScreen'

export default function MobileJournalPage() {
  return (
    <MobileAppShell showHeader={false} showTabBar>
      <JournalScreen />
    </MobileAppShell>
  )
}
