import { useState } from 'react';
import { ArrowLeft, FileSignature, Upload, MessagesSquare, Sparkles } from 'lucide-react';
import { Link, navigate } from '../../lib/router';
import { useStore } from '../../lib/store';
import { getProject } from '../../lib/data';
import ProjectSidebar, { PROJECT_SECTIONS } from '../../components/ProjectSidebar';
import { Card, StatusBadge, RiskBadge, ProgressBar, Modal, Field, Select, DocumentUploader, Avatar } from '../../components/ui';
import type { UploadDoc } from '../../components/ui';
import ProjectDetails from './Details';
import Resources from './Resources';
import Finance from './Finance';
import AIGuide from './AIGuide';
import Bills from './Bills';
import Analytics from './Analytics';
import Inspection from './Inspection';
import ReportUpdate from './ReportUpdate';
import AIAnalysis from './AIAnalysis';
import AICompletion from './AICompletion';
import Communication from './Communication';
import { cls, cr, fmtDate, daysUntil, daysLeftLabel } from '../../lib/utils';
import { useAuth } from '@/core/auth/useAuth';

export default function ProjectLayout({ projectId, section }: { projectId: string; section: string }) {
  const { projects, documents, addDocument, toast } = useStore();
  const { session } = useAuth();
  const project = projects.find((p) => p.id === projectId || p.code === projectId) || getProject(projectId) || projects[0];
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docType, setDocType] = useState('QA Report');
  const [docs, setDocs] = useState<UploadDoc[]>([]);

  if (!project) {
    return (
      <div className="p-6 max-w-3xl mx-auto pt-10">
        <Card className="p-8 text-center">
          <p className="font-display font-bold text-xl text-slate-800 dark:text-slate-100">Project not found</p>
          <p className="text-sm text-slate-500 mt-2">The project you are looking for does not exist in your register.</p>
          <Link to="/projects" className="btn btn-primary mt-5 inline-flex">Back to My Projects</Link>
        </Card>
      </div>
    );
  }

  const path = `/projects/${project.id}/${section}`;
  const base = `/projects/${project.id}`;

  const upload = () => {
    if (docs.length === 0) {
      toast('warn', 'No file selected', 'Choose at least one document to upload.');
      return;
    }
    docs.forEach((d) => addDocument(project.id, { name: d.name, type: docType, size: d.size }));
    toast('success', `${docs.length} document${docs.length > 1 ? 's' : ''} uploaded`, `Added to ${project.name} record.`);
    setDocs([]);
    setUploadOpen(false);
  };

  const page = (() => {
    switch (section) {
      case 'details': return <ProjectDetails project={project} />;
      case 'resources': return <Resources project={project} />;
      case 'finance': return <Finance project={project} />;
      case 'ai-guide': return <AIGuide project={project} />;
      case 'bills': return <Bills project={project} />;
      case 'analytics': return <Analytics project={project} />;
      case 'inspection': return <Inspection project={project} />;
      case 'update': return <ReportUpdate project={project} />;
      case 'ai-analysis': return <AIAnalysis project={project} />;
      case 'ai-completion': return <AICompletion project={project} />;
      case 'communication': return <Communication project={project} />;
      default: return <ProjectDetails project={project} />;
    }
  })();

  const sectionTitle = PROJECT_SECTIONS.find((s) => s.key === section)?.label ?? 'Project Details';

  return (
    <div>
      {/* Project header band */}
      <div className="border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4 lg:pl-64">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="min-w-0">
              <Link to="/projects" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 dark:text-slate-400">
                <ArrowLeft className="w-3.5 h-3.5" /> My Projects
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
                <h1 className="font-display text-xl lg:text-2xl text-slate-800 tracking-tight font-bold truncate dark:text-slate-100">{project.name}</h1>
                <span className="text-xs text-slate-500 font-semibold dark:text-slate-400">Project ID: {project.code}</span>
                <StatusBadge status={project.status} />
                <RiskBadge risk={project.risk} />
              </div>
              <div className="flex items-center gap-2.5 mt-2.5 min-w-[240px] max-w-md">
                <ProgressBar value={project.progress} marker={project.planned} height="h-2.5" className="flex-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{project.progress}% Complete</span>
                {project.status !== 'Completed' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap cursor-pointer" onClick={() => navigate(`${base}/ai-completion`)} title="AI predicted completion">
                    <Sparkles className="w-3 h-3" /> AI: {fmtDate(project.forecast.predicted)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link to={`${base}/update`}>
                <button className="btn btn-primary">
                  <FileSignature className="w-4 h-4" />
                  Update Progress
                </button>
              </Link>
              <button className="btn btn-secondary" onClick={() => setUploadOpen(true)}>
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
              <Link to={`${base}/communication`}>
                <button className="btn btn-secondary">
                  <MessagesSquare className="w-4 h-4" />
                  Contact Government
                </button>
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span><strong className="text-slate-700 dark:text-slate-300">{project.department}</strong></span>
            <span>{project.officerRole}</span>
            <span>{project.location}</span>
            <span>Contract Value: <strong className="text-slate-700 dark:text-slate-300">{cr(project.value)}</strong></span>
            <span>
              Deadline: <strong className="text-slate-700 dark:text-slate-300">{fmtDate(project.deadline)}</strong>
              <span className={cls('ml-1.5', daysUntil(project.deadline) < 0 ? 'text-red-600' : '')}>({daysLeftLabel(project.deadline)})</span>
            </span>
            <span>{documents[project.id]?.length ?? 0} documents on record</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-5 lg:pl-64">
        <nav className="lg:hidden mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          {sectionTitle}
          <span className="normal-case font-medium text-slate-400">— open “Workspace” from the bottom-left for all sections</span>
        </nav>
        {page}
      </div>

      <ProjectSidebar project={project} path={path} />

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title={`Upload Document — ${project.name}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setUploadOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={upload}>Upload</button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={session?.organization?.name || session?.profile?.full_name || 'Unknown'} />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{session?.organization?.name || 'Organization not available'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{project.code} • {project.department}</p>
            </div>
          </div>
          <Field label="Document Type">
            <Select
              value={docType}
              onChange={setDocType}
              options={['QA Report', 'Drawing', 'Compliance', 'Insurance', 'Site Photograph', 'Other'].map((v) => ({ value: v, label: v }))}
            />
          </Field>
          <DocumentUploader label="Files" docs={docs} onChange={setDocs} />
        </div>
      </Modal>
    </div>
  );
}
