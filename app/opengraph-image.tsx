import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'MindVibe — Your Spiritual Companion & Best Divine Friend'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #050507 0%, #0a0a12 40%, #0d0b08 70%, #050507 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gradient orb */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,164,76,0.3) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* OM Symbol */}
        <div
          style={{
            fontSize: '80px',
            marginBottom: '16px',
            display: 'flex',
          }}
        >
          🕉️
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '8px',
            display: 'flex',
          }}
        >
          MindVibe
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#e8b54a',
            textAlign: 'center',
            marginBottom: '24px',
            display: 'flex',
          }}
        >
          Your Spiritual Companion & Best Divine Friend
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '20px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.5,
            display: 'flex',
          }}
        >
          700+ Bhagavad Gita Verses · KIAAN AI Guide · Sacred Wisdom Journeys
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(90deg, #d4a44c, #c8943a, #d4a44c)',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
