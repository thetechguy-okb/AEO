import { User, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * The permanent sole Super Administrator (Owner) UID for Athena Election Observatory.
 * Only this Firebase Authentication UID confers Owner administrative authority.
 */
export const SUPER_ADMIN_UID = 's39PbuZxqdW1x63i0SsEVE7HqGQ2';

/**
 * Checks if a given Firebase User is the primary Super Administrator (Owner).
 * Solely evaluates the cryptographic Firebase Auth UID. No email fallback.
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.uid === SUPER_ADMIN_UID;
}

export const SESSION_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_MAX_DURATION_MS = 8 * 60 * 60 * 1000;    // 8 hours

const KEY_SESSION_START = 'aeo_admin_session_start_time';
const KEY_LAST_ACTIVITY = 'aeo_admin_last_activity_time';

export interface AdminAuthResult {
  isAuthorized: boolean;
  reason?: string;
  role?: string;
}

/**
 * Checks whether a Firebase User is authorized as an AEO administrator.
 * 1. Owner UID ('s39PbuZxqdW1x63i0SsEVE7HqGQ2') is permanently authorized.
 * 2. Other users are dynamically checked against the trusted '/cms_admins' collection in Firestore.
 * 3. Accounts must have an explicitly approved 'Active' status. Suspended, Revoked, or Pending are rejected.
 */
export async function checkIsAdminUser(user: User): Promise<AdminAuthResult> {
  if (!user) {
    return { isAuthorized: false, reason: 'No authenticated user account provided.' };
  }

  // 1. Permanent Super Administrator (Owner) authorization check
  if (user.uid === SUPER_ADMIN_UID) {
    return { isAuthorized: true, role: 'Super Administrator' };
  }

  // 2. Dynamic verification against Firestore database 'aeo19oct-clone' collection 'cms_admins'
  // Reads ONLY the user's own directory record (/cms_admins/{user.uid})
  try {
    const adminDocRef = doc(db, 'cms_admins', user.uid);
    const docSnap = await getDoc(adminDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.status === 'Active') {
        return { isAuthorized: true, role: data.role || 'Administrator' };
      } else if (data.status === 'Suspended') {
        return {
          isAuthorized: false,
          reason: 'Access Denied: Your administrator account has been suspended by the Owner.'
        };
      } else if (data.status === 'Revoked') {
        return {
          isAuthorized: false,
          reason: 'Access Denied: Your administrator privileges have been revoked.'
        };
      } else if (data.status === 'Pending') {
        return {
          isAuthorized: false,
          reason: 'Access Denied: Your administrator account is pending Owner activation.'
        };
      }
    }
  } catch (err: any) {
    console.warn('Direct Firestore administrator record lookup notice:', err.message);
  }

  return {
    isAuthorized: false,
    reason: `Access Denied: Account (UID: ${user.uid}) is not authorized for administrator privileges.`
  };
}

/**
 * Initializes session timestamps in sessionStorage upon successful login.
 */
export function initializeAdminSessionTimestamps(): void {
  const now = Date.now().toString();
  sessionStorage.setItem(KEY_SESSION_START, now);
  sessionStorage.setItem(KEY_LAST_ACTIVITY, now);
}

/**
 * Updates the last activity timestamp in sessionStorage.
 */
export function touchAdminSessionActivity(): void {
  const now = Date.now().toString();
  sessionStorage.setItem(KEY_LAST_ACTIVITY, now);
}

/**
 * Clears admin session timestamps from sessionStorage.
 */
export function clearAdminSessionTimestamps(): void {
  sessionStorage.removeItem(KEY_SESSION_START);
  sessionStorage.removeItem(KEY_LAST_ACTIVITY);
}

/**
 * Evaluates whether the active session is valid or has expired due to 15m inactivity or 8h duration limit.
 */
export function evaluateSessionStatus(): { isValid: boolean; reason?: string } {
  const startTimeStr = sessionStorage.getItem(KEY_SESSION_START);
  const lastActivityStr = sessionStorage.getItem(KEY_LAST_ACTIVITY);

  if (!startTimeStr || !lastActivityStr) {
    initializeAdminSessionTimestamps();
    return { isValid: true };
  }

  const now = Date.now();
  const startTime = parseInt(startTimeStr, 10);
  const lastActivity = parseInt(lastActivityStr, 10);

  if (isNaN(startTime) || isNaN(lastActivity)) {
    initializeAdminSessionTimestamps();
    return { isValid: true };
  }

  // 1. Check 8-hour maximum session duration limit
  if (now - startTime > SESSION_MAX_DURATION_MS) {
    return {
      isValid: false,
      reason: 'Session reached the maximum 8-hour duration limit. Re-authentication required.'
    };
  }

  // 2. Check 15-minute inactivity timeout
  if (now - lastActivity > SESSION_INACTIVITY_TIMEOUT_MS) {
    return {
      isValid: false,
      reason: 'Session timed out due to 15 minutes of inactivity. Please sign in again.'
    };
  }

  return { isValid: true };
}

/**
 * Performs complete secure logout: signs out of Firebase Auth and clears application session storage.
 */
export async function performSecureAdminLogout(): Promise<void> {
  clearAdminSessionTimestamps();
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Error signing out from Firebase Auth:', err);
  }
}
