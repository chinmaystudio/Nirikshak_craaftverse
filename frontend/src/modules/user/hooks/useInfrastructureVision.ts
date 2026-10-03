import { useCallback, useState } from "react";
import { useAppState } from "@/app/providers/store";
import { analyzeWithSteps, getVisionResult, markInfoSubmitted } from "@/services/vision/visionService";
import type { VisionAnalysis, VisionImageSource } from "@/types/infrastructure";

export const ANALYSIS_STEPS: readonly string[] = [
  "Reading image",
  "Identifying infrastructure",
  "Checking public project database",
  "Finding responsible authority"
];

export interface AnalyzeInput {
  thumb: string | null;
  source: VisionImageSource;
  preferredProjectId?: string | null;
}

export interface UseInfrastructureVisionResult {
  history: VisionAnalysis[];
  analyzing: boolean;
  analysisStep: number;
  analyze: (opts: AnalyzeInput) => Promise<VisionAnalysis>;
  getResult: (id: string) => VisionAnalysis | null;
  submitInfo: (id: string) => void;
}

export function useInfrastructureVision(): UseInfrastructureVisionResult {
  const history = useAppState((s) => s.vision);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(-1);

  const analyze = useCallback(async (opts: AnalyzeInput): Promise<VisionAnalysis> => {
    setAnalyzing(true);
    setAnalysisStep(0);
    try {
      return await analyzeWithSteps(opts, (_step, index) => setAnalysisStep(index));
    } finally {
      setAnalyzing(false);
      setAnalysisStep(-1);
    }
  }, []);

  const getResult = useCallback((id: string): VisionAnalysis | null => getVisionResult(id), []);

  const submitInfo = useCallback((id: string): void => {
    markInfoSubmitted(id);
  }, []);

  return { history, analyzing, analysisStep, analyze, getResult, submitInfo };
}
