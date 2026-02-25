import { ImageResponse } from 'next/og'

export const size = 180
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f0c96d 0%, #d4a44c 45%, #c8943a 65%, #050507 100%)',
          color: '#050507',
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
