import { ImageResponse } from 'next/og'

export const size = 512
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'radial-gradient(circle at 20% 20%, #f0c96d 0%, #d4a44c 40%, #c8943a 70%, #050507 100%)',
          color: '#050507',
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
