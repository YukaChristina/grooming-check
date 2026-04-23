'use client';

import { useAppStore, SelfCheckAnswers } from '@/store/useAppStore';
import { Check, X } from 'lucide-react';

const questions: { key: keyof SelfCheckAnswers; text: string; desc: string }[] = [
  { key: 'noseHair', text: '鼻毛の処理はできていますか？', desc: '鏡で明るい場所で確認しましょう。' },
  { key: 'bodyOdor', text: '体臭・口臭が気になりませんか？', desc: 'デオドラントや歯磨きなどのケアを行いましたか？' },
  { key: 'haircut', text: '美容室・理容室に行きましたか？', desc: '直近2〜3週間以内の来店が目安です。' },
  { key: 'hairWax', text: '整髪料はつけすぎていませんか？', desc: 'テカリすぎず、自然なセットを心がけましょう。' },
];

export default function Step3SelfCheck() {
  const { selfCheck, updateSelfCheck, nextStep, prevStep } = useAppStore();

  return (
    <div className="flex flex-col items-center justify-start p-6 w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">セルフチェック</h2>
        <p className="text-sm text-slate-500">写真では判定できない項目を確認します。</p>
      </div>

      <div className="w-full space-y-4">
        {questions.map((q) => (
          <div key={q.key} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div>
              <p className="font-bold text-slate-800">{q.text}</p>
              <p className="text-xs text-slate-500 mt-1">{q.desc}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => updateSelfCheck(q.key, true)}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-2 border-2 transition-all ${selfCheck[q.key] === true ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
              >
                <Check className="w-4 h-4" />
                <span className="font-bold">はい</span>
              </button>
              <button
                onClick={() => updateSelfCheck(q.key, false)}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-2 border-2 transition-all ${selfCheck[q.key] === false ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
              >
                <X className="w-4 h-4" />
                <span className="font-bold">いいえ</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-3 w-full mt-4">
        <button 
          onClick={prevStep}
          className="w-1/3 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
        >
          戻る
        </button>
        <button 
          onClick={nextStep}
          className="w-2/3 py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30"
        >
          次へ進む
        </button>
      </div>
    </div>
  );
}
