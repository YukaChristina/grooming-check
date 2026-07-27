import './global.css';

import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Step1Date from './screens/Step1Date';
import Step2Tone from './screens/Step2Tone';
import Step3SelfCheck from './screens/Step3SelfCheck';
import Step4Camera from './screens/Step4Camera';
import Step5Results from './screens/Step5Results';
import WelcomeIntro from './screens/WelcomeIntro';
import { configurePurchases, getPremiumStatus } from './services/purchaseService';
import { useAppStore } from './store/useAppStore';

function AppContent() {
  const { currentStep, setIsPremium } = useAppStore();
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    configurePurchases();
    getPremiumStatus().then(setIsPremium);
  }, [setIsPremium]);

  if (showWelcome) {
    return (
      <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
        <StatusBar style="light" />
        <WelcomeIntro onStart={() => setShowWelcome(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {currentStep < 5 && (
        <>
          <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100 bg-white">
            <Text className="text-base font-bold text-slate-800 flex-1 mr-2" numberOfLines={1}>
              身だしなみチェック
            </Text>
            <View className="bg-slate-100 px-2 py-1 rounded-full flex-shrink-0">
              <Text className="text-sm font-bold text-slate-400">
                STEP {currentStep} / 4
              </Text>
            </View>
          </View>
          <View className="w-full bg-slate-100 h-1">
            <View className="h-1 bg-emerald-600" style={{ width: `${(currentStep / 4) * 100}%` }} />
          </View>
        </>
      )}

      <View className="flex-1">
        {currentStep === 1 && <Step1Date />}
        {currentStep === 2 && <Step2Tone />}
        {currentStep === 3 && <Step3SelfCheck />}
        {currentStep === 4 && <Step4Camera />}
        {currentStep === 5 && <Step5Results />}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
