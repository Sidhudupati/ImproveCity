import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IssueCategory } from '../types';

export type ViewMode = 'grid' | 'table';

interface LocationFilter {
  query: string;
  latitude: number | null;
  longitude: number | null;
}

interface FilterStore {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  categoryFilter: IssueCategory | 'All';
  setCategoryFilter: (category: IssueCategory | 'All') => void;
  
  locationFilter: LocationFilter;
  setLocationFilter: (location: LocationFilter) => void;
  
  resetFilters: () => void;
}

const defaultLocationFilter: LocationFilter = {
  query: '',
  latitude: null,
  longitude: null,
};

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),
      
      categoryFilter: 'All',
      setCategoryFilter: (category) => set({ categoryFilter: category }),
      
      locationFilter: defaultLocationFilter,
      setLocationFilter: (location) => set({ locationFilter: location }),
      
      resetFilters: () => set({
        categoryFilter: 'All',
        locationFilter: defaultLocationFilter,
      }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
);
