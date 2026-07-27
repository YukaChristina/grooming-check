import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { AlertCircle, Camera, RefreshCw, SkipForward } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import Paywall from './Paywall';
import { Photos, useAppStore } from '../store/useAppStore';

const FREE_DIAGNOSIS_LIMIT = 3;

type CaptureStep = 'overview' | 'guide' | 'camera' | 'confirm' | 'error' | 'paywall';

interface PartConfig {
  id: keyof Photos;
  title: string;
  required: boolean;
  desc: string;
}

const parts: PartConfig[] = [
  { id: 'faceFront', title: '顔（正面）', required: true, desc: '清潔感・全体印象・眉毛を確認します。明るい場所で撮影してください。' },
  { id: 'faceSide', title: '顔（側面）', required: true, desc: 'ひげの剃り残しがないか確認します。右を向いて撮影してください。' },
  { id: 'hands', title: '手・爪', required: true, desc: '爪の長さ・汚れ・ささくれを確認します。手の甲側を撮影してください。' },
  { id: 'upperBody', title: '上半身', required: false, desc: '服装・清潔感を確認します。内カメラ・外カメラを切り替えて撮影してください。' },
  { id: 'shoes', title: '靴・足元', required: false, desc: '靴の汚れ・手入れを確認します。真上から撮影してください。' },
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
    instruction: '4本の指の爪を、画面の黄色い楕円にそれぞれ合わせてください',
    tips: ['明るい場所で撮影する', '爪先までピントが合うように近づける', '指を揃えて楕円の中に収める'],
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

const MAX_DIMENSION = 1024;

// 背面カメラは高解像度で撮影されるため、Base64化・アップロード前に縮小してメモリ超過による
// クラッシュとアップロード負荷を防ぐ。
async function resizeIfNeeded(uri: string, width: number, height: number): Promise<string> {
  if (Math.max(width, height) <= MAX_DIMENSION) return uri;
  const resizeAction = width >= height ? { resize: { width: MAX_DIMENSION } } : { resize: { height: MAX_DIMENSION } };
  const result = await manipulateAsync(uri, [resizeAction], { compress: 0.8, format: SaveFormat.JPEG });
  return result.uri;
}

// Canvasによる輝度チェックはRNに同等APIがないため、サイズチェックのみ行い
// 暗すぎ/不鮮明の最終判定はサーバー側のAI診断（undiagnosable）に委ねる。
function checkImageSize(base64: string): { ok: boolean; reason?: string } {
  const sizeKB = (base64.length * 3) / 4 / 1024;
  if (sizeKB < 20) {
    return { ok: false, reason: '画像が判定できません。再撮影してください' };
  }
  return { ok: true };
}

// 顔を置く位置を示す、大きめの点線の楕円ガイド
function FaceOverlay() {
  return (
    <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
      <Svg width={240} height={310} viewBox="0 0 200 260">
        <Ellipse
          cx={100}
          cy={130}
          rx={85}
          ry={110}
          stroke="white"
          strokeWidth={3}
          strokeDasharray="10 7"
          fill="none"
        />
      </Svg>
      <Text className="mt-4 text-white text-base text-center px-4">顔を点線の枠に合わせてください</Text>
    </View>
  );
}

function SideFaceCountdownOverlay({ countdown }: { countdown: number }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-black/30" pointerEvents="none">
      <Text className="text-white text-2xl font-bold mb-1">右を向いてください</Text>
      <Text className="text-white" style={{ fontSize: 80, lineHeight: 80 }}>
        →
      </Text>
      <View className="mt-4 w-20 h-20 rounded-full bg-black/60 items-center justify-center">
        <Text className="text-white text-6xl font-bold">{countdown}</Text>
      </View>
    </View>
  );
}

// 手のイラストはやめ、4本指＋親指それぞれの爪を合わせる縦長の楕円ガイドのみを表示する。
// 4本指は中指（右から2番目）を頂点にした山なりに、親指は右下に配置。
const NAIL_VIEW_WIDTH = 250;
const NAIL_VIEW_HEIGHT = 330;

// 左から: 小指・薬指・中指（頂点）・人差し指
const FINGER_NAILS = [
  { cx: 27.5, cy: 145 },
  { cx: 82.5, cy: 105 },
  { cx: 137.5, cy: 65 },
  { cx: 192.5, cy: 105 },
];
const THUMB_NAIL = { cx: 225, cy: 290, rx: 18, ry: 28 };

function NailOverlay() {
  const rx = 17;
  const ry = 32;

  return (
    <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
      <Svg viewBox={`0 0 ${NAIL_VIEW_WIDTH} ${NAIL_VIEW_HEIGHT}`} width={NAIL_VIEW_WIDTH} height={NAIL_VIEW_HEIGHT}>
        {FINGER_NAILS.map((pos, i) => (
          <Ellipse
            key={i}
            cx={pos.cx}
            cy={pos.cy}
            rx={rx}
            ry={ry}
            stroke="#facc15"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            fill="rgba(250,204,21,0.12)"
          />
        ))}
        <Ellipse
          cx={THUMB_NAIL.cx}
          cy={THUMB_NAIL.cy}
          rx={THUMB_NAIL.rx}
          ry={THUMB_NAIL.ry}
          stroke="#facc15"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          fill="rgba(250,204,21,0.12)"
        />
      </Svg>
      <Text className="mt-3 text-white text-base text-center px-4 font-medium">
        指の爪を、それぞれ黄色い楕円に合わせてください
      </Text>
    </View>
  );
}

// 靴・足元用: 大きめの点線の縦長楕円を2つ並べて、画面いっぱいに配置
function ShoesOverlay() {
  return (
    <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
      <Svg width={305} height={380} viewBox="0 0 305 380">
        <Ellipse
          cx={78}
          cy={190}
          rx={70}
          ry={180}
          stroke="white"
          strokeWidth={3}
          strokeDasharray="10 7"
          fill="none"
        />
        <Ellipse
          cx={224}
          cy={190}
          rx={70}
          ry={180}
          stroke="white"
          strokeWidth={3}
          strokeDasharray="10 7"
          fill="none"
        />
      </Svg>
      <Text className="mt-4 text-white text-base text-center px-4">両足を点線の枠に合わせてください</Text>
    </View>
  );
}

function CaptureError({ reason, onRetry }: { reason: string; onRetry: () => void }) {
  return (
    <View className="items-center w-full">
      <View className="bg-white rounded-xl p-6 w-full shadow-lg">
        <Text className="text-base text-center font-bold text-gray-700 mb-4">⚠️ 再撮影が必要です</Text>
        <View className="flex-row items-start gap-2">
          <Text className="text-red-500">✗</Text>
          <Text className="text-base text-red-500 flex-1">{reason}</Text>
        </View>
      </View>
      <Pressable onPress={onRetry} className="mt-6 w-full bg-teal-400 py-4 rounded-xl items-center">
        <Text className="font-bold text-white text-xl">再撮影する</Text>
      </Pressable>
    </View>
  );
}

function CaptureConfirm({
  imageUri,
  onOk,
  onRetry,
}: {
  imageUri: string;
  onOk: () => void;
  onRetry: () => void;
}) {
  return (
    <View className="items-center w-full flex-1">
      <Image
        source={{ uri: imageUri }}
        className="w-full flex-1 rounded-2xl mb-4"
        resizeMode="cover"
      />
      <Text className="text-base text-gray-600 mb-4">この画像で診断しますか？</Text>
      <Pressable onPress={onOk} className="w-full bg-teal-400 py-4 rounded-xl items-center mb-2">
        <Text className="font-bold text-white text-xl">OK（次へ進む）</Text>
      </Pressable>
      <Pressable onPress={onRetry} className="w-full py-2 items-center">
        <Text className="text-teal-500 text-base">再撮影する</Text>
      </Pressable>
    </View>
  );
}

export default function Step4Camera() {
  const { setPhoto, skipPhoto, nextStep, prevStep, diagnosisCount, isPremium } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [captureStep, setCaptureStep] = useState<CaptureStep>('overview');
  const [tempImage, setTempImage] = useState('');
  const [errorReason, setErrorReason] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraFacingOverride, setCameraFacingOverride] = useState<CameraType | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const isCapturingRef = useRef(false);
  const isSideFacePartRef = useRef(false);

  const currentPart = parts[currentIndex];
  const guide = SHOT_GUIDES[currentPart.id];

  const frontCameraParts: (keyof Photos)[] = ['faceFront', 'faceSide'];
  const defaultFacingMode: CameraType = frontCameraParts.includes(currentPart.id) ? 'front' : 'back';
  const effectiveFacingMode = cameraFacingOverride ?? defaultFacingMode;

  const showFaceOverlay = ['faceFront', 'faceSide'].includes(currentPart.id);
  const isSideFacePart = currentPart.id === 'faceSide';
  const isUpperBody = currentPart.id === 'upperBody';
  const isHandsPart = currentPart.id === 'hands';
  const isShoesPart = currentPart.id === 'shoes';

  useEffect(() => {
    setCameraFacingOverride(null);
    isSideFacePartRef.current = currentPart.id === 'faceSide';
  }, [currentIndex]);

  useEffect(() => {
    if (captureStep === 'camera' && !permission?.granted) {
      requestPermission();
    }
  }, [captureStep, permission]); // eslint-disable-line react-hooks/exhaustive-deps

  // カメラビューに入るたびに準備完了フラグをリセット（onCameraReadyで再度trueになる）
  useEffect(() => {
    if (captureStep === 'camera') {
      setIsCameraReady(false);
    }
  }, [captureStep, currentPart.id]);

  // 横顔撮影は、カメラの初期化が完了してから5秒カウントダウンを開始する
  // （準備前にtakePictureAsyncを呼ぶと失敗し、次に進めなくなるため）
  useEffect(() => {
    if (captureStep === 'camera' && isSideFacePart && isCameraReady) {
      isCapturingRef.current = false;
      setCountdown(5);
    } else if (!(captureStep === 'camera' && isSideFacePart)) {
      setCountdown(null);
    }
  }, [captureStep, currentPart.id, isCameraReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0) capture();
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceToNextPart = async () => {
    if (currentIndex < parts.length - 1) {
      setCurrentIndex((i) => i + 1);
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

    try {
      // takePictureAsyncにbase64:trueを渡すと実機でPromiseがハングすることがあるため、
      // 撮影はuriのみで完了させ、Base64化はexpo-file-systemで別途行う。
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) {
        setErrorReason('撮影に失敗しました。もう一度お試しください');
        setCaptureStep('error');
        return;
      }

      const resizedUri = await resizeIfNeeded(photo.uri, photo.width, photo.height);
      const base64 = await FileSystem.readAsStringAsync(resizedUri, { encoding: 'base64' });
      const imageSrc = `data:image/jpeg;base64,${base64}`;
      setTempImage(imageSrc);

      const result = checkImageSize(base64);
      if (result.ok) {
        setCaptureStep('confirm');
      } else {
        setErrorReason(result.reason ?? '');
        setCaptureStep('error');
      }
    } catch (err) {
      console.error('capture failed', err);
      setErrorReason('カメラの準備が間に合いませんでした。もう一度お試しください');
      setCaptureStep('error');
    } finally {
      isCapturingRef.current = false;
    }
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
      setCurrentIndex((i) => i - 1);
      setCaptureStep('guide');
      setTempImage('');
      setErrorReason('');
    } else {
      setCaptureStep('overview');
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

      const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
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
        Alert.alert(
          '判定できませんでした',
          data.undiagnosableReason || '画像が不鮮明なため診断できませんでした。再度撮影してください。'
        );
        return;
      }

      useAppStore.getState().setScore(data);
      useAppStore.getState().incrementDiagnosisCount();
      setIsAnalyzing(false);
      nextStep();
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', '診断中にエラーが発生しました。もう一度お試しください。');
      setIsAnalyzing(false);
    }
  };

  const ProgressBar = () => (
    <View className="w-full flex-row justify-between items-center px-2 mb-4">
      <Pressable onPress={handleBack}>
        <Text className="text-slate-400 text-xl font-bold">戻る</Text>
      </Pressable>
      <View className="bg-emerald-100 px-3 py-1 rounded-full">
        <Text className="text-sm font-bold text-emerald-600">
          {currentIndex + 1} / {parts.length}
        </Text>
      </View>
    </View>
  );

  if (isAnalyzing) {
    return (
      <View className="flex-1 items-center justify-center p-6 gap-6">
        <ActivityIndicator size="large" color="#43aab1" />
        <View className="items-center">
          <Text className="text-2xl font-bold text-slate-800">診断中...</Text>
          <Text className="text-base text-slate-500 mt-2">身だしなみを細かくチェックしています</Text>
        </View>
      </View>
    );
  }

  if (captureStep === 'overview') {
    return (
      <ScrollView className="flex-1" contentContainerClassName="p-4 pt-6 pb-10">
        <Pressable onPress={prevStep} className="mb-4">
          <Text className="text-slate-400 text-xl font-bold">戻る</Text>
        </Pressable>

        <Text className="text-3xl font-bold text-slate-800 mb-2 text-center">
          これから撮影する部位
        </Text>
        <Text className="text-base text-slate-600 text-center px-4 mb-8">
          全部で{parts.length}箇所を撮影します。どんな写真が必要か、先に確認しておきましょう。
        </Text>

        <View className="w-full gap-3 mb-8">
          {parts.map((part) => (
            <View key={part.id}>
              <View className="w-full bg-white p-4 rounded-xl border border-slate-100 flex-row gap-3">
                <View
                  className={`px-2 py-1 rounded self-start ${
                    part.required ? 'bg-red-100' : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      part.required ? 'text-red-600' : 'text-slate-500'
                    }`}
                  >
                    {part.required ? '必須' : '任意'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-800">{part.title}</Text>
                  <Text className="text-base text-slate-500 mt-1">{part.desc}</Text>
                </View>
              </View>

              {part.id === 'hands' && (
                <View className="items-center my-3">
                  <View className="w-full h-px bg-slate-200" />
                  <Text className="text-sm text-slate-500 text-center mt-3 px-2">
                    お見合い・デート当日の服装を着て撮影してください
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => {
            const limitReached = diagnosisCount >= FREE_DIAGNOSIS_LIMIT && !isPremium;
            setCaptureStep(limitReached ? 'paywall' : 'guide');
          }}
          className="w-full py-4 rounded-xl bg-emerald-600 flex-row items-center justify-center gap-2"
        >
          <Camera size={20} color="white" />
          <Text className="text-base font-bold text-white">撮影を始める</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (captureStep === 'paywall') {
    return <Paywall onBack={() => setCaptureStep('overview')} />;
  }

  if (captureStep === 'guide') {
    return (
      <ScrollView className="flex-1" contentContainerClassName="p-4 pt-6 pb-10">
        <ProgressBar />

        <Text className="text-3xl font-bold text-slate-800 mb-2 mt-6 text-center">{guide.title}</Text>
        <Text className="text-base text-slate-600 text-center px-4 mb-8">{guide.instruction}</Text>

        <View className="w-full bg-emerald-50 rounded-xl p-4 mb-8">
          <Text className="text-lg font-bold text-red-800 mb-2">撮影のコツ</Text>
          <View className="gap-2">
            {guide.tips.map((tip, i) => (
              <View key={i} className="flex-row items-start gap-2">
                <Text className="text-emerald-400 mt-0.5">✓</Text>
                <Text className="text-base text-emerald-800 flex-1">{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {(isUpperBody || isShoesPart) && (
          <Text className="text-lg text-slate-500 text-center mb-8">
            お見合い・デート当日の服装を着て撮影してください
          </Text>
        )}

        {!currentPart.required && (
          <>
            <Pressable
              onPress={handleSkip}
              className="w-full py-3 rounded-xl bg-slate-100 flex-row items-center justify-center gap-2 mb-3"
            >
              <SkipForward size={20} color="#475569" />
              <Text className="text-base font-bold text-slate-600">スキップ</Text>
            </Pressable>
            <View className="flex-row items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
              <AlertCircle size={16} color="#94a3b8" />
              <Text className="text-sm text-slate-400 flex-1">
                任意の部位はスキップ可能ですが、撮影した方がより正確な診断結果が得られます。
              </Text>
            </View>
          </>
        )}

        <Pressable
          onPress={() => setCaptureStep('camera')}
          className="w-full py-4 rounded-xl bg-emerald-600 flex-row items-center justify-center gap-2 mt-4"
        >
          <Camera size={20} color="white" />
          <Text className="text-base font-bold text-white">撮影開始</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (captureStep === 'camera') {
    if (!permission?.granted) {
      return (
        <View className="flex-1 items-center justify-center p-6 gap-4">
          <AlertCircle size={40} color="#ef4444" />
          <Text className="text-base text-slate-800 font-bold text-center">
            カメラへのアクセスを許可してください
          </Text>
          <Pressable onPress={requestPermission} className="px-6 py-3 bg-emerald-600 rounded-xl">
            <Text className="text-base text-white font-bold">許可する</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="flex-1 p-4 pt-6 gap-4">
        <View className="w-full flex-row justify-between items-center px-2">
          <Pressable onPress={() => setCaptureStep('guide')}>
            <Text className="text-slate-400 text-xl font-bold">戻る</Text>
          </Pressable>
          <View className="bg-emerald-100 px-3 py-1 rounded-full">
            <Text className="text-sm font-bold text-emerald-600">
              {currentIndex + 1} / {parts.length}
            </Text>
          </View>
        </View>

        <Text className="text-3xl font-bold text-slate-800">{currentPart.title}</Text>

        {isSideFacePart && (
          <Text className="text-lg text-slate-500 text-center">
            右を向いてください。{countdown ?? 0} 秒後に自動撮影します
          </Text>
        )}

        {isUpperBody && (
          <>
            <Text className="text-lg text-slate-500 text-center">腰の上まで映るようにしてください</Text>
            <Text className="text-lg text-slate-500 text-center">
              お見合い・デート当日の服装を着て撮影してください
            </Text>
          </>
        )}

        {isShoesPart && (
          <Text className="text-lg text-slate-500 text-center">
            お見合い・デート当日の服装を着て撮影してください
          </Text>
        )}

        <View className="w-full flex-1 bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative items-center justify-center">
          <CameraView
            ref={cameraRef}
            style={{ width: '100%', height: '100%' }}
            facing={effectiveFacingMode}
            mirror={effectiveFacingMode === 'front' && !isSideFacePart}
            onCameraReady={() => setIsCameraReady(true)}
          />

          {currentPart.required && (
            <View className="absolute top-4 left-4 bg-red-500 px-2 py-1 rounded shadow">
              <Text className="text-white text-sm font-bold">必須</Text>
            </View>
          )}

          {isUpperBody && (
            <Pressable
              onPress={() => setCameraFacingOverride((m) => (m === 'front' ? 'back' : 'front'))}
              className="absolute top-4 right-4 bg-black/60 px-4 py-2.5 rounded-full flex-row items-center gap-2"
            >
              <RefreshCw size={20} color="white" />
              <Text className="text-white text-lg font-bold">
                {effectiveFacingMode === 'front' ? '内カメラ' : '外カメラ'}
              </Text>
            </Pressable>
          )}

          {showFaceOverlay && !isSideFacePart && <FaceOverlay />}

          {isHandsPart && <NailOverlay />}

          {isShoesPart && <ShoesOverlay />}

          {isSideFacePart && countdown !== null && countdown > 0 && (
            <SideFaceCountdownOverlay countdown={countdown} />
          )}
        </View>

        <Pressable
          onPress={capture}
          className="w-full py-4 rounded-xl bg-emerald-600 flex-row items-center justify-center gap-2 mt-4"
        >
          <Camera size={20} color="white" />
          <Text className="text-base font-bold text-white">
            {isSideFacePart && countdown !== null ? '今すぐ撮影' : '撮影する'}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (captureStep === 'error') {
    return (
      <View className="flex-1 p-4 pt-6">
        <ProgressBar />
        <Text className="text-2xl font-bold text-slate-800 mb-6 mt-2">{currentPart.title}</Text>
        <CaptureError reason={errorReason} onRetry={handleRetry} />
      </View>
    );
  }

  // captureStep === 'confirm'
  return (
    <View className="flex-1 p-4 pt-6">
      <ProgressBar />
      <Text className="text-2xl font-bold text-slate-800 mb-4 mt-2">{currentPart.title}</Text>
      <CaptureConfirm imageUri={tempImage} onOk={handleConfirmOk} onRetry={handleRetry} />
    </View>
  );
}
