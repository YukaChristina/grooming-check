'use client';

import { useAppStore } from '@/store/useAppStore';
import { Calendar } from 'lucide-react';

export default function Step1Date() {
  const { eventDate, setEventDate, nextStep } = useAppStore();

  const handleNext = () => {
    if (eventDate) nextStep();
  };

  // Ensure minimum date is today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">お見合い・デートはいつですか？</h2>
        <p className="text-sm text-slate-500">当日に向けた最適なアドバイスを生成します。</p>
      </div>

      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center space-y-4">
        <Calendar className="w-12 h-12 text-blue-500 mb-2" />
        <input 
          type="date" 
          min={today}
          value={eventDate || ''}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full p-4 border border-slate-200 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      <button 
        onClick={handleNext}
        disabled={!eventDate}
        className="w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30"
      >
        次へ進む
      </button>
    </div>
  );
}
