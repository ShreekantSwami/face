'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isAuthenticated, isChecking } = useAuthRedirect();

  useEffect(() => {
    if (!isChecking && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (user.role === 'teacher') {
        router.replace('/teacher/dashboard');
      } else {
        // Fallback or error, though role should always be defined for logged-in user
        router.replace('/login');
      }
    }
  }, [user, isAuthenticated, router, isChecking]);

  return (
     <div className="flex h-full flex-col items-center justify-center">
      <LayoutDashboard className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading dashboard...</p>
    </div>
  );
}
