export type ExperienceLevel = 'new_grad' | '1_3_years' | '3_5_years' | '5_10_years' | '10_plus_years';

export interface LlmConfigInput {
  provider: string;
  model: string;
  apiKey: string;
}

export interface GenerateRequest {
  experienceLevel: ExperienceLevel;
  targetRole: string;
  background: string;
  jdText: string;
  jobProfileId?: string;
  llmConfig: LlmConfigInput;
}

export interface ResumeSection {
  sectionType: 'basic_info' | 'summary' | 'skills' | 'experience' | 'education';
  title: string;
  content: string;
}

export interface IdealResume {
  markdown: string;
  sections: ResumeSection[];
}

export interface BlockerItem {
  gap: string;
  whyFatal: string;
  alternative: string;
}

export interface CriticalGapItem {
  ideal: string;
  current: string;
  actionPath: string;
  estimatedTime: string;
}

export interface ExpressionTip {
  fromText: string;
  toText: string;
  method: string;
}

export interface GapReport {
  overallScore: number;
  summary: string;
  blockers: BlockerItem[];
  criticalGaps: CriticalGapItem[];
  expressionTips: ExpressionTip[];
}

export interface GenerateResponse {
  session_id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: string;
  ideal_resume?: IdealResume;
  gap_report?: GapReport;
  error?: string;
}
