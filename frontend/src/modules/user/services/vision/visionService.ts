import type { VisionAnalysis, VisionProfile, VisionImageSource } from "@/types/infrastructure";
import type { ApiResponse } from "@/types/api";
import { latency, offlineGuard } from "@/services/api/client";
import { infrastructureProfiles } from "@/data/infrastructure";
import { appStore } from "@/app/providers/store";

const MAX_HISTORY = 12;

export interface AnalyzeOptions {
  thumb: string | null;
  source: VisionImageSource;
  preferredProjectId?: string | null;
}

function pickProfile(preferredProjectId?: string | null): VisionProfile {
  const profiles = infrastructureProfiles;
  if (preferredProjectId) {
    const match = profiles.find((p) => p.projectMatch === preferredProjectId);
    if (match) return match;
  }
  const count = appStore.getState().visionCount;
  appStore.setState({ visionCount: count + 1 });
  if (count % 4 === 3) {
    return profiles.find((p) => p.projectMatch === null) ?? profiles[0];
  }
  const withProject = profiles.filter((p) => p.projectMatch !== null);
  return withProject[count % withProject.length];
}

function buildResult(profile: VisionProfile, opts: AnalyzeOptions): VisionAnalysis {
  const variants = profile.conditionVariants;
  const condition = variants
    ? variants[appStore.getState().visionCount % variants.length]
    : profile.defaultCondition;
  return {
    id: `VIS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
    analyzedAt: new Date().toISOString(),
    imageSource: opts.source,
    thumb: opts.thumb,
    infrastructureLabel: profile.label,
    shortLabel: profile.shortLabel,
    infrastructureType: profile.type,
    confidence: profile.confidence - Math.floor(Math.random() * 4),
    description: profile.description,
    details: profile.details,
    condition,
    authority: profile.authority,
    relatedProject: profile.projectMatch
      ? { projectId: profile.projectMatch, matchConfidence: 88 + Math.floor(Math.random() * 9) }
      : null,
    reportCategory: profile.reportCategory,
    saved: true,
    infoSubmitted: false
  };
}

const ANALYSIS_STEPS: readonly string[] = [
  "Reading image",
  "Identifying infrastructure",
  "Checking public project database",
  "Finding responsible authority"
];

export function analysisSteps(): readonly string[] {
  return ANALYSIS_STEPS;
}

export async function analyzeInfrastructure(opts: AnalyzeOptions): Promise<VisionAnalysis> {
  offlineGuard();
  await latency(700, 1100);
  await latency(750, 1050);
  await latency(700, 950);
  await latency(600, 850);
  return buildResult(pickProfile(opts.preferredProjectId), opts);
}

export async function analyzeWithSteps(
  opts: AnalyzeOptions,
  onStep: (step: string, index: number) => void
): Promise<VisionAnalysis> {
  for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
    onStep(ANALYSIS_STEPS[i], i);
    await latency(650, 900);
  }
  const result = buildResult(pickProfile(opts.preferredProjectId), opts);
  saveResult(result);
  return result;
}

export function getVisionHistory(): VisionAnalysis[] {
  return appStore.getState().vision;
}

export function saveResult(result: VisionAnalysis): VisionAnalysis {
  const list = appStore.getState().vision;
  if (!list.some((r) => r.id === result.id)) {
    appStore.setState({ vision: [result, ...list].slice(0, MAX_HISTORY) });
  }
  return result;
}

export function getVisionResult(id: string): VisionAnalysis | null {
  return appStore.getState().vision.find((r) => r.id === id) ?? null;
}

export function markInfoSubmitted(id: string): VisionAnalysis | null {
  const vision = appStore.getState().vision.map((r) => (r.id === id ? { ...r, infoSubmitted: true } : r));
  appStore.setState({ vision });
  return vision.find((r) => r.id === id) ?? null;
}

export function latestResult(): VisionAnalysis | null {
  return appStore.getState().vision[0] ?? null;
}

export type { ApiResponse };
