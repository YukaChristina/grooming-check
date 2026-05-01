import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f7e3cf, #dec3a0)',
          borderRadius: 8,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="6.5" stroke="#b28b64" strokeWidth="2.2" fill="rgba(255, 255, 255, 0.22)" />
          <rect x="11" y="14.5" width="2" height="5" fill="#b28b64" rx="1" />
          <path d="M8 8 l2 2 l4-4" stroke="#fff4d6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
          <path d="M14.5 4.5 l2 1" stroke="#fff4d6" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <path d="M9.5 3 l1.5 1.5" stroke="#fff4d6" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
