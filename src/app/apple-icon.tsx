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
          background: 'linear-gradient(135deg, #2563eb, #4338ca)',
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
            border: '6px solid rgba(255,255,255,0.9)',
            background: 'rgba(255,255,255,0.15)',
            position: 'relative',
          }}
        >
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
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 6,
            marginTop: -2,
          }}
        />
        {/* アプリ名 */}
        <div
          style={{
            color: 'white',
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
