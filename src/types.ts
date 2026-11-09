export interface ReportSection {
  title: string;
  content: string;
}

export type TagType = 'analysis' | 'tech' | 'dcm' | 'announcement' | 'newsletter' | 'brief' | 'africa-election-watch';

export interface Report {
  id: string;
  tag: string;
  tagType: TagType;
  date: string;
  normalizedDate?: string;
  datePrecision?: 'day' | 'month' | 'year';
  sortValue?: number;
  size: string;
  title: string;
  summary: string;
  sections: ReportSection[];
  author?: string;
  authorsList?: string;
  readingTime?: string;
  image?: string;
  researchArea?: string;
  pdfUrl?: string;
  downloadSectionTitle?: string;
  downloadButtonLabel?: string;
  slug?: string;
  createdAt?: number;
  reads?: number;
  downloads?: number;
  status?: 'current' | 'archived' | string;
  reportingPeriod?: string;
}

export interface CandidateParticipant {
  name: string;
  party: string;
  role?: string;
  platform?: string;
}

export interface SittingExecutive {
  name: string;
  title: string;
  party: string;
  termInfo?: string;
  assumedOffice?: string;
  notes?: string;
}

export interface DiaryItem {
  id: string;
  date: string;
  normalizedDate?: string;
  datePrecision?: 'day' | 'month' | 'year';
  sortValue?: number;
  title: string;
  subtitle: string;
  status: 'In view' | 'Scheduled' | 'Provisional' | 'Tracking' | 'Concluded';
  region?: 'nigeria' | 'africa' | 'other';
  type?: 'presidential' | 'governorship' | 'local_government' | 'other';
  country?: string;
  location?: string;
  electoralBody?: string;
  registeredVoters?: string;
  pollingUnits?: string;
  lgasCount?: string;
  description?: string;
  stateCode?: string;
  sittingExecutive?: SittingExecutive;
  participants?: CandidateParticipant[];
  keyIssues?: string[];
  monitoringMission?: string;
}

export interface EventLink {
  label: string;
  url: string;
  external?: boolean;
}

export interface EventItem {
  id: string;
  month: string;
  day: string;
  date?: string;
  normalizedDate?: string;
  datePrecision?: 'day' | 'month' | 'year';
  sortValue?: number;
  title: string;
  description: string;
  location: string;
  type: string;
  imageUrl?: string;
  externalLink?: string;
  links?: EventLink[];
}

export interface TeamMember {
  id: string;
  initials: string;
  name: string;
  role: string;
}

export interface WeeklySection {
  title: string;
  text: string;
}

export interface WeeklyIssue {
  id: string;
  tag: string;
  date: string;
  normalizedDate?: string;
  datePrecision?: 'day' | 'month' | 'year';
  sortValue?: number;
  title: string;
  summary: string;
  linkText: string;
  author?: string;
  authorsList?: string;
  readingTime?: string;
  sections?: WeeklySection[];
  image?: string;
  pdfUrl?: string;
  downloadSectionTitle?: string;
  downloadButtonLabel?: string;
  slug?: string;
  createdAt?: number;
  reads?: number;
  downloads?: number;
}

export interface HeroConfig {
  badgeText: string;
  title: string;
  description: string;
  exploreButtonText: string;
  auditButtonText: string;
  
  // Spotlight
  spotlightBadgeText: string;
  spotlightStatusText: string;
  spotlightTitle: string;
  spotlightDateText: string;
  spotlightTargetDate: string;
  
  // Spotlight specs
  lgasCount: string;
  registeredVoters: string;
  pollingUnits: string;
  spotlightBottomText: string;
  diaryLinkText: string;

  // Custom styling settings for colors, font size, and font type
  heroBgColor?: string; // background color or hex (e.g. bg-navy, bg-slate-900, or hex #123456)
  titleFontSize?: string; // e.g. "text-4xl sm:text-5xl lg:text-6xl"
  titleFontFamily?: string; // e.g. "font-sans", "font-display", "font-mono"
  titleColor?: string; // e.g. "text-white" or custom Hex
  titleHighlightFrom?: string; // e.g. "#93C5FD" (blue-300)
  titleHighlightTo?: string; // e.g. "#86EFAC" (green-300)
  descriptionFontSize?: string; // e.g. "text-base sm:text-lg"
  descriptionFontFamily?: string; // e.g. "font-sans", "font-display", "font-mono"
  descriptionColor?: string; // e.g. "text-blue-100" or hex
}

export interface StatItemConfig {
  id: number;
  title: string;
  value: string;
  sub: string;
  detail: string;
  color: string; // fallback background gradient class
  iconName: 'Shield' | 'Database' | 'FileSpreadsheet' | 'Globe';

  // Custom styling settings
  cardBgType?: 'gradient' | 'solid';
  cardBgSolid?: string; // Hex color
  cardBgGradFrom?: string; // Hex or tailwind class
  cardBgGradTo?: string; // Hex or tailwind class
  titleFontSize?: string; // e.g. "text-xs"
  titleFontFamily?: string; // e.g. "font-sans", "font-display", "font-mono"
  titleColor?: string; // e.g. "text-white/80" or custom hex
  valueFontSize?: string; // e.g. "text-3xl sm:text-4xl"
  valueFontFamily?: string; // e.g. "font-sans", "font-display", "font-mono"
  valueColor?: string; // e.g. "text-white" or custom hex
}

export interface AnnouncementItem {
  id: string;
  month: string;
  day: string;
  date: string;
  normalizedDate?: string;
  datePrecision?: 'day' | 'month' | 'year';
  sortValue?: number;
  title: string;
  summary: string;
  content?: string;
  category: 'press' | 'bulletin' | 'statement' | 'alert';
  author?: string;
  authorsList?: string;
  readingTime?: string;
  image?: string;
  pdfUrl?: string;
  downloadSectionTitle?: string;
  downloadButtonLabel?: string;
  slug?: string;
  createdAt?: number;
  reads?: number;
  downloads?: number;
}

