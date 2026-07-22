import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConsentState {
  lms: boolean;
  github: boolean;
  wellness: boolean;
  setConsent: (key: 'lms' | 'github' | 'wellness', value: boolean) => void;
  hasConsent: (key: 'lms' | 'github' | 'wellness') => boolean;
  resetAll: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set, get) => ({
      lms: true, // Default enabled for core function
      github: true, // Default enabled for integration demo
      wellness: false, // Default disabled for governance demo
      setConsent: (key, value) => set({ [key]: value }),
      hasConsent: (key) => get()[key],
      resetAll: () => set({ lms: false, github: false, wellness: false })
    }),
    {
      name: 'drishta-consent-settings'
    }
  )
);
