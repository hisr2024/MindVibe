'use client';

/**
 * Ecosystem Introduction Component
 * Introduces the 3-pillar MindVibe ecosystem
 */
export function EcosystemIntro() {
  const pillars = [
    {
      icon: '🧘',
      title: 'Inner Peace',
      description: 'Find stillness through breath-focused exercises and gentle grounding techniques.',
      gradient: 'from-teal-500/20 to-emerald-500/20',
      border: 'border-teal-400/30',
    },
    {
      icon: '🧠',
      title: 'Mind Control',
      description: 'Develop focused clarity through structured mindfulness practices.',
      gradient: 'from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-400/30',
    },
    {
      icon: '💙',
      title: 'Self Kindness',
      description: 'Cultivate compassion for yourself through warm, supportive exercises.',
      gradient: 'from-pink-500/20 to-rose-500/20',
      border: 'border-pink-400/30',
    },
  ];

  return (
    <section className="space-y-6 rounded-3xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#050507]/80 to-[#120a07]/90 p-6 shadow-[0_30px_120px_rgba(212,164,76,0.18)] backdrop-blur md:p-8">
      {/* Header */}
      <div className="space-y-3 text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#e8b54a] via-[#ffb347] to-rose-200 bg-clip-text text-transparent md:text-4xl">
          The MindVibe Ecosystem
        </h2>
        <p className="mx-auto max-w-2xl text-base text-[#f5f0e8]/80 md:text-lg">
          A holistic approach to spiritual wellness, rooted in ancient wisdom and modern practices
        </p>
      </div>

      {/* Three Pillars */}
      <div className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar, index) => (
          <div
            key={index}
            className={`group relative overflow-hidden rounded-2xl border ${pillar.border} bg-gradient-to-br ${pillar.gradient} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
          >
            {/* Glow effect */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Content */}
            <div className="relative space-y-3">
              <div className="flex items-center justify-center">
                <span className="text-5xl" role="img" aria-label={pillar.title}>
                  {pillar.icon}
                </span>
              </div>
              <h3 className="text-center text-xl font-semibold text-[#f5f0e8]">
                {pillar.title}
              </h3>
              <p className="text-center text-sm text-[#f5f0e8]/80 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Supporting text */}
      <div className="rounded-2xl border border-[#d4a44c]/20 bg-white/5 p-4 text-center">
        <p className="text-sm text-[#f5f0e8]/75">
          ✨ Each pillar works together to create a balanced, sustainable approach to spiritual wellness
        </p>
      </div>
    </section>
  );
}
