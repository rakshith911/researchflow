// frontend/src/components/auth/protected-route.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // ✅ Make auth optional (default FALSE to allow guest mode)
}

export function ProtectedRoute({ children, requireAuth = false }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isGuestMode, token, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // ✅ If guest mode is active and auth not required, allow access
      if (isGuestMode && !requireAuth) {
        setIsChecking(false);
        return;
      }

      // ✅ If authenticated, allow access
      if (isAuthenticated) {
        setIsChecking(false);
        return;
      }

      // If no token and no guest mode, check what to do
      if (!token && !isGuestMode) {
        setIsChecking(false);
        return;
      }

      // If token exists, verify it
      if (token) {
        await checkAuth();
      }

      setIsChecking(false);
    };

    verifyAuth();
  }, [token, isGuestMode, requireAuth, isAuthenticated, checkAuth]);

  useEffect(() => {
    // ✅ Only redirect if:
    // 1. Auth is required AND
    // 2. Not authenticated AND
    // 3. Not in guest mode AND
    // 4. Done checking
    // 4. Done checking
    if (!isChecking && requireAuth && !isAuthenticated && !isGuestMode) {
      router.push('/login');
    }
  }, [isChecking, isAuthenticated, isGuestMode, requireAuth, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ✅ Allow access if:
  // 1. Auth not required (guest mode allowed) OR
  // 2. User is authenticated OR
  // 3. User is in guest mode
  if (!requireAuth || isAuthenticated || isGuestMode) {
    return <>{children}</>;
  }

  return null;
}