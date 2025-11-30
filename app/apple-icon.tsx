import { ImageResponse } from 'next/og'

export const size = 180
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #ffb56b 0%, #ff9248 45%, #ff7a36 65%, #241913 100%)',
          color: '#0b0b0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 120,
          letterSpacing: '-0.03em',
          borderRadius: '30%'
        }}
      >
        MV
      </div>
    ),
    {
      width: size,
      height: size,
    }
  )
}
