'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore, Photos } from '@/store/useAppStore';
import Webcam from 'react-webcam';
import { Camera, SkipForward, AlertCircle, RefreshCw } from 'lucide-react';

type CaptureStep = 'guide' | 'camera' | 'quality_check' | 'confirm' | 'error';

interface PartConfig {
  id: keyof Photos;
  title: string;
  required: boolean;
  desc: string;
}

// ④ 全身撮影・反対側面を削除
const parts: PartConfig[] = [
  { id: 'faceFront',  title: '顔（正面）', required: true,  desc: '清潔感・全体印象・眉毛を確認します。明るい場所で撮影してください。' },
  { id: 'faceSide',   title: '顔（側面）', required: true,  desc: 'ひげの剃り残しがないか確認します。右を向いて撮影してください。' },
  { id: 'hands',      title: '手・爪',     required: true,  desc: '爪の長さ・汚れ・ささくれを確認します。手の甲側を撮影してください。' },
  { id: 'upperBody',  title: '上半身',     required: false, desc: '服装・清潔感を確認します。内カメラ・外カメラを切り替えて撮影してください。' },
  { id: 'shoes',      title: '靴・足元',   required: false, desc: '靴の汚れ・手入れを確認します。真上から撮影してください。' },
];

const SHOT_GUIDES: Record<string, { title: string; instruction: string; tips: string[] }> = {
  faceFront: {
    title: '顔（正面）を撮影',
    instruction: 'セルフィーカメラで顔全体が明るく映るように撮影してください',
    tips: ['明るい場所で撮影する', 'スマホを目線の高さに合わせる', '顔全体が枠内に収まるように'],
  },
  faceSide: {
    title: '顔（側面）を撮影',
    instruction: '右を向いてください。5秒後に自動撮影します',
    tips: ['耳から顎のラインが見えるように', 'ひげが映る角度で撮影する', 'スマホは正面を向けたまま顔だけ右へ'],
  },
  hands: {
    title: '手・爪を撮影',
    instruction: '両手の爪が見えるように撮影してください',
    tips: ['明るい場所で撮影する', '爪先までピントが合うように近づける'],
  },
  upperBody: {
    title: '上半身を撮影',
    instruction: '服装が全体的に映るように撮影してください',
    tips: ['内カメラ・外カメラはボタンで切り替え可能', '明るい場所で撮影する'],
  },
  shoes: {
    title: '靴・足元を撮影',
    instruction: '靴の状態が確認できるように撮影してください',
    tips: ['真上から撮影する', '靴全体が映るように距離を取る'],
  },
};

async function checkImageQuality(base64: string): Promise<{ ok: boolean; reason?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        total += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      const avg = total / (data.length / 4);

      if (avg < 30) {
        resolve({ ok: false, reason: '画像が暗すぎます。明るい場所で撮影してください' });
      } else if (avg > 240) {
        resolve({ ok: false, reason: '明るすぎます。光源を避けて撮影してください' });
      } else {
        const sizeKB = (base64.length * 3) / 4 / 1024;
        if (sizeKB < 20) {
          resolve({ ok: false, reason: '画像が判定できません。再撮影してください' });
        } else {
          resolve({ ok: true });
        }
      }
    };
    img.src = base64;
  });
}

function FaceOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <div className="w-56 h-72 rounded-full border-4 border-white opacity-80" />
      <p className="mt-4 text-white text-sm text-center px-4">顔を枠内に収めてください</p>
    </div>
  );
}

// ① 横顔カウントダウンオーバーレイ（右向き矢印＋テキスト＋カウント）
function SideFaceCountdownOverlay({ countdown }: { countdown: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/30">
      <p className="text-white text-xl font-bold drop-shadow mb-1">右を向いてください</p>
      <span
        className="text-white drop-shadow"
        style={{ fontSize: '5rem', lineHeight: 1 }}
      >
        →
      </span>
      <div className="mt-4 w-20 h-20 rounded-full bg-black/60 flex items-center justify-center">
        <span className="text-white text-5xl font-bold">{countdown}</span>
      </div>
    </div>
  );
}

// ② 手形オーバーレイ（手の甲側・爪が見える向き）
function HandOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 100 120"
        className="w-36 h-44 opacity-80"
        fill="none"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Pinky */}
        <path d="M 8 86 L 8 60 Q 8 48 16 48 Q 24 48 24 60 L 24 82" />
        {/* Ring */}
        <path d="M 26 82 L 26 48 Q 26 36 34 36 Q 42 36 42 48 L 42 82" />
        {/* Middle */}
        <path d="M 44 82 L 44 42 Q 44 30 52 30 Q 60 30 60 42 L 60 82" />
        {/* Index */}
        <path d="M 62 82 L 62 48 Q 62 36 70 36 Q 78 36 78 48 L 78 82" />
        {/* Thumb */}
        <path d="M 80 82 L 80 62 Q 80 50 87 50 Q 94 52 93 66 L 88 86" />
        {/* Palm */}
        <path d="M 8 86 Q 5 104 8 110 Q 12 116 50 116 Q 88 116 92 110 Q 95 104 88 86" />
      </svg>
      <p className="mt-2 text-white text-sm text-center px-4 drop-shadow">
        手・爪を枠内に映してください
      </p>
    </div>
  );
}

function CaptureError({ reason, onRetry }: { reason: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-white rounded-xl p-6 w-full shadow-lg">
        <p className="text-center font-bold text-gray-700 mb-4">⚠️ 再撮影が必要です</p>
        <div className="flex items-start gap-2 text-red-500">
          <span>✗</span>
          <span>{reason}</span>
        </div>
      </div>
      <button
        onClick={onRetry}
        className="mt-6 w-full bg-teal-400 text-white py-4 rounded-xl font-bold text-lg"
      >
        再撮影する
      </button>
    </div>
  );
}

function CaptureConfirm({
  imageBase64,
  onOk,
  onRetry,
}: {
  imageBase64: string;
  onOk: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center w-full">
      <img src={imageBase64} alt="撮影した画像" className="w-48 rounded-lg shadow mb-4" />
      <p className="text-sm text-gray-600 mb-4">この画像で診断しますか？</p>
      <button
        onClick={onOk}
        className="w-full bg-teal-400 text-white py-4 rounded-xl font-bold text-lg mb-2"
      >
        OK（次へ進む）
      </button>
      <button onClick={onRetry} className="w-full text-teal-500 py-2 text-sm">
        再撮影する
      </button>
    </div>
  );
}

export default function Step4Camera() {
  const { setPhoto, skipPhoto, nextStep, prevStep } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [captureStep, setCaptureStep] = useState<CaptureStep>('guide');
  const [tempImage, setTempImage] = useState('');
  const [errorReason, setErrorReason] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  // ③ 上半身カメラ向き切り替え
  const [cameraFacingOverride, setCameraFacingOverride] = useState<'user' | 'environment' | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const isCapturingRef = useRef(false);

  const currentPart = parts[currentIndex];
  const guide = SHOT_GUIDES[currentPart.id];

  const frontCameraParts: (keyof Photos)[] = ['faceFront', 'faceSide'];
  const defaultFacingMode = frontCameraParts.includes(currentPart.id) ? 'user' : 'environment';
  const effectiveFacingMode = cameraFacingOverride ?? defaultFacingMode;

  const showFaceOverlay = ['faceFront', 'faceSide'].includes(currentPart.id);
  const isSideFacePart = currentPart.id === 'faceSide';
  const isUpperBody = currentPart.id === 'upperBody';
  const isHandsPart = currentPart.id === 'hands';

  // パートが変わったらカメラ向きオーバーライドをリセット
  useEffect(() => {
    setCameraFacingOverride(null);
  }, [currentIndex]);

  // ① カウントダウン開始：横顔撮影でカメラが開いたとき（5秒）
  useEffect(() => {
    if (captureStep === 'camera' && isSideFacePart) {
      isCapturingRef.current = false;
      setCountdown(5);
    } else {
      setCountdown(null);
    }
  }, [captureStep, currentPart.id]);

  // カウントダウンのティック
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // カウントダウン0で自動撮影
  useEffect(() => {
    if (countdown === 0) capture();
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceToNextPart = async () => {
    if (currentIndex < parts.length - 1) {
      setCurrentIndex(i => i + 1);
      setCaptureStep('guide');
      setTempImage('');
      setErrorReason('');
    } else {
      setIsAnalyzing(true);
      await performAnalysis();
    }
  };

  const capture = useCallback(async () => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;
    setCountdown(null);

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      isCapturingRef.current = false;
      return;
    }

    setTempImage(imageSrc);
    setCaptureStep('quality_check');

    const result = await checkImageQuality(imageSrc);
    if (result.ok) {
      setCaptureStep('confirm');
    } else {
      setErrorReason(result.reason ?? '');
      setCaptureStep('error');
    }
    isCapturingRef.current = false;
  }, []);

  const handleConfirmOk = async () => {
    setPhoto(currentPart.id, tempImage);
    await advanceToNextPart();
  };

  const handleRetry = () => {
    setTempImage('');
    setErrorReason('');
    setCaptureStep('camera');
  };

  const handleSkip = async () => {
    skipPhoto(currentPart.id);
    await advanceToNextPart();
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setCaptureStep('guide');
      setTempImage('');
      setErrorReason('');
    } else {
      prevStep();
    }
  };

  const performAnalysis = async () => {
    try {
      const state = useAppStore.getState();

      let daysRemaining = 0;
      if (state.eventDate) {
        const event = new Date(state.eventDate);
        const today = new Date();
        const diffTime = event.getTime() - today.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: state.photos,
          selfCheck: state.selfCheck,
          daysRemaining,
          tone: state.tone,
          skippedParts: state.skippedParts,
        }),
      });

      if (!response.ok) throw new Error('診断に失敗しました');

      const data = await response.json();

      if (data.undiagnosable) {
        setIsAnalyzing(false);
        alert(data.undiagnosableReason || '画像が不鮮明なため診断できませんでした。再度撮影してください。');
        return;
      }

      useAppStore.getState().setScore(data);
      setIsAnalyzing(false);
      nextStep();
    } catch (error) {
      console.error(error);
      alert('診断中にエラーが発生しました。もう一度お試しください。');
      setIsAnalyzing(false);
    }
  };

  const ProgressBar = () => (
    <div className="w-full flex justify-between items-center px-2 mb-4">
      <button onClick={handleBack} className="text-slate-400 text-sm font-bold">戻る</button>
      <div className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
        {currentIndex + 1} / {parts.length}
      </div>
    </div>
  );

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-96 space-y-6 animate-pulse">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">AIが診断中...</h2>
          <p className="text-sm text-slate-500 mt-2">身だしなみを細かくチェックしています</p>
        </div>
      </div>
    );
  }

  if (captureStep === 'guide') {
    return (
      <div className="flex flex-col items-center justify-start p-4 w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-4 duration-300 pb-8">
        <ProgressBar />

        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">{guide.title}</h2>
        <p className="text-sm text-slate-600 text-center px-4 mb-6">{guide.instruction}</p>

        <div className="w-full bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold text-blue-700 mb-2">撮影のコツ</p>
          <ul className="space-y-2">
            {guide.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {!currentPart.required && (
          <>
            <button
              onClick={handleSkip}
              className="w-full py-3 rounded-xl font-bold text-slate-600 bg-slate-100 flex items-center justify-center space-x-2 mb-3"
            >
              <SkipForward className="w-5 h-5" />
              <span>スキップ</span>
            </button>
            <div className="flex items-start space-x-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>任意の部位はスキップ可能ですが、撮影した方がより正確な診断結果が得られます。</p>
            </div>
          </>
        )}

        <button
          onClick={() => setCaptureStep('camera')}
          className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 flex items-center justify-center space-x-2"
        >
          <Camera className="w-5 h-5" />
          <span>撮影開始</span>
        </button>
      </div>
    );
  }

  if (captureStep === 'camera') {
    return (
      <div className="flex flex-col items-center justify-start p-4 w-full max-w-md mx-auto space-y-3 animate-in fade-in duration-300 pb-8">
        <div className="w-full flex justify-between items-center px-2">
          <button onClick={() => setCaptureStep('guide')} className="text-slate-400 text-sm font-bold">戻る</button>
          <div className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            {currentIndex + 1} / {parts.length}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800">{currentPart.title}</h2>

        {isSideFacePart && (
          <p className="text-xs text-slate-500 text-center">
            右を向いてください。{countdown ?? 0} 秒後に自動撮影します
          </p>
        )}

        <div className="w-full bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative h-96 flex items-center justify-center">
          <Webcam
            key={`${currentPart.id}-${effectiveFacingMode}`}
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: { ideal: effectiveFacingMode } }}
            className="w-full h-full object-cover"
          />

          {currentPart.required && (
            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
              必須
            </div>
          )}

          {/* ③ 上半身：カメラ切り替えボタン */}
          {isUpperBody && (
            <button
              onClick={() => setCameraFacingOverride(m => m === 'user' ? 'environment' : 'user')}
              className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{effectiveFacingMode === 'user' ? '内カメラ' : '外カメラ'}</span>
            </button>
          )}

          {showFaceOverlay && !isSideFacePart && <FaceOverlay />}

          {/* ② 手形オーバーレイ */}
          {isHandsPart && <HandOverlay />}

          {/* ① 横顔カウントダウンオーバーレイ */}
          {isSideFacePart && countdown !== null && countdown > 0 && (
            <SideFaceCountdownOverlay countdown={countdown} />
          )}
        </div>

        <button
          onClick={capture}
          className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 flex items-center justify-center space-x-2"
        >
          <Camera className="w-5 h-5" />
          <span>{isSideFacePart && countdown !== null ? '今すぐ撮影' : '撮影する'}</span>
        </button>
      </div>
    );
  }

  if (captureStep === 'quality_check') {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-600">画像を確認中...</p>
      </div>
    );
  }

  if (captureStep === 'error') {
    return (
      <div className="flex flex-col items-center justify-start p-4 w-full max-w-md mx-auto animate-in fade-in duration-300 pb-8">
        <ProgressBar />
        <h2 className="text-xl font-bold text-slate-800 mb-6">{currentPart.title}</h2>
        <CaptureError reason={errorReason} onRetry={handleRetry} />
      </div>
    );
  }

  // captureStep === 'confirm'
  return (
    <div className="flex flex-col items-center justify-start p-4 w-full max-w-md mx-auto animate-in fade-in duration-300 pb-8">
      <ProgressBar />
      <h2 className="text-xl font-bold text-slate-800 mb-4">{currentPart.title}</h2>
      <CaptureConfirm imageBase64={tempImage} onOk={handleConfirmOk} onRetry={handleRetry} />
    </div>
  );
}
