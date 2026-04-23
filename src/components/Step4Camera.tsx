'use client';

import { useState, useRef, useCallback } from 'react';
import { useAppStore, Photos } from '@/store/useAppStore';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, ArrowRight, SkipForward, AlertCircle } from 'lucide-react';

interface PartConfig {
  id: keyof Photos;
  title: string;
  required: boolean;
  desc: string;
}

const parts: PartConfig[] = [
  { id: 'faceFront', title: '顔（正面）', required: true, desc: '清潔感・全体印象・眉毛を確認します。明るい場所で撮影してください。' },
  { id: 'faceSide', title: '顔（側面）', required: true, desc: 'ひげの剃り残しがないか確認します。横を向いて撮影してください。' },
  { id: 'hands', title: '手・爪', required: true, desc: '爪の長さ・汚れ・ささくれを確認します。手の甲側を撮影してください。' },
  { id: 'faceSideOpposite', title: '顔（反対側面）', required: false, desc: '反対側のひげも確認します。' },
  { id: 'upperBody', title: '上半身', required: false, desc: '服装・清潔感を確認します。鏡を使って撮影するかスキップしてください。' },
  { id: 'fullBody', title: '全身', required: false, desc: 'コーディネート全体を確認します。鏡を使って撮影するかスキップしてください。' },
  { id: 'shoes', title: '靴・足元', required: false, desc: '靴の汚れ・手入れを確認します。真上から撮影してください。' },
];

export default function Step4Camera() {
  const { photos, setPhoto, skipPhoto, nextStep, prevStep } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const currentPart = parts[currentIndex];
  const capturedImage = photos[currentPart.id];

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPhoto(currentPart.id, imageSrc);
    }
  }, [webcamRef, currentPart.id, setPhoto]);

  const handleNextPart = async () => {
    if (currentIndex < parts.length - 1) {
      setCurrentIndex(curr => curr + 1);
    } else {
      // Analyze
      setIsAnalyzing(true);
      await performAnalysis();
    }
  };

  const handleSkip = async () => {
    skipPhoto(currentPart.id);
    if (currentIndex < parts.length - 1) {
      setCurrentIndex(curr => curr + 1);
    } else {
      setIsAnalyzing(true);
      await performAnalysis();
    }
  };

  const handleRetake = () => {
    // We don't necessarily need to clear it, just taking a new photo will overwrite.
    // But forcing re-render of webcam is good.
    setPhoto(currentPart.id, ''); // Setting to empty triggers webcam view
  };

  const performAnalysis = async () => {
    try {
      const state = useAppStore.getState();
      
      // Calculate days remaining
      let daysRemaining = 0;
      if (state.eventDate) {
        const event = new Date(state.eventDate);
        const today = new Date();
        const diffTime = event.getTime() - today.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: state.photos,
          selfCheck: state.selfCheck,
          daysRemaining,
          tone: state.tone,
          skippedParts: state.skippedParts
        }),
      });

      if (!response.ok) {
        throw new Error('診断に失敗しました');
      }

      const data = await response.json();
      useAppStore.getState().setScore(data);
      setIsAnalyzing(false);
      nextStep();
    } catch (error) {
      console.error(error);
      alert('診断中にエラーが発生しました。もう一度お試しください。');
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-96 space-y-6 animate-pulse">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">AIが診断中...</h2>
          <p className="text-sm text-slate-500 mt-2">身だしなみを細かくチェックしています</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start p-4 w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-24">
      
      {/* Progress Indicator */}
      <div className="w-full flex justify-between items-center px-2">
        <button onClick={() => { if(currentIndex > 0) setCurrentIndex(c => c-1); else prevStep(); }} className="text-slate-400 text-sm font-bold">戻る</button>
        <div className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
          {currentIndex + 1} / {parts.length}
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-slate-800">{currentPart.title}</h2>
        <p className="text-xs text-slate-500 px-4">{currentPart.desc}</p>
      </div>

      <div className="w-full bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative aspect-[3/4] flex items-center justify-center">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay Badges */}
        {currentPart.required && !capturedImage && (
          <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
            必須
          </div>
        )}
      </div>

      <div className="w-full space-y-3">
        {!capturedImage ? (
          <div className="flex space-x-3">
            {!currentPart.required && (
              <button 
                onClick={handleSkip}
                className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 flex items-center justify-center space-x-2"
              >
                <SkipForward className="w-5 h-5" />
                <span>スキップ</span>
              </button>
            )}
            <button 
              onClick={capture}
              className={`${currentPart.required ? 'w-full' : 'flex-[2]'} py-4 rounded-xl font-bold text-white bg-blue-600 flex items-center justify-center space-x-2`}
            >
              <Camera className="w-5 h-5" />
              <span>撮影する</span>
            </button>
          </div>
        ) : (
          <div className="flex space-x-3">
            <button 
              onClick={handleRetake}
              className="flex-1 py-4 rounded-xl font-bold text-slate-600 bg-slate-100 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>撮り直す</span>
            </button>
            <button 
              onClick={handleNextPart}
              className="flex-[2] py-4 rounded-xl font-bold text-white bg-blue-600 flex items-center justify-center space-x-2"
            >
              <span>{currentIndex === parts.length - 1 ? '診断する' : '次へ'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      {!currentPart.required && !capturedImage && (
        <div className="flex items-start space-x-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>任意の部位はスキップ可能ですが、撮影した方がより正確な診断結果が得られます。</p>
        </div>
      )}
    </div>
  );
}
