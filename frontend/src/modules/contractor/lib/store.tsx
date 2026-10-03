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
import { useAuth } from '@/core/auth/useAuth';
import { isDemoMode } from '@/lib/config/dataMode';
import { contractorProjectsService } from '../services/projects.service';

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
  submitBid: (tenderId: string, bidValue: number, ref?: string) => string;

  savedTenders: string[];
  toggleSaveTender: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside provider');
  return c;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const demo = isDemoMode();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('nrk-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nrk-theme', theme);
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('nrk-font')) || 1);
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
    localStorage.setItem('nrk-font', String(fontScale));
  }, [fontScale]);

  const [a11y, setA11y] = useState<A11y>(() =>
    localStorage.getItem('nrk-a11y') ? JSON.parse(localStorage.getItem('nrk-a11y')!) : { hc: false, rm: false, ul: false }
  );
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

  const [notifications, setNotifications] = useState<Notification[]>(() =>
    demo ? INITIAL_NOTIFICATIONS : []
  );
  const markRead = useCallback((id: string) => setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n))), []);
  const markAllRead = useCallback(() => setNotifications((ns) => ns.map((n) => ({ ...n, read: true }))), []);
  const unread = notifications.filter((n) => !n.read).length;

  const [projects, setProjects] = useState<Project[]>(() => (demo ? PROJECTS : []));

  useEffect(() => {
    let isMounted = true;
    async function loadAssignedProjects() {
      if (demo) {
        setProjects(PROJECTS);
        return;
      }
      try {
        const live = await contractorProjectsService.getAssignedProjects();
        if (isMounted) {
          setProjects(live);
        }
      } catch (err) {
        console.warn('[StoreProvider] Error loading assigned projects:', err);
      }
    }
    loadAssignedProjects();
    return () => {
      isMounted = false;
    };
  }, [demo, session?.user?.id, session?.organization?.id]);

  // Local drafts of progress reports, cleanly separated from server state
  const [reports, setReports] = useState<ProgressReport[]>(() => {
    if (demo) return INITIAL_REPORTS;
    try {
      const saved = localStorage.getItem('nrk-contractor-draft-reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addReport = useCallback(
    (r: Omit<ProgressReport, 'id' | 'submittedAt'>) => {
      const id = uid('draft-rep');
      const newRep: ProgressReport = {
        ...r,
        id,
        submittedAt: new Date().toISOString(),
        status: 'Draft',
      };
      setReports((rs) => {
        const updated = [newRep, ...rs];
        if (!demo) {
          localStorage.setItem('nrk-contractor-draft-reports', JSON.stringify(updated));
        }
        return updated;
      });
      return id;
    },
    [demo]
  );

  const setReportStatus = useCallback(
    (id: string, status: ProgressReport['status'], note?: string) => {
      setReports((rs) => {
        const updated = rs.map((r) => (r.id === id ? { ...r, status, reviewerNote: note ?? r.reviewerNote } : r));
        if (!demo) {
          localStorage.setItem('nrk-contractor-draft-reports', JSON.stringify(updated));
        }
        return updated;
      });
    },
    [demo]
  );

  // Workers, Resources, Invoices, Messages: DEMO fixtures vs LIVE NOT_IMPLEMENTED states
  const [workers, setWorkers] = useState<Record<string, Worker[]>>(() => (demo ? INITIAL_WORKERS : {}));
  const addWorker = useCallback(
    (projectId: string, w: Omit<Worker, 'id'>) => {
      if (!demo) {
        toast('info', 'Feature in Development', 'Resource management will be persisted in Database V2.');
        return;
      }
      setWorkers((ws) => ({ ...ws, [projectId]: [...(ws[projectId] ?? []), { ...w, id: uid('w') }] }));
    },
    [demo, toast]
  );
  const updateWorker = useCallback(
    (projectId: string, w: Worker) => {
      if (!demo) return;
      setWorkers((ws) => ({ ...ws, [projectId]: (ws[projectId] ?? []).map((x) => (x.id === w.id ? w : x)) }));
    },
    [demo]
  );
  const removeWorker = useCallback(
    (projectId: string, id: string) => {
      if (!demo) return;
      setWorkers((ws) => ({ ...ws, [projectId]: (ws[projectId] ?? []).filter((x) => x.id !== id) }));
    },
    [demo]
  );

  const [resources, setResources] = useState<Record<string, ResourceRow[]>>(() => (demo ? INITIAL_RESOURCES : {}));
  const addResource = useCallback(
    (projectId: string, r: Omit<ResourceRow, 'id'>) => {
      if (!demo) {
        toast('info', 'Feature in Development', 'Heavy machinery & material allocation will be live in Database V2.');
        return;
      }
      setResources((rs) => ({ ...rs, [projectId]: [...(rs[projectId] ?? []), { ...r, id: uid('r') }] }));
    },
    [demo, toast]
  );

  const [invoices, setInvoices] = useState<Invoice[]>(() => (demo ? INITIAL_INVOICES : []));
  const addInvoice = useCallback(
    (i: Omit<Invoice, 'id'>) => {
      if (!demo) {
        toast('info', 'Feature in Development', 'Running Account (RA) billing will be persisted in Database V2.');
        return;
      }
      setInvoices((inv) => [{ ...i, id: uid('i') }, ...inv]);
    },
    [demo, toast]
  );
  const submitInvoice = useCallback(
    (id: string) => {
      if (!demo) return;
      setInvoices((inv) =>
        inv.map((i) => (i.id === id && i.status === 'Draft' ? { ...i, status: 'Submitted', verification: 'Awaiting DyE check' } : i))
      );
    },
    [demo]
  );

  const [messages, setMessages] = useState<Record<string, Message[]>>(() => (demo ? INITIAL_MESSAGES : {}));
  const sendMessage = useCallback(
    (m: Omit<Message, 'id' | 'ts' | 'status'>) => {
      if (!demo) {
        toast('info', 'Feature in Development', 'Official project communications will be supported in Database V2.');
        return;
      }
      const id = uid('m');
      setMessages((ms) => ({
        ...ms,
        [m.projectId]: [...(ms[m.projectId] ?? []), { ...m, id, ts: new Date().toISOString(), status: 'Sent' }],
      }));
    },
    [demo, toast]
  );

  const [documents, setDocuments] = useState<Record<string, ProjectDoc[]>>(() => (demo ? INITIAL_DOCS : {}));
  const addDocument = useCallback(
    (projectId: string, d: Omit<ProjectDoc, 'id' | 'uploaded' | 'by'>) => {
      if (!demo) {
        toast('info', 'Feature in Development', 'Document upload backend not yet implemented.');
        return;
      }
      const orgName = session?.organization?.name || 'Contractor Entity';
      setDocuments((ds) => ({
        ...ds,
        [projectId]: [
          ...(ds[projectId] ?? []),
          { ...d, id: uid('d'), uploaded: new Date().toISOString().slice(0, 10), by: orgName },
        ],
      }));
    },
    [demo, session?.organization?.name, toast]
  );

  const [bids, setBids] = useState<Record<string, Bid>>(() => {
    if (demo) return INITIAL_BIDS;
    try {
      const saved = localStorage.getItem('nrk-contractor-bid-drafts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveBidDraft = useCallback((tenderId: string, step: number, data: Record<string, unknown>) => {
    setBids((bs) => {
      const updated = {
        ...bs,
        [tenderId]: {
          ...(bs[tenderId] ?? { tenderId, status: 'Draft' as const }),
          tenderId,
          status: 'Draft' as const,
          step,
          updatedAt: new Date().toISOString(),
          data,
        },
      };
      localStorage.setItem('nrk-contractor-bid-drafts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const submitBid = useCallback((tenderId: string, bidValue: number, ref?: string) => {
    const finalRef = ref || (demo ? `NRK-BID-2026-${Math.floor(3200 + Math.random() * 700)}` : 'NRK-BID-SUBMITTED');
    setBids((bs) => ({
      ...bs,
      [tenderId]: {
        ...(bs[tenderId] ?? { tenderId, step: 7, data: {} }),
        tenderId,
        status: 'Submitted',
        step: 7,
        updatedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        ref: finalRef,
        bidValue,
      },
    }));
    return finalRef;
  }, [demo]);

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
