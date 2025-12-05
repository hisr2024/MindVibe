'use client'

import { useState } from 'react'
import { Button, Modal } from '@/components/ui'

interface DataManagementProps {
  className?: string
}

export function DataManagement({ className = '' }: DataManagementProps) {
  const [showClearChatModal, setShowClearChatModal] = useState(false)
  const [showClearJournalModal, setShowClearJournalModal] = useState(false)
  const [clearingChat, setClearingChat] = useState(false)
  const [clearingJournal, setClearingJournal] = useState(false)

  const handleClearChatHistory = async () => {
    setClearingChat(true)
    try {
      localStorage.removeItem('mindvibe_chat_history')
      localStorage.removeItem('mindvibe_kiaan_conversations')
      setShowClearChatModal(false)
    } finally {
      setClearingChat(false)
    }
  }

  const handleClearJournalEntries = async () => {
    setClearingJournal(true)
    try {
      localStorage.removeItem('mindvibe_journals')
      localStorage.removeItem('mindvibe_journal_entries')
      setShowClearJournalModal(false)
    } finally {
      setClearingJournal(false)
    }
  }

  const dataActions = [
    {
      title: 'Clear Chat History',
      description: 'Remove all KIAAN conversation history',
      action: () => setShowClearChatModal(true),
      variant: 'outline' as const,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </svg>
      ),
    },
    {
      title: 'Clear Journal Entries',
      description: 'Remove all journal entries (cannot be undone)',
      action: () => setShowClearJournalModal(true),
      variant: 'outline' as const,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </svg>
      ),
    },
  ]

  return (
    <div className={className}>
      <div className="space-y-3">
        {dataActions.map((action) => (
          <div
            key={action.title}
            className="flex items-center justify-between p-3 rounded-xl border border-orange-500/15 bg-black/20"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-orange-50">{action.title}</p>
                <p className="text-xs text-orange-100/50">{action.description}</p>
              </div>
            </div>
            <Button variant={action.variant} size="sm" onClick={action.action}>
              Clear
            </Button>
          </div>
        ))}
      </div>

      {/* Clear Chat History Modal */}
      <Modal
        open={showClearChatModal}
        onClose={() => setShowClearChatModal(false)}
        title="Clear Chat History"
        description="This will permanently delete all your KIAAN conversations."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
            <p className="text-sm text-amber-100">
              This action cannot be undone. All chat history will be permanently deleted.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowClearChatModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearChatHistory} disabled={clearingChat}>
              {clearingChat ? 'Clearing...' : 'Clear History'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Journal Entries Modal */}
      <Modal
        open={showClearJournalModal}
        onClose={() => setShowClearJournalModal(false)}
        title="Clear Journal Entries"
        description="This will permanently delete all your journal entries."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
            <p className="text-sm text-red-100">
              Warning: This action cannot be undone. All your journal entries, reflections, and notes will be permanently deleted.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowClearJournalModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearJournalEntries} disabled={clearingJournal}>
              {clearingJournal ? 'Clearing...' : 'Clear Entries'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DataManagement
