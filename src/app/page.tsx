'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { LayoutDashboard } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isStoreInitialized = useAuthStore(state => !!state.login); // Check if store is initialized

  useEffect(() => {
    // Wait for Zustand store to potentially hydrate from localStorage
    if (!isStoreInitialized) {
      // This check is a bit of a hack. A better way would be to use a Zustand persistence middleware
      // that provides hydration status. For this MVP, a small timeout can help.
      const timeoutId = setTimeout(() => {
        const currentAuthStatus = useAuthStore.getState().isAuthenticated;
        if (currentAuthStatus) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      }, 100); // Small delay for store hydration
      return () => clearTimeout(timeoutId);
    }

    // If store is already initialized
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router, isStoreInitialized]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <LayoutDashboard className="h-16 w-16 animate-pulse text-primary" />
      <p className="ml-4 text-xl text-muted-foreground">Loading AttendaTrack...</p>
    </div>
  );
}
