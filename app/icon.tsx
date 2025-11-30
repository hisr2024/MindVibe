import { ImageResponse } from 'next/og'

export const size = 512
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'radial-gradient(circle at 20% 20%, #ffd89b 0%, #ff9c5b 40%, #ff7a36 70%, #1f1712 100%)',
          color: '#0b0b0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 220,
          letterSpacing: '-0.04em',
          borderRadius: '22%'
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
