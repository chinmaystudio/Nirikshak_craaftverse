import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ToastItem } from '../components/ui';
import type {
  Notification, Worker, ResourceRow, Invoice, ProgressReport, Message,
  ProjectDoc, Bid, Project,
} from './data';
import { uid } from './utils';
import { useAuth } from '@/core/auth/useAuth';
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

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const markRead = useCallback((id: string) => setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n))), []);
  const markAllRead = useCallback(() => setNotifications((ns) => ns.map((n) => ({ ...n, read: true }))), []);
  const unread = notifications.filter((n) => !n.read).length;

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAssignedProjects() {
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
  }, [session?.user?.id, session?.organization?.id]);

  // Local drafts of progress reports, cleanly separated from server state
  const [reports, setReports] = useState<ProgressReport[]>(() => {
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
        localStorage.setItem('nrk-contractor-draft-reports', JSON.stringify(updated));
        return updated;
      });
      return id;
    },
    []
  );

  const setReportStatus = useCallback(
    (id: string, status: ProgressReport['status'], note?: string) => {
      setReports((rs) => {
        const updated = rs.map((r) => (r.id === id ? { ...r, status, reviewerNote: note ?? r.reviewerNote } : r));
        localStorage.setItem('nrk-contractor-draft-reports', JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  // Workers, Resources, Invoices, Messages: live database state
  const [workers, setWorkers] = useState<Record<string, Worker[]>>({});
  const addWorker = useCallback(
    (projectId: string, w: Omit<Worker, 'id'>) => {
      setWorkers((ws) => ({ ...ws, [projectId]: [...(ws[projectId] ?? []), { ...w, id: uid('w') }] }));
    },
    []
  );
  const updateWorker = useCallback(
    (projectId: string, w: Worker) => {
      setWorkers((ws) => ({ ...ws, [projectId]: (ws[projectId] ?? []).map((x) => (x.id === w.id ? w : x)) }));
    },
    []
  );
  const removeWorker = useCallback(
    (projectId: string, id: string) => {
      setWorkers((ws) => ({ ...ws, [projectId]: (ws[projectId] ?? []).filter((x) => x.id !== id) }));
    },
    []
  );

  const [resources, setResources] = useState<Record<string, ResourceRow[]>>({});
  const addResource = useCallback(
    (projectId: string, r: Omit<ResourceRow, 'id'>) => {
      setResources((rs) => ({ ...rs, [projectId]: [...(rs[projectId] ?? []), { ...r, id: uid('r') }] }));
    },
    []
  );

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const addInvoice = useCallback(
    (i: Omit<Invoice, 'id'>) => {
      setInvoices((inv) => [{ ...i, id: uid('i') }, ...inv]);
    },
    []
  );
  const submitInvoice = useCallback(
    (id: string) => {
      setInvoices((inv) =>
        inv.map((i) => (i.id === id && i.status === 'Draft' ? { ...i, status: 'Submitted', verification: 'Awaiting DyE check' } : i))
      );
    },
    []
  );

  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const sendMessage = useCallback(
    (m: Omit<Message, 'id' | 'ts' | 'status'>) => {
      const id = uid('m');
      setMessages((ms) => ({
        ...ms,
        [m.projectId]: [...(ms[m.projectId] ?? []), { ...m, id, ts: new Date().toISOString(), status: 'Sent' }],
      }));
    },
    []
  );

  const [documents, setDocuments] = useState<Record<string, ProjectDoc[]>>({});
  const addDocument = useCallback(
    (projectId: string, d: Omit<ProjectDoc, 'id' | 'uploaded' | 'by'>) => {
      const orgName = session?.organization?.name || 'Contractor Entity';
      import('../services/documents.service').then(({ ContractorDocumentsService }) => {
        ContractorDocumentsService.registerDocument(projectId, {
          document_type: d.type || 'CONTRACT',
          file_name: d.name,
          file_path: `projects/${projectId}/${Date.now()}_${d.name}`,
          file_size_bytes: 1024,
          mime_type: 'application/pdf',
          visibility: 'CONTRACTOR_ONLY',
        }).catch((err) => {
          console.warn('[store] Live document registration notice:', err?.message || err);
        });
      });
      setDocuments((ds) => ({
        ...ds,
        [projectId]: [
          ...(ds[projectId] ?? []),
          { ...d, id: uid('d'), uploaded: new Date().toISOString().slice(0, 10), by: orgName },
        ],
      }));
    },
    [session?.organization?.name]
  );

  const [bids, setBids] = useState<Record<string, Bid>>(() => {
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
    if (!ref) {
      throw new Error('Bid submission failed: authoritative bid reference must be returned by save_tender_bid RPC');
    }
    const finalRef = ref;
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
