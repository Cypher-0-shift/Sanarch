import { create } from 'zustand';

interface Profile {
  id: string;
  name: string;
  relation: 'self' | 'patient';
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
}

interface ProfileState {
  activeProfile: Profile | null;
  familyMembers: FamilyMember[];
  setActiveProfile: (profile: Profile | null) => void;
  addFamilyMember: (member: FamilyMember) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  activeProfile: null,
  familyMembers: [],

  setActiveProfile: (activeProfile) => set({ activeProfile }),

  addFamilyMember: (member) =>
    set((state) => ({ familyMembers: [...state.familyMembers, member] })),

  clearProfile: () => set({ activeProfile: null, familyMembers: [] }),
}));
