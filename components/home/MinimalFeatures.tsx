'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { springConfigs, animationVariants, staggerContainer } from '@/lib/animations/spring-configs';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Minimal Features Component
 * Showcases 3 key features: Voice, Offline, Emotional Reset
 * Enhanced with smooth animations and micro-interactions
 */
export function MinimalFeatures() {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: '🎙️',
      title: t('home.features.voice.title', 'Voice Guidance'),
      description: t('home.features.voice.description', 'Talk naturally with KIAAN using voice input for a more personal experience.'),
      gradient: 'from-purple-500/20 to-violet-500/20',
      border: 'border-purple-400/30',
      link: '/kiaan',
      linkText: t('home.features.voice.cta', 'Try Voice Chat'),
    },
    {
      icon: '📱',
      title: t('home.features.offline.title', 'Offline Ready'),
      description: t('home.features.offline.description', 'Access your journal, moods, and reflections anytime, even without internet.'),
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-400/30',
      link: '/sacred-reflections',
      linkText: t('home.features.offline.cta', 'Start Journaling'),
    },
    {
      icon: '🔄',
      title: t('home.features.reset.title', 'Emotional Reset'),
      description: t('home.features.reset.description', 'Quick exercises to reset your emotional state and find instant calm.'),
      gradient: 'from-orange-500/20 to-amber-500/20',
      border: 'border-orange-400/30',
      link: '/emotional-reset',
      linkText: t('home.features.reset.cta', 'Try Reset'),
    },
  ];

  return (
    <motion.section 
      className="space-y-4"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
    >
      <motion.div 
        className="text-center"
        variants={animationVariants.slideUp}
      >
        <h2 className="text-2xl font-bold text-orange-100 md:text-3xl">
          {t('home.features.title', 'Key Features')}
        </h2>
        <p className="mt-2 text-sm text-orange-100/70">
          {t('home.features.subtitle', 'Privacy-first tools designed for your spiritual wellness journey')}
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.15, ...springConfigs.smooth }}
            whileHover={{ y: -8, transition: springConfigs.snappy }}
            className={`group relative overflow-hidden rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.gradient} p-5 shadow-lg transition-shadow duration-300 hover:shadow-2xl`}
          >
            {/* Subtle glow effect on hover */}
            <motion.div 
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            <div className="relative space-y-4">
              {/* Icon */}
              <div className="flex items-center justify-center">
                <motion.div 
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/30 border border-white/10"
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 5,
                    transition: springConfigs.bouncy 
                  }}
                >
                  <motion.span 
                    className="text-3xl" 
                    role="img" 
                    aria-label={feature.title}
                    whileHover={{
                      scale: 1.2,
                      transition: springConfigs.bouncy
                    }}
                  >
                    {feature.icon}
                  </motion.span>
                </motion.div>
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
                <Link href={feature.link}>
                  <motion.div
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-orange-50 "
                    whileHover={{ 
                      scale: 1.05, 
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      transition: springConfigs.snappy 
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {feature.linkText}
                    <motion.span 
                      aria-hidden
                      animate={{ x: [0, 4, 0] }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5,
                        ease: "easeInOut"
                      }}
                    >
                      →
                    </motion.span>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
