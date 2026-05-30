import { create } from 'zustand';

export interface Profile {
  id: string;
  sanarchId: string;
  name: string;
  relation: 'self' | 'parent' | 'child' | 'spouse' | 'sibling' | 'elderly' | 'other';
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  heightCm?: string;
  weightKg?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  isMainAccount: boolean;
}

interface ProfileState {
  activeProfile: Profile | null;
  familyMembers: Profile[];
  setActiveProfile: (profile: Profile | null) => void;
  addFamilyMember: (member: Profile) => void;
  updateFamilyMember: (id: string, updates: Partial<Profile>) => void;
  initProfiles: (mainProfile: Profile, dependentProfile?: Profile) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  activeProfile: null,
  familyMembers: [],

  setActiveProfile: (activeProfile) => set({ activeProfile }),

  addFamilyMember: (member) =>
    set((state) => ({ familyMembers: [...state.familyMembers, member] })),

  updateFamilyMember: (id, updates) =>
    set((state) => ({
      familyMembers: state.familyMembers.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  initProfiles: (mainProfile, dependentProfile) =>
    set({
      activeProfile: mainProfile,
      familyMembers: dependentProfile
        ? [mainProfile, dependentProfile]
        : [mainProfile],
    }),

  clearProfile: () => set({ activeProfile: null, familyMembers: [] }),
}));
