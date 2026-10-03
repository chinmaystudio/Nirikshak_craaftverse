import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ToastItem } from '../components/ui';
import {
  INITIAL_NOTIFICATIONS, INITIAL_WORKERS, INITIAL_RESOURCES, INITIAL_INVOICES,
  INITIAL_REPORTS, INITIAL_MESSAGES, INITIAL_DOCS, INITIAL_BIDS,
} from './data';
import type {
  Notification, Worker, ResourceRow, Invoice, ProgressReport, Message,
  ProjectDoc, Bid, Project,
} from './data';
import { uid } from './utils';
import { PROJECTS } from './data';
import { normalizeProjectStatus } from '@/core/status/projectStatus';
import { useAuth } from '@/core/auth/useAuth';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_USE_MOCK_API === 'true';

interface A11y {
  hc: boolean;
  rm: boolean;
  ul: boolean;
}

interface Store {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  fontScale: number;
  stepFont: (dir: 1 | -1) => void;
  a11y: A11y;
  toggleA11y: (k: keyof A11y) => void;
  lang: string;
  setLang: (l: string) => void;

  toasts: ToastItem[];
  toast: (type: ToastItem['type'], title: string, msg?: string) => void;
  dismissToast: (id: number) => void;

  notifications: Notification[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;

  projects: Project[];
  reports: ProgressReport[];
  addReport: (r: Omit<ProgressReport, 'id' | 'submittedAt'>) => string;
  setReportStatus: (id: string, status: ProgressReport['status'], note?: string) => void;

  workers: Record<string, Worker[]>;
  addWorker: (projectId: string, w: Omit<Worker, 'id'>) => void;
  updateWorker: (projectId: string, w: Worker) => void;
  removeWorker: (projectId: string, id: string) => void;

  resources: Record<string, ResourceRow[]>;
  addResource: (projectId: string, r: Omit<ResourceRow, 'id'>) => void;

  invoices: Invoice[];
  addInvoice: (i: Omit<Invoice, 'id'>) => void;
  submitInvoice: (id: string) => void;

  messages: Record<string, Message[]>;
  sendMessage: (m: Omit<Message, 'id' | 'ts' | 'status'>) => void;

  documents: Record<string, ProjectDoc[]>;
  addDocument: (projectId: string, d: Omit<ProjectDoc, 'id' | 'uploaded' | 'by'>) => void;

  bids: Record<string, Bid>;
  saveBidDraft: (tenderId: string, step: number, data: Record<string, unknown>) => void;
  submitBid: (tenderId: string, bidValue: number) => string;

  savedTenders: string[];
  toggleSaveTender: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside provider');
  return c;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('nrk-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nrk-theme', theme);
    return () => {
      // Clean up when navigating away from contractor portal
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('nrk-font')) || 1);
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
    localStorage.setItem('nrk-font', String(fontScale));
  }, [fontScale]);

  const [a11y, setA11y] = useState<A11y>(() => (localStorage.getItem('nrk-a11y') ? JSON.parse(localStorage.getItem('nrk-a11y')!) : { hc: false, rm: false, ul: false }));
  useEffect(() => {
    document.body.classList.toggle('hc', a11y.hc);
    document.body.classList.toggle('rm', a11y.rm);
    document.body.classList.toggle('ul', a11y.ul);
    localStorage.setItem('nrk-a11y', JSON.stringify(a11y));
  }, [a11y]);

  const [lang, setLang] = useState('English');

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (type: ToastItem['type'], title: string, msg?: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-4), { id, type, title, msg }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
    },
    []
  );

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const markRead = useCallback((id: string) => setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n))), []);
  const markAllRead = useCallback(() => setNotifications((ns) => ns.map((n) => ({ ...n, read: true }))), []);
  const unread = notifications.filter((n) => !n.read).length;

  const [projects, setProjects] = useState<Project[]>([]);


  useEffect(() => {
    let isMounted = true;
    async function loadLiveContractorProjects() {
      try {
        const { supabase } = await import('@/core/supabase/client');
        const { data, error } = await supabase
          .from('contractor_assigned_projects_view')
          .select('*')
          .order('total_cost_inr_crore', { ascending: false, nullsFirst: false })
          .limit(100);

        let records: any[] = (data as any[]) || [];

        if (records && records.length > 0 && isMounted) {
          const liveProjects: Project[] = records.map((p: any) => {
            const cost = Number(p.contract_value ?? p.total_cost_inr_crore) || 0;
            const progress = Number(p.physical_progress_percent) || 0;
            const sharedStatus = normalizeProjectStatus(p.normalized_status);
            const status: Project['status'] = sharedStatus === 'completed' ? 'Completed' : sharedStatus === 'delayed' ? 'Delayed' : sharedStatus === 'at_risk' ? 'At Risk' : 'Active';

            const projId = p.nirikshak_project_id || p.id;
            return {
              id: p.id || projId,
              code: projId,
              name: p.project_name || 'Project name not available',
              department: p.project_authority || 'Not available',
              deptAbbr: (p.project_authority || 'N/A').slice(0, 4).toUpperCase(),
              officer: 'Not available', officerRole: 'Not available', officerPhone: '', officerEmail: '',
              location: p.location_text || 'Not available', district: 'Not available',
              category: p.sector || p.subsector || 'Not available',
              value: cost,
              budgetApproved: cost, spent: 0, received: 0,
              progress,
              planned: Math.min(100, progress + 8),
              start: '', deadline: p.scheduled_completion_date || '', months: 0,
              status,
              risk: status === 'Delayed' ? 'High' : status === 'At Risk' ? 'Medium' : 'Low',
              lastUpdate: '', lastUpdateNote: 'No verified update metadata available.',
              workOrder: p.contract_number || 'Not available', scope: 'Not available',
              milestones: [], upcoming: [], history: [], compliance: [], complianceScore: 0,
              forecast: {
                predicted: p.scheduled_completion_date || '', earlyDays: 0, confidence: 0, factors: [], actions: [],
              },
              health: {
                overall: status === 'Delayed' ? 'POOR' : progress > 50 ? 'GOOD' : 'FAIR',
                score: Math.round(progress),
                scores: [],
                risks: [],
              },
              expenses: [],
            };
          });
          setProjects(liveProjects);
        }
      } catch (err) {
        console.warn('Failed to load contractor projects from Supabase:', err);
      }
    }
    loadLiveContractorProjects();
    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, session?.organization?.id]);

  const [reports, setReports] = useState<ProgressReport[]>([]);
  const addReport = useCallback((r: Omit<ProgressReport, 'id' | 'submittedAt'>) => {
    const id = uid('rep');
    const newRep = { ...r, id, submittedAt: new Date().toISOString() };
    setReports((rs) => [newRep, ...rs]);

    // Send to Supabase via secure submit_progress_update RPC for authoritative verification (Rule 26)
    try {
      import('@/core/supabase/client').then(({ supabase }) => {
        const project = projects.find((item) => item.id === r.projectId || item.code === r.projectId);
        if (!project) return;
        supabase.rpc('submit_progress_update', {
          p_project_id: project.id,
          p_reported_progress: r.progress,
          p_description: r.completed || r.challenges || 'Contractor progress report submission',
          p_milestone_id: null,
        }).then(({ error }) => {
          if (error) console.warn('Contractor progress submit_progress_update notice:', error.message);
        });
      });
    } catch {
      /* offline or mock */
    }

    return id;
  }, [projects]);
  const setReportStatus = useCallback((id: string, status: ProgressReport['status'], note?: string) => {
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status, reviewerNote: note ?? r.reviewerNote } : r)));
  }, []);

  const [workers, setWorkers] = useState<Record<string, Worker[]>>({});
  const addWorker = useCallback((projectId: string, w: Omit<Worker, 'id'>) => {
    setWorkers((ws) => ({ ...ws, [projectId]: [...(ws[projectId] ?? []), { ...w, id: uid('w') }] }));
  }, []);
  const updateWorker = useCallback((projectId: string, w: Worker) => {
    setWorkers((ws) => ({ ...ws, [projectId]: (ws[projectId] ?? []).map((x) => (x.id === w.id ? w : x)) }));
  }, []);
  const removeWorker = useCallback((projectId: string, id: string) => {
    setWorkers((ws) => ({ ...ws, [projectId]: (ws[projectId] ?? []).filter((x) => x.id !== id) }));
  }, []);

  const [resources, setResources] = useState<Record<string, ResourceRow[]>>({});
  const addResource = useCallback((projectId: string, r: Omit<ResourceRow, 'id'>) => {
    setResources((rs) => ({ ...rs, [projectId]: [...(rs[projectId] ?? []), { ...r, id: uid('r') }] }));
  }, []);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const addInvoice = useCallback((i: Omit<Invoice, 'id'>) => {
    setInvoices((inv) => [{ ...i, id: uid('i') }, ...inv]);
  }, []);
  const submitInvoice = useCallback((id: string) => {
    setInvoices((inv) => inv.map((i) => (i.id === id && i.status === 'Draft' ? { ...i, status: 'Submitted', verification: 'Awaiting DyE check' } : i)));
  }, []);

  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const sendMessage = useCallback((m: Omit<Message, 'id' | 'ts' | 'status'>) => {
    const id = uid('m');
    setMessages((ms) => ({
      ...ms,
      [m.projectId]: [...(ms[m.projectId] ?? []), { ...m, id, ts: new Date().toISOString(), status: 'Sent' }],
    }));
  }, []);

  const [documents, setDocuments] = useState<Record<string, ProjectDoc[]>>({});
  const addDocument = useCallback((projectId: string, d: Omit<ProjectDoc, 'id' | 'uploaded' | 'by'>) => {
    const orgName = session?.organization?.name || 'Contractor Entity';
    setDocuments((ds) => ({
      ...ds,
      [projectId]: [
        ...(ds[projectId] ?? []),
        { ...d, id: uid('d'), uploaded: new Date().toISOString().slice(0, 10), by: orgName },
      ],
    }));
  }, [session?.organization?.name]);

  const [bids, setBids] = useState<Record<string, Bid>>({});

  const saveBidDraft = useCallback((tenderId: string, step: number, data: Record<string, unknown>) => {
    setBids((bs) => ({
      ...bs,
      [tenderId]: {
        ...(bs[tenderId] ?? { tenderId, status: 'Draft' as const }),
        tenderId,
        status: 'Draft',
        step,
        updatedAt: new Date().toISOString(),
        data,
      },
    }));
  }, []);
  const submitBid = useCallback((tenderId: string, bidValue: number) => {
    const ref = `NRK-BID-2026-${Math.floor(3200 + Math.random() * 700)}`;
    setBids((bs) => ({
      ...bs,
      [tenderId]: {
        ...(bs[tenderId] ?? { tenderId, step: 7, data: {} }),
        tenderId,
        status: 'Submitted',
        step: 7,
        updatedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        ref,
        bidValue,
      },
    }));
    return ref;
  }, []);

  const [savedTenders, setSavedTenders] = useState<string[]>([]);
  const toggleSaveTender = useCallback((id: string) => {
    setSavedTenders((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }, []);

  const value: Store = {
    theme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    fontScale,
    stepFont: (dir) => setFontScale((f) => Math.min(1.25, Math.max(0.875, Math.round((f + dir * 0.125) * 1000) / 1000))),
    a11y,
    toggleA11y: (k) => setA11y((a) => ({ ...a, [k]: !a[k] })),
    lang,
    setLang,
    toasts,
    toast,
    dismissToast,
    notifications,
    unread,
    markRead,
    markAllRead,
    projects,
    reports,
    addReport,
    setReportStatus,
    workers,
    addWorker,
    updateWorker,
    removeWorker,
    resources,
    addResource,
    invoices,
    addInvoice,
    submitInvoice,
    messages,
    sendMessage,
    documents,
    addDocument,
    bids,
    saveBidDraft,
    submitBid,
    savedTenders,
    toggleSaveTender,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
