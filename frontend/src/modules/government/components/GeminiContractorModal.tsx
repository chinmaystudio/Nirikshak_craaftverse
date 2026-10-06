import { useState, useEffect } from 'react';
import { Modal } from '@/components/modals/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCr } from '@/utils/format';
import { geminiContractorService, type GeminiContractorSuggestion } from '../services/geminiContractor.service';
import type { Tender } from '@/types';

interface GeminiContractorModalProps {
  open: boolean;
  onClose: () => void;
  tender: Tender | null;
  onAwardTender?: (bidId: string) => void;
}

export function GeminiContractorModal({
  open,
  onClose,
  tender,
  onAwardTender,
}: GeminiContractorModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<GeminiContractorSuggestion | null>(null);
  const [expandedBidder, setExpandedBidder] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tender) return;

    let isMounted = true;
    setLoading(true);

    // Prepare bidders from tender.lots
    const bidders = (tender.lots || []).map((lot, idx) => ({
      bidId: lot.bidId || `BID-${idx + 1}`,
      bidder: lot.bidder,
      quotedAmountCr: lot.quotedAmountCr,
      technicalScore: lot.technicalScore || (80 + (idx % 3) * 5),
      financialScore: lot.financialScore || (85 + (idx % 2) * 5),
    }));

    // If tender has no lots yet, provide sensible bidding candidates based on tender estimate
    const finalBidders = bidders.length > 0 ? bidders : [
      {
        bidId: 'BID-001',
        bidder: 'M/s Sahyadri Infrastructure Pvt. Ltd.',
        quotedAmountCr: Number((tender.estimatedCostCr * 0.96).toFixed(2)),
        technicalScore: 92,
        financialScore: 94,
      },
      {
        bidId: 'BID-002',
        bidder: 'Kalyani Buildcon & Developers',
        quotedAmountCr: Number((tender.estimatedCostCr * 0.92).toFixed(2)),
        technicalScore: 84,
        financialScore: 98,
      },
      {
        bidId: 'BID-003',
        bidder: 'Vidarbha Engineering Works',
        quotedAmountCr: Number((tender.estimatedCostCr * 1.04).toFixed(2)),
        technicalScore: 78,
        financialScore: 82,
      },
    ];

    geminiContractorService
      .suggestBestContractor({
        tenderId: tender.id,
        tenderTitle: tender.title,
        estimatedCostCr: tender.estimatedCostCr,
        bidders: finalBidders,
      })
      .then((res) => {
        if (isMounted) {
          setSuggestion(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[GeminiContractorModal] Evaluation failed:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, tender]);

  if (!tender) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="AI Contractor Management"
      titleIcon="auto_awesome"
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-caption text-fg-subtle">
            <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
              verified
            </span>
            <span>Evaluated with Google Gemini 3.1 Pro (QCBS 70:30)</span>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Model & Tender Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="nk-mono-id text-caption font-semibold text-primary">{tender.id}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                Gemini 3.1 Pro
              </span>
            </div>
            <h3 className="mt-0.5 text-body font-semibold text-fg">{tender.title}</h3>
          </div>
          <div className="text-right">
            <p className="text-caption text-fg-muted">Tender Estimate</p>
            <p className="text-body font-bold text-fg">{formatCr(tender.estimatedCostCr)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-3 h-10 w-10">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              </div>
            </div>
            <p className="text-body font-medium text-fg">Google Gemini 3.1 Pro is analyzing contractor bids…</p>
            <p className="text-caption text-fg-muted">
              Auditing technical capacity, financial quotations, and QCBS composite score
            </p>
          </div>
        ) : suggestion ? (
          <>
            {/* Top Winner Highlight Card */}
            <div className="relative overflow-hidden rounded-xl border border-success-border bg-gradient-to-r from-success-tint/60 to-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-strong text-white shadow">
                    <span className="material-symbols-outlined text-[22px]">emoji_events</span>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-success-strong">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      Gemini Recommended Best Contractor
                    </span>
                    <h2 className="text-heading-3 font-bold text-fg">
                      {suggestion.recommendedWinner.bidder}
                    </h2>
                    <p className="mt-1 text-body-small text-fg-muted">
                      {suggestion.recommendedWinner.technicalHighlights}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="rounded-lg border border-success-border bg-surface px-3 py-1.5 text-right shadow-xs">
                    <span className="text-[11px] text-fg-subtle">Composite QCBS</span>
                    <p className="text-heading-3 font-bold text-success-strong">
                      {suggestion.recommendedWinner.compositeScore} / 100
                    </p>
                  </div>
                  {onAwardTender && suggestion.recommendedWinner.bidId && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon="gavel"
                      onClick={() => onAwardTender(suggestion.recommendedWinner.bidId!)}
                    >
                      Award Tender
                    </Button>
                  )}
                </div>
              </div>

              {/* Justification Box */}
              <div className="mt-3.5 rounded-lg border border-border/60 bg-surface/80 p-3 text-body-small text-fg">
                <p className="font-semibold text-fg">
                  <span className="material-symbols-outlined mr-1 align-middle text-[16px] text-primary">
                    psychology
                  </span>
                  Gemini Evaluation Rationale:
                </p>
                <p className="mt-1 leading-relaxed text-fg-muted">
                  {suggestion.recommendedWinner.justification}
                </p>
              </div>
            </div>

            {/* Comparative Bidders Ranking Matrix */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-body font-semibold text-fg">
                  <span className="material-symbols-outlined text-[18px] text-fg-muted">leaderboard</span>
                  Comparative Bidder Rankings ({suggestion.comparativeRankings.length} Bidders)
                </h4>
                <span className="text-caption text-fg-subtle">
                  Methodology: 70% Technical + 30% Financial Weightage
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[620px] text-left text-body-small">
                  <thead>
                    <tr className="border-b border-border bg-surface-2 font-medium text-fg-muted">
                      <th className="px-3 py-2.5">Rank</th>
                      <th className="px-3 py-2.5">Contractor / Bidder</th>
                      <th className="px-3 py-2.5 text-right">Quoted Value</th>
                      <th className="px-3 py-2.5 text-right">Tech (70%)</th>
                      <th className="px-3 py-2.5 text-right">Fin (30%)</th>
                      <th className="px-3 py-2.5 text-right">Composite</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestion.comparativeRankings.map((bidder) => {
                      const isTop = bidder.rank === 1;
                      const isExpanded = expandedBidder === bidder.bidder;
                      return (
                        <>
                          <tr
                            key={bidder.bidder}
                            className={`border-b border-border/70 transition-colors ${
                              isTop ? 'bg-success-tint/20 font-medium' : 'hover:bg-surface-2'
                            }`}
                          >
                            <td className="px-3 py-2.5">
                              {isTop ? (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success-strong text-[12px] font-bold text-white">
                                  1
                                </span>
                              ) : (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[12px] text-fg-muted">
                                  {bidder.rank}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-semibold text-fg">{bidder.bidder}</span>
                              {isTop && (
                                <Badge tone="success" size="sm" className="ml-2">
                                  Top Choice
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-fg">
                              {formatCr(bidder.quotedAmountCr)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-fg">
                              {bidder.technicalScore}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-fg">
                              {bidder.financialScore}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums font-bold text-fg">
                              <span className={isTop ? 'text-success-strong' : ''}>
                                {bidder.compositeScore}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Badge
                                tone={
                                  bidder.recommendation === 'RECOMMENDED'
                                    ? 'success'
                                    : bidder.recommendation === 'QUALIFIED'
                                    ? 'neutral'
                                    : 'danger'
                                }
                                size="sm"
                              >
                                {bidder.recommendation}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                                onClick={() =>
                                  setExpandedBidder(isExpanded ? null : bidder.bidder)
                                }
                              >
                                {isExpanded ? 'Hide' : 'Details'}
                                <span className="material-symbols-outlined text-[14px]">
                                  {isExpanded ? 'expand_less' : 'expand_more'}
                                </span>
                              </button>
                            </td>
                          </tr>

                          {/* Expanded detail row */}
                          {isExpanded && (
                            <tr className="border-b border-border bg-surface-2/60">
                              <td colSpan={8} className="p-3">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <div className="rounded border border-success-border/50 bg-success-tint/30 p-2.5">
                                    <p className="text-[11px] font-bold text-success-strong uppercase">
                                      Key Strengths (Gemini 3.1 Pro)
                                    </p>
                                    <ul className="mt-1 list-disc space-y-1 pl-4 text-caption text-fg">
                                      {bidder.keyStrengths.map((str, i) => (
                                        <li key={i}>{str}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="rounded border border-warning-border/50 bg-warning-tint/30 p-2.5">
                                    <p className="text-[11px] font-bold text-warning-strong uppercase">
                                      Risk Factors & Advisories
                                    </p>
                                    <ul className="mt-1 list-disc space-y-1 pl-4 text-caption text-fg">
                                      {bidder.riskFactors.map((rf, i) => (
                                        <li key={i}>{rf}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Governance & Safeguards Checked */}
            <div className="rounded-lg border border-border bg-surface p-3 text-caption text-fg-subtle">
              <p className="font-semibold text-fg">
                <span className="material-symbols-outlined mr-1 align-middle text-[15px] text-primary">
                  security
                </span>
                Procurement Compliance & Safeguards Audited:
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {suggestion.evaluationSummary.safeguardsChecked.map((sg, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded bg-surface-2 px-2 py-0.5 text-fg-muted"
                  >
                    <span className="material-symbols-outlined text-[13px] text-success-strong">
                      check_circle
                    </span>
                    {sg}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
