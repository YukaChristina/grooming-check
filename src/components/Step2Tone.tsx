'use client';

import { useAppStore } from '@/store/useAppStore';
import { Sparkles, MessageCircleHeart } from 'lucide-react';

export default function Step2Tone() {
  const { tone, setTone, nextStep, prevStep } = useAppStore();

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">アドバイスのトーンは？</h2>
        <p className="text-sm text-slate-500">AIからのフィードバックの厳しさを選びます。</p>
      </div>

      <div className="w-full space-y-4">
        <button 
          onClick={() => setTone('strict')}
          className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center space-x-4 ${tone === 'strict' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
        >
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-slate-800">ズバリ言って</h3>
            <p className="text-xs text-slate-500 mt-1">「〜はNGです」など、改善点を率直に指摘してほしい方におすすめです。</p>
          </div>
        </button>

        <button 
          onClick={() => setTone('gentle')}
          className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center space-x-4 ${tone === 'gentle' ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
        >
          <div className="p-3 bg-pink-100 rounded-full text-pink-600">
            <MessageCircleHeart className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-slate-800">やさしく教えて</h3>
            <p className="text-xs text-slate-500 mt-1">「〜するとより好印象です」など、ポジティブな表現でアドバイスします。</p>
          </div>
        </button>
      </div>

      <div className="flex space-x-3 w-full">
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
