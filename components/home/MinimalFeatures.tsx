'use client';

import Link from 'next/link';

/**
 * Minimal Features Component
 * Showcases 3 key features: Voice, Offline, Emotional Reset
 */
export function MinimalFeatures() {
  const features = [
    {
      icon: '🎙️',
      title: 'Voice Guidance',
      description: 'Talk naturally with KIAAN using voice input for a more personal experience.',
      gradient: 'from-purple-500/20 to-violet-500/20',
      border: 'border-purple-400/30',
      link: '/kiaan',
      linkText: 'Try Voice Chat',
    },
    {
      icon: '📱',
      title: 'Offline Ready',
      description: 'Access your journal, moods, and reflections anytime, even without internet.',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-400/30',
      link: '/sacred-reflections',
      linkText: 'Start Journaling',
    },
    {
      icon: '🔄',
      title: 'Emotional Reset',
      description: 'Quick exercises to reset your emotional state and find instant calm.',
      gradient: 'from-orange-500/20 to-amber-500/20',
      border: 'border-orange-400/30',
      link: '/emotional-reset',
      linkText: 'Try Reset',
    },
  ];

  return (
    <section className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-orange-100 md:text-3xl">
          Key Features
        </h2>
        <p className="mt-2 text-sm text-orange-100/70">
          Privacy-first tools designed for your mental wellness journey
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`group relative overflow-hidden rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.gradient} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
          >
            {/* Subtle glow effect on hover */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative space-y-4">
              {/* Icon */}
              <div className="flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/30 border border-white/10">
                  <span className="text-3xl" role="img" aria-label={feature.title}>
                    {feature.icon}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-center text-lg font-semibold text-orange-50">
                  {feature.title}
                </h3>
                <p className="text-center text-sm text-orange-100/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* CTA Link */}
              <div className="flex justify-center">
                <Link
                  href={feature.link}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-orange-50 transition-all hover:bg-white/20 hover:scale-105"
                >
                  {feature.linkText}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
