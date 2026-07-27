import { AlertCircle, ChevronDown, RefreshCw, Star } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';

function BlinkingChevron() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity, marginTop: 8 }}>
      <ChevronDown color="#facc15" size={28} />
    </Animated.View>
  );
}

const FACE_PARTS = ['faceFront', 'faceSide', 'faceSideOpposite'];
const BODY_PARTS = ['upperBody', 'fullBody'];

function groupScore(keys: string[], parts: Record<string, number | string>): number | null {
  const scores = keys
    .filter((k) => typeof parts[k] === 'number')
    .map((k) => parts[k] as number);
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}

function groupHasUndiagnosable(keys: string[], parts: Record<string, number | string>): boolean {
  return keys.some((k) => parts[k] === 'undiagnosable');
}

function groupVisible(keys: string[], parts: Record<string, number | string>): boolean {
  return keys.some((k) => k in parts);
}

function groupFeedback(keys: string[], partFeedback?: Record<string, string>): string {
  return keys
    .filter((k) => partFeedback?.[k])
    .map((k) => partFeedback![k])
    .join(' ');
}

function PartCard({
  label,
  score,
  feedback,
  undiagnosable,
}: {
  label: string;
  score: number | null;
  feedback: string;
  undiagnosable: boolean;
}) {
  return (
    <View className="bg-white rounded-xl border border-slate-200 p-4">
      <View className="flex-row justify-between items-center">
        <Text className="text-base font-bold text-slate-800">{label}</Text>
        {undiagnosable ? (
          <View className="bg-slate-100 px-2 py-1 rounded">
            <Text className="text-sm font-bold text-slate-400">判定不能</Text>
          </View>
        ) : (
          <Text className="font-black text-xl text-emerald-600">{score}点</Text>
        )}
      </View>
      {!undiagnosable && feedback ? (
        <Text className="text-sm text-slate-500 mt-1">{feedback}</Text>
      ) : null}
    </View>
  );
}

export default function Step5Results() {
  const { score, resetApp, skippedParts } = useAppStore();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const heroHeight = windowHeight - insets.top - insets.bottom;

  if (!score) {
    return (
      <View className="flex-1 items-center justify-center p-6 gap-4">
        <AlertCircle size={48} color="#ef4444" />
        <Text className="text-base text-slate-800 font-bold">診断結果が見つかりません</Text>
        <Pressable onPress={resetApp} className="px-6 py-2 bg-slate-100 rounded-full">
          <Text className="text-base font-bold">最初からやり直す</Text>
        </Pressable>
      </View>
    );
  }

  const starCount = score.total ? (score.total >= 85 ? 5 : score.total >= 75 ? 4 : 3) : 0;

  const faceScore = groupScore(FACE_PARTS, score.parts);
  const faceFeedback = groupFeedback(FACE_PARTS, score.partFeedback);

  const bodyScore = groupScore(BODY_PARTS, score.parts);
  const bodyFeedback = groupFeedback(BODY_PARTS, score.partFeedback);

  const handsScore = typeof score.parts['hands'] === 'number' ? (score.parts['hands'] as number) : null;
  const handsFeedback = score.partFeedback?.['hands'] ?? '';

  const shoesScore = typeof score.parts['shoes'] === 'number' ? (score.parts['shoes'] as number) : null;
  const shoesFeedback = score.partFeedback?.['shoes'] ?? '';

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-8">
      <View style={{ height: heroHeight }} className="w-full bg-emerald-700 relative overflow-hidden">
        <Image
          source={require('../assets/Welcome_girl.png')}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />

        <View className="flex-1 justify-end">
          <View className="bg-black/70 px-6 pt-6 pb-8 items-center gap-3">
            <Text className="text-xl font-medium text-white opacity-90">総合スコア</Text>
            <View className="flex-row items-baseline">
              <Text className="text-7xl font-black text-white">{score.total}</Text>
              <Text className="text-3xl font-bold text-white opacity-80 ml-1">点</Text>
            </View>
            <View className="flex-row gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={24}
                  color={i <= starCount ? '#facc15' : 'rgba(255,255,255,0.2)'}
                  fill={i <= starCount ? '#facc15' : 'rgba(255,255,255,0.2)'}
                />
              ))}
            </View>
            <Text className="font-bold text-xl text-center mt-1 text-white">{score.comments}</Text>

            <BlinkingChevron />
          </View>
        </View>
      </View>

      <View className="w-full p-4 gap-6 mt-4">
        <View className="gap-3">
          <View className="flex-row items-center border-b border-slate-200 pb-2">
            <View className="w-1 h-5 bg-indigo-500 rounded-full mr-2" />
            <Text className="font-bold text-xl">部位別の評価</Text>
          </View>
          <View className="gap-2">
            {groupVisible(FACE_PARTS, score.parts) && (
              <PartCard
                label="顔"
                score={faceScore}
                feedback={faceFeedback}
                undiagnosable={faceScore === null && groupHasUndiagnosable(FACE_PARTS, score.parts)}
              />
            )}

            {'hands' in score.parts && (
              <PartCard
                label="手・爪"
                score={handsScore}
                feedback={handsFeedback}
                undiagnosable={score.parts['hands'] === 'undiagnosable'}
              />
            )}

            {groupVisible(BODY_PARTS, score.parts) && (
              <PartCard
                label="上半身・全身"
                score={bodyScore}
                feedback={bodyFeedback}
                undiagnosable={bodyScore === null && groupHasUndiagnosable(BODY_PARTS, score.parts)}
              />
            )}

            {'shoes' in score.parts && (
              <PartCard
                label="靴・足元"
                score={shoesScore}
                feedback={shoesFeedback}
                undiagnosable={score.parts['shoes'] === 'undiagnosable'}
              />
            )}

            {skippedParts
              .filter((k) => !FACE_PARTS.includes(k) && !BODY_PARTS.includes(k) && k !== 'hands' && k !== 'shoes')
              .map((key) => (
                <View key={`skip-${key}`} className="bg-slate-50 rounded-xl border border-slate-100 p-4 opacity-70">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-medium text-slate-500">{key}</Text>
                    <View className="bg-slate-200 px-2 py-1 rounded">
                      <Text className="text-sm font-bold text-slate-400">未撮影</Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </View>

        <View className="gap-4">
          <View className="flex-row items-center border-b border-slate-200 pb-2">
            <View className="w-1 h-5 bg-emerald-500 rounded-full mr-2" />
            <Text className="font-bold text-xl">いつまでに何をすべきか</Text>
          </View>

          {score.advice.today && score.advice.today.length > 0 && (
            <View className="bg-red-50 border border-red-100 p-4 rounded-xl gap-2">
              <View className="flex-row items-center">
                <AlertCircle size={16} color="#b91c1c" />
                <Text className="font-bold text-red-700 text-base ml-1">今日できること</Text>
              </View>
              <View>
                {score.advice.today.map((item, idx) => (
                  <Text key={idx} className="text-base text-slate-700">
                    • {item}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {score.advice.fewDays && score.advice.fewDays.length > 0 && (
            <View className="bg-orange-50 border border-orange-100 p-4 rounded-xl gap-2">
              <Text className="font-bold text-orange-700 text-base">2〜3日で解決できること</Text>
              <View>
                {score.advice.fewDays.map((item, idx) => (
                  <Text key={idx} className="text-base text-slate-700">
                    • {item}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {score.advice.longTerm && score.advice.longTerm.length > 0 && (
            <View className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl gap-2">
              <Text className="font-bold text-emerald-700 text-base">長期的に取り組むこと</Text>
              <View>
                {score.advice.longTerm.map((item, idx) => (
                  <Text key={idx} className="text-base text-slate-700">
                    • {item}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        <Pressable
          onPress={resetApp}
          className="w-full mt-8 py-4 rounded-xl bg-white border-2 border-slate-200 flex-row items-center justify-center gap-2"
        >
          <RefreshCw size={20} color="#475569" />
          <Text className="text-base font-bold text-slate-600">最初からやり直す</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
