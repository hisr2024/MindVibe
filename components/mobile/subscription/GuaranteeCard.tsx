'use client'

export function GuaranteeCard() {
  return (
    <div className="rounded-2xl p-5 border border-[#D4A017]/30 bg-gradient-to-br from-[#D4A017]/10 to-transparent">
      <div className="flex items-start gap-3">
        <div className="text-3xl">🛡</div>
        <div>
          <h3
            className="text-lg font-serif text-[#F0C040] mb-1"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            30-Day Sacred Guarantee
          </h3>
          <p className="text-sm text-white/70 leading-relaxed">
            Try Kiaanverse risk-free. Full refund within 30 days, no questions asked.
          </p>
        </div>
      </div>
    </div>
  )
}
