import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function Step1Date() {
  const { eventDate, setEventDate, nextStep } = useAppStore();
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const today = new Date();
  const selectedDate = eventDate ? new Date(eventDate) : today;

  const handleChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) setEventDate(toDateString(date));
  };

  const handleNext = () => {
    if (eventDate) nextStep();
  };

  return (
    <View className="flex-1 items-center justify-center p-6 gap-8">
      <View className="items-center gap-2">
        <Text className="text-3xl font-bold text-slate-800 text-center">
          お見合い・デートはいつですか？
        </Text>
        <Text className="text-base text-slate-500 text-center">
          当日に向けた最適なアドバイスを生成します。
        </Text>
      </View>

      <View className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 items-center gap-4">
        <Calendar size={48} color="#43aab1" />

        {Platform.OS === 'android' && (
          <Pressable
            onPress={() => setShowPicker(true)}
            className="w-full p-4 border border-slate-200 rounded-xl"
          >
            <Text className="text-xl text-center">{eventDate ?? '日付を選択'}</Text>
          </Pressable>
        )}

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            minimumDate={today}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleChange}
          />
        )}
      </View>

      <Pressable
        onPress={handleNext}
        disabled={!eventDate}
        className={`w-full py-4 rounded-xl items-center mt-6 ${
          eventDate ? 'bg-emerald-600' : 'bg-emerald-300'
        }`}
      >
        <Text className="font-bold text-white text-lg">次へ進む</Text>
      </Pressable>
    </View>
  );
}
