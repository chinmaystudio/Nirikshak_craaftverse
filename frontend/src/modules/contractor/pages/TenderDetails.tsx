import { useState } from 'react';
import { Download, Bookmark, BookmarkCheck, ArrowRight, CheckCircle2, XCircle, CircleAlert, MapPin, Landmark, IndianRupee, CalendarClock } from 'lucide-react';
import { PageHeader, Card, Tabs, StatusBadge, AIInsight, SectionTitle, Timeline } from '../components/ui';
import { Link } from '../lib/router';
import { useStore } from '../lib/store';
import { getTender, CONTRACTOR } from '../lib/data';
import { eligibilityRows, eligibilityStatus } from '../lib/eligibility';
import { cr, downloadFile, fmtDate, money, daysLeftLabel, cls } from '../lib/utils';

export default function TenderDetails({ tenderId }: { tenderId: string }) {
  const tender = getTender(tenderId);
  const { savedTenders, toggleSaveTender, toast, bids } = useStore();
  const [tab, setTab] = useState('Overview');

  if (!tender) {
    return (
      <div className="p-6 max-w-3xl mx-auto pt-10">
        <Card className="p-8 text-center">
          <p className="font-display font-bold text-xl text-slate-800 dark:text-slate-100">Tender not found</p>
          <p className="text-sm text-slate-500 mt-2">The tender you are looking for does not exist or has been withdrawn.</p>
          <Link to="/tenders" className="btn btn-primary mt-5 inline-flex">Back to Tender Management</Link>
        </Card>
      </div>
    );
  }

  const isSaved = savedTenders.includes(tender.id);
  const status = eligibilityStatus(tender);
  const rows = eligibilityRows(tender);
  const bid = bids[tender.id];

  const downloadTender = () => {
    const text = [
      `NIRIKSHAK — Tender Document (Summary Extract)`,
      `================================================`,
      `Tender: ${tender.title}`,
      `Code: ${tender.code}`,
      `Department: ${tender.department}`,
      `Location: ${tender.location}`,
      `Estimated Value: ₹ ${tender.value} Cr`,
      `EMD: ₹ ${tender.emd} L`,
      `Submission Deadline: ${fmtDate(tender.deadline)}`,
      `Work Duration: ${tender.durationMonths} months`,
      ``,
      `SCOPE`,
      ...tender.scopePoints.map((s) => ` - ${s}`),
      ``,
      `ELIGIBILITY`,
      `${tender.eligibility.label}: ${tender.eligibility.required}`,
      ``,
      `TECHNICAL REQUIREMENTS`,
      ...tender.techReq.map((s, i) => ` ${i + 1}. ${s}`),
      ``,
      `FINANCIAL REQUIREMENTS`,
      ...tender.finReq.map((s, i) => ` ${i + 1}. ${s}`),
      ``,
      `CONTACT`,
      `${tender.contact.name} — ${tender.contact.role}`,
      `Phone: ${tender.contact.phone} | Email: ${tender.contact.email}`,
      ``,
      `This is a demonstration extract. The complete tender document (Vol 1-3, BOQ, drawings) is available on the official e-procurement portal.`,
    ].join('\n');
    downloadFile(`NIRIKSHAK_Tender_${tender.code.replace(/[\/\\]/g, '-')}.txt`, text);
    toast('success', 'Tender document downloaded', 'Summary extract saved locally.');
  };

  const TABS = ['Overview', 'Eligibility', 'Technical Requirements', 'Financial Requirements', 'Documents', 'Timeline', 'Contact'];

  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1300px] mx-auto space-y-5">
      <PageHeader
        backTo="/tenders"
        backLabel="Tender Management"
        title={tender.title}
        subtitle={`${tender.code} • ${tender.department} • ${tender.category}`}
        actions={
          <>
            <button className="btn btn-secondary" onClick={downloadTender}>
              <Download className="w-4 h-4" />
              Download Tender
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                toggleSaveTender(tender.id);
                toast('info', isSaved ? 'Removed from saved tenders' : 'Tender saved', tender.title);
              }}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" /> : <Bookmark className="w-4 h-4" />}
              {isSaved ? 'Saved' : 'Save Tender'}
            </button>
            {status === 'Not Eligible' ? (
              <button className="btn btn-primary" disabled title="Profile does not meet eligibility requirements">
                Start Bid
              </button>
            ) : (
              <Link to={`/tenders/${tender.id}/bid`}>
                <button className="btn btn-primary">
                  {bid ? 'Continue Bid' : 'Start Bid'} <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            )}
          </>
        }
      />

      {/* Key facts strip */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <Fact icon={Landmark} label="Estimated Value" value={cr(tender.value)} />
          <Fact icon={IndianRupee} label="EMD" value={money(tender.emd)} />
          <Fact icon={CalendarClock} label="Submission Deadline" value={fmtDate(tender.deadline)} sub={daysLeftLabel(tender.deadline)} />
          <Fact icon={CalendarClock} label="Work Duration" value={`${tender.durationMonths} months`} />
          <Fact icon={MapPin} label="Location" value={tender.location} />
          <Fact icon={Landmark} label="Eligibility" value={status} badge />
        </div>
      </Card>

      <AIInsight title="AI Tender Summary">
        <p className="leading-relaxed">{tender.summary}</p>
      </AIInsight>

      <Card className="overflow-hidden">
        <Tabs tabs={TABS.map((t) => ({ key: t, label: t }))} active={tab} onChange={setTab} />
        <div className="p-5">
          {tab === 'Overview' && (
            <div className="space-y-5">
              <div>
                <SectionTitle title="Scope of Work" />
                <ul className="flex flex-col gap-2">
                  {tender.scopePoints.map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-700 mt-1.5 shrink-0 dark:bg-blue-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Key Dates</p>
                  <dl className="space-y-1.5 text-sm">
                    <Row k="Published" v={fmtDate(tender.opened)} />
                    <Row k="Pre-bid meeting" v={fmtDate(tender.preBid)} />
                    <Row k="Submission deadline" v={fmtDate(tender.deadline)} />
                    <Row k="Work duration" v={`${tender.durationMonths} months`} />
                  </dl>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Bid Status</p>
                  {bid ? (
                    <div className="flex items-center gap-2.5">
                      <StatusBadge status={bid.status === 'Draft' ? 'Draft' : 'Under Evaluation'} />
                      {bid.ref && <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300">{bid.ref}</span>}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">No bid started yet for this tender.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'Eligibility' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-slate-800 dark:text-slate-200">{tender.eligibility.label}:</strong> {tender.eligibility.required}
              </p>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Criterion</th>
                      <th>Requirement</th>
                      <th>Our Profile</th>
                      <th>Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.label}>
                        <td className="font-bold text-slate-800 dark:text-slate-100">{r.label}</td>
                        <td className="text-xs max-w-[260px]">{r.required}</td>
                        <td className="text-xs max-w-[220px] font-semibold">{r.ours}</td>
                        <td>
                          {r.pass === true ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400">
                              <CheckCircle2 className="w-4 h-4" /> Passed
                            </span>
                          ) : r.pass === false ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                              <XCircle className="w-4 h-4" /> Not met
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                              <CircleAlert className="w-4 h-4" /> Review
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated check against {CONTRACTOR.name} profile. Final eligibility is confirmed by the department at technical evaluation.
              </p>
            </div>
          )}

          {tab === 'Technical Requirements' && (
            <ol className="flex flex-col gap-3">
              {tender.techReq.map((r, i) => (
                <li key={r} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3.5 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-1.5 py-0.5 mt-0.5 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{r}</span>
                </li>
              ))}
            </ol>
          )}

          {tab === 'Financial Requirements' && (
            <ol className="flex flex-col gap-3">
              {tender.finReq.map((r, i) => (
                <li key={r} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3.5 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5 mt-0.5 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{r}</span>
                </li>
              ))}
            </ol>
          )}

          {tab === 'Documents' && (
            <div className="space-y-3">
              {tender.docs.map((d, i) => (
                <div key={d} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3.5 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 dark:bg-slate-800">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{d}</span>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => toast('success', 'Download started', `${d} (demo extract) saved.`)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              ))}
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete documents are available on the official e-procurement portal after login.</p>
            </div>
          )}

          {tab === 'Timeline' && (
            <div className="max-w-xl">
              <Timeline items={tender.timeline.map((t, i) => ({ label: t.label, date: fmtDate(t.date), state: t.date < new Date().toISOString().slice(0, 10) ? 'done' : i === tender.timeline.findIndex((x) => x.date >= new Date().toISOString().slice(0, 10)) ? 'current' : 'pending' }))} />
            </div>
          )}

          {tab === 'Contact' && (
            <div className="max-w-xl rounded-lg border border-slate-200 p-5 dark:border-slate-700">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{tender.contact.name}</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 dark:text-slate-400">{tender.contact.role}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Phone" v={tender.contact.phone} />
                <Row k="Email" v={tender.contact.email} />
                <Row k="Office hours" v="Mon–Fri, 10:00–17:30 IST" />
              </dl>
              <p className="text-xs text-slate-500 mt-4 dark:text-slate-400">
                Pre-bid queries must be submitted in writing before the query deadline (see Timeline).
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Fact({ icon: Icon, label, value, sub, badge }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; badge?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </p>
      {badge ? (
        <div className="mt-1.5">
          <StatusBadge status={value} />
        </div>
      ) : (
        <p className="text-sm font-bold text-slate-800 mt-1 dark:text-slate-100">{value}</p>
      )}
      {sub && <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-xs text-slate-500 font-semibold">{k}</dt>
      <dd className="text-xs font-bold text-slate-800 text-right dark:text-slate-200">{v}</dd>
    </div>
  );
}
