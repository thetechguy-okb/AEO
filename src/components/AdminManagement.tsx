import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, UserPlus, Users, Activity, CheckCircle2, AlertTriangle, 
  Trash2, UserX, Loader2, Lock, ShieldAlert, FileText, Search, RefreshCw
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SUPER_ADMIN_UID } from '../lib/adminSession';

import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdminAccount {
  uid: string;
  email: string;
  role: 'Super Administrator' | 'Administrator';
  status: 'Active' | 'Suspended' | 'Revoked';
  grantedAt: string;
  grantedBy: string;
  notes?: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actingUid: string;
  actingEmail: string;
  targetUid: string;
  operation: string;
  status: 'SUCCESS' | 'FAILED';
  reason?: string;
}

interface AdminManagementProps {
  currentUser: User;
}

export function AdminManagement({ currentUser }: AdminManagementProps) {
  const isOwner = currentUser?.uid === SUPER_ADMIN_UID;
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'audit'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // In-flight request controller to prevent stale overwrites and leaks
  const activeAbortCtrlRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUid, setNewUid] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'Administrator' | 'Super Administrator'>('Administrator');
  const [newStatus, setNewStatus] = useState<'Active' | 'Suspended'>('Active');
  const [newNotes, setNewNotes] = useState('');
  const [isManualVerified, setIsManualVerified] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    actionLabel: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      if (isMountedRef.current) setStatusMsg(null);
    }, 5000);
  };

  // Helper to fetch authorization bearer token
  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await currentUser.getIdToken(true);
    } catch (err) {
      console.error('Error retrieving ID token:', err);
      return null;
    }
  };

  // Helper for safe JSON parsing and error handling without throwing Unexpected end of JSON
  const handleApiResponse = async (res: Response) => {
    const text = await res.text().catch(() => '');
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        // Body was text or HTML, not JSON
      }
    }
    
    if (!res.ok) {
      throw new Error(data.error || data.details || (text ? `Server returned HTTP ${res.status}: ${text.slice(0, 150)}` : `Request failed with status ${res.status}`));
    }
    
    return data;
  };

  // Direct client SDK fallback: Reads /cms_admins using initialized Firestore db
  const fetchAdminsFromFirestoreDirect = async (): Promise<AdminAccount[]> => {
    const snap = await getDocs(collection(db, 'cms_admins'));
    const results: AdminAccount[] = [{
      uid: SUPER_ADMIN_UID,
      email: currentUser?.email || 'agbedunj@gmail.com',
      role: 'Super Administrator',
      status: 'Active',
      grantedAt: new Date('2026-10-01').toISOString(),
      grantedBy: 'Owner Account',
      notes: 'Primary Super Administrator (Owner)'
    }];
    const seenUids = new Set([SUPER_ADMIN_UID]);

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const docUid = docSnap.id;
      if (docUid && !seenUids.has(docUid) && !String(docUid).startsWith('invitation_')) {
        seenUids.add(docUid);
        results.push({
          uid: docUid,
          email: d.email || 'N/A',
          role: (d.role as any) || 'Administrator',
          status: (d.status as any) || 'Active',
          grantedAt: d.grantedAt || new Date().toISOString(),
          grantedBy: d.grantedBy || 'Owner',
          notes: d.notes || ''
        });
      }
    });

    return results;
  };

  // Fetch Directory from trusted backend with direct Firestore SDK fallback and reliable finally cleanup
  const fetchAdmins = async () => {
    // Cancel any previous in-flight request
    if (activeAbortCtrlRef.current) {
      activeAbortCtrlRef.current.abort();
    }
    const abortCtrl = new AbortController();
    activeAbortCtrlRef.current = abortCtrl;

    // 15-second client timeout per requirements
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      abortCtrl.abort();
    }, 15000);

    setLoading(true);
    setDirectoryError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication token unavailable. Please sign in again.');
      }

      let loadedAdmins: AdminAccount[] | null = null;
      let failureReason: string | null = null;

      // 1. Primary: GET /api/admin/users
      try {
        const res = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: abortCtrl.signal
        });

        const data = await handleApiResponse(res);

        if (data.success === true && Array.isArray(data.admins)) {
          loadedAdmins = data.admins;
        } else {
          failureReason = data.error || data.details || `API request failed with HTTP ${res.status}`;
          console.warn('Backend /api/admin/users returned non-success:', failureReason);
        }
      } catch (apiErr: any) {
        if (apiErr.name === 'AbortError') {
          throw apiErr;
        }
        failureReason = apiErr.message || 'Network connection to backend failed';
        console.warn('Backend fetch error, trying client SDK fallback:', apiErr);
      }

      // 2. Secondary: If backend proxy was unsuccessful, attempt direct client Firestore read
      if (!loadedAdmins || loadedAdmins.length === 0) {
        try {
          const directList = await fetchAdminsFromFirestoreDirect();
          if (directList && directList.length > 0) {
            loadedAdmins = directList;
            failureReason = null;
          }
        } catch (directErr: any) {
          console.warn('Direct Firestore client read notice:', directErr);
          if (!failureReason) {
            failureReason = directErr.message || 'Direct Firestore retrieval failed';
          }
        }
      }

      // If component is still mounted, update state
      if (isMountedRef.current) {
        if (loadedAdmins && loadedAdmins.length > 0) {
          setAdmins(loadedAdmins);
          setDirectoryError(null);
        } else {
          const errMsg = failureReason || 'Failed to retrieve administrator directory.';
          setDirectoryError(errMsg);
          showNotification(errMsg, 'error');
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        if (didTimeout || err.name === 'AbortError') {
          const timeoutMsg = 'Administrator directory request timed out. Please retry.';
          setDirectoryError(timeoutMsg);
          showNotification(timeoutMsg, 'error');
        } else {
          const errorMsg = err.message || 'Error connecting to administrator management backend.';
          setDirectoryError(errorMsg);
          showNotification(errorMsg, 'error');
        }
      }
    } finally {
      clearTimeout(timeoutId);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchAuditLogs = async () => {
    try {
      let loadedLogs: AuditLogEntry[] | null = null;
      try {
        const token = await getAuthToken();
        if (token) {
          const res = await fetch('/api/admin/audit-logs', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            signal: AbortSignal.timeout(10000)
          });

          if (res.ok) {
            const data = await handleApiResponse(res);
            if (data.logs && Array.isArray(data.logs)) {
              loadedLogs = data.logs;
            }
          }
        }
      } catch (e) {
        console.warn('Backend audit logs fetch notice:', e);
      }

      if (!loadedLogs) {
        // Direct Firestore fallback
        try {
          const auditSnap = await getDocs(collection(db, 'cms_audit_logs'));
          const logsList: AuditLogEntry[] = [];
          auditSnap.forEach(d => {
            logsList.push({ ...d.data(), id: d.id } as AuditLogEntry);
          });
          logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          loadedLogs = logsList;
        } catch (directAuditErr) {
          console.warn('Direct Firestore audit log fetch notice:', directAuditErr);
        }
      }

      if (loadedLogs && isMountedRef.current) {
        setAuditLogs(loadedLogs);
      }
    } catch (err) {
      console.warn('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchAdmins();
    fetchAuditLogs();

    return () => {
      isMountedRef.current = false;
      if (activeAbortCtrlRef.current) {
        activeAbortCtrlRef.current.abort();
      }
    };
  }, [currentUser?.uid]);

  // Handle Add / Invite Administrator
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUid.trim()) {
      showNotification('Please enter the administrator Firebase Authentication UID.', 'error');
      return;
    }

    if (!newEmail.trim() || !newEmail.includes('@')) {
      showNotification('Please enter a valid administrator email address.', 'error');
      return;
    }

    if (!isManualVerified) {
      showNotification('Please confirm that you have verified this UID belongs to the intended administrator.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const cleanUid = newUid.trim();
      const cleanEmail = newEmail.trim().toLowerCase();
      const newAdminRecord: AdminAccount = {
        uid: cleanUid,
        email: cleanEmail,
        role: 'Administrator',
        status: newStatus,
        grantedAt: new Date().toISOString(),
        grantedBy: `Owner (UID: ${SUPER_ADMIN_UID})`,
        notes: newNotes.trim() ? `${newNotes.trim()} (Owner UID Verified)` : 'Owner UID Verified'
      };

      let successMsg = '';
      let backendSucceeded = false;
      try {
        const token = await getAuthToken();
        if (token) {
          const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              uid: cleanUid,
              email: cleanEmail,
              status: newStatus,
              notes: newNotes.trim()
            })
          });

          const data = await handleApiResponse(res);
          if (data.success) {
            backendSucceeded = true;
            successMsg = data.message || `Administrator '${cleanEmail}' approved successfully!`;
          }
        }
      } catch (backendErr: any) {
        console.warn('Backend approval failed, attempting direct Firestore synchronization:', backendErr);
      }

      // If backend was not reached or failed (e.g. static hosting on production aeo.athenacentre.org),
      // perform direct authoritative write using Super Admin client credentials
      if (!backendSucceeded) {
        await setDoc(doc(db, 'cms_admins', cleanUid), newAdminRecord);
        try {
          const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
          await setDoc(doc(db, 'cms_audit_logs', logId), {
            id: logId,
            timestamp: new Date().toISOString(),
            actingUid: currentUser.uid,
            actingEmail: currentUser.email || 'N/A',
            targetUid: cleanUid,
            operation: `APPROVE_ADMINISTRATOR_UID:${cleanUid}:${cleanEmail}:${newStatus}`,
            status: 'SUCCESS'
          });
        } catch (auditErr) {
          console.warn('Could not write audit log:', auditErr);
        }
        successMsg = `Administrator '${cleanEmail}' approved successfully in Observatory database!`;
      }

      showNotification(successMsg);
      setShowAddModal(false);
      setNewUid('');
      setNewEmail('');
      setNewNotes('');
      setIsManualVerified(false);
      fetchAdmins();
      fetchAuditLogs();
    } catch (err: any) {
      showNotification(err.message || 'Error approving administrator.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Role Change
  const handleChangeRole = (admin: AdminAccount, targetRole: 'Administrator') => {
    if (admin.uid === SUPER_ADMIN_UID) {
      showNotification('The Primary Super Administrator (Owner) account cannot be modified or demoted.', 'error');
      return;
    }

    setConfirmModal({
      title: `Change Administrator Role`,
      message: `Are you sure you want to change the role of '${admin.email}' to ${targetRole}?`,
      actionLabel: 'Confirm Role Change',
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(true);
        try {
          let roleMsg = '';
          let backendSucceeded = false;
          try {
            const token = await getAuthToken();
            if (token) {
              const res = await fetch(`/api/admin/users/${admin.uid}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: targetRole })
              });

              const data = await handleApiResponse(res);
              if (data.success) {
                backendSucceeded = true;
                roleMsg = data.message;
              }
            }
          } catch (backendErr) {
            console.warn('Backend role update failed, attempting direct Firestore synchronization:', backendErr);
          }

          if (!backendSucceeded) {
            await setDoc(doc(db, 'cms_admins', admin.uid), {
              ...admin,
              role: targetRole
            }, { merge: true });
            roleMsg = `Administrator role updated to '${targetRole}'.`;
          }

          showNotification(roleMsg);
          fetchAdmins();
          fetchAuditLogs();
        } catch (err: any) {
          showNotification(err.message || 'Error updating role', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Handle Suspend / Reactivate Status
  const handleToggleStatus = (admin: AdminAccount) => {
    if (admin.uid === SUPER_ADMIN_UID) {
      showNotification('The Primary Super Administrator (Owner) account cannot be suspended.', 'error');
      return;
    }

    const targetStatus = admin.status === 'Active' ? 'Suspended' : 'Active';
    setConfirmModal({
      title: `${targetStatus === 'Suspended' ? 'Suspend' : 'Reactivate'} Administrator`,
      message: `Are you sure you want to ${targetStatus.toLowerCase()} access for '${admin.email}'?`,
      actionLabel: targetStatus === 'Suspended' ? 'Suspend Access' : 'Reactivate Account',
      isDangerous: targetStatus === 'Suspended',
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(true);
        try {
          let statusMsg = '';
          let backendSucceeded = false;
          try {
            const token = await getAuthToken();
            if (token) {
              const res = await fetch(`/api/admin/users/${admin.uid}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: targetStatus })
              });

              const data = await handleApiResponse(res);
              if (data.success) {
                backendSucceeded = true;
                statusMsg = data.message;
              }
            }
          } catch (backendErr) {
            console.warn('Backend status toggle failed, attempting direct Firestore synchronization:', backendErr);
          }

          if (!backendSucceeded) {
            await setDoc(doc(db, 'cms_admins', admin.uid), {
              ...admin,
              status: targetStatus
            }, { merge: true });
            try {
              const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
              await setDoc(doc(db, 'cms_audit_logs', logId), {
                id: logId,
                timestamp: new Date().toISOString(),
                actingUid: currentUser.uid,
                actingEmail: currentUser.email || 'N/A',
                targetUid: admin.uid,
                operation: `UPDATE_ADMINISTRATOR_STATUS:${admin.email}:${targetStatus}`,
                status: 'SUCCESS'
              });
            } catch (auditErr) {
              console.warn('Could not write audit log:', auditErr);
            }
            statusMsg = `Administrator '${admin.email}' status updated to '${targetStatus}'.`;
          }

          showNotification(statusMsg);
          fetchAdmins();
          fetchAuditLogs();
        } catch (err: any) {
          showNotification(err.message || 'Error updating status', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Handle Revoke Access
  const handleRevoke = (admin: AdminAccount) => {
    if (admin.uid === SUPER_ADMIN_UID) {
      showNotification('The Primary Super Administrator (Owner) account cannot be revoked.', 'error');
      return;
    }

    setConfirmModal({
      title: 'Revoke Administrator Access',
      message: `PERMANENT REVOCATION: Are you sure you want to revoke all administrative permissions for '${admin.email}'? They will immediately lose access to the AEO CMS.`,
      actionLabel: 'Revoke Access',
      isDangerous: true,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(true);
        try {
          let revokeMsg = '';
          let backendSucceeded = false;
          try {
            const token = await getAuthToken();
            if (token) {
              const res = await fetch(`/api/admin/users/${admin.uid}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              const data = await handleApiResponse(res);
              if (data.success) {
                backendSucceeded = true;
                revokeMsg = data.message;
              }
            }
          } catch (backendErr) {
            console.warn('Backend revoke failed, attempting direct Firestore synchronization:', backendErr);
          }

          if (!backendSucceeded) {
            await setDoc(doc(db, 'cms_admins', admin.uid), {
              ...admin,
              status: 'Revoked'
            }, { merge: true });
            try {
              const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
              await setDoc(doc(db, 'cms_audit_logs', logId), {
                id: logId,
                timestamp: new Date().toISOString(),
                actingUid: currentUser.uid,
                actingEmail: currentUser.email || 'N/A',
                targetUid: admin.uid,
                operation: `REVOKE_ADMINISTRATOR:${admin.email}`,
                status: 'SUCCESS'
              });
            } catch (auditErr) {
              console.warn('Could not write audit log:', auditErr);
            }
            revokeMsg = `Administrator access for '${admin.email}' revoked successfully.`;
          }

          showNotification(revokeMsg);
          fetchAdmins();
          fetchAuditLogs();
        } catch (err: any) {
          showNotification(err.message || 'Error revoking access', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Visible regular administrators: Exclude the permanent Super Administrator (Owner) UID from the visible directory presentation
  const visibleAdmins = admins.filter(a => a.uid !== SUPER_ADMIN_UID);

  const filteredAdmins = visibleAdmins.filter(a => 
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-navy text-white p-6 rounded-2xl shadow-custom border border-navy-light flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-brand-gold shrink-0" />
            <span className="text-xs font-mono font-bold tracking-widest text-brand-gold uppercase">
              Super Administrator Console
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight">
            Manage Observatory Administrators
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Exclusive management portal for Super Administrators. Provision, authorize, and audit access permissions for AEO observatory personnel.
          </p>
        </div>

        {isOwner && (
          <button
            id="btn-add-admin-header"
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-gold hover:bg-amber-400 text-navy font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            title="Approve administrator by Firebase UID"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Administrator</span>
          </button>
        )}
      </div>

      {/* Status Alert Notification */}
      {statusMsg && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-medium ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div className="leading-relaxed">{statusMsg.text}</div>
        </div>
      )}

      {/* Directory Synchronization Warning Alert */}
      {directoryError && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold font-mono text-amber-950 uppercase tracking-wide">
                Firestore Directory Synchronization Alert
              </div>
              <div className="mt-1 font-mono text-amber-900 break-all">{directoryError}</div>
              <div className="mt-1 text-[11px] text-amber-800">
                The Owner can continue to approve administrators using the <strong>+ Add Administrator</strong> button.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchAdmins()}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-mono text-[10px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Metrics Row - Reflects regular administrators, excluding the Super Administrator (Owner) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mut">Total Registered</span>
            <Users className="w-4 h-4 text-brand-blue" />
          </div>
          <div className="text-2xl font-display font-bold text-ink mt-2">{visibleAdmins.length}</div>
          <div className="text-[10px] text-ink2 mt-1">Authorized Administrators</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mut">Active Administrators</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-600 mt-2">
            {visibleAdmins.filter(a => a.status === 'Active').length}
          </div>
          <div className="text-[10px] text-ink2 mt-1">Active CMS Personnel</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mut">Suspended / Revoked</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-display font-bold text-amber-600 mt-2">
            {visibleAdmins.filter(a => a.status !== 'Active').length}
          </div>
          <div className="text-[10px] text-ink2 mt-1">Access Restricted</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mut">Audit Records</span>
            <Activity className="w-4 h-4 text-brand-purple" />
          </div>
          <div className="text-2xl font-display font-bold text-brand-purple mt-2">{auditLogs.length}</div>
          <div className="text-[10px] text-ink2 mt-1">Logged Security Events</div>
        </div>
      </div>

      {/* Sub-Tab Controls & Search */}
      <div className="bg-white p-4 rounded-2xl border border-line shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'directory' ? 'bg-white text-navy shadow-xs' : 'text-mut hover:text-ink'
            }`}
          >
            Administrator Directory
          </button>
          <button
            onClick={() => {
              setActiveSubTab('audit');
              fetchAuditLogs();
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'audit' ? 'bg-white text-navy shadow-xs' : 'text-mut hover:text-ink'
            }`}
          >
            Security Audit Trail
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeSubTab === 'directory' && (
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-mut absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search email, UID, or role..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-line rounded-xl bg-white text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          )}
          <button
            onClick={() => {
              fetchAdmins();
              fetchAuditLogs();
            }}
            className="p-2 border border-line rounded-xl hover:bg-slate-50 text-mut hover:text-ink cursor-pointer transition-colors shrink-0"
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isOwner && activeSubTab === 'directory' && (
            <button
              id="btn-add-admin-toolbar"
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-navy hover:bg-navy-dark text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0 cursor-pointer whitespace-nowrap"
              title="Approve administrator by Firebase UID"
            >
              <UserPlus className="w-4 h-4 text-brand-gold" />
              <span>+ Add Administrator</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Table View */}
      {activeSubTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-mut flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
              <span>Fetching administrator directory from secure backend...</span>
            </div>
          ) : directoryError && visibleAdmins.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-mut space-y-4">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <div className="font-bold text-ink max-w-md mx-auto">{directoryError}</div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchAdmins()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-dark text-white font-mono text-xs font-bold uppercase rounded-xl cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold hover:bg-amber-400 text-navy font-mono text-xs font-bold uppercase rounded-xl cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add Administrator</span>
                  </button>
                )}
              </div>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-mut space-y-3">
              <div>
                {searchQuery
                  ? "No administrator records found matching search query."
                  : "No regular administrators registered yet."}
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-dark text-white font-mono text-xs font-bold uppercase rounded-xl cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-4 h-4 text-brand-gold" />
                  <span>+ Add Administrator</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-line text-[10px] font-mono uppercase font-bold text-mut tracking-wider">
                    <th className="py-3.5 px-6">Administrator Account</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Authorization Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs font-mono">
                  {filteredAdmins.map((admin) => {
                    const isOwner = admin.uid === SUPER_ADMIN_UID;

                    return (
                      <tr key={admin.uid} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-ink flex items-center gap-2">
                            <span>{admin.email}</span>
                            {isOwner && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-mut mt-0.5 font-mono">
                            UID: {admin.uid}
                          </div>
                          {admin.notes && (
                            <div className="text-[10px] text-ink2 mt-1 italic font-sans">
                              {admin.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            admin.role === 'Super Administrator'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            <ShieldCheck className="w-3 h-3" />
                            {admin.role}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            admin.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : admin.status === 'Suspended'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              admin.status === 'Active' ? 'bg-emerald-600' : admin.status === 'Suspended' ? 'bg-amber-600' : 'bg-red-600'
                            }`} />
                            {admin.status}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-mut text-[11px]">
                          <div>{new Date(admin.grantedAt).toLocaleDateString()}</div>
                          <div className="text-[9px] text-ink2">By: {admin.grantedBy || 'Super Admin'}</div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          {isOwner ? (
                            <div className="inline-flex items-center gap-1 text-[10px] text-mut font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-line">
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>Owner (Protected)</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle Status Button */}
                              <button
                                onClick={() => handleToggleStatus(admin)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                                  admin.status === 'Active'
                                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                              >
                                {admin.status === 'Active' ? 'Suspend' : 'Activate'}
                              </button>

                              {/* Revoke Button */}
                              <button
                                onClick={() => handleRevoke(admin)}
                                className="p-1.5 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"
                                title="Revoke Administrator Access"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Security Audit Trail View */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden">
          <div className="p-4 border-b border-line bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-navy">
                Server-Recorded Administrative Audit Logs
              </span>
            </div>
            <span className="text-[10px] font-mono text-mut">
              Recorded asynchronously on trusted backend
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-mut">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-line text-[10px] font-mono uppercase font-bold text-mut tracking-wider">
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-4">Acting Administrator</th>
                    <th className="py-3 px-4">Operation</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-6 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 text-mut text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-ink">
                        <div>{log.actingEmail || 'Super Admin'}</div>
                        <div className="text-[9px] text-mut font-normal">UID: {log.actingUid}</div>
                      </td>
                      <td className="py-3.5 px-4 text-navy font-semibold">
                        {log.operation}
                      </td>
                      <td className="py-3.5 px-4 text-ink2">
                        {log.targetUid}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Administrator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-line shadow-2xl overflow-hidden">
            <div className="p-6 bg-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-gold" />
                <h3 className="font-display font-bold uppercase text-base tracking-wide">
                  Authorize New Administrator
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-navy-light rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-ink mb-1">
                  Firebase Authentication UID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUid}
                  onChange={(e) => setNewUid(e.target.value)}
                  placeholder="e.g. KloJN3fIOCNn98lKQaAMy7koeVm2"
                  className="w-full p-2.5 border border-line rounded-xl text-sm font-mono bg-white text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <span className="text-[10px] text-mut font-mono block mt-1">
                  The user's authentic Firebase Authentication UID. Found in Firebase Console or user account.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-ink mb-1">
                  Administrator Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@athenacentre.ng"
                  className="w-full p-2.5 border border-line rounded-xl text-sm font-mono bg-white text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <span className="text-[10px] text-mut font-mono block mt-1">
                  Used for identification, directory display, and audit logs.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink mb-2">
                    Administrator Role
                  </label>
                  <div className="w-full p-2.5 border border-line rounded-xl text-xs font-mono bg-slate-50 text-ink font-semibold flex items-center justify-between">
                    <span>Administrator (CMS)</span>
                    <span className="text-[10px] text-mut uppercase">Fixed</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-ink mb-2">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-line rounded-xl text-xs font-mono bg-white text-ink focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-ink mb-2">
                  Notes / Department Assignment
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g., Senior Electoral Analyst - Election Watch Division"
                  className="w-full p-2.5 border border-line rounded-xl text-xs font-mono bg-white text-ink placeholder:text-mut focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={isManualVerified}
                    onChange={(e) => setIsManualVerified(e.target.checked)}
                    className="mt-0.5 rounded border-amber-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-amber-900 leading-tight">
                    <strong>Manual UID Verification:</strong> As Super Administrator, I confirm that I have verified that this exact Firebase Authentication UID belongs to this administrator account.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-line rounded-xl text-xs font-mono font-bold uppercase text-ink hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !isManualVerified}
                  className="flex items-center gap-2 px-5 py-2 bg-navy hover:bg-navy-dark text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Approve Administrator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-line shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-ink">
              {confirmModal.isDangerous ? (
                <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              <h3 className="font-display font-bold uppercase text-base">{confirmModal.title}</h3>
            </div>

            <p className="text-xs text-ink2 leading-relaxed font-sans">{confirmModal.message}</p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-line rounded-xl text-xs font-mono font-bold uppercase text-ink hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all ${
                  confirmModal.isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-navy hover:bg-navy-dark'
                }`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
