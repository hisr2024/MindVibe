'use client'

import { HelpIcon, FadeIn, AnimatedCard, DisclosureItem, Card, CardContent } from '@/components/ui'

const values = [
  {
    title: 'Privacy-first',
    summary: 'Your data stays yours',
    detail: 'Encrypted journals stay on your device. Conversations avoid tracking and emphasize consent.'
  },
  {
    title: 'Accessibility',
    summary: 'Designed for everyone',
    detail: 'Layouts, color contrast, and focus states are tuned for WCAG 2.1 AA compliance.'
  },
  {
    title: 'Ethical guardrails',
    summary: 'Mindful boundaries',
    detail: 'We avoid medical claims, surface crisis disclaimers, and respect your agency.'
  }
]

const mobileMoments = [
  { label: 'Safe-area aware', detail: 'Respects notches and rounded corners' },
  { label: 'Pocket friendly', detail: 'One-hand optimized layouts' },
  { label: 'Clarity-first', detail: 'Clean microcopy and spacing' }
]

const techStack = [
  { name: 'Next.js 16', description: 'Modern React framework for web applications' },
  { name: 'TypeScript', description: 'Type-safe JavaScript for reliability' },
  { name: 'End-to-End Encryption', description: 'Your journals are encrypted on-device' },
  { name: 'AI-Powered', description: 'Advanced language models for KIAAN guidance' },
]

const howItWorks = [
  { step: 1, title: 'Connect', description: 'Start a conversation with KIAAN or write in your journal', icon: '💬' },
  { step: 2, title: 'Reflect', description: 'Explore your thoughts with guided prompts and wisdom', icon: '🌱' },
  { step: 3, title: 'Grow', description: 'Track your progress and watch your Karmic Tree flourish', icon: '🌳' },
]

const faqs = [
  {
    title: 'How does encryption work?',
    preview: 'Your data is protected',
    content: 'Your journal entries are encrypted directly on your device using industry-standard AES-256 encryption before being stored. This means even we cannot read your private thoughts. The encryption key is derived from your account and never leaves your device.'
  },
  {
    title: 'What AI model powers KIAAN?',
    preview: 'Advanced language understanding',
    content: 'KIAAN is powered by state-of-the-art large language models, fine-tuned with wisdom from ancient traditions including the Bhagavad Gita, Stoic philosophy, and modern psychology. The model is designed to provide thoughtful, non-judgmental guidance while respecting ethical boundaries.'
  },
  {
    title: 'How is MindVibe different from therapy?',
    preview: 'Complementary support',
    content: 'MindVibe is a wellness companion, not a replacement for professional mental health care. KIAAN provides reflective prompts, journaling support, and wisdom-based guidance. For clinical mental health needs, please consult a licensed therapist or counselor. MindVibe can complement therapy but is not a substitute for professional treatment.'
  },
  {
    title: 'Can I export my data?',
    preview: 'Full data portability',
    content: 'Yes! We support full data portability. You can export all your journal entries, chat history, mood data, and settings as a JSON file at any time from your Profile page. This ensures you always have control over your data, in compliance with GDPR and other privacy regulations.'
  },
  {
    title: 'Is MindVibe HIPAA compliant?',
    preview: 'Privacy-focused design',
    content: 'While MindVibe is designed with privacy-first principles and uses strong encryption, we are not currently HIPAA certified. MindVibe is a wellness application, not a healthcare provider. For medical or clinical mental health needs, please use HIPAA-compliant healthcare services.'
  },
  {
    title: 'What happens to my data if I cancel?',
    preview: 'You stay in control',
    content: 'Your data remains on your device even if you cancel your subscription. You can export it anytime before or after cancellation. If you delete your account, all data is permanently removed from our servers. Local data on your device is only removed when you explicitly choose to delete it.'
  },
]

const teamInfo = {
  vision: 'We believe that ancient wisdom combined with modern technology can help people find clarity, peace, and purpose in their daily lives. MindVibe was created to make thoughtful self-reflection accessible to everyone.',
  mission: 'To provide a safe, private space for personal growth through AI-guided reflection, journaling, and wisdom from timeless traditions.',
}

const openSourceCredits = [
  'React & Next.js - The foundation of our web application',
  'Framer Motion - Smooth, accessible animations',
  'Radix UI - Accessible component primitives',
  'Tailwind CSS - Utility-first styling',
  'date-fns - Date manipulation utilities',
]

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 mobile-safe-padding">
      {/* Hero Section */}
      <FadeIn>
        <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">About</p>
              <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">Calm, trust, and safety</h1>
              <p className="max-w-xl text-orange-100/80 text-sm">Quiet guidance with strong privacy and accessible design.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-950">
              <span className="rounded-xl bg-orange-200 px-3 py-1">Dark-mode native</span>
              <span className="rounded-xl bg-orange-100 px-3 py-1">Motion-aware</span>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Team & Vision Section */}
      <FadeIn delay={0.1}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-orange-50">Our Vision</h2>
            <HelpIcon content="What drives us forward" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatedCard className="p-5">
              <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-orange-50 mb-2">Vision</h3>
              <p className="text-sm text-orange-100/70">{teamInfo.vision}</p>
            </AnimatedCard>
            <AnimatedCard className="p-5">
              <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-orange-50 mb-2">Mission</h3>
              <p className="text-sm text-orange-100/70">{teamInfo.mission}</p>
            </AnimatedCard>
          </div>
        </section>
      </FadeIn>

      {/* How It Works Section */}
      <FadeIn delay={0.15}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg font-semibold text-orange-50">How It Works</h2>
            <HelpIcon content="Your journey in three simple steps" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {howItWorks.map((step) => (
              <AnimatedCard key={step.step} className="p-5 text-center">
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-bold text-orange-400">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-orange-50 mb-2">{step.title}</h3>
                <p className="text-sm text-orange-100/70">{step.description}</p>
              </AnimatedCard>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Technology Stack Section */}
      <FadeIn delay={0.2}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-orange-50">Technology Stack</h2>
            <HelpIcon content="Built with modern, secure technologies" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {techStack.map((tech) => (
              <AnimatedCard key={tech.name} className="p-4">
                <p className="text-sm font-semibold text-orange-50">{tech.name}</p>
                <p className="text-xs text-orange-100/70 mt-1">{tech.description}</p>
              </AnimatedCard>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Mobile Experience Section */}
      <FadeIn delay={0.25}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-orange-50">Mobile experience</h2>
            <HelpIcon content="Optimized touch targets and safe-area padding" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {mobileMoments.map(moment => (
              <AnimatedCard key={moment.label} className="p-3">
                <p className="text-sm font-semibold text-orange-50">{moment.label}</p>
                <p className="text-xs text-orange-100/70">{moment.detail}</p>
              </AnimatedCard>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Values Section */}
      <FadeIn delay={0.3}>
        <section className="grid gap-6 md:grid-cols-3">
          {values.map(card => (
            <AnimatedCard key={card.title} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-orange-50">{card.title}</h2>
                <HelpIcon content={card.detail} size="sm" />
              </div>
              <p className="mt-1 text-sm text-orange-100/70">{card.summary}</p>
            </AnimatedCard>
          ))}
        </section>
      </FadeIn>

      {/* FAQ Section */}
      <FadeIn delay={0.35}>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-orange-50">Frequently Asked Questions</h2>
          {faqs.map((faq) => (
            <DisclosureItem key={faq.title} title={faq.title} preview={faq.preview}>
              <p>{faq.content}</p>
            </DisclosureItem>
          ))}
        </section>
      </FadeIn>

      {/* Open Source Acknowledgments */}
      <FadeIn delay={0.4}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <h2 className="text-lg font-semibold text-orange-50 mb-4">Open Source Acknowledgments</h2>
          <p className="text-sm text-orange-100/70 mb-4">
            MindVibe is built on the shoulders of giants. We're grateful to the open source community for these amazing tools:
          </p>
          <ul className="space-y-2">
            {openSourceCredits.map((credit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-orange-100/70">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400 mt-0.5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {credit}
              </li>
            ))}
          </ul>
        </section>
      </FadeIn>

      {/* Learn More Section */}
      <FadeIn delay={0.45}>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-orange-50">Learn more</h2>
          <DisclosureItem title="Our Mission" preview="Slow down, reflect, act" defaultOpen>
            <p>KIAAN leads the dialogue while tools like Clarity Pause and Ardha keep agency with you. On mobile, that means fewer taps, clearer guidance, and just-right friction before big decisions.</p>
          </DisclosureItem>
          <DisclosureItem title="Future Vision" preview="Growing with you">
            <p>Dashboards, insight integrations, and PWA support are on the way. Expect more mobile-native gestures, offline rituals, and gentle haptics as we evolve.</p>
          </DisclosureItem>
        </section>
      </FadeIn>
    </main>
  )
}
