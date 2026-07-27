import { Check, X } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SelfCheckAnswers, useAppStore } from '../store/useAppStore';

const questions: { key: keyof SelfCheckAnswers; text: string; desc: string }[] = [
  { key: 'noseHair', text: '鼻毛の処理はできていますか？', desc: '鏡で明るい場所で確認しましょう。' },
  { key: 'bodyOdor', text: '体臭・口臭が気になりませんか？', desc: 'デオドラントや歯磨きなどのケアを行いましたか？' },
  { key: 'haircut', text: '美容室・理容室に行きましたか？', desc: '直近2〜3週間以内の来店が目安です。' },
  { key: 'hairWax', text: '整髪料はつけすぎていませんか？（鏡でテカリを確認）', desc: 'テカリすぎず、自然なセットを心がけましょう。' },
];

export default function Step3SelfCheck() {
  const { selfCheck, updateSelfCheck, nextStep, prevStep } = useAppStore();

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6 pb-8">
      <View className="items-center gap-2">
        <Text className="text-3xl font-bold text-slate-800">セルフチェック</Text>
        <Text className="text-base text-slate-500 text-center">
          写真では判定できない項目を確認します。
        </Text>
      </View>

      <View className="w-full gap-4">
        {questions.map((q) => (
          <View key={q.key} className="bg-white p-5 rounded-2xl border border-slate-100 gap-3">
            <View>
              <Text className="text-base font-bold text-slate-800">{q.text}</Text>
              <Text className="text-sm text-slate-500 mt-1">{q.desc}</Text>
            </View>
            <View className="flex-row gap-4">
              <Pressable
                onPress={() => updateSelfCheck(q.key, true)}
                className={`flex-1 py-2 rounded-xl flex-row items-center justify-center gap-2 border-2 ${
                  selfCheck[q.key] === true
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-100'
                }`}
              >
                <Check size={16} color={selfCheck[q.key] === true ? '#2a7479' : '#94a3b8'} />
                <Text
                  className={`text-base font-bold ${
                    selfCheck[q.key] === true ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  はい
                </Text>
              </Pressable>
              <Pressable
                onPress={() => updateSelfCheck(q.key, false)}
                className={`flex-1 py-2 rounded-xl flex-row items-center justify-center gap-2 border-2 ${
                  selfCheck[q.key] === false ? 'border-red-500 bg-red-50' : 'border-slate-100'
                }`}
              >
                <X size={16} color={selfCheck[q.key] === false ? '#b91c1c' : '#94a3b8'} />
                <Text
                  className={`text-base font-bold ${
                    selfCheck[q.key] === false ? 'text-red-700' : 'text-slate-400'
                  }`}
                >
                  いいえ
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View className="flex-row w-full gap-5 mt-8">
        <Pressable onPress={prevStep} className="flex-1 py-4 rounded-xl bg-slate-100 items-center">
          <Text className="text-xl font-bold text-slate-600">戻る</Text>
        </Pressable>
        <Pressable onPress={nextStep} className="flex-[2] py-4 rounded-xl bg-emerald-600 items-center">
          <Text className="text-base font-bold text-white">次へ進む</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
