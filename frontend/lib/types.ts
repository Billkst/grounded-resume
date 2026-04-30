export type MaterialType =
  | "education"
  | "project"
  | "competition"
  | "campus"
  | "skill"
  | "work"
  | "other";

export type Tone = "conservative" | "balanced" | "confident";

export type HardType =
  | "education"
  | "major"
  | "location"
  | "availability"
  | "language"
  | "tool"
  | "visa"
  | "other";

export type EvidenceType =
  | "project_outcome"
  | "technical_depth"
  | "product_judgment"
  | "research_analysis"
  | "collaboration"
  | "learning_agility"
  | "communication";

export type Priority = "critical" | "important" | "nice_to_have";

export type JobLevel = "intern" | "junior" | "mid" | "senior";

export type JDSection = "description" | "requirements" | "preferred" | "other";

export type FactType =
  | "action"
  | "outcome"
  | "skill_possessed"
  | "skill_used"
  | "knowledge"
  | "trait";

export type FactConfidence = "explicit" | "inferred_weak" | "inferred_strong";

export type RoleLevel = "solo" | "lead" | "core" | "participant" | "observer";

export type MappingType = "direct" | "semantic" | "inferential" | "composite";

export type EvidenceStrength = "strong" | "moderate" | "weak" | "insufficient";

export type GapType =
  | "missing_evidence"
  | "insufficient_depth"
  | "unclear_scope"
  | "temporal_mismatch";

export type GapSeverity = "critical" | "major" | "minor";

export type SectionType =
  | "basic_info"
  | "education"
  | "experience"
  | "skills"
  | "summary"
  | "additional";

export type ExpressionLevel = "literal" | "conservative" | "standard" | "emphasized";

export type RiskLevel = "safe" | "caution" | "warning" | "redline";

export type RewriteOperator = "system" | "guardrail" | "user";

export type RiskType =
  | "fabrication"
  | "exaggeration"
  | "role_inflation"
  | "outcome_inference"
  | "scope_ambiguity"
  | "temporal_fabrication"
  | "keyword_injection";

export type FindingSeverity = "info" | "warning" | "error";

export type RevisionPriority = "mandatory" | "suggested";

export type Recommendation = "approve" | "revise" | "reject";

export type UserDecisionValue = "approve" | "revise" | "reject";

export type GapUserAction = "accept" | "will_supplement" | "acknowledge";

export type AttachmentType =
  | "evidence_map"
  | "gap_report"
  | "risk_summary"
  | "modification_guide";

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  github?: string;
  blog?: string;
  location?: string;
}

export interface TargetJob {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  sourceUrl?: string;
}

export interface RawMaterial {
  id: string;
  type: MaterialType;
  title: string;
  content: string;
  timestamp?: string;
  sourceHint?: string;
}

export interface UserPreferences {
  tone?: Tone;
  allowDowngrade?: boolean;
  showGapAnalysis?: boolean;
  maxBullets?: number;
}

export interface UserInput {
  profile: UserProfile;
  targetJob: TargetJob;
  materials: RawMaterial[];
  preferences?: UserPreferences;
}

export interface HardRequirement {
  id: string;
  category: HardType;
  description: string;
  sourceText: string;
  isSatisfiableByEvidence: boolean;
}

export interface CapabilityRequirement {
  id: string;
  capability: string;
  description: string;
  evidenceType: EvidenceType;
  priority: Priority;
  sourceText: string;
  relatedKeywords: string[];
}

export interface JobContext {
  jobLevel: JobLevel;
  teamFocus: string[];
  productStage?: string;
  techStackMentioned: string[];
  cultureSignals: string[];
}

export interface JDExcerpt {
  id: string;
  text: string;
  section: JDSection;
  lineNumber?: number;
}

export interface JDParsedResult {
  jobId: string;
  hardRequirements: HardRequirement[];
  coreCapabilities: CapabilityRequirement[];
  niceToHave: CapabilityRequirement[];
  derivedContext: JobContext;
  parserConfidence: number;
  rawExcerpts: JDExcerpt[];
}

export interface MaterialFact {
  id: string;
  sourceMaterialId: string;
  factType: FactType;
  statement: string;
  confidence: FactConfidence;
  temporalScope?: string;
  roleIndicator?: RoleLevel;
  skillTags: string[];
  topicTags: string[];
  outcomeTags: string[];
}

export interface SourceFragment {
  id: string;
  materialId: string;
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface ParserNote {
  level: "info" | "warning" | "critical";
  materialId: string;
  message: string;
}

export interface MaterialParseResult {
  facts: MaterialFact[];
  fragments: SourceFragment[];
  parserNotes: ParserNote[];
}

export interface EvidenceMapping {
  id: string;
  jdRequirementId: string;
  materialFactIds: string[];
  mappingType: MappingType;
  strength: EvidenceStrength;
  reasoning: string;
  directQuote: string;
}

export interface GapItem {
  id: string;
  jdRequirementId: string;
  gapType: GapType;
  description: string;
  severity: GapSeverity;
  recommendation?: string;
}

export interface OverclaimItem {
  id: string;
  materialFactId: string;
  reason: string;
  suggestion?: string;
}

export interface EvidenceMappingResult {
  mappings: EvidenceMapping[];
  gaps: GapItem[];
  overclaims: OverclaimItem[];
  mappingConfidence: number;
}

export interface EvidenceRef {
  mappingId: string;
  factIds: string[];
  sourceFragments: string[];
}

export interface RewriteStep {
  step: number;
  from: string;
  to: string;
  reason: string;
  operator: RewriteOperator;
}

export interface UserOverride {
  approved: boolean;
  modifiedText?: string;
  rejectionReason?: string;
}

export interface ResumeBullet {
  id: string;
  text: string;
  evidenceRefs: EvidenceRef[];
  expressionLevel: ExpressionLevel;
  rewriteChain: RewriteStep[];
  riskLevel: RiskLevel;
  userOverride?: UserOverride;
}

export interface ResumeSection {
  id: string;
  sectionType: SectionType;
  title: string;
  bullets: ResumeBullet[];
  order: number;
}

export interface GenerationLog {
  step: string;
  decision: string;
  rationale: string;
}

export interface RiskFlag {
  bulletId: string;
  riskType: RiskType;
  severity: "low" | "medium" | "high";
  description: string;
  suggestedFix: string;
  autoResolved: boolean;
}

export interface ResumeDraft {
  version: number;
  sections: ResumeSection[];
  generationLog: GenerationLog[];
  riskFlags: RiskFlag[];
}

export interface Finding {
  bulletId: string;
  issue: string;
  severity: FindingSeverity;
  evidence?: string;
}

export interface CheckResult {
  checkId: string;
  checkName: string;
  passed: boolean;
  score: number;
  findings: Finding[];
}

export interface ValidationScore {
  authenticity: number;
  jdAlignment: number;
  expressionQuality: number;
  structuralCompleteness: number;
  modificationCostEstimate: number;
}

export interface RevisionItem {
  id: string;
  bulletId: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  priority: RevisionPriority;
  resolved: boolean;
}

export interface ValidationResult {
  passed: boolean;
  checks: CheckResult[];
  overallScore: ValidationScore;
  mandatoryRevisions: RevisionItem[];
  suggestedRevisions: RevisionItem[];
}

export interface EvidencePreview {
  sourceMaterialTitle: string;
  directQuotes: string[];
  mappingReasoning: string;
}

export interface ConfirmationItem {
  id: string;
  bulletId: string;
  proposedText: string;
  evidencePreview: EvidencePreview;
  riskNotes: string[];
  systemRecommendation: Recommendation;
}

export interface UserDecision {
  confirmationItemId: string;
  decision: UserDecisionValue;
  revisedText?: string;
  userComment?: string;
  timestamp: string;
}

export interface GapAcknowledgment {
  gapId: string;
  userAction: GapUserAction;
  userComment?: string;
}

export interface ConfirmationSession {
  sessionId: string;
  resumeVersion: number;
  items: ConfirmationItem[];
  userDecisions: UserDecision[];
  finalResume: ResumeDraft;
  gapAcknowledgments: GapAcknowledgment[];
}

export interface OutputMetadata {
  targetJob: TargetJob;
  generationTimestamp: string;
  version: string;
  confidence: number;
  materialCoverage: number;
  gapCount: number;
}

export interface OutputAttachment {
  type: AttachmentType;
  title: string;
  content: string;
}

export interface ResumeOutput {
  resume: ResumeDraft;
  metadata: OutputMetadata;
  attachments: OutputAttachment[];
  // Frontend convenience field: pre-rendered Markdown of the final resume
  resumeMarkdown?: string;
}
