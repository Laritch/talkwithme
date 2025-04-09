export interface Point {
  x: number;
  y: number;
}

export enum ElementType {
  Rectangle = 'rectangle',
  Ellipse = 'ellipse',
  Line = 'line',
  Pencil = 'pencil',
  Text = 'text',
}

export enum ModerationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Flagged = 'flagged',
  Rejected = 'rejected',
}

export enum ModerationReason {
  None = 'none',
  ProfaneLanguage = 'profane_language',
  OffensiveContent = 'offensive_content',
  UnwantedSymbols = 'unwanted_symbols',
  Other = 'other',
}

export interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor: string;
  backgroundColor?: string;
  points?: Point[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  roughness?: number;
  moderationStatus: ModerationStatus;
  moderationReason?: ModerationReason;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface ModerationResult {
  status: ModerationStatus;
  reason?: ModerationReason;
  confidence: number;
  message?: string;
}

export interface ModerationConfig {
  enabled: boolean;
  autoModerate: boolean;
  blockRejected: boolean;
  sensitivity: number; // 0-100
  moderateText: boolean;
  moderateDrawings: boolean;
  customBlocklist?: string[];
  customAllowlist?: string[];
  notifyOnFlag: boolean;
}
