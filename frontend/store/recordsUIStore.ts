/**
 * Records UI Store — Phase 5
 *
 * Persists sort, filter, and view mode state across navigations.
 * Should be reset when the active profile changes.
 */

import { create } from 'zustand';
import { type ViewMode } from '../components/records/ViewToggle';
import { type SortOption, type FilterOption } from '../components/records/FilterSortSheet';

interface RecordsUIState {
  viewMode: ViewMode;
  activeSort: SortOption;
  activeFilter: FilterOption;
  setViewMode: (mode: ViewMode) => void;
  setSortAndFilter: (sort: SortOption, filter: FilterOption) => void;
  reset: () => void;
}

export const useRecordsUIStore = create<RecordsUIState>((set) => ({
  viewMode: 'grouped', // default per Phase 5 spec
  activeSort: 'newest',
  activeFilter: 'all',

  setViewMode: (mode) => set({ viewMode: mode }),
  
  setSortAndFilter: (sort, filter) => set({ activeSort: sort, activeFilter: filter }),
  
  reset: () => set({
    viewMode: 'grouped',
    activeSort: 'newest',
    activeFilter: 'all',
  }),
}));
