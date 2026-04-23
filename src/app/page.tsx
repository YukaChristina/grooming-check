'use client';

import { useAppStore } from '@/store/useAppStore';
import Step1Date from '@/components/Step1Date';
import Step2Tone from '@/components/Step2Tone';
import Step3SelfCheck from '@/components/Step3SelfCheck';
import Step4Camera from '@/components/Step4Camera';
import Step5Results from '@/components/Step5Results';
import { Camera } from 'lucide-react';

export default function Home() {
  const { currentStep } = useAppStore();

  return (
    <main className="min-h-screen max-w-md mx-auto bg-slate-50 relative flex flex-col shadow-2xl">
      {/* App Header (Hide on Results page for immersive feel) */}
      {currentStep < 5 && (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-slate-800 tracking-tight">身だしなみチェック</h1>
          </div>
          <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            STEP {currentStep} / 4
          </div>
        </header>
      )}

      {/* Progress Bar */}
      {currentStep < 5 && (
        <div className="w-full bg-slate-100 h-1">
          <div 
            className="h-1 bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {currentStep === 1 && <Step1Date />}
        {currentStep === 2 && <Step2Tone />}
        {currentStep === 3 && <Step3SelfCheck />}
        {currentStep === 4 && <Step4Camera />}
        {currentStep === 5 && <Step5Results />}
      </div>
    </main>
  );
}
