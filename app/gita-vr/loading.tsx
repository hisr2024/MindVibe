/**
 * Gita VR Loading Screen — Sacred loading experience
 *
 * Shows OM symbol with golden pulse animation and Sanskrit shloka
 * while the 3D scene assets load.
 */

export default function GitaVRLoading() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black">
      {/* Sacred OM with divine golden pulse */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow */}
        <div
          className="absolute h-48 w-48 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212, 164, 76, 0.15) 0%, transparent 70%)',
          }}
        />
        {/* Inner glow */}
        <div
          className="absolute h-32 w-32 animate-pulse rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(240, 201, 109, 0.25) 0%, transparent 60%)',
            animationDelay: '0.5s',
          }}
        />
        {/* OM Symbol */}
        <span
          className="relative text-7xl"
          style={{
            color: '#d4a44c',
            textShadow: '0 0 30px rgba(212, 164, 76, 0.5), 0 0 60px rgba(212, 164, 76, 0.2)',
          }}
        >
          &#x0950;
        </span>
      </div>

      {/* Loading text */}
      <p className="mt-8 text-sm tracking-widest text-[#d4a44c]/60">
        Preparing the Sacred Battlefield...
      </p>

      {/* Sanskrit shloka */}
      <p className="mt-4 font-serif text-xs text-[#d4a44c]/40">
        &#x0927;&#x0930;&#x094D;&#x092E;&#x0915;&#x094D;&#x0937;&#x0947;&#x0924;&#x094D;&#x0930;&#x0947;
        &#x0915;&#x0941;&#x0930;&#x0941;&#x0915;&#x094D;&#x0937;&#x0947;&#x0924;&#x094D;&#x0930;&#x0947;
      </p>
    </div>
  )
}
