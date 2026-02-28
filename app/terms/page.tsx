/**
 * Terms of Service Page
 *
 * Server component that renders Sakha's Terms of Service.
 * Covers acceptance, accounts, privacy, payments, content,
 * disclaimers, and termination in spiritually-themed but
 * legally adequate language.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Sakha',
  description:
    'Terms of Service for Sakha, your spiritual companion rooted in Bhagavad Gita wisdom. Read about usage, privacy, content, and your sacred responsibilities.',
  alternates: {
    canonical: 'https://mindvibe.life/terms',
  },
}

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <article className="prose prose-invert prose-orange max-w-none">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="text-sm text-white/50">
          Last updated: February 22, 2026
        </p>

        <p className="text-white/70 leading-relaxed">
          Welcome to Sakha. These Terms of Service govern your use of the
          Sakha platform, including our website, mobile application, KIAAN AI
          companion, and all related services. By accessing or using Sakha,
          you agree to be bound by these terms. If you do not agree, please
          refrain from using our services.
        </p>

        {/* Section 1: Acceptance */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            1. Acceptance of Terms
          </h2>
          <p className="text-white/70 leading-relaxed">
            By creating an account, accessing, or using any part of Sakha,
            you acknowledge that you have read, understood, and agree to be
            bound by these Terms of Service, our Privacy Policy, and any
            additional guidelines or rules posted on the platform. We may update
            these terms from time to time; continued use after changes
            constitutes acceptance of the revised terms.
          </p>
          <p className="text-white/70 leading-relaxed">
            You must be at least 13 years of age to use Sakha. If you are
            under 18, you represent that you have obtained parental or guardian
            consent before using the platform.
          </p>
        </section>

        {/* Section 2: Accounts */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            2. Your Account
          </h2>
          <p className="text-white/70 leading-relaxed">
            When you create a Sakha account, you are responsible for
            maintaining the confidentiality of your login credentials and for
            all activities that occur under your account. You agree to provide
            accurate information and to promptly update it if it changes.
          </p>
          <p className="text-white/70 leading-relaxed">
            You may not share your account with others or create multiple
            accounts for deceptive purposes. If you suspect unauthorized access
            to your account, please contact us immediately at{' '}
            <a
              href="mailto:care@mindvibe.life"
              className="text-[#e8b54a] hover:text-[#e8b54a] transition"
            >
              care@mindvibe.life
            </a>
            .
          </p>
        </section>

        {/* Section 3: Privacy */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            3. Privacy and Data Protection
          </h2>
          <p className="text-white/70 leading-relaxed">
            Your spiritual journey is sacred to us. We treat your personal data,
            reflections, journal entries, and interactions with KIAAN with the
            highest level of care and respect. Our collection and use of
            personal information is governed by our{' '}
            <a
              href="/privacy"
              className="text-[#e8b54a] hover:text-[#e8b54a] transition"
            >
              Privacy Policy
            </a>
            , which forms an integral part of these Terms.
          </p>
          <p className="text-white/70 leading-relaxed">
            We encrypt sensitive data at rest and in transit. We do not sell
            your personal information to third parties. Your journal entries and
            reflections are yours alone.
          </p>
        </section>

        {/* Section 4: Payments */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            4. Payments and Subscriptions
          </h2>
          <p className="text-white/70 leading-relaxed">
            Sakha may offer free and paid tiers of service. If you subscribe
            to a paid plan, you agree to pay the applicable fees as described at
            the time of purchase. Subscriptions may renew automatically unless
            you cancel before the renewal date.
          </p>
          <p className="text-white/70 leading-relaxed">
            All fees are stated in the currency shown at checkout. Refunds, if
            applicable, will be processed in accordance with our refund policy.
            We reserve the right to change pricing with reasonable notice to
            existing subscribers.
          </p>
        </section>

        {/* Section 5: Content */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            5. Content and Intellectual Property
          </h2>
          <p className="text-white/70 leading-relaxed">
            The Bhagavad Gita verses, translations, commentary, KIAAN AI
            responses, journey content, and all other materials provided through
            Sakha are protected by copyright and intellectual property laws.
            You may use this content for personal, non-commercial spiritual
            growth purposes only.
          </p>
          <p className="text-white/70 leading-relaxed">
            Content you create on Sakha, such as journal entries,
            reflections, and notes, remains your intellectual property. By
            submitting content, you grant Sakha a limited, non-exclusive
            license to store, process, and display your content back to you as
            part of the service.
          </p>
          <p className="text-white/70 leading-relaxed">
            You agree not to reproduce, distribute, modify, or create
            derivative works from Sakha&apos;s proprietary content without
            our written permission.
          </p>
        </section>

        {/* Section 6: Acceptable Use */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            6. Acceptable Use
          </h2>
          <p className="text-white/70 leading-relaxed">
            Sakha is a platform for spiritual growth and inner peace. You
            agree not to use the platform to:
          </p>
          <ul className="list-disc pl-6 text-white/70 space-y-2">
            <li>Harass, abuse, or harm others</li>
            <li>
              Upload or transmit malicious code, spam, or harmful content
            </li>
            <li>
              Attempt to gain unauthorized access to other accounts or systems
            </li>
            <li>
              Use the platform for any unlawful purpose or in violation of any
              applicable laws
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              platform
            </li>
            <li>
              Scrape, mine, or extract data from Sakha through automated
              means without permission
            </li>
          </ul>
        </section>

        {/* Section 7: Disclaimers */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            7. Disclaimers
          </h2>
          <p className="text-white/70 leading-relaxed">
            Sakha provides spiritual guidance and wisdom resources for
            personal growth and self-reflection. Our platform, including KIAAN
            AI, is <strong className="text-white/90">not a substitute</strong>{' '}
            for professional medical advice, mental health treatment, or
            therapy. If you are experiencing a mental health crisis, please
            contact a qualified professional or emergency services immediately.
          </p>
          <p className="text-white/70 leading-relaxed">
            The platform is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
          <p className="text-white/70 leading-relaxed">
            KIAAN AI generates responses based on Bhagavad Gita teachings and
            spiritual wisdom. While we strive for accuracy and authenticity, AI
            responses may occasionally be imperfect. We recommend consulting
            traditional sources and qualified teachers for deep scriptural
            study.
          </p>
        </section>

        {/* Section 8: Limitation of Liability */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            8. Limitation of Liability
          </h2>
          <p className="text-white/70 leading-relaxed">
            To the fullest extent permitted by applicable law, Sakha and its
            creators, officers, employees, and agents shall not be liable for
            any indirect, incidental, special, consequential, or punitive
            damages, including but not limited to loss of data, loss of
            profits, or personal injury arising from your use of or inability
            to use the platform.
          </p>
        </section>

        {/* Section 9: Termination */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            9. Termination
          </h2>
          <p className="text-white/70 leading-relaxed">
            You may close your account at any time by contacting us at{' '}
            <a
              href="mailto:care@mindvibe.life"
              className="text-[#e8b54a] hover:text-[#e8b54a] transition"
            >
              care@mindvibe.life
            </a>
            . We may suspend or terminate your account if you violate these
            Terms, engage in harmful behavior, or if required by law.
          </p>
          <p className="text-white/70 leading-relaxed">
            Upon termination, your right to access the platform ceases. We will
            retain your data for a reasonable period to comply with legal
            obligations, resolve disputes, and enforce our agreements. You may
            request an export of your personal data before account closure.
          </p>
        </section>

        {/* Section 10: Governing Law */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            10. Governing Law
          </h2>
          <p className="text-white/70 leading-relaxed">
            These Terms shall be governed by and construed in accordance with
            the laws of India, without regard to its conflict of law
            provisions. Any disputes arising from these Terms shall be resolved
            through good-faith negotiation, and if necessary, through binding
            arbitration.
          </p>
        </section>

        {/* Section 11: Contact */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-[#e8b54a]">
            11. Contact Us
          </h2>
          <p className="text-white/70 leading-relaxed">
            If you have any questions about these Terms of Service, please
            reach out to us:
          </p>
          <p className="text-white/70">
            Email:{' '}
            <a
              href="mailto:care@mindvibe.life"
              className="text-[#e8b54a] hover:text-[#e8b54a] transition"
            >
              care@mindvibe.life
            </a>
          </p>
        </section>

        {/* Closing */}
        <section className="mt-12 border-t border-white/10 pt-8">
          <p className="text-center text-sm text-white/40 italic">
            &quot;Set thy heart upon thy work, but never on its reward.&quot;
            <br />
            <span className="text-[#d4a44c]/50">
              &mdash; Bhagavad Gita 2.47
            </span>
          </p>
        </section>
      </article>
    </main>
  )
}
