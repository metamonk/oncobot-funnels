import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getProUserStatusOnly } from '@/app/actions';
import { User } from '@/lib/db/schema';

export type UserWithProStatus = User & {
  isProUser: boolean;
  subscriptionData?: any;
};

// Hook for user data
export function useUserData() {
  return useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes - user data doesn't change often
    gcTime: 1000 * 60 * 10, // 10 minutes cache retention
    refetchOnWindowFocus: false, // Don't refetch on focus
    retry: 2, // Retry failed requests twice
  });
}

// Fast hook for just pro user status - optimized for navbar/settings
export function useProStatusOnly() {
  return useQuery({
    queryKey: ['pro-status-only'],
    queryFn: getProUserStatusOnly,
    staleTime: 1000 * 60 * 30, // 30 minutes - matches server cache
    gcTime: 1000 * 60 * 60, // 1 hour cache retention
    refetchOnWindowFocus: false,
    retry: 1,
  });
}


// Combined hook for Pro user status with optimized caching
export function useProUserStatus() {
  const { data: user, isLoading: userLoading } = useUserData();


  return {
    user: (user || null) as UserWithProStatus | null,
    subscriptionData: user?.subscriptionData,
    isProUser: Boolean(user?.isProUser),
    isLoading: Boolean(userLoading),
    // Pro users should never see limit checks
    shouldCheckLimits: !userLoading && user && !user.isProUser,
  };
}

// Fast hook for components that only need pro status (navbar, settings)
export function useFastProStatus() {
  const { data: isProUser, isLoading } = useProStatusOnly();

  return {
    isProUser: Boolean(isProUser),
    isLoading,
  };
}
