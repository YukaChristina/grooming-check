import { MessageCircleHeart, Sparkles } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export default function Step2Tone() {
  const { tone, setTone, nextStep, prevStep } = useAppStore();

  return (
    <View className="flex-1 items-center justify-center p-6 gap-8">
      <View className="items-center gap-2">
        <Text className="text-3xl font-bold text-slate-800">アドバイスのトーンは？</Text>
        <Text className="text-base text-slate-500 text-center">
          AIからのフィードバックの厳しさを選びます。
        </Text>
      </View>

      <View className="w-full gap-6">
        <Pressable
          onPress={() => setTone('strict')}
          className={`w-full p-6 rounded-2xl border-2 flex-row items-center gap-4 ${
            tone === 'strict' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'
          }`}
        >
          <View className="p-3 bg-emerald-100 rounded-full">
            <Sparkles size={24} color="#358c92" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-800">ズバリ言って</Text>
            <Text className="text-sm text-slate-500 mt-1">
              「〜はNGです」など、改善点を率直に指摘してほしい方におすすめです。
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setTone('gentle')}
          className={`w-full p-6 rounded-2xl border-2 flex-row items-center gap-4 ${
            tone === 'gentle' ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-white'
          }`}
        >
          <View className="p-3 bg-pink-100 rounded-full">
            <MessageCircleHeart size={24} color="#db2777" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-800">やさしく教えて</Text>
            <Text className="text-sm text-slate-500 mt-1">
              「〜するとより好印象です」など、ポジティブな表現でアドバイスします。
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="flex-row w-full gap-5 mt-6">
        <Pressable onPress={prevStep} className="flex-1 py-4 rounded-xl bg-slate-100 items-center">
          <Text className="text-xl font-bold text-slate-600">戻る</Text>
        </Pressable>
        <Pressable onPress={nextStep} className="flex-[2] py-4 rounded-xl bg-emerald-600 items-center">
          <Text className="text-base font-bold text-white">次へ進む</Text>
        </Pressable>
      </View>
    </View>
  );
}
