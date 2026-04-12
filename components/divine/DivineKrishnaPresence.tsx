'use client'

/**
 * DivineKrishnaPresence - The Divine Friend awaits
 *
 * An immersive hero section that embodies Krishna as the compassionate
 * divine friend (Sakha) and spiritual guide. No gimmicky logos —
 * a pure, serene, atmospheric presence with sacred gold OM mark
 * and refined KIAAN typography.
 */

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { springConfigs } from '@/lib/animations/spring-configs'
import { useLanguage } from '@/hooks/useLanguage'

/* Inject keyframe for the Sakha name shimmer — matches sakha-symbol.html */
const mandalaStyles = `
@keyframes nameshine {
  0% { background-position: 0% center; }
  50% { background-position: 100% center; }
  100% { background-position: 0% center; }
}
`

/** Sacred OM Mandala — rotating rings, Sri Yantra, lotus, vibration rings */
function DivineOmMark({ reduceMotion }: { reduceMotion: boolean | null }) {
  const animate = !reduceMotion

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Outermost divine aura pulse */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '100%', height: '100%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.0) 35%, rgba(212,175,55,0.06) 55%, rgba(212,175,55,0.18) 72%, rgba(212,175,55,0.08) 85%, transparent 100%)',
        }}
        animate={animate ? { scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] } : undefined}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Outer rotating mandala */}
      <motion.svg
        className="absolute"
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.55))' }}
        viewBox="0 0 400 400"
        fill="none"
        animate={animate ? { rotate: 360 } : undefined}
        transition={animate ? { duration: 90, repeat: Infinity, ease: 'linear' } : undefined}
      >
        <defs>
          <radialGradient id="dk-goldRing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5E27A" stopOpacity={0.9} />
            <stop offset="60%" stopColor="#D4AF37" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#A0792A" stopOpacity={0.3} />
          </radialGradient>
          <filter id="dk-glow"><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {/* Circle rings */}
        <circle cx="200" cy="200" r="192" stroke="url(#dk-goldRing)" strokeWidth="0.8" opacity="0.5" />
        <circle cx="200" cy="200" r="182" stroke="#D4AF37" strokeWidth="0.4" opacity="0.3" />
        <circle cx="200" cy="200" r="170" stroke="#F5E27A" strokeWidth="1.2" opacity="0.6" filter="url(#dk-glow)" />
        {/* 4-point star petals */}
        <g filter="url(#dk-glow)" opacity="0.55">
          <path d="M200 8 L210 190 L200 198 L190 190 Z" fill="#D4AF37" />
          <path d="M392 200 L210 210 L202 200 L210 190 Z" fill="#D4AF37" />
          <path d="M200 392 L190 210 L200 202 L210 210 Z" fill="#D4AF37" />
          <path d="M8 200 L190 190 L198 200 L190 210 Z" fill="#D4AF37" />
        </g>
        {/* 8-petal lotus ring */}
        <g opacity="0.45" filter="url(#dk-glow)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
            <ellipse key={a} cx="200" cy="50" rx="10" ry="26" fill="#D4AF37" transform={`rotate(${a} 200 200)`} />
          ))}
        </g>
        {/* Diamond ring */}
        <g stroke="#F5E27A" strokeWidth="0.6" opacity="0.5" fill="none" filter="url(#dk-glow)">
          <polygon points="200,32 368,200 200,368 32,200" />
          <polygon points="200,32 368,200 200,368 32,200" transform="rotate(22.5 200 200)" />
          <polygon points="200,32 368,200 200,368 32,200" transform="rotate(45 200 200)" />
        </g>
        {/* Mid circles */}
        <circle cx="200" cy="200" r="130" stroke="#D4AF37" strokeWidth="0.6" opacity="0.4" strokeDasharray="4 6" />
        <circle cx="200" cy="200" r="110" stroke="#F5E27A" strokeWidth="0.8" opacity="0.35" />
        {/* Teal accent dots */}
        <circle cx="200" cy="70" r="4" fill="#00E5FF" opacity="0.8" filter="url(#dk-glow)" />
        <circle cx="330" cy="200" r="4" fill="#00E5FF" opacity="0.8" filter="url(#dk-glow)" />
        <circle cx="200" cy="330" r="4" fill="#00E5FF" opacity="0.8" filter="url(#dk-glow)" />
        <circle cx="70" cy="200" r="4" fill="#00E5FF" opacity="0.8" filter="url(#dk-glow)" />
      </motion.svg>

      {/* Inner counter-rotating mandala — Sri Yantra */}
      <motion.svg
        className="absolute"
        style={{ width: '78%', height: '78%', filter: 'drop-shadow(0 0 8px rgba(0,180,216,0.4))' }}
        viewBox="0 0 400 400"
        fill="none"
        animate={animate ? { rotate: -360 } : undefined}
        transition={animate ? { duration: 60, repeat: Infinity, ease: 'linear' } : undefined}
      >
        <defs>
          <filter id="dk-glow2"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g opacity="0.6" filter="url(#dk-glow2)">
          <polygon points="200,60 340,290 60,290" stroke="#F5E27A" strokeWidth="1.5" fill="rgba(212,175,55,0.04)" />
          <polygon points="200,340 60,110 340,110" stroke="#00B4D8" strokeWidth="1.2" fill="rgba(0,180,216,0.04)" />
          <polygon points="200,110 300,260 100,260" stroke="#F5E27A" strokeWidth="1" fill="rgba(212,175,55,0.05)" />
          <polygon points="200,290 100,140 300,140" stroke="#00B4D8" strokeWidth="0.8" fill="rgba(0,180,216,0.05)" />
          <polygon points="200,155 235,215 165,215" stroke="#FFD700" strokeWidth="1.2" fill="rgba(255,215,0,0.08)" />
          <polygon points="200,245 235,185 165,185" stroke="#00B4D8" strokeWidth="1" fill="rgba(0,180,216,0.08)" />
        </g>
        <circle cx="200" cy="200" r="60" stroke="#D4AF37" strokeWidth="1" opacity="0.5" />
        <circle cx="200" cy="200" r="45" stroke="#F5E27A" strokeWidth="0.8" opacity="0.4" strokeDasharray="3 5" />
        <g fill="#F5E27A" opacity="0.5" filter="url(#dk-glow2)">
          {[[200,142],[251,171],[251,229],[200,258],[149,229],[149,171]].map(([x,y],i) => (
            <circle key={i} cx={x} cy={y} r="2.5" />
          ))}
        </g>
      </motion.svg>

      {/* Vibration rings emanating from OM */}
      {animate && [0, 1.16, 2.33].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ width: 80, height: 80, border: '1.5px solid rgba(212,175,55,0.5)' }}
          animate={{ scale: [1, 2.8], opacity: [0.8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay }}
        />
      ))}

      {/* Chakra dots on mandala edge */}
      {[[50,14],[84,30],[84,70],[50,86],[16,70],[16,30]].map(([l,t], i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 6, height: 6, left: `${l}%`, top: `${t}%`,
            transform: 'translateX(-50%) translateY(-50%)',
            background: 'radial-gradient(circle, #00E5FF 0%, #0077B6 100%)',
            boxShadow: '0 0 10px #00E5FF, 0 0 20px rgba(0,229,255,0.6)',
          }}
          animate={animate ? { scale: [1, 1.5, 1], opacity: [0.9, 1, 0.9] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      {/* OM glow background */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 120, height: 120,
          background: 'radial-gradient(circle, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0.10) 45%, transparent 75%)',
        }}
        animate={animate ? { scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] } : undefined}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Central OM symbol */}
      <motion.div
        className="relative select-none z-10"
        animate={animate ? { scale: [1, 1.05, 1] } : undefined}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <span
          style={{
            fontSize: 64,
            lineHeight: 1,
            fontFamily: "'Noto Sans Devanagari', serif",
            background: 'linear-gradient(160deg, #FFF8DC 0%, #F5E27A 30%, #D4AF37 55%, #A0792A 80%, #F5E27A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.9)) drop-shadow(0 0 40px rgba(212,175,55,0.5))',
            userSelect: 'none',
          }}
        >
          {'\u0950'}
        </span>
      </motion.div>
    </div>
  )
}

export function DivineKrishnaPresence() {
  const reduceMotion = useReducedMotion()
  const { t } = useLanguage()

  return (
    <motion.header
      className="relative overflow-hidden rounded-3xl"
      initial={reduceMotion ? undefined : { opacity: 0, y: 15 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Inject keyframe styles for name shimmer */}
      <style dangerouslySetInnerHTML={{ __html: mandalaStyles }} />
      {/* Atmospheric container */}
      <div className="divine-hero-container relative px-6 py-10 sm:px-8 sm:py-14 md:px-12 md:py-20">
        {/* Radial divine light */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '500px',
            height: '500px',
            background:
              'radial-gradient(circle, rgba(212, 164, 76, 0.08) 0%, rgba(212, 164, 76, 0.03) 35%, transparent 65%)',
          }}
          animate={
            reduceMotion
              ? undefined
              : { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
          }
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center space-y-6 text-center">
          {/* Sacred OM mark */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, ...springConfigs.smooth }}
          >
            <DivineOmMark reduceMotion={reduceMotion} />
          </motion.div>

          {/* Gold divider line */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, scaleX: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: 180, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), rgba(255,240,150,0.9), rgba(212,175,55,0.6), transparent)',
            }}
          />

          {/* Sakha branding — matching divine symbol aesthetic */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-1"
          >
            <h2
              className="text-4xl tracking-[0.18em] sm:text-5xl md:text-6xl"
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                fontWeight: 400,
                backgroundImage: 'linear-gradient(120deg, #FFF8DC 0%, #F5E27A 35%, #D4AF37 60%, #FFF8DC 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 16px rgba(212,175,55,0.5))',
                animation: 'nameshine 5s ease-in-out infinite',
              }}
            >
              Sakha
            </h2>
            <p
              className="text-xs tracking-[0.22em] uppercase sm:text-sm"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'rgba(212,175,55,0.75)',
              }}
            >
              {t('home.divine.tagline', 'Your Divine Companion')}
            </p>
            <p
              className="text-[11px] sm:text-xs mt-2"
              style={{
                fontFamily: "'Noto Sans Devanagari', 'Cormorant Garamond', serif",
                color: 'rgba(212,175,55,0.45)',
                letterSpacing: '0.08em',
              }}
            >
              {'\u0938\u0916\u093E \u2014 \u0924\u0935 \u0926\u093F\u0935\u094D\u092F\u0903 \u0938\u093E\u0925\u0940'}
            </p>
          </motion.div>

          {/* Divine greeting */}
          <motion.div
            className="space-y-3"
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-sacred text-2xl font-light tracking-wide sm:text-3xl md:text-4xl">
              {t('home.divine.welcome', 'Welcome, Dear Friend')}
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-300/70 sm:text-base">
              {t(
                'home.divine.subtitle',
                'You have entered a sacred space. Here, Krishna walks beside you — as your friend, your guide, your light in the darkness.'
              )}
            </p>
          </motion.div>

          {/* Sacred verse */}
          <motion.div
            className="mx-auto max-w-md"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="font-sacred text-sm italic leading-relaxed text-[#d4a44c]/60 sm:text-base">
              {t(
                'home.divine.verse',
                '"I am the friend of all beings. Know this and find peace."'
              )}
            </p>
            <p className="mt-1 text-xs text-[#d4a44c]/40">
              — {t('home.divine.verseRef', 'Bhagavad Gita 5.29')}
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
            initial={reduceMotion ? undefined : { opacity: 0, y: 15 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.25, ...springConfigs.smooth }}
          >
            <Link href="/kiaan/chat">
              <motion.div
                className="divine-cta-primary inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold shadow-lg"
                whileHover={{ scale: 1.04, boxShadow: '0 20px 50px rgba(212, 164, 76, 0.3)' }}
                whileTap={{ scale: 0.96 }}
                transition={springConfigs.snappy}
              >
                {t('home.divine.ctaPrimary', 'Speak with KIAAN')}
                <motion.span
                  aria-hidden
                  animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="opacity-70"
                >
                  &rarr;
                </motion.span>
              </motion.div>
            </Link>
            <Link href="/sacred-reflections">
              <motion.div
                className="divine-cta-secondary inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold"
                whileHover={{
                  scale: 1.04,
                  borderColor: 'rgba(212, 164, 76, 0.4)',
                  backgroundColor: 'rgba(212, 164, 76, 0.08)',
                }}
                whileTap={{ scale: 0.96 }}
                transition={springConfigs.snappy}
              >
                {t('home.divine.ctaSecondary', 'Sacred Reflections')}
              </motion.div>
            </Link>
          </motion.div>

          {/* Privacy */}
          <motion.p
            className="pt-2 text-xs text-slate-400/50"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {t('home.divine.privacy', 'Your words remain sacred and private. A confidential refuge.')}
          </motion.p>
        </div>
      </div>
    </motion.header>
  )
}
