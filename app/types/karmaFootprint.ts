export type KarmaFootprintCategory =
  | "duty_action"
  | "desire_driven_action"
  | "helpful_action"
  | "avoided_action"
  | "mixed";

export type KarmaFootprintImpact = "positive" | "neutral" | "negative" | "unclear";

export type KarmaFootprintLevel =
  | "strong_positive"
  | "mild_positive"
  | "neutral"
  | "mild_heavy"
  | "heavy";

export interface KarmaFootprintAction {
  description: string;
  category: KarmaFootprintCategory;
  intention_label: string;
  impact: KarmaFootprintImpact;
  karma_delta: -2 | -1 | 0 | 1 | 2;
  note: string;
}

export interface KarmaFootprintSummary {
  date: string | null;
  actions: KarmaFootprintAction[];
  total_score: number;
  footprint_level: KarmaFootprintLevel;
  overall_interpretation: string;
  tomorrow_suggestion: string;
}

export interface KarmaFootprintAPIResponse {
  status: "success" | "partial_success" | "error";
  analysis?: KarmaFootprintSummary;
  raw_text?: string | null;
  model: string;
  provider: string;
}

export interface KarmaFootprintRequestPayload {
  date?: string | null;
  actions: string[];
}

/**
 * Kiaan compatibility guardrail: clients should only call this module when
 * explicitly requesting Karma Footprint analysis, and should not override or
 * mutate Kiaan conversations. Keep Kiaan responses intact.
 */
export const KARMA_SYSTEM_PROMPT_HEADER =
  "Karma Footprint Engine is a standalone reflection assistant. It must never replace, rewrite, or intercept Kiaan responses.";
