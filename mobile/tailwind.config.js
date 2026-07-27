/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './screens/**/*.{ts,tsx}', './store/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ブランドカラー #69bdc3 を基準にした濃淡スケール。
        // 既存の emerald-* クラスをそのまま上書きするので、他ファイルの変更は不要。
        emerald: {
          50: '#f2f8f8',
          100: '#e0eff0',
          200: '#bee1e4',
          300: '#95d1d5',
          400: '#69bdc3',
          500: '#43aab1',
          600: '#358c92',
          700: '#2a7479',
          800: '#235d62',
          900: '#1d4a4e',
        },
      },
    },
  },
  plugins: [],
};
