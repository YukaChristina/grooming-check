import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

const LINE = '身だしなみチェックアプリへようこそ！次のお見合いやデートに向けて、一緒に身だしなみをチェックしていきましょう。';
const TYPE_INTERVAL_MS = 40;

export default function WelcomeIntro({ onStart }: { onStart: () => void }) {
  const [shownLength, setShownLength] = useState(0);
  const isComplete = shownLength >= LINE.length;

  useEffect(() => {
    if (shownLength >= LINE.length) return;
    const timer = setTimeout(() => setShownLength((n) => n + 1), TYPE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [shownLength]);

  const handleSkip = () => {
    if (!isComplete) setShownLength(LINE.length);
  };

  return (
    <View className="flex-1 bg-black">
      <Pressable className="flex-1" onPress={handleSkip}>
        <Image
          source={require('../assets/Welcome_girl.png')}
          className="flex-1 w-full"
          resizeMode="cover"
        />
      </Pressable>

      <View className="absolute bottom-0 left-0 right-0 px-6 pt-6 pb-10 bg-black/75">
        <Text className="text-white text-lg leading-8" style={{ minHeight: 88 }}>
          {LINE.slice(0, shownLength)}
        </Text>

        <Pressable
          onPress={onStart}
          disabled={!isComplete}
          className={`w-full py-4 rounded-xl bg-emerald-600 items-center mt-6 ${
            isComplete ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Text className="text-lg font-bold text-white">身だしなみチェックをスタート</Text>
        </Pressable>
      </View>
    </View>
  );
}
