import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Tone = 'strict' | 'gentle';

export interface SelfCheckAnswers {
  noseHair: boolean;
  bodyOdor: boolean;
  haircut: boolean;
  hairWax: boolean;
}

export interface Photos {
  faceFront?: string;
  faceSide?: string;
  hands?: string;
  faceSideOpposite?: string;
  upperBody?: string;
  fullBody?: string;
  shoes?: string;
}

export interface ScoreData {
  total: number | null;
  comments: string | null;
  parts: Record<string, number | string>;
  partFeedback?: Record<string, string>;
  advice: {
    today: string[];
    fewDays: string[];
    longTerm: string[];
  };
  undiagnosable?: boolean;
  undiagnosableReason?: string;
}

interface AppState {
  currentStep: number;
  eventDate: string | null;
  tone: Tone;
  selfCheck: SelfCheckAnswers;
  photos: Photos;
  skippedParts: string[];
  score: ScoreData | null;
  
  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setEventDate: (date: string) => void;
  setTone: (tone: Tone) => void;
  updateSelfCheck: (key: keyof SelfCheckAnswers, value: boolean) => void;
  setPhoto: (part: keyof Photos, base64: string) => void;
  skipPhoto: (part: keyof Photos) => void;
  setScore: (score: ScoreData) => void;
  resetApp: () => void;
}

const initialSelfCheck: SelfCheckAnswers = {
  noseHair: false,
  bodyOdor: false,
  haircut: false,
  hairWax: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentStep: 1,
      eventDate: null,
      tone: 'gentle',
      selfCheck: initialSelfCheck,
      photos: {},
      skippedParts: [],
      score: null,

      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
      setEventDate: (date) => set({ eventDate: date }),
      setTone: (tone) => set({ tone }),
      updateSelfCheck: (key, value) => 
        set((state) => ({ selfCheck: { ...state.selfCheck, [key]: value } })),
      setPhoto: (part, base64) => 
        set((state) => {
          // Remove from skipped if it was skipped before
          const skippedParts = state.skippedParts.filter(p => p !== part);
          return { 
            photos: { ...state.photos, [part]: base64 },
            skippedParts
          };
        }),
      skipPhoto: (part) => 
        set((state) => ({
          skippedParts: [...state.skippedParts.filter(p => p !== part), part]
        })),
      setScore: (score) => set({ score }),
      resetApp: () => set({
        currentStep: 1,
        eventDate: null,
        tone: 'gentle',
        selfCheck: initialSelfCheck,
        photos: {},
        skippedParts: [],
        score: null,
      }),
    }),
    {
      name: 'midashi_history', // LocalStorage key specified in PDF
      partialize: (state) => ({ 
        // Only persist these fields to match requirements (do not persist photos)
        eventDate: state.eventDate, 
        tone: state.tone, 
        skippedParts: state.skippedParts,
        score: state.score
      }),
    }
  )
);
