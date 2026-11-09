import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Load Firebase configuration
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    console.log('Firebase configuration loaded from:', firebaseConfigPath);
  } catch (e) {
    console.error('Failed to parse firebase-applet-config.json:', e);
  }
} else {
  console.warn('firebase-applet-config.json not found in cwd, checked:', firebaseConfigPath);
}

const SUPER_ADMIN_UID = 's39PbuZxqdW1x63i0SsEVE7HqGQ2';
const API_KEY = firebaseConfig.apiKey || '';
const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || 'aeo-database19';
const PROJECT_ID = firebaseConfig.projectId || 'gen-lang-client-0961551337';

// Safe JSON parser for HTTP responses to prevent Unexpected end of JSON errors
async function safeFetchJson(res: any): Promise<any> {
  const text = await res.text().catch(() => '');
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

// Middleware: Authenticate caller strictly using Firebase Auth REST API lookup and verify Owner UID
async function authenticateSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  try {
    // Cryptographically verify ID token against Firebase Auth REST API lookup
    const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`;
    const lookupRes = await fetch(lookupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(10000)
    });

    if (!lookupRes.ok) {
      const errData = await safeFetchJson(lookupRes);
      return res.status(401).json({ error: 'Authentication failed: Invalid or expired token', details: errData });
    }

    const data = await safeFetchJson(lookupRes);
    const user = data.users && data.users[0];

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed: User account not found' });
    }

    const uid = user.localId;
    const email = (user.email || '').toLowerCase();

    // Verify caller is STRICTLY the designated Super Administrator (Owner) UID
    // Email addresses NEVER independently confer Owner privileges.
    const isSuperAdminUser = uid === SUPER_ADMIN_UID;

    if (!isSuperAdminUser) {
      await auditOperation({
        actingUid: uid,
        actingEmail: email,
        targetUid: req.params.uid || req.body?.email || 'N/A',
        operation: `UNAUTHORIZED_ACCESS_ATTEMPT:${req.method}:${req.path}`,
        status: 'FAILED',
        reason: 'Caller is not the designated Super Administrator'
      }, idToken);

      return res.status(403).json({ 
        error: 'Forbidden: Only the permanent Super Administrator (Owner UID: s39PbuZxqdW1x63i0SsEVE7HqGQ2) can manage administrator accounts.' 
      });
    }

    (req as any).user = { uid, email, isSuperAdmin: true };
    (req as any).idToken = idToken;
    next();
  } catch (err: any) {
    console.error('Error verifying token in authenticateSuperAdmin:', err);
    return res.status(500).json({ error: 'Internal server authentication error', details: err.message });
  }
}

// Middleware: Authenticate any valid Firebase user
async function authenticateFirebaseUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  try {
    const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`;
    const lookupRes = await fetch(lookupUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(10000)
    });

    if (!lookupRes.ok) {
      return res.status(401).json({ error: 'Authentication failed: Invalid or expired token' });
    }

    const data = await safeFetchJson(lookupRes);
    const user = data.users && data.users[0];
    if (!user) {
      return res.status(401).json({ error: 'Authentication failed: User not found' });
    }

    (req as any).user = {
      uid: user.localId,
      email: (user.email || '').toLowerCase(),
      emailVerified: user.emailVerified === true || user.emailVerified === 'true'
    };
    (req as any).idToken = idToken;
    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server authentication error', details: err.message });
  }
}

// Firestore REST Helper: Parse Firestore Document
function parseFirestoreDocument(doc: any) {
  if (!doc || !doc.fields) return null;
  const result: Record<string, any> = {};
  for (const [key, field] of Object.entries(doc.fields as Record<string, any>)) {
    if ('stringValue' in field) result[key] = field.stringValue;
    else if ('doubleValue' in field) result[key] = Number(field.doubleValue);
    else if ('integerValue' in field) result[key] = Number(field.integerValue);
    else if ('booleanValue' in field) result[key] = field.booleanValue;
    else if ('timestampValue' in field) result[key] = field.timestampValue;
    else if ('referenceValue' in field) result[key] = field.referenceValue;
    else if ('nullValue' in field) result[key] = null;
    else if ('arrayValue' in field) result[key] = (field.arrayValue?.values || []).map((v: any) => v.stringValue || v);
    else if ('mapValue' in field) result[key] = field.mapValue?.fields;
  }
  return result;
}

// Firestore REST Helper: Read Document
async function getFirestoreDocument(documentPath: string, callerToken?: string): Promise<Record<string, any> | null> {
  // Always include ?key=${API_KEY} so Google API Gateway identifies the Firebase project consumer
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/${documentPath}?key=${API_KEY}`;
  const headers: Record<string, string> = { 
    'Accept': 'application/json',
    'x-goog-api-key': API_KEY
  };
  if (callerToken) headers['Authorization'] = `Bearer ${callerToken}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore GET failed (${res.status}): ${text}`);
  }
  const data = await safeFetchJson(res);
  const parsed = parseFirestoreDocument(data) || {};
  return { ...parsed, _name: data.name };
}

// Firestore REST Helper: List Collection Documents
async function listFirestoreDocuments(collectionId: string, callerToken?: string): Promise<any[]> {
  if (!callerToken) {
    throw new Error(`Authentication token required to list Firestore collection '${collectionId}'`);
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-goog-api-key': API_KEY,
    'Authorization': `Bearer ${callerToken}`
  };

  // Primary: Standard list endpoint on named database
  const listUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/${collectionId}?key=${API_KEY}&pageSize=300`;
  
  let primaryError: Error | null = null;
  try {
    const res = await fetch(listUrl, { headers, signal: AbortSignal.timeout(12000) });
    if (res.status === 404) return [];
    if (res.ok) {
      const data = await safeFetchJson(res);
      if (!data.documents || !Array.isArray(data.documents)) return [];
      return data.documents.map((d: any) => {
        const id = d.name.split('/').pop();
        const parsed = parseFirestoreDocument(d) || {};
        return { ...parsed, id, uid: parsed.uid || id };
      });
    }
    const text = await res.text().catch(() => '');
    primaryError = new Error(`Firestore list failed (${res.status}): ${text}`);
  } catch (err: any) {
    primaryError = err;
  }

  // Secondary: StructuredQuery fallback (documents:runQuery)
  try {
    const runQueryUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents:runQuery?key=${API_KEY}`;
    const queryRes = await fetch(runQueryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId }]
        }
      }),
      signal: AbortSignal.timeout(12000)
    });

    if (queryRes.ok) {
      const items = await safeFetchJson(queryRes);
      if (Array.isArray(items)) {
        const results: any[] = [];
        for (const item of items) {
          if (item.document) {
            const id = item.document.name.split('/').pop();
            const parsed = parseFirestoreDocument(item.document) || {};
            results.push({ ...parsed, id, uid: parsed.uid || id });
          }
        }
        return results;
      }
    }
  } catch (qErr) {
    console.warn(`runQuery fallback also failed for ${collectionId}:`, qErr);
  }

  if (primaryError) {
    throw primaryError;
  }
  return [];
}

// Firestore REST Helper: Write / Update Document
async function writeFirestoreDocument(documentPath: string, fields: Record<string, any>, callerToken?: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/${documentPath}?key=${API_KEY}`;
  
  // Format fields to Firestore REST JSON
  const formattedFields: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'string') formattedFields[key] = { stringValue: val };
    else if (typeof val === 'number') formattedFields[key] = { doubleValue: val };
    else if (typeof val === 'boolean') formattedFields[key] = { booleanValue: val };
    else if (Array.isArray(val)) formattedFields[key] = { arrayValue: { values: val.map(v => ({ stringValue: String(v) })) } };
    else if (val && typeof val === 'object') formattedFields[key] = { mapValue: { fields: val } };
    else formattedFields[key] = { stringValue: String(val || '') };
  }

  const headers: Record<string, string> = { 
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-goog-api-key': API_KEY
  };
  if (callerToken) headers['Authorization'] = `Bearer ${callerToken}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields: formattedFields }),
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firestore PATCH failed (${res.status}): ${text}`);
  }
  return await safeFetchJson(res);
}

// Firestore REST Helper: Delete Document
async function deleteFirestoreDocument(documentPath: string, callerToken?: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/${documentPath}?key=${API_KEY}`;
  const headers: Record<string, string> = { 
    'Accept': 'application/json',
    'x-goog-api-key': API_KEY
  };
  if (callerToken) headers['Authorization'] = `Bearer ${callerToken}`;
  const res = await fetch(url, { method: 'DELETE', headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Firestore DELETE failed (${res.status}): ${text}`);
  }
  return true;
}

// The sole permanent Super Administrator (Owner) record
const INITIAL_OWNER_ADMIN = {
  uid: SUPER_ADMIN_UID,
  email: 'agbedunj@gmail.com',
  role: 'Super Administrator' as const,
  status: 'Active' as const,
  grantedAt: new Date('2026-10-01').toISOString(),
  grantedBy: 'System Initializer (Owner)',
  notes: 'Permanent Initial Super Administrator (Owner Account)'
};

// In-Memory cache (hydrated dynamically from Firestore collection /cms_admins)
let ADMINS_DIRECTORY: Array<{
  uid: string;
  email: string;
  role: 'Super Administrator' | 'Administrator';
  status: 'Active' | 'Suspended' | 'Revoked' | 'Pending';
  grantedAt: string;
  grantedBy: string;
  notes?: string;
}> = [INITIAL_OWNER_ADMIN];

// Audit Logger
let AUDIT_LOGS: Array<{
  id: string;
  timestamp: string;
  actingUid: string;
  actingEmail: string;
  targetUid: string;
  operation: string;
  status: 'SUCCESS' | 'FAILED';
  reason?: string;
}> = [];

async function auditOperation(params: {
  actingUid: string;
  actingEmail: string;
  targetUid: string;
  operation: string;
  status: 'SUCCESS' | 'FAILED';
  reason?: string;
}, callerToken?: string) {
  const logEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    ...params
  };

  AUDIT_LOGS.unshift(logEntry);
  if (AUDIT_LOGS.length > 500) AUDIT_LOGS = AUDIT_LOGS.slice(0, 500);

  // Sync to Firestore cms_audit_logs collection
  try {
    await writeFirestoreDocument(`cms_audit_logs/${logEntry.id}`, logEntry, callerToken);
  } catch (err: any) {
    console.warn('Could not write audit log to Firestore REST:', err.message);
  }
}

// ----------------------------------------------------
// API ROUTES FOR SUPER ADMINISTRATOR
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    configLoaded: !!firebaseConfig.apiKey
  });
});

// GET /api/admin/users - List all administrators (Hydrated from Firestore database 'aeo19oct-clone')
app.get('/api/admin/users', authenticateSuperAdmin, async (req: Request, res: Response) => {
  try {
    const callerToken = (req as any).idToken;
    let firestoreAdmins: any[] = [];
    try {
      firestoreAdmins = await listFirestoreDocuments('cms_admins', callerToken);
    } catch (fsErr: any) {
      console.error('Could not read cms_admins from Firestore:', fsErr.message);
      // Return accurate error state without replacing with misleading success response
      return res.status(502).json({
        success: false,
        error: `Could not read cms_admins from Firestore: ${fsErr.message}`,
        superAdminUid: SUPER_ADMIN_UID,
        admins: [INITIAL_OWNER_ADMIN]
      });
    }

    // Ensure the permanent Owner is always at index 0
    const merged: Array<any> = [INITIAL_OWNER_ADMIN];
    const seenUids = new Set([SUPER_ADMIN_UID]);

    for (const a of firestoreAdmins) {
      const recordUid = a.uid || a.id;
      if (recordUid && !seenUids.has(recordUid) && !String(recordUid).startsWith('invitation_')) {
        seenUids.add(recordUid);
        merged.push({
          uid: recordUid,
          email: a.email || 'N/A',
          role: a.role || 'Administrator',
          status: a.status || 'Active',
          grantedAt: a.grantedAt || new Date().toISOString(),
          grantedBy: a.grantedBy || 'Owner',
          notes: a.notes || ''
        });
      }
    }

    // Merge in any previously recorded administrators in in-memory cache
    for (const cached of ADMINS_DIRECTORY) {
      if (cached.uid && !seenUids.has(cached.uid) && !String(cached.uid).startsWith('invitation_')) {
        seenUids.add(cached.uid);
        merged.push(cached);
      }
    }

    // Merge in any pending invitations for Owner visibility
    for (const a of firestoreAdmins) {
      const recordId = String(a.id || a.uid || '');
      if (recordId.startsWith('invitation_')) {
        merged.push({
          uid: recordId,
          email: a.email || a.invitedEmail || 'N/A',
          role: 'Administrator',
          status: 'Pending',
          grantedAt: a.grantedAt || new Date().toISOString(),
          grantedBy: a.grantedBy || 'Owner Invitation',
          notes: a.notes ? `[Invitation Pending] ${a.notes}` : '[Invitation Pending]'
        });
      }
    }

    // Synchronize in-memory cache
    ADMINS_DIRECTORY = merged;

    await auditOperation({
      actingUid: (req as any).user.uid,
      actingEmail: (req as any).user.email,
      targetUid: 'ALL',
      operation: 'LIST_ADMINISTRATORS',
      status: 'SUCCESS'
    }, callerToken);

    res.json({
      success: true,
      superAdminUid: SUPER_ADMIN_UID,
      admins: merged
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list administrators', details: err.message });
  }
});

// POST /api/admin/users - Approve an existing Firebase Authentication account by its real UID
app.post('/api/admin/users', authenticateSuperAdmin, async (req: Request, res: Response) => {
  const { uid, email, status, notes } = req.body;
  const callerToken = (req as any).idToken;

  if (!uid || typeof uid !== 'string' || uid.trim().length < 5) {
    return res.status(400).json({ error: 'Valid Firebase Authentication UID is required for administrator approval.' });
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required for administrator identification.' });
  }

  const cleanUid = uid.trim();
  const cleanEmail = email.trim().toLowerCase();

  // Protect Owner: Cannot approve Owner UID as an ordinary administrator
  if (cleanUid === SUPER_ADMIN_UID) {
    return res.status(400).json({ error: 'The Super Administrator (Owner) account is already permanently authorized.' });
  }

  const assignedRole: 'Administrator' = 'Administrator';
  const assignedStatus: 'Active' | 'Suspended' = status === 'Suspended' ? 'Suspended' : 'Active';

  // Owner verification attribution:
  // Note: An unprivileged Web API key cannot query arbitrary third-party accounts via Identity Toolkit.
  // The system relies authoritatively on the Owner's authenticated confirmation of the candidate's exact Firebase UID.
  const verificationNotes = notes?.trim()
    ? `${notes.trim()} (Owner UID Verified)`
    : 'Owner UID Verified';

  const newAdminRecord = {
    uid: cleanUid,
    email: cleanEmail,
    role: assignedRole,
    status: assignedStatus,
    grantedAt: new Date().toISOString(),
    grantedBy: `Owner (UID: ${SUPER_ADMIN_UID})`,
    notes: verificationNotes || 'Owner-approved administrator UID'
  };

  // Persist directly to Firestore database 'aeo19oct-clone' under /cms_admins/{cleanUid}
  try {
    await writeFirestoreDocument(`cms_admins/${cleanUid}`, newAdminRecord, callerToken);
  } catch (saveErr: any) {
    console.error('Failed to persist administrator to Firestore:', saveErr);
    await auditOperation({
      actingUid: (req as any).user.uid,
      actingEmail: (req as any).user.email,
      targetUid: cleanUid,
      operation: `APPROVE_ADMIN_FAILED:${cleanUid}:${cleanEmail}`,
      status: 'FAILED',
      reason: saveErr.message
    }, callerToken);

    return res.status(500).json({
      error: `Failed to persist administrator to production database '${FIRESTORE_DATABASE_ID}': ${saveErr.message}`
    });
  }

  // Update in-memory cache
  const existingIdx = ADMINS_DIRECTORY.findIndex(a => a.uid === cleanUid);
  if (existingIdx >= 0) {
    ADMINS_DIRECTORY[existingIdx] = newAdminRecord;
  } else {
    ADMINS_DIRECTORY.push(newAdminRecord);
  }

  await auditOperation({
    actingUid: (req as any).user.uid,
    actingEmail: (req as any).user.email,
    targetUid: cleanUid,
    operation: `APPROVE_ADMINISTRATOR_UID:${cleanUid}:${cleanEmail}:${assignedStatus}`,
    status: 'SUCCESS'
  }, callerToken);

  res.status(201).json({
    success: true,
    message: `Administrator '${cleanEmail}' (UID: ${cleanUid}) approved successfully with role '${assignedRole}'.`,
    admin: newAdminRecord
  });
});

// PATCH /api/admin/users/:uid - Update administrator status
app.patch('/api/admin/users/:uid', authenticateSuperAdmin, async (req: Request, res: Response) => {
  const targetUid = req.params.uid;
  const { status, notes } = req.body;
  const callerToken = (req as any).idToken;

  // PROTECT OWNER ACCOUNT: Immutable
  if (targetUid === SUPER_ADMIN_UID) {
    await auditOperation({
      actingUid: (req as any).user.uid,
      actingEmail: (req as any).user.email,
      targetUid,
      operation: `ATTEMPT_MODIFY_SUPER_ADMIN:${status || ''}`,
      status: 'FAILED',
      reason: 'Owner account cannot be modified or suspended'
    }, callerToken);

    return res.status(403).json({ 
      error: 'Forbidden: The Primary Super Administrator (Owner) account cannot be modified, demoted, or suspended.' 
    });
  }

  // Retrieve current record from Firestore
  let targetAdmin: any = null;
  try {
    targetAdmin = await getFirestoreDocument(`cms_admins/${targetUid}`, callerToken);
  } catch (fsErr: any) {
    console.warn('Could not read admin from Firestore for update:', fsErr.message);
  }

  if (!targetAdmin) {
    const memoryIdx = ADMINS_DIRECTORY.findIndex(a => a.uid === targetUid);
    if (memoryIdx >= 0) targetAdmin = { ...ADMINS_DIRECTORY[memoryIdx] };
  }

  if (!targetAdmin) {
    return res.status(404).json({ error: 'Administrator record not found.' });
  }

  // Update fields
  if (status) targetAdmin.status = status;
  if (notes !== undefined) targetAdmin.notes = notes;
  targetAdmin.role = 'Administrator'; // Retain strictly Administrator

  // Persist directly to Firestore. Return error if save fails.
  try {
    await writeFirestoreDocument(`cms_admins/${targetUid}`, targetAdmin, callerToken);
  } catch (saveErr: any) {
    console.error('Failed to update administrator in Firestore:', saveErr);
    await auditOperation({
      actingUid: (req as any).user.uid,
      actingEmail: (req as any).user.email,
      targetUid,
      operation: `UPDATE_ADMIN_FAILED:${targetUid}`,
      status: 'FAILED',
      reason: saveErr.message
    }, callerToken);

    return res.status(500).json({
      error: `Failed to update administrator in database '${FIRESTORE_DATABASE_ID}': ${saveErr.message}`
    });
  }

  // Update in-memory cache
  const targetIndex = ADMINS_DIRECTORY.findIndex(a => a.uid === targetUid);
  if (targetIndex >= 0) {
    ADMINS_DIRECTORY[targetIndex] = targetAdmin;
  }

  await auditOperation({
    actingUid: (req as any).user.uid,
    actingEmail: (req as any).user.email,
    targetUid,
    operation: `UPDATE_ADMINISTRATOR:${targetAdmin.email || targetUid}:${targetAdmin.status}`,
    status: 'SUCCESS'
  }, callerToken);

  res.json({
    success: true,
    message: `Administrator '${targetAdmin.email || targetUid}' status updated to '${targetAdmin.status}'.`,
    admin: targetAdmin
  });
});

// DELETE /api/admin/users/:uid - Revoke administrator access
app.delete('/api/admin/users/:uid', authenticateSuperAdmin, async (req: Request, res: Response) => {
  const targetUid = req.params.uid;
  const callerToken = (req as any).idToken;

  // PROTECT OWNER ACCOUNT
  if (targetUid === SUPER_ADMIN_UID) {
    await auditOperation({
      actingUid: (req as any).user.uid,
      actingEmail: (req as any).user.email,
      targetUid,
      operation: 'ATTEMPT_REVOKE_SUPER_ADMIN',
      status: 'FAILED',
      reason: 'Owner account cannot be revoked'
    }, callerToken);

    return res.status(403).json({ 
      error: 'Forbidden: The Primary Super Administrator (Owner) account cannot be revoked or deleted.' 
    });
  }

  // Retrieve current record
  let targetAdmin: any = null;
  try {
    targetAdmin = await getFirestoreDocument(`cms_admins/${targetUid}`, callerToken);
  } catch (fsErr: any) {
    console.warn('Could not read admin from Firestore for delete:', fsErr.message);
  }

  if (!targetAdmin) {
    const memoryIdx = ADMINS_DIRECTORY.findIndex(a => a.uid === targetUid);
    if (memoryIdx >= 0) targetAdmin = { ...ADMINS_DIRECTORY[memoryIdx] };
  }

  if (!targetAdmin) {
    return res.status(404).json({ error: 'Administrator record not found.' });
  }

  targetAdmin.status = 'Revoked';

  // Persist directly to Firestore
  try {
    await writeFirestoreDocument(`cms_admins/${targetUid}`, targetAdmin, callerToken);
  } catch (saveErr: any) {
    console.error('Failed to revoke administrator in Firestore:', saveErr);
    await auditOperation({
      actingUid: (req as any).user.uid,
      actingEmail: (req as any).user.email,
      targetUid,
      operation: `REVOKE_ADMIN_FAILED:${targetUid}`,
      status: 'FAILED',
      reason: saveErr.message
    }, callerToken);

    return res.status(500).json({
      error: `Failed to record administrator revocation in database '${FIRESTORE_DATABASE_ID}': ${saveErr.message}`
    });
  }

  // Update in-memory cache
  const targetIndex = ADMINS_DIRECTORY.findIndex(a => a.uid === targetUid);
  if (targetIndex >= 0) {
    ADMINS_DIRECTORY[targetIndex] = targetAdmin;
  }

  await auditOperation({
    actingUid: (req as any).user.uid,
    actingEmail: (req as any).user.email,
    targetUid,
    operation: `REVOKE_ADMINISTRATOR:${targetAdmin.email || targetUid}`,
    status: 'SUCCESS'
  }, callerToken);

  res.json({
    success: true,
    message: `Administrator access for '${targetAdmin.email || targetUid}' revoked successfully.`,
    admin: targetAdmin
  });
});

// POST /api/admin/bind-account - Disabled: Enforcing Owner-only direct UID approval
app.post('/api/admin/bind-account', authenticateFirebaseUser, async (_req: Request, res: Response) => {
  return res.status(403).json({
    error: 'Direct self-binding is disabled. Administrator onboarding requires explicit Owner approval of your Firebase Authentication UID in the Super Administrator Console.'
  });
});

// GET /api/admin/audit-logs - Retrieve audit logs
app.get('/api/admin/audit-logs', authenticateSuperAdmin, async (req: Request, res: Response) => {
  const callerToken = (req as any).idToken;
  try {
    let logs: any[] = [];
    try {
      logs = await listFirestoreDocuments('cms_audit_logs', callerToken);
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (e) {
      logs = AUDIT_LOGS;
    }

    res.json({
      success: true,
      logs: logs.length > 0 ? logs : AUDIT_LOGS
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audit logs', details: err.message });
  }
});

// Express static route for PDF file downloads
app.get('/*.pdf', (req: Request, res: Response) => {
  const filename = path.basename(req.path);
  const pdfPath = path.join(__dirname, 'public', filename);
  if (fs.existsSync(pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(pdfPath);
  }
  const assetPath = path.join(__dirname, 'public', 'assets', 'aistudio', filename);
  if (fs.existsSync(assetPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(assetPath);
  }
  return res.status(404).send('PDF document not found');
});

app.use(express.static(path.join(__dirname, 'public')));

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Global error handler for JSON errors
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message || 'An unexpected error occurred',
      path: req.path
    });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
});
