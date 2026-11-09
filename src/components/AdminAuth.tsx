import React, { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, ArrowLeft, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { User, signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserSessionPersistence, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { checkIsAdminUser } from '../lib/adminSession';

interface AdminAuthProps {
  onSuccess: (user: User) => void;
  onNavigateHome: () => void;
  initialError?: string | null;
}

export default function AdminAuth({ onSuccess, onNavigateHome, initialError }: AdminAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError || null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Enforce browser-session persistence for admin login session
      await setPersistence(auth, browserSessionPersistence);

      // 2. Perform authentic Firebase Email/Password sign-in
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 3. Verify administrator authorization before granting access
      const authCheck = await checkIsAdminUser(user);
      if (!authCheck.isAuthorized) {
        await auth.signOut();
        setError(authCheck.reason || 'Unauthorized administrator account. Access denied.');
        setLoading(false);
        return;
      }

      onSuccess(user);
    } catch (err: any) {
      const isExpectedAuthError = 
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-email' ||
        err.code === 'auth/too-many-requests';

      if (!isExpectedAuthError) {
        console.warn('Unexpected authentication error code:', err?.code, err);
      }

      let friendlyMessage = 'Authentication failed. Please check your credentials.';
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential'
      ) {
        friendlyMessage = 'Invalid email address or password. Please verify your credentials.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many unsuccessful attempts. Please wait a moment and try again.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage = 'Email/Password sign-in is not enabled in Firebase Authentication.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      // 1. Enforce browser-session persistence for admin login session
      await setPersistence(auth, browserSessionPersistence);

      // 2. Trigger Google Sign-In popup
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // 3. Verify administrator authorization before granting access
      const authCheck = await checkIsAdminUser(user);
      if (!authCheck.isAuthorized) {
        await auth.signOut();
        setError(authCheck.reason || 'Unauthorized administrator account. Access denied.');
        setGoogleLoading(false);
        return;
      }

      onSuccess(user);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed popup; clear loading state without error banner
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google Sign-In popup was blocked by your browser. Please allow popups for this site.');
      } else {
        console.warn('Google authentication error:', err?.code, err);
        setError('Google Sign-In failed. ' + (err.message || 'Please try again.'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSent(false);

    if (!email.trim()) {
      setError('Please enter your registered email address to receive a password reset link.');
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err: any) {
      let friendlyMessage = 'Failed to send password reset email. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'No registered administrator account found with this email.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setError(friendlyMessage);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-panel py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={onNavigateHome}
          className="mx-auto flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-brand-blue hover:text-brand-blue-dark transition-colors uppercase mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </button>

        <div className="text-center">
          <h2 className="mt-2 text-center text-3xl font-display font-bold tracking-tight text-ink uppercase">
            AEO Admin
          </h2>
          <p className="mt-2 text-center text-xs text-ink2 max-w">
            Authorized observatory staff only. Access is logged and audited.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-line sm:rounded-2xl sm:px-10 shadow-custom">
          {(error || initialError) && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-xs text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="font-medium leading-normal">{error || initialError}</div>
            </div>
          )}

          {resetSent && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-medium leading-normal">
                Password reset link sent! Check your inbox ({email.trim()}) for instructions.
              </div>
            </div>
          )}

          {showResetForm ? (
            <form className="space-y-6" onSubmit={handlePasswordReset}>
              <div>
                <label htmlFor="reset-email" className="block text-xs font-semibold uppercase tracking-wider text-ink font-mono mb-2">
                  Administrator Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-mut" aria-hidden="true" />
                  </div>
                  <input
                    id="reset-email"
                    name="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@athenacentre.ng"
                    className="block w-full pl-10 pr-3 py-2.5 border border-line rounded-lg text-sm bg-white text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-semibold font-mono tracking-wider uppercase text-white bg-navy hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition-all cursor-pointer items-center gap-2 shadow-sm"
                >
                  {resetLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>Send Reset Link</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setError(null);
                  }}
                  className="text-xs text-brand-blue hover:underline font-semibold font-mono cursor-pointer"
                >
                  ← Return to Sign In
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-line rounded-lg text-xs font-semibold font-mono tracking-wider uppercase text-ink bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-ink2" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Sign In with Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase font-mono">
                  <span className="bg-white px-3 text-mut font-semibold">Or with Email</span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleEmailAuth}>
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-ink font-mono mb-2">
                    Email Address
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-mut" aria-hidden="true" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@athenacentre.ng"
                      className="block w-full pl-10 pr-3 py-2.5 border border-line rounded-lg text-sm bg-white text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-ink font-mono">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetForm(true);
                        setError(null);
                        setResetSent(false);
                      }}
                      className="text-[11px] font-mono text-brand-blue hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-mut" aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-2.5 border border-line rounded-lg text-sm bg-white text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-semibold font-mono tracking-wider uppercase text-white bg-navy hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition-all cursor-pointer items-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>Sign In as Admin</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

