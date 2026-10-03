import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/core/supabase/client';
import { Panel } from '@/components/ui/Card';
import { TextField, Select } from '@/components/ui/Fields';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Building2, Briefcase, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface GovAccessRequest {
  id: string;
  user_id: string;
  employee_id: string;
  department: string;
  designation: string;
  official_email: string;
  state: string;
  district: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_role: string;
  created_at: string;
  reviewed_at?: string;
  user_profile?: {
    full_name?: string;
    phone?: string;
  };
}

interface ContractorAccessRequest {
  id: string;
  user_id: string;
  company_name: string;
  registration_cin: string;
  gstin: string;
  contractor_class: string;
  state: string;
  district: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_role: string;
  created_at: string;
  reviewed_at?: string;
  user_profile?: {
    full_name?: string;
  };
}

export function AccessRequestsPage() {
  const [activeTab, setActiveTab] = useState<'government' | 'contractor'>('government');
  const [govRequests, setGovRequests] = useState<GovAccessRequest[]>([]);
  const [contractorRequests, setContractorRequests] = useState<ContractorAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Role selections per card
  const [selectedGovRoles, setSelectedGovRoles] = useState<Record<string, string>>({});
  const [selectedContractorRoles, setSelectedContractorRoles] = useState<Record<string, string>>({});

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch government requests
      const { data: rawGov, error: rawGovErr } = await supabase
        .from('government_access_requests')
        .select('id, user_id, employee_id, department, designation, official_email, state, district, status, requested_role, created_at, reviewed_at')
        .order('created_at', { ascending: false });

      if (rawGovErr) throw rawGovErr;

      const govUserIds = Array.from(new Set((rawGov || []).map((r: any) => r.user_id).filter(Boolean)));
      const govProfileMap: Record<string, { full_name?: string; phone?: string }> = {};

      if (govUserIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', govUserIds);

        (profs || []).forEach((p: any) => {
          govProfileMap[p.id] = { full_name: p.full_name, phone: p.phone };
        });
      }

      const formattedGov: GovAccessRequest[] = (rawGov || []).map((r: any) => ({
        ...r,
        user_profile: govProfileMap[r.user_id] || { full_name: r.official_email?.split('@')[0] },
      }));
      setGovRequests(formattedGov);

      // Fetch contractor requests
      const { data: rawCon, error: rawConErr } = await supabase
        .from('contractor_access_requests')
        .select('id, user_id, company_name, registration_cin, gstin, contractor_class, state, district, phone, status, requested_role, created_at, reviewed_at')
        .order('created_at', { ascending: false });

      if (rawConErr) throw rawConErr;

      const conUserIds = Array.from(new Set((rawCon || []).map((r: any) => r.user_id).filter(Boolean)));
      const conProfileMap: Record<string, { full_name?: string }> = {};

      if (conUserIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', conUserIds);

        (profs || []).forEach((p: any) => {
          conProfileMap[p.id] = { full_name: p.full_name };
        });
      }

      const formattedCon: ContractorAccessRequest[] = (rawCon || []).map((r: any) => ({
        ...r,
        user_profile: conProfileMap[r.user_id] || { full_name: r.company_name },
      }));
      setContractorRequests(formattedCon);
    } catch (err: any) {
      console.error('Failed to load access requests:', err);
      setError(err.message || 'Failed to load access requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApproveGov = async (requestId: string, requestedRole: string) => {
    const roleToGrant = selectedGovRoles[requestId] || requestedRole || 'government_engineer';
    try {
      setActionLoading(requestId);
      setError(null);
      setSuccessMsg(null);

      const { error: rpcErr } = await (supabase.rpc as any)('approve_government_access_request', {
        request_id: requestId,
        approved_role: roleToGrant,
      });

      if (rpcErr) throw rpcErr;

      setSuccessMsg(`Government request approved successfully with role: ${roleToGrant}`);
      await loadRequests();
    } catch (err: any) {
      console.error('Error approving government request:', err);
      setError(err.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveContractor = async (requestId: string, requestedRole: string) => {
    const roleToGrant = selectedContractorRoles[requestId] || requestedRole || 'contractor_admin';
    try {
      setActionLoading(requestId);
      setError(null);
      setSuccessMsg(null);

      const { error: rpcErr } = await (supabase.rpc as any)('approve_contractor_access_request', {
        request_id: requestId,
        approved_role: roleToGrant,
      });

      if (rpcErr) throw rpcErr;

      setSuccessMsg(`Contractor request approved successfully. Organization verified and user active.`);
      await loadRequests();
    } catch (err: any) {
      console.error('Error approving contractor request:', err);
      setError(err.message || 'Contractor approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string, type: 'government' | 'contractor') => {
    try {
      setActionLoading(requestId);
      setError(null);
      setSuccessMsg(null);

      const { error: rpcErr } = await (supabase.rpc as any)('reject_access_request', {
        p_request_id: requestId,
        p_type: type,
        p_reason: 'Application rejected by Government Authority Administrator',
      });

      if (rpcErr) throw rpcErr;

      setSuccessMsg(`${type === 'government' ? 'Government' : 'Contractor'} access request rejected.`);
      await loadRequests();
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered Gov Requests
  const filteredGov = useMemo(() => {
    return govRequests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        const name = (r.user_profile?.full_name || '').toLowerCase();
        const email = (r.official_email || '').toLowerCase();
        const emp = (r.employee_id || '').toLowerCase();
        const dept = (r.department || '').toLowerCase();
        if (!name.includes(query) && !email.includes(query) && !emp.includes(query) && !dept.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [govRequests, statusFilter, search]);

  // Filtered Contractor Requests
  const filteredContractors = useMemo(() => {
    return contractorRequests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        const company = (r.company_name || '').toLowerCase();
        const name = (r.user_profile?.full_name || '').toLowerCase();
        const cin = (r.registration_cin || '').toLowerCase();
        const gstin = (r.gstin || '').toLowerCase();
        if (!company.includes(query) && !name.includes(query) && !cin.includes(query) && !gstin.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [contractorRequests, statusFilter, search]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-primary-strong" />
            Access Requests & Clearances
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Review and grant authorized credentials for Pune Infrastructure Monitoring Authority officers and verified contractors.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => loadRequests()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('government')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'government'
              ? 'border-primary-strong text-primary-strong'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Government Requests
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-surface-2 text-fg-muted font-mono">
            {govRequests.filter((r) => r.status === 'PENDING').length} pending
          </span>
        </button>

        <button
          onClick={() => setActiveTab('contractor')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'contractor'
              ? 'border-primary-strong text-primary-strong'
              : 'border-transparent text-fg-muted hover:text-fg'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Contractor Requests
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-surface-2 text-fg-muted font-mono">
            {contractorRequests.filter((r) => r.status === 'PENDING').length} pending
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <TextField
            label="Search Applicants"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'government' ? 'Search by name, email, employee ID...' : 'Search by company, GSTIN, CIN...'}
            startIcon="search"
          />
        </div>
        <div>
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending Approval' },
              { value: 'APPROVED', label: 'Approved / Active' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-fg-muted">
          <div className="w-8 h-8 rounded-full border-2 border-primary-strong border-t-transparent animate-spin" />
          <span className="text-sm font-medium">Loading clearance requests…</span>
        </div>
      ) : activeTab === 'government' ? (
        filteredGov.length === 0 ? (
          <Panel title="Government Clearance Requests" bodyClassName="p-12 text-center text-fg-muted">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-semibold text-fg">No Government requests found</h3>
            <p className="text-xs text-fg-muted mt-1">There are no matching Government access requests in this view.</p>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredGov.map((req) => {
              const isPending = req.status === 'PENDING';
              const isActioning = actionLoading === req.id;
              const currentRole = selectedGovRoles[req.id] || req.requested_role || 'government_engineer';

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-surface-1 border border-border hover:border-border-strong transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          req.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface-2 text-fg-muted border border-border">
                        Role: {req.requested_role}
                      </span>
                      <span className="text-xs text-fg-subtle flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(req.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-fg">
                        {req.user_profile?.full_name || 'Government Officer'}
                      </h3>
                      <div className="text-xs text-fg-muted flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span>Email: <strong className="text-fg">{req.official_email}</strong></span>
                        <span>Employee ID: <strong className="font-mono text-fg">{req.employee_id}</strong></span>
                        <span>Jurisdiction: <strong className="text-fg">{req.district}, {req.state}</strong></span>
                      </div>
                    </div>

                    <div className="text-xs text-fg-subtle flex items-center gap-2 bg-surface-0/60 p-2.5 rounded-lg border border-border/50">
                      <Building2 className="w-4 h-4 text-primary-strong shrink-0" />
                      <span>{req.department} • <span className="font-medium text-fg">{req.designation}</span></span>
                    </div>
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                      <div className="w-full sm:w-48">
                        <Select
                          label="Grant Role"
                          value={currentRole}
                          onChange={(e) =>
                            setSelectedGovRoles((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          options={[
                            { value: 'government_engineer', label: 'Government Engineer' },
                            { value: 'project_officer', label: 'Project Officer' },
                            { value: 'chief_engineer', label: 'Chief Engineer' },
                            { value: 'auditor', label: 'Auditor' },
                            { value: 'government_admin', label: 'Government Admin' },
                          ]}
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-auto">
                        <Button
                          variant="primary"
                          onClick={() => handleApproveGov(req.id, req.requested_role)}
                          disabled={isActioning}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(req.id, 'government')}
                          disabled={isActioning}
                          className="flex-1 sm:flex-initial text-red-500 border-red-500/30 hover:bg-red-500/10 inline-flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        filteredContractors.length === 0 ? (
          <Panel title="Contractor Clearance Requests" bodyClassName="p-12 text-center text-fg-muted">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-semibold text-fg">No Contractor requests found</h3>
            <p className="text-xs text-fg-muted mt-1">There are no matching Contractor access requests in this view.</p>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredContractors.map((req) => {
              const isPending = req.status === 'PENDING';
              const isActioning = actionLoading === req.id;
              const currentRole = selectedContractorRoles[req.id] || req.requested_role || 'contractor_admin';

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-surface-1 border border-border hover:border-border-strong transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          req.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface-2 text-fg-muted border border-border">
                        Class: {req.contractor_class}
                      </span>
                      <span className="text-xs text-fg-subtle flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(req.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-fg">
                        {req.company_name}
                      </h3>
                      <div className="text-xs text-fg-muted flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span>Representative: <strong className="text-fg">{req.user_profile?.full_name || 'Primary Representative'}</strong></span>
                        <span>GSTIN: <strong className="font-mono text-fg">{req.gstin}</strong></span>
                        <span>CIN / Reg: <strong className="font-mono text-fg">{req.registration_cin}</strong></span>
                      </div>
                    </div>

                    <div className="text-xs text-fg-subtle flex items-center gap-2 bg-surface-0/60 p-2.5 rounded-lg border border-border/50">
                      <Briefcase className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Location: <span className="font-medium text-fg">{req.district}, {req.state}</span> • Phone: <span className="font-medium text-fg">{req.phone}</span></span>
                    </div>
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                      <div className="w-full sm:w-48">
                        <Select
                          label="Grant Role"
                          value={currentRole}
                          onChange={(e) =>
                            setSelectedContractorRoles((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          options={[
                            { value: 'contractor_admin', label: 'Contractor Admin' },
                            { value: 'contractor_manager', label: 'Project Manager' },
                            { value: 'contractor_engineer', label: 'Site Engineer' },
                          ]}
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-auto">
                        <Button
                          variant="primary"
                          onClick={() => handleApproveContractor(req.id, req.requested_role)}
                          disabled={isActioning}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Verify & Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(req.id, 'contractor')}
                          disabled={isActioning}
                          className="flex-1 sm:flex-initial text-red-500 border-red-500/30 hover:bg-red-500/10 inline-flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
