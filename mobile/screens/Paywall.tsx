import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { getPremiumPriceString, purchasePremium, restorePurchases } from '../services/purchaseService';
import { useAppStore } from '../store/useAppStore';

export default function Paywall({ onBack }: { onBack: () => void }) {
  const setIsPremium = useAppStore((state) => state.setIsPremium);
  const [priceString, setPriceString] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    getPremiumPriceString().then(setPriceString);
  }, []);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      const unlocked = await purchasePremium();
      if (unlocked) {
        setIsPremium(true);
        onBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', '購入処理に失敗しました。もう一度お試しください。');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const unlocked = await restorePurchases();
      if (unlocked) {
        setIsPremium(true);
        onBack();
      } else {
        Alert.alert('購入履歴が見つかりません', '過去の購入が見つかりませんでした。');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', '購入の復元に失敗しました。もう一度お試しください。');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-10">
      {/* Welcome_girlの実寸比率（1122x1402）に高さを合わせ、cover表示でも頭が切れないようにする */}
      <View className="w-full relative" style={{ aspectRatio: 1122 / 1402 }}>
        <Image
          source={require('../assets/Welcome_girl.png')}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />

        <Pressable onPress={onBack} className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded-full">
          <Text className="text-white text-base font-bold">戻る</Text>
        </Pressable>

        <View className="absolute bottom-0 left-0 right-0 bg-black/70 px-4 py-3">
          <Text className="text-white text-sm text-center">
            3回の無料診断、お疲れさまでした！これからより良くなっていくと思いますよ。
          </Text>
        </View>
      </View>

      <View className="p-4 pt-6">
        <Text className="text-3xl font-bold text-slate-800 mb-2 text-center">
          無料診断の上限に達しました
        </Text>
        <Text className="text-base text-slate-600 text-center px-4 mb-8">
          無料でお試しいただける診断回数を使い切りました。引き続きご利用いただくには、購入が必要です。一度のお支払いで、以降は無制限にご利用いただけます。
        </Text>

        <View className="w-full bg-white p-6 rounded-2xl border border-slate-100 items-center gap-4 mb-8">
          {priceString ? (
            <Text className="text-4xl font-black text-slate-800">{priceString}</Text>
          ) : (
            <ActivityIndicator size="small" color="#43aab1" />
          )}
          <Text className="text-sm text-slate-500 text-center">買い切り・追加課金なし</Text>
        </View>

        <Pressable
          onPress={handlePurchase}
          disabled={isPurchasing || isRestoring}
          className="w-full py-4 rounded-xl bg-emerald-600 items-center flex-row justify-center gap-2"
        >
          {isPurchasing && <ActivityIndicator size="small" color="white" />}
          <Text className="text-lg font-bold text-white">購入して続ける</Text>
        </Pressable>

        <Pressable onPress={handleRestore} disabled={isPurchasing || isRestoring} className="w-full py-4 items-center">
          <Text className="text-base font-bold text-slate-500">
            {isRestoring ? '復元中...' : '購入を復元'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
