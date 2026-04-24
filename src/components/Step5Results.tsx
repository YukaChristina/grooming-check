'use client';

import { useAppStore } from '@/store/useAppStore';
import { Star, AlertCircle, RefreshCw } from 'lucide-react';

const FACE_PARTS = ['faceFront', 'faceSide', 'faceSideOpposite'];

const OTHER_PARTS = [
  { key: 'hands', label: '手・爪' },
  { key: 'upperBody', label: '上半身' },
  { key: 'fullBody', label: '全身' },
  { key: 'shoes', label: '靴・足元' },
];

export default function Step5Results() {
  const { score, resetApp, skippedParts } = useAppStore();

  if (!score) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-slate-800 font-bold">診断結果が見つかりません</p>
        <button onClick={resetApp} className="px-6 py-2 bg-slate-100 rounded-full font-bold">最初からやり直す</button>
      </div>
    );
  }

  const starCount = score.total ? (score.total >= 85 ? 5 : score.total >= 75 ? 4 : 3) : 0;

  // 顔グループ：正面・側面・反対側面のスコア平均とフィードバック結合
  const faceScores = FACE_PARTS
    .filter(p => typeof score.parts[p] === 'number')
    .map(p => score.parts[p] as number);
  const faceScore = faceScores.length > 0
    ? Math.round(faceScores.reduce((a, b) => a + b, 0) / faceScores.length)
    : null;
  const faceFeedback = FACE_PARTS
    .filter(p => score.partFeedback?.[p])
    .map(p => score.partFeedback![p])
    .join(' ');

  // 顔以外：スコアが数値のもののみ表示
  const evaluatedOtherParts = OTHER_PARTS.filter(({ key }) => typeof score.parts[key] === 'number');

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

      {/* Header */}
      <div className="w-full bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-b-3xl text-white shadow-lg space-y-4 flex flex-col items-center">
        <h2 className="text-lg font-medium opacity-90">総合スコア</h2>
        <div className="text-6xl font-black tracking-tighter flex items-baseline">
          {score.total}<span className="text-2xl font-bold ml-1 opacity-80">点</span>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`w-6 h-6 ${i <= starCount ? 'fill-yellow-400 text-yellow-400' : 'fill-white/20 text-transparent'}`} />
          ))}
        </div>
        <p className="font-bold text-lg text-center mt-2">{score.comments}</p>
      </div>

      <div className="w-full p-4 space-y-6 mt-4">

        {/* 部位別の評価 */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg border-b pb-2 flex items-center">
            <span className="w-1 h-5 bg-indigo-500 rounded-full mr-2"></span>
            部位別の評価
          </h3>
          <div className="space-y-2">

            {faceScore !== null && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">顔</span>
                  <span className="font-black text-lg text-blue-600">{faceScore}点</span>
                </div>
                {faceFeedback && <p className="text-xs text-slate-500 mt-1">{faceFeedback}</p>}
              </div>
            )}

            {evaluatedOtherParts.map(({ key, label }) => (
              <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{label}</span>
                  <span className="font-black text-lg text-blue-600">{score.parts[key] as number}点</span>
                </div>
                {score.partFeedback?.[key] && (
                  <p className="text-xs text-slate-500 mt-1">{score.partFeedback[key]}</p>
                )}
              </div>
            ))}

            {skippedParts
              .filter(key => !FACE_PARTS.includes(key))
              .map(key => {
                const label = OTHER_PARTS.find(p => p.key === key)?.label || key;
                return (
                  <div key={`skip-${key}`} className="bg-slate-50 rounded-xl border border-slate-100 p-4 opacity-70">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-500">{label}</span>
                      <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded">未撮影</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* いつまでに何をすべきか */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2 flex items-center">
            <span className="w-1 h-5 bg-blue-500 rounded-full mr-2"></span>
            いつまでに何をすべきか
          </h3>

          {score.advice.today && score.advice.today.length > 0 && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-red-700 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" /> 今日できること
              </h4>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {score.advice.today.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}

          {score.advice.fewDays && score.advice.fewDays.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-orange-700 text-sm">2〜3日で解決できること</h4>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {score.advice.fewDays.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}

          {score.advice.longTerm && score.advice.longTerm.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-blue-700 text-sm">長期的に取り組むこと</h4>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {score.advice.longTerm.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={resetApp}
          className="w-full mt-8 py-4 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 flex items-center justify-center space-x-2 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          <span>最初からやり直す</span>
        </button>
      </div>
    </div>
  );
}
