'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface UseAuthRedirectOptions {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string; // Path to redirect to if not authenticated or role mismatch
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  const defaultRedirect = '/login';
  const { requiredRole, redirectTo = defaultRedirect } = options;

  useEffect(() => {
    // Ensure this runs only on the client after Zustand store might have hydrated
    const authState = useAuthStore.getState();
    const currentUser = authState.user;
    const currentIsAuthenticated = authState.isAuthenticated;

    if (!currentIsAuthenticated) {
      if (pathname !== redirectTo && pathname !== '/login') { // Avoid redirect loop if already on login
        router.replace(redirectTo);
      } else {
        setIsChecking(false);
      }
      return;
    }

    if (requiredRole) {
      const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!currentUser || !rolesArray.includes(currentUser.role)) {
        // If role mismatch, redirect to a common dashboard or a 'not authorized' page,
        // or back to login if it's a sensitive area.
        router.replace(redirectTo === defaultRedirect ? '/dashboard' : redirectTo); 
        return;
      }
    }
    setIsChecking(false);
  }, [user, isAuthenticated, pathname, router, requiredRole, redirectTo, defaultRedirect]);

  return { user, isAuthenticated, isChecking };
}
