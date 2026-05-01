import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f7e3cf, #dec3a0)',
        }}
      >
        {/* 鏡フレーム */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 100,
            height: 100,
            borderRadius: 50,
            border: '6px solid rgba(178, 139, 100, 0.95)',
            background: 'rgba(255, 255, 255, 0.22)',
            position: 'relative',
            boxShadow: '0 0 18px rgba(255,255,255,0.22)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 16,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.75)',
              filter: 'blur(1px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 18,
              width: 8,
              height: 8,
              background: 'rgba(255,255,255,0.95)',
              transform: 'rotate(15deg)',
            }}
          />
          {/* チェックマーク */}
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12 l4 4 l10-10"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {/* 持ち手 */}
        <div
          style={{
            width: 12,
            height: 28,
            background: 'rgba(178, 139, 100, 0.95)',
            borderRadius: 6,
            marginTop: -2,
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.08)',
          }}
        />
        {/* アプリ名 */}
        <div
          style={{
            color: '#5d3f1f',
            fontSize: 13,
            fontWeight: 700,
            marginTop: 10,
            letterSpacing: 1,
          }}
        >
          身だしなみ
        </div>
      </div>
    ),
    { ...size }
  );
}
