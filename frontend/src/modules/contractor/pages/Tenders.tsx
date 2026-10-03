import { useEffect, useMemo, useState } from 'react';
import { Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react';
import { PageHeader, Card, Tabs, StatusBadge, Select, SearchInput, EmptyState } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { Link } from '../lib/router';
import { useStore } from '../lib/store';
import { PAST_BIDS } from '../lib/data';
import type { Tender } from '../lib/data';
import { eligibilityStatus } from '../lib/eligibility';
import { cls, cr, daysUntil, fmtDate, timeAgo } from '../lib/utils';
import { ContractorTenderService } from '../services/tender.service';

export default function Tenders() {
  const { bids, savedTenders, toggleSaveTender, toast } = useStore();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [tab, setTab] = useState('open');
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('All Departments');
  const [loc, setLoc] = useState('All Locations');
  const [cat, setCat] = useState('All Categories');
  const [minVal, setMinVal] = useState('Any Value');
  const [elig, setElig] = useState('All');
  const DEPTS = useMemo(() => ['All Departments', ...new Set(tenders.map((t) => t.department))], [tenders]);
  const LOCS = useMemo(() => ['All Locations', ...new Set(tenders.map((t) => t.location))], [tenders]);
  const CATS = useMemo(() => ['All Categories', ...new Set(tenders.map((t) => t.category))], [tenders]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const rows = await ContractorTenderService.getOpenTenders();
        if (active) setTenders(rows.map(ContractorTenderService.toTender));
      } catch (error) {
        console.error('Unable to load tenders:', error);
        if (active) toast('warn', 'Tender data unavailable', 'No database fallback data was substituted.');
      }
    };
    void load();
    const unsubscribe = ContractorTenderService.subscribeTenderEvents(load);
    return () => { active = false; unsubscribe(); };
  }, [toast]);

  const openFiltered = useMemo(() => {
    return tenders.filter((t) => {
      const term = q.trim().toLowerCase();
      if (term && !((t.title || '').toLowerCase().includes(term) || (t.code || '').toLowerCase().includes(term) || (t.department || '').toLowerCase().includes(term))) return false;
      if (dept !== 'All Departments' && t.department !== dept) return false;
      if (loc !== 'All Locations' && t.location !== loc) return false;
      if (cat !== 'All Categories' && t.category !== cat) return false;
      if (minVal !== 'Any Value' && t.value < Number(minVal)) return false;
      if (elig !== 'All' && eligibilityStatus(t) !== elig) return false;
      return true;
    });
  }, [tenders, q, dept, loc, cat, minVal, elig]);

  const saved = tenders.filter((t) => savedTenders.includes(t.id));
  const bidRows = tenders.filter((t) => bids[t.id]).map((t) => ({ ...bids[t.id], tender: t, id: t.id }));

  const toggleSave = (t: Tender) => {
    const wasSaved = savedTenders.includes(t.id);
    toggleSaveTender(t.id);
    toast('info', wasSaved ? 'Removed from saved tenders' : 'Tender saved', t.title);
  };

  const tenderCols = [
    {
      key: 'title',
      label: 'Tender',
      sortVal: (t: Tender) => t.title,
      render: (t: Tender) => (
        <div className="max-w-[260px]">
          <Link to={`/tenders/${t.id}`} className="text-sm font-bold text-slate-800 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-400">
            {t.title}
          </Link>
          <p className="text-[11px] text-slate-500 font-medium dark:text-slate-400">{t.code}</p>
        </div>
      ),
    },
    { key: 'dept', label: 'Department', sortVal: (t: Tender) => t.department, render: (t: Tender) => <span className="text-xs font-semibold">{t.department}</span> },
    { key: 'loc', label: 'Location', sortVal: (t: Tender) => t.location, render: (t: Tender) => <span className="text-xs font-semibold">{t.location}</span> },
    { key: 'value', label: 'Estimated Value', sortVal: (t: Tender) => t.value, render: (t: Tender) => <span className="text-xs font-bold tabular-nums">{cr(t.value)}</span> },
    {
      key: 'deadline',
      label: 'Deadline',
      sortVal: (t: Tender) => t.deadline,
      render: (t: Tender) => {
        const d = daysUntil(t.deadline);
        return (
          <div>
            <p className="text-xs font-semibold">{fmtDate(t.deadline)}</p>
            <p className={cls('text-[10px] font-bold', d <= 14 ? 'text-red-600' : 'text-slate-500 dark:text-slate-400')}>{d < 0 ? 'Closed' : `${d}d left`}</p>
          </div>
        );
      },
    },
    { key: 'elig', label: 'Eligibility', sortVal: (t: Tender) => eligibilityStatus(t), render: (t: Tender) => <StatusBadge status={eligibilityStatus(t)} /> },
    { key: 'status', label: 'Status', render: () => <StatusBadge status="Open" /> },
    {
      key: 'action',
      label: 'Action',
      render: (t: Tender) => (
        <div className="flex items-center gap-1.5">
          <Link to={`/tenders/${t.id}`} className="btn btn-secondary btn-sm">
            View
          </Link>
          {t.status === 'Open' && eligibilityStatus(t) !== 'Not Eligible' && (
            <Link to={`/tenders/${t.id}/bid`} className="btn btn-primary btn-sm">
              Start Bid
            </Link>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => toggleSave(t)} aria-label={savedTenders.includes(t.id) ? 'Unsave tender' : 'Save tender'}>
            {savedTenders.includes(t.id) ? <BookmarkCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Tender Management"
        subtitle="Government of Maharashtra procurement marketplace — discover, evaluate and bid for works"
      />

      <Card className="overflow-hidden">
        <Tabs
          tabs={[
            { key: 'open', label: 'Open Tenders', count: tenders.filter((t) => t.status === 'Open').length },
            { key: 'saved', label: 'Saved', count: saved.length },
            { key: 'bids', label: 'My Bids', count: bidRows.length },
            { key: 'past', label: 'Past Bids', count: PAST_BIDS.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'open' && (
          <>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 border-b border-slate-100 dark:border-slate-800">
              <SearchInput value={q} onChange={setQ} placeholder="Search tender or department…" className="xl:col-span-2" />
              <Select value={dept} onChange={setDept} options={DEPTS.map((v) => ({ value: v, label: v === 'All Departments' ? v : v.replace('Maharashtra Jeevan Pradhikaran', 'MJP') }))} />
              <Select value={loc} onChange={setLoc} options={LOCS.map((v) => ({ value: v, label: v }))} />
              <Select value={cat} onChange={setCat} options={CATS.map((v) => ({ value: v, label: v }))} />
              <Select
                value={minVal}
                onChange={setMinVal}
                options={['Any Value', '5', '15', '25', '50'].map((v) => ({ value: v, label: v === 'Any Value' ? v : `Min ₹${v} Cr` }))}
              />
            </div>
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Eligibility:</span>
              {['All', 'Eligible', 'Review', 'Not Eligible'].map((e) => (
                <button key={e} className={cls('pill px-2.5 py-1', elig === e ? 'pill-active' : 'pill-idle')} onClick={() => setElig(e)}>
                  {e}
                </button>
              ))}
            </div>
            <DataTable columns={tenderCols} rows={openFiltered} empty={<EmptyState title="No tenders match your filters" msg="Clear the search or widen eligibility and value filters." />} />
          </>
        )}

        {tab === 'saved' && (
          <DataTable
            columns={tenderCols}
            rows={saved}
            
            empty={
              <EmptyState
                title="No saved tenders"
                msg="Bookmark interesting tenders from the Open Tenders tab to track them here."
              />
            }
          />
        )}

        {tab === 'bids' && (
          <DataTable
            
            columns={[
              {
                key: 'tender',
                label: 'Tender',
                render: (r: (typeof bidRows)[number]) => (
                  <div className="">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{r.tender.title}</p>
                    <p className="text-[11px] text-slate-500 font-medium dark:text-slate-400">{r.tender.code}</p>
                  </div>
                ),
              },
              { key: 'ref', label: 'Bid Reference', render: (r: (typeof bidRows)[number]) => (r.ref ? <span className="text-xs font-bold font-mono">{r.ref}</span> : <span className="text-xs text-slate-400">— (draft)</span>) },
              { key: 'value', label: 'Bid Value', render: (r: (typeof bidRows)[number]) => <span className="text-xs font-bold tabular-nums">{r.bidValue ? cr(r.bidValue / 1e7) : '—'}</span> },
              { key: 'updated', label: 'Last Activity', sortVal: (r: (typeof bidRows)[number]) => r.updatedAt, render: (r: (typeof bidRows)[number]) => <span className="text-xs">{timeAgo(r.updatedAt)}</span> },
              { key: 'status', label: 'Stage', render: (r: (typeof bidRows)[number]) => <StatusBadge status={r.status === 'Draft' ? 'Draft' : 'Under Evaluation'} /> },
              {
                key: 'action',
                label: 'Action',
                render: (r: (typeof bidRows)[number]) =>
                  r.status === 'Draft' ? (
                    <div className="flex gap-1.5">
                      <Link to={`/tenders/${r.tenderId}/bid`} className="btn btn-primary btn-sm">
                        Continue <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Link to={`/tenders/${r.tenderId}/bid/ai-assist`} className="btn btn-secondary btn-sm">
                        AI Check
                      </Link>
                    </div>
                  ) : (
                    <Link to={`/tenders/${r.tenderId}`} className="btn btn-secondary btn-sm">
                      View Tender
                    </Link>
                  ),
              },
            ]}
            rows={bidRows}
            empty={<EmptyState title="No bids yet" msg="Start a bid from the Open Tenders tab. Drafts are saved automatically." />}
          />
        )}

        {tab === 'past' && (
          <DataTable
            
            columns={[
              { key: 'tender', label: 'Tender', render: (r: (typeof PAST_BIDS)[number]) => <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{r.tender}</span> },
              { key: 'dept', label: 'Department', render: (r: (typeof PAST_BIDS)[number]) => <span className="text-xs font-semibold">{r.department}</span> },
              { key: 'year', label: 'Year', sortVal: (r: (typeof PAST_BIDS)[number]) => r.year, render: (r: (typeof PAST_BIDS)[number]) => <span className="text-xs">{r.year}</span> },
              { key: 'value', label: 'Value', sortVal: (r: (typeof PAST_BIDS)[number]) => r.value, render: (r: (typeof PAST_BIDS)[number]) => <span className="text-xs font-bold tabular-nums">{cr(r.value)}</span> },
              { key: 'outcome', label: 'Outcome', sortVal: (r: (typeof PAST_BIDS)[number]) => r.outcome, render: (r: (typeof PAST_BIDS)[number]) => <StatusBadge status={r.outcome} /> },
              { key: 'detail', label: 'Detail', render: (r: (typeof PAST_BIDS)[number]) => <span className="text-xs text-slate-600 dark:text-slate-400">{r.detail}</span> },
            ]}
            rows={PAST_BIDS}
          />
        )}
      </Card>
    </div>
  );
}
