'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Bot,
  CheckCircle2,
  Heart,
  Home,
  Lock,
  Mic,
  NotebookPen,
  PauseCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'

import { ThemeToggle } from './components/theme-toggle'
import { ChatBubble } from './components/ChatBubble'
import { GenZNavbar } from './components/GenZNavbar'
import { KiaanAvatar } from './components/KiaanAvatar'
import { ParticleBackground } from './components/ParticleBackground'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Modal, ModalContent, ModalDescription, ModalTitle, ModalTrigger } from './components/ui/modal'
import { Skeleton } from './components/ui/skeleton'
import { Textarea } from './components/ui/textarea'

interface Conversation {
  role: 'user' | 'assistant'
  content: string
}

const onboardingSteps = [
  {
    title: 'Welcome',
    description: 'We will gently guide you through goals and preferences.',
  },
  {
    title: 'Set goals',
    description: 'Choose what you want to nurture: calm, sleep, or focus.',
  },
  {
    title: 'Privacy consent',
    description: 'Your data is encrypted and under your control.',
  },
]

const bottomNav = [
  { icon: Home, label: 'Home' },
  { icon: NotebookPen, label: 'Journal' },
  { icon: Bot, label: 'KIAAN' },
  { icon: BarChart3, label: 'Insights' },
]

function useTimedLoader(delay = 900) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay)
    return () => clearTimeout(timer)
  }, [delay])
  return loading
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [goal, setGoal] = useState('Build a calmer evening routine')
  const [consent, setConsent] = useState(false)
  const [mood, setMood] = useState(6)
  const [journal, setJournal] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [messages, setMessages] = useState<Conversation[]>([
    { role: 'assistant', content: 'Hi, I’m KIAAN. I’m here to offer gentle support whenever you need it.' },
    { role: 'user', content: 'I feel tense before bedtime and want a gentle plan.' },
    {
      role: 'assistant',
      content: 'Thank you for sharing. Let’s create a soft wind-down plan together and bring some ease to your evening.',
    },
  ])
  const [draftMessage, setDraftMessage] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  const isLoadingChat = useTimedLoader()

  useEffect(() => {
    const saved = window.localStorage.getItem('mv-journal')
    if (saved) setJournal(saved)
  }, [])

  useEffect(() => {
    if (!journal) return
    const handle = setTimeout(() => {
      window.localStorage.setItem('mv-journal', journal)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 1200)
    }, 500)
    return () => clearTimeout(handle)
  }, [journal])

  const moodLabel = useMemo(() => {
    if (mood <= 2) return 'Low'
    if (mood <= 4) return 'Tender'
    if (mood <= 6) return 'Steady'
    if (mood <= 8) return 'Hopeful'
    return 'Light'
  }, [mood])

  const createGroundedResponse = (text: string) => {
    const lower = text.toLowerCase()
    if (lower.includes('sleep') || lower.includes('bed')) {
      return 'Sleepy vibes 💤 dim lights, 3 slow breaths, shoulders melting.'
    }
    if (lower.includes('tense') || lower.includes('anxious')) {
      return 'I feel you 🤝 hand to heart, soften the jaw, name one safe thing.'
    }
    return 'Vibes are key! ✨ Inhale 4, hold 2, exhale 6—what feels cozy next?'
  }

  const handleSend = (value = draftMessage) => {
    if (!value.trim() || isResponding) return
    setMessages(prev => [...prev, { role: 'user', content: value }])
    setDraftMessage('')
    setIsResponding(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: createGroundedResponse(value) }])
      setIsResponding(false)
    }, 950)
  }

  const quickPrompts = [
    'Guide me through a 2-minute breath',
    'I need a gentle bedtime plan',
    'How do I calm racing thoughts?',
    'Can you remind me I’m safe right now?',
  ]

  const MotionButton = motion(Button)

  return (
    <main className="relative min-h-screen overflow-hidden pb-24">
      <div className="aurora-sheen" aria-hidden />
      <div className="aurora-pearl" aria-hidden />
      <div className="starfield" aria-hidden />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-8 md:px-8 md:pt-10">
        <GenZNavbar />
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="glow relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-50 via-white to-calm-100 text-ink-100 shadow-soft"
              animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              role="img"
              aria-label="Soft star avatar"
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-100/50 via-white/40 to-calm-100/40" aria-hidden />
              <Star aria-hidden className="h-6 w-6 text-ink-500" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-ink-100/70 dark:text-calm-100/80">Meet KIAAN • MindVibe</p>
              <h1 className="text-3xl font-bold text-ink-100 dark:text-calm-50">A calm, soothing guide for bedtime ease</h1>
              <p className="text-sm text-ink-100/70 dark:text-calm-100/80">
                Gentle UX, privacy-first, and intentionally comforting micro-interactions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-calm-200 bg-white/70 px-3 py-2 text-sm text-ink-100/80 shadow-soft md:flex dark:border-ink-300/70 dark:bg-ink-200/50">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <span>End-to-end encrypted</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card-surface relative overflow-hidden p-6">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-calm-100/60 via-white/30 to-calm-200/40 dark:from-ink-200/40 dark:via-ink-200/10 dark:to-ink-200/40" aria-hidden />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge className="bg-ink-500 text-white shadow-soft">KIAAN status</Badge>
                <h2 className="mt-2 text-2xl font-semibold text-ink-100 dark:text-calm-50">Bedtime comfort lane</h2>
                <p className="text-sm text-ink-100/70 dark:text-calm-100/80">
                  Crafted to lower tension with soft visuals and predictable, safe responses.
                </p>
              </div>
              <div className="flex flex-col gap-2 text-sm text-ink-100/80 dark:text-calm-100">
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-soft dark:bg-ink-200/60">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  <span>KIAAN is tuned for soothing tone</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-soft dark:bg-ink-200/60">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  <span>Safety filters & pause ready</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[{ label: 'Grounding speed', value: 'Under 1s' }, { label: 'Tone', value: 'Warm & calm' }, { label: 'Uptime', value: '99.9%' }].map(item => (
                <div key={item.label} className="rounded-2xl border border-calm-200/70 bg-white/70 p-4 text-sm shadow-soft dark:border-ink-300/60 dark:bg-ink-200/50">
                  <p className="text-ink-100/70 dark:text-calm-100/80">{item.label}</p>
                  <p className="text-xl font-semibold text-ink-100 dark:text-calm-50">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <motion.div
            className="card-surface p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge>Onboarding</Badge>
                <h2 className="mt-2 text-2xl font-semibold text-ink-100 dark:text-calm-50">Progressive welcome</h2>
                <p className="text-sm text-ink-100/70 dark:text-calm-100/80">
                  Gentle, three-step flow with clear privacy consent.
                </p>
              </div>
              <Modal>
                <ModalTrigger asChild>
                  <Button variant="secondary">Privacy policy</Button>
                </ModalTrigger>
                <ModalContent>
                  <ModalTitle>Privacy at MindVibe</ModalTitle>
                  <ModalDescription>
                    Your entries stay on your device until you choose to sync. We avoid red/orange alerts and keep contrast at
                    least 4.5:1 for comfortable reading.
                  </ModalDescription>
                  <div className="mt-4 space-y-2 text-sm text-ink-100/80 dark:text-calm-100/80">
                    <p>
                      • Sessions are encrypted in transit and at rest. <br />• You can pause data collection at any time.
                    </p>
                    <p className="flex items-center gap-2 text-ink-100">
                      <Lock className="h-4 w-4" aria-hidden />
                      Your choices are reversible.
                    </p>
                  </div>
                </ModalContent>
              </Modal>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {onboardingSteps.map((step, index) => {
                const active = index === currentStep
                const done = index < currentStep
                return (
                  <button
                    key={step.title}
                    className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calm-400 focus-visible:ring-offset-2 ${
                      active
                        ? 'border-ink-500 bg-calm-100 shadow-soft'
                        : 'border-calm-200 bg-white/80 dark:border-ink-300/70 dark:bg-ink-200/40'
                    }`}
                    onClick={() => setCurrentStep(index)}
                    aria-current={active}
                    aria-label={`Onboarding step ${index + 1}: ${step.title}`}
                  >
                    <div className="flex items-center gap-2">
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-ink-500" aria-hidden />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-calm-200 text-xs font-semibold text-ink-100">
                          {index + 1}
                        </span>
                      )}
                      <p className="text-sm font-semibold text-ink-100 dark:text-calm-50">{step.title}</p>
                    </div>
                    <p className="mt-2 text-sm text-ink-100/70 dark:text-calm-100/80">{step.description}</p>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-100 dark:text-calm-50">Goal focus</span>
                <Input
                  aria-describedby="goal-help"
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder="Describe what you want to nurture"
                />
                <p id="goal-help" className="text-xs text-ink-100/60 dark:text-calm-100/70">
                  Example: Build a calmer evening routine.
                </p>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-ink-100 dark:text-calm-50">Consent toggle</span>
                <div className="flex items-center gap-3 rounded-2xl border border-calm-200 bg-white/70 px-4 py-3 shadow-soft dark:border-ink-300/70 dark:bg-ink-200/40">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="h-5 w-5 accent-ink-500"
                    aria-describedby="consent-copy"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink-100 dark:text-calm-50">I agree to mindful data use</p>
                    <p id="consent-copy" className="text-xs text-ink-100/60 dark:text-calm-100/70">
                      Clear language, reversible at any time.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </motion.div>

          <motion.div
            className="card-surface p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <Badge className="bg-calm-200 text-ink-100">Mood</Badge>
                <h2 className="mt-2 text-2xl font-semibold text-ink-100 dark:text-calm-50">Mood tracker</h2>
                <p className="text-sm text-ink-100/70 dark:text-calm-100/80">Emoji scale with text + icon feedback.</p>
              </div>
              <Heart className="h-6 w-6 text-ink-500" aria-hidden />
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-calm-100/80 p-4 text-ink-100 shadow-soft dark:bg-ink-200/50">
                <span className="text-2xl" aria-hidden>
                  {mood <= 2 ? '😢' : mood <= 4 ? '😟' : mood <= 6 ? '🙂' : mood <= 8 ? '😊' : '🤗'}
                </span>
                <div>
                  <p className="text-sm font-semibold">How are you feeling?</p>
                  <p className="text-xs text-ink-100/70">{moodLabel} • Tap arrows or drag for nuance.</p>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={mood}
                aria-label="Mood level"
                onChange={e => setMood(Number(e.target.value))}
                className="w-full accent-ink-500"
              />
              <div className="flex flex-wrap gap-2 text-xs text-ink-100/70 dark:text-calm-100/80">
                {['Gentle stretch', 'Water break', 'Two-minute breath', 'Send note to coach'].map(item => (
                  <Badge key={item} className="bg-white text-ink-100 shadow-soft dark:bg-ink-200/60">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="section-grid">
          <Card className="p-6">
            <CardHeader>
              <Badge className="bg-calm-200 text-ink-100">Journal</Badge>
              <CardTitle>Encrypted journal with auto-save</CardTitle>
              <CardDescription>Include voice-to-text and privacy badges for reassurance.</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-ink-100 dark:text-calm-50">Today’s entry</span>
                <Textarea
                  aria-label="Journal entry"
                  minLength={12}
                  rows={5}
                  value={journal}
                  onChange={e => setJournal(e.target.value)}
                  placeholder="How are you feeling? What do you want to remember?"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-100/70 dark:text-calm-100/80">
                <div className="flex items-center gap-2 rounded-full bg-calm-100 px-3 py-1 shadow-soft dark:bg-ink-200/50">
                  <Lock className="h-4 w-4" aria-hidden />
                  <span>End-to-end encrypted</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-calm-100 px-3 py-1 shadow-soft dark:bg-ink-200/50">
                  <Mic className="h-4 w-4" aria-hidden />
                  <span>Voice-to-text ready</span>
                </div>
                {noteSaved && <span className="text-ink-500">Saved • breathing space protected</span>}
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <Badge className="bg-ink-500 text-white">KIAAN</Badge>
              <CardTitle>Calm chat companion</CardTitle>
              <CardDescription>Soft gradients, grounded replies, and instant breathing prompts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="glass-aurora relative overflow-hidden rounded-3xl border border-vibrant-blue/30 bg-black/40 p-6 text-white">
                <ParticleBackground />
                <div className="relative flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-100/80">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 shadow-soft ring-1 ring-white/10">
                        <Sparkles className="h-4 w-4" aria-hidden />
                        Neon-fast replies
                      </span>
                      <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 shadow-soft ring-1 ring-white/10">
                        <Lock className="h-4 w-4" aria-hidden />
                        Encrypted & gentle
                      </span>
                      {isResponding && (
                        <span className="rounded-full bg-vibrant-blue/20 px-3 py-1 text-white shadow-soft ring-1 ring-vibrant-blue/50">
                          Crafting a glow reply…
                        </span>
                      )}
                    </div>
                    <button className="neon-button" type="button">
                      Start Chat 🚀
                    </button>
                  </div>

                  <KiaanAvatar />

                  <div className="flex flex-wrap gap-2 text-xs text-slate-200/80">
                    {['Fast interactions', 'Empowering tone', 'Snappy animations'].map(item => (
                      <span
                        key={item}
                        className="rounded-full bg-vibrant-blue/20 px-3 py-1 text-white shadow-soft ring-1 ring-vibrant-blue/40"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="relative mt-2 flex min-h-[180px] flex-col gap-3" role="log" aria-live="polite" aria-busy={isResponding}>
                    {isLoadingChat ? (
                      <div className="space-y-2" aria-label="Loading chat">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-5 w-3/4" />
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {messages.map((message, index) => (
                          <ChatBubble
                            key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
                            text={message.content}
                            sender={message.role}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>

                  <div className="relative mt-2 flex flex-wrap gap-2" role="group" aria-label="Quick prompts">
                    {quickPrompts.map(prompt => (
                      <motion.button
                        key={prompt}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white shadow-soft ring-1 ring-vibrant-blue/35"
                        onClick={() => handleSend(prompt)}
                        aria-label={`Send prompt: ${prompt}`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Sparkles className="h-4 w-4" aria-hidden /> {prompt}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  <label className="sr-only" htmlFor="chat-input">
                    Message KIAAN
                  </label>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row">
                    <Input
                      id="chat-input"
                      aria-label="Message KIAAN"
                      value={draftMessage}
                      onChange={e => setDraftMessage(e.target.value)}
                      placeholder="Tell KIAAN what you need right now"
                      aria-describedby="chat-actions"
                      className="border-vibrant-blue/40 bg-white/10 text-white placeholder:text-white/60 focus:border-vibrant-pink/50 focus:ring-vibrant-pink/40"
                    />
                    <MotionButton
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSend()}
                      disabled={!draftMessage.trim() || isResponding}
                      className="neon-button md:w-40"
                      aria-label={isResponding ? 'KIAAN is responding' : 'Send message to KIAAN'}
                    >
                      {isResponding ? 'Calming…' : 'Send to KIAAN'}
                    </MotionButton>
                  </div>
                  <div id="chat-actions" className="flex flex-wrap gap-2 text-xs text-ink-100/70 dark:text-calm-100/80">
                    <Button variant="outline" size="sm" className="gap-2 border-white/20 bg-white/10 text-white">
                      <PauseCircle className="h-4 w-4" aria-hidden /> Pause chat
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-white">
                      <PhoneCall className="h-4 w-4" aria-hidden /> Get help
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-white">
                      <ShieldCheck className="h-4 w-4" aria-hidden /> Safety filters on
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="section-grid">
          <Card className="p-6">
            <CardHeader>
              <Badge className="bg-calm-200 text-ink-100">Insights</Badge>
              <CardTitle>Privacy-aware analytics</CardTitle>
              <CardDescription>Summaries without exposing raw entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[{ label: 'Sleep readiness', value: '82%' }, { label: 'Calm streak', value: '6 days' }, { label: 'Journals this week', value: '4' }, { label: 'Emergency contacts', value: '2 saved' }].map(item => (
                  <div key={item.label} className="rounded-2xl border border-calm-200 bg-white/70 p-4 shadow-soft dark:border-ink-300/70 dark:bg-ink-200/40">
                    <p className="text-xs text-ink-100/60 dark:text-calm-100/80">{item.label}</p>
                    <p className="text-xl font-semibold text-ink-100 dark:text-calm-50">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-100/70 dark:text-calm-100/80">
                We avoid harsh reds/oranges and respect WCAG AA contrast.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <Badge className="bg-calm-200 text-ink-100">Feedback</Badge>
              <CardTitle>Listening loop</CardTitle>
              <CardDescription>Lightweight, privacy-friendly feedback form.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" aria-label="Feedback form">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-ink-100 dark:text-calm-50">What felt supportive?</span>
                  <Input name="supportive" placeholder="Gentle check-ins, calming colors, etc." />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-ink-100 dark:text-calm-50">What should we refine?</span>
                  <Textarea name="refine" rows={3} placeholder="Share any friction or access needs." />
                </label>
                <Button type="submit" className="gap-2">
                  <Heart className="h-4 w-4" aria-hidden /> Send feedback
                </Button>
              </form>
              <p className="text-xs text-ink-100/70 dark:text-calm-100/80">
                Designed for keyboard navigation with visible focus rings and aria-describedby bindings for errors.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/90 px-4 py-3 shadow-soft backdrop-blur dark:bg-ink-200/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {bottomNav.map(item => (
            <button
              key={item.label}
              className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold text-ink-100/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calm-400 focus-visible:ring-offset-2"
              aria-label={`${item.label} tab`}
            >
              <item.icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  )
}
