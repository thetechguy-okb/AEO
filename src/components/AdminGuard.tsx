import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  checkIsAdminUser, 
  initializeAdminSessionTimestamps, 
  touchAdminSessionActivity, 
  clearAdminSessionTimestamps, 
  evaluateSessionStatus, 
  performSecureAdminLogout 
} from '../lib/adminSession';
import AdminAuth from './AdminAuth';
import CMSPanel from './CMSPanel';
import { CMSProvider } from '../context/CMSContext';

interface AdminGuardProps {
  onNavigateHome: () => void;
}

export default function AdminGuard({ onNavigateHome }: AdminGuardProps) {
  const [authState, setAuthState] = useState<{
    verifying: boolean;
    authorizedUser: User | null;
    sessionError: string | null;
  }>({
    verifying: true,
    authorizedUser: null,
    sessionError: null
  });

  const handleLogout = useCallback(async (errorMsg?: string) => {
    await performSecureAdminLogout();
    setAuthState({
      verifying: false,
      authorizedUser: null,
      sessionError: errorMsg || null
    });
  }, []);

  // Listen to Firebase Auth state changes and enforce session restoration checks
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        clearAdminSessionTimestamps();
        setAuthState({
          verifying: false,
          authorizedUser: null,
          sessionError: null
        });
        return;
      }

      // 1. Verify administrator authorization first
      const authCheck = await checkIsAdminUser(currentUser);
      if (!authCheck.isAuthorized) {
        await performSecureAdminLogout();
        setAuthState({
          verifying: false,
          authorizedUser: null,
          sessionError: authCheck.reason || 'Unauthorized administrator account.'
        });
        return;
      }

      // 2. Check session duration (8h max) and inactivity (15m max)
      const sessionEval = evaluateSessionStatus();
      if (!sessionEval.isValid) {
        await performSecureAdminLogout();
        setAuthState({
          verifying: false,
          authorizedUser: null,
          sessionError: sessionEval.reason || 'Session expired.'
        });
        return;
      }

      // 3. Authorized administrator with valid active session
      touchAdminSessionActivity();
      setAuthState({
        verifying: false,
        authorizedUser: currentUser,
        sessionError: null
      });
    });

    return () => unsubscribe();
  }, []);

  // Set up inactivity & maximum session duration listeners while on /admin
  useEffect(() => {
    if (!authState.authorizedUser) return;

    let throttleTimer: NodeJS.Timeout | null = null;

    const handleUserActivity = () => {
      const sessionEval = evaluateSessionStatus();
      if (!sessionEval.isValid) {
        handleLogout(sessionEval.reason);
        return;
      }

      if (!throttleTimer) {
        touchAdminSessionActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 5000);
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Periodic check every 10 seconds to enforce timeout even if completely idle
    const intervalId = setInterval(() => {
      const sessionEval = evaluateSessionStatus();
      if (!sessionEval.isValid) {
        handleLogout(sessionEval.reason);
      }
    }, 10000);

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      clearInterval(intervalId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [authState.authorizedUser, handleLogout]);

  // Render Loading / Verification State
  if (authState.verifying) {
    return (
      <div className="min-h-screen bg-panel flex items-center justify-center p-4">
        <div className="text-center space-y-3 font-mono">
          <Loader2 className="w-6 h-6 text-brand-blue animate-spin mx-auto" />
          <div className="text-xs font-bold text-ink uppercase tracking-wider">
            Verifying Administrator Credentials &amp; Session Security...
          </div>
          <div className="text-[11px] text-mut">
            Athena Observatory Security Subsystem
          </div>
        </div>
      </div>
    );
  }

  // Render Login Screen if not authorized or session expired
  if (!authState.authorizedUser) {
    return (
      <AdminAuth
        initialError={authState.sessionError}
        onSuccess={(user) => {
          initializeAdminSessionTimestamps();
          setAuthState({
            verifying: false,
            authorizedUser: user,
            sessionError: null
          });
        }}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  // Render Admin CMS Panel for authorized administrator
  return (
    <CMSProvider>
      <CMSPanel
        isStandalone={true}
        onNavigateHome={onNavigateHome}
        currentUser={authState.authorizedUser}
      />
    </CMSProvider>
  );
}
