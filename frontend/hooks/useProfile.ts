// hooks/useProfile.ts
/**
 * React Query hooks for SANARCH profile API endpoints.
 *
 * Uses the existing apiClient from services/api.ts and
 * endpoint constants from constants/api.ts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import { ENDPOINTS } from '../constants/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProfileResponse {
  sanarch_id: string;
  family_serial: string;
  profile_type: 'P' | 'D';
  member_index: number;
  country_code: string;
  reg_year: number;
  gender_code: 'M' | 'F' | 'X';
  age_band: number;
  primary_id: string | null;
  created_at: string;
  qr_base64: string;
}

export interface CreatePrimaryProfileRequest {
  country_code: string;
  gender: 'M' | 'F' | 'X';
  age: number;
}

export interface CreateDependentProfileRequest {
  primary_sanarch_id: string;
  gender: 'M' | 'F' | 'X';
  age: number;
}

// ── Query keys ───────────────────────────────────────────────────────────────

const profileKeys = {
  all: ['profiles'] as const,
  detail: (id: string) => ['profiles', 'detail', id] as const,
  family: (id: string) => ['profiles', 'family', id] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch a single SANARCH profile by its ID.
 */
export function useGetProfile(sanarchId: string | null | undefined) {
  const isValidId = !!sanarchId && sanarchId !== '---' && sanarchId.trim().length > 3;
  return useQuery({
    queryKey: profileKeys.detail(sanarchId ?? ''),
    queryFn: async (): Promise<ProfileResponse> => {
      const response = await apiClient.get<ProfileResponse>(
        ENDPOINTS.GET_PROFILE(sanarchId!)
      );
      return response.data;
    },
    enabled: isValidId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Fetch all family members for a given SANARCH ID.
 */
export function useFamilyProfiles(sanarchId: string | null | undefined) {
  const isValidId = !!sanarchId && sanarchId !== '---' && sanarchId.trim().length > 3;
  return useQuery({
    queryKey: profileKeys.family(sanarchId ?? ''),
    queryFn: async (): Promise<ProfileResponse[]> => {
      const response = await apiClient.get<ProfileResponse[]>(
        ENDPOINTS.GET_FAMILY_PROFILES(sanarchId!)
      );
      return response.data;
    },
    enabled: isValidId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Create a new primary profile.
 */
export function useCreatePrimaryProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreatePrimaryProfileRequest
    ): Promise<ProfileResponse> => {
      const response = await apiClient.post<ProfileResponse>(
        ENDPOINTS.CREATE_PRIMARY_PROFILE,
        data
      );
      return response.data;
    },
    onSuccess: (profile) => {
      // Populate the cache for the new profile
      queryClient.setQueryData(
        profileKeys.detail(profile.sanarch_id),
        profile
      );
      // Invalidate family queries since membership changed
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

/**
 * Create a dependent profile under an existing primary.
 */
export function useCreateDependentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateDependentProfileRequest
    ): Promise<ProfileResponse> => {
      const response = await apiClient.post<ProfileResponse>(
        ENDPOINTS.CREATE_DEPENDENT_PROFILE,
        data
      );
      return response.data;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(
        profileKeys.detail(profile.sanarch_id),
        profile
      );
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
