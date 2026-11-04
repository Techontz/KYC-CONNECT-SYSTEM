/**
 * Types derived from docs/API_CONTRACT.md (v1). Fields not spelled out in the contract are
 * marked optional so the UI degrades gracefully if the backend omits them.
 */

export type ID = string | number;

export type RoleKey =
  | "platform_admin"
  | "verifier"
  | "field_agent"
  | "association_admin"
  | "group_leader"
  | "rider"
  | "owner";

export type ProfileStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "verified"
  | "correction_required"
  | "rejected"
  | "archived";

export type VerificationType = "phone" | "identity" | "vehicle" | "membership";
export type VerificationMethod = "document_review" | "in_person" | "association_confirmation" | "phone_otp";
export type DecisionOutcome = "verified" | "correction_required" | "rejected";
export type RelationshipType = "owner" | "operator" | "keeper";
export type VehicleType = "motorcycle" | "bajaji";
export type SupportCategory = "correction" | "help" | "complaint";
export type SupportStatus = "open" | "in_progress" | "resolved" | "rejected";
export type DuplicateStatus = "open" | "confirmed_duplicate" | "not_duplicate";
export type DocumentType = "national_id" | "driving_licence" | "vehicle_registration" | "membership_letter" | "other";

export interface ListMeta {
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
  /** Notifications only (v1.1). */
  unread?: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export interface ItemResponse<T> {
  data: T;
}

export interface RoleAssignment {
  id?: ID;
  role: RoleKey;
  organisationId?: ID | null;
  organisationName?: string | null;
  groupId?: ID | null;
  groupName?: string | null;
  revokedAt?: string | null;
  grantedAt?: string | null;
  roleLabel?: string | null;
}

export interface Me {
  id: ID;
  phoneE164: string;
  status: string;
  person: { id: ID; legalName: string; preferredName?: string | null } | null;
  roles: RoleAssignment[];
  permissions: string[];
  displayName?: string;
}

export interface RiderListItem {
  id: ID;
  systemId: string;
  legalName: string;
  preferredName?: string | null;
  phoneMasked?: string | null;
  profileStatus: ProfileStatus;
  completeness?: number | { percent: number; missing?: string[] } | null;
  organisationName?: string | null;
  groupName?: string | null;
  parkingPointName?: string | null;
  createdAt: string;
  duplicateFlag?: boolean | { id?: ID; status?: DuplicateStatus } | null;
}

export interface Membership {
  id: ID;
  organisationId?: ID;
  organisationName?: string | null;
  membershipNumber?: string | null;
  status?: string | null;
  startAt?: string | null;
  endAt?: string | null;
}

export interface GroupMembership {
  id: ID;
  groupId?: ID;
  groupName?: string | null;
  parkingPointId?: ID | null;
  parkingPointName?: string | null;
  status?: string | null;
  startAt?: string | null;
  endAt?: string | null;
}

export interface VehicleRelationship {
  id: ID;
  vehicleId?: ID;
  personId?: ID;
  personName?: string | null;
  systemId?: string | null;
  relationshipType: RelationshipType;
  startAt?: string | null;
  endAt?: string | null;
  verificationStatus?: string | null;
  vehicle?: Partial<Vehicle> | null;
}

export interface Vehicle {
  id: ID;
  vehicleType: VehicleType;
  registrationNumber: string;
  registrationNumberNormalised?: string;
  make?: string | null;
  model?: string | null;
  colour?: string | null;
  status?: string | null;
  verificationStatus?: string | null;
  createdAt?: string;
  relationshipType?: RelationshipType;
  /** Rider detail: vehicles carry the rider's own relationship nested (v1.1). */
  relationship?: Partial<VehicleRelationship> | null;
  relationships?: VehicleRelationship[];
}

export interface VerificationCaseSummary {
  id: ID;
  verificationType: VerificationType;
  status: ProfileStatus;
  createdAt?: string;
  decidedAt?: string | null;
  assignedToName?: string | null;
}

export interface Consent {
  id: ID;
  purpose: string;
  purposeLabel?: string | null;
  granted: boolean;
  noticeVersion?: string | null;
  privacyNoticeVersion?: string | null;
  grantedAt?: string | null;
  recordedAt?: string | null;
  createdAt?: string | null;
  withdrawnAt?: string | null;
}

export interface DocumentMeta {
  id: ID;
  documentType: DocumentType | string;
  originalName?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt?: string | null;
  uploadedByName?: string | null;
}

export interface TimelineEntry {
  id?: ID;
  action: string;
  actorName?: string | null;
  entityType?: string | null;
  at?: string;
  createdAt?: string;
  summary?: string | null;
}

export interface Completeness {
  percent: number;
  missing: string[];
}

export interface RiderDetail {
  id: ID;
  systemId: string;
  legalName: string;
  preferredName?: string | null;
  phoneE164?: string | null;
  phoneMasked?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  identityReference?: string | null;
  profileStatus: ProfileStatus;
  captureMethod?: string | null;
  organisationName?: string | null;
  groupName?: string | null;
  parkingPointName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  memberships?: Membership[];
  groupMemberships?: GroupMembership[];
  vehicles?: Vehicle[];
  verificationCases?: VerificationCaseSummary[];
  consents?: Consent[];
  documents?: DocumentMeta[];
  completeness?: Completeness;
  timeline?: TimelineEntry[];
  duplicateFlag?: RiderListItem["duplicateFlag"];
  /** Group leaders get a reduced record (v1.1). */
  limitedView?: boolean;
  identityReferenceMasked?: string | null;
  organisationId?: ID | null;
  groupId?: ID | null;
  parkingPointId?: ID | null;
}

export interface DuplicateMatch {
  id: ID;
  systemId: string;
  legalName: string;
  reason: "phone" | "identity" | "plate" | "name";
  /** False when the match is outside the caller's scope (name reduced to initials). */
  inScope?: boolean;
  vehicleId?: ID | null;
  registrationNumber?: string | null;
}

export interface Organisation {
  id: ID;
  name: string;
  type?: string;
  region?: string | null;
  status?: string | null;
  counts?: { groups?: number; parkingPoints?: number; riders?: number; members?: number; vehicles?: number; verifiedMembers?: number };
  groupsCount?: number;
  parkingPointsCount?: number;
  ridersCount?: number;
}

export interface Group {
  id: ID;
  organisationId?: ID;
  name: string;
  code?: string | null;
  leaderPersonId?: ID | null;
  leaderName?: string | null;
  membersCount?: number | null;
  memberCount?: number | null;
  parkingPointCount?: number | null;
  status?: string | null;
}

/** GET /groups/{id}/members item (v1.1). */
export interface GroupMember {
  membershipId: ID;
  personId: ID;
  systemId: string;
  legalName: string;
  preferredName?: string | null;
  phoneMasked?: string | null;
  profileStatus: ProfileStatus;
  role?: string | null;
  parkingPointName?: string | null;
  status?: string | null;
  startAt?: string | null;
  endAt?: string | null;
}

export interface ParkingPoint {
  id: ID;
  organisationId?: ID;
  name: string;
  ward?: string | null;
  area?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface PersonRef {
  id: ID;
  systemId?: string | null;
  legalName?: string | null;
  phoneMasked?: string | null;
  profileStatus?: ProfileStatus;
}

export interface UserRef {
  id: ID;
  name?: string | null;
  legalName?: string | null;
}

export interface Decision {
  id: ID;
  outcome: DecisionOutcome;
  method: VerificationMethod;
  reasonCode: string;
  notes?: string | null;
  decidedBy?: UserRef | null;
  decidedByName?: string | null;
  decidedAt?: string | null;
  createdAt?: string | null;
}

export interface VerificationCase {
  id: ID;
  verificationType: VerificationType;
  status: ProfileStatus;
  subject?: PersonRef | null;
  person?: PersonRef | null;
  subjectName?: string | null;
  submittedBy?: UserRef | null;
  submittedByName?: string | null;
  assignedTo?: UserRef | null;
  assignedToName?: string | null;
  createdAt: string;
  updatedAt?: string;
  evidence?: DocumentMeta[];
  documents?: DocumentMeta[];
  history?: Decision[];
  decisions?: Decision[];
  submittedAt?: string | null;
  decidedAt?: string | null;
}

export interface DuplicateFlag {
  id: ID;
  status: DuplicateStatus;
  reason?: string | null;
  reasons?: string[] | null;
  score?: number | null;
  person?: PersonRef | null;
  matchedPerson?: PersonRef | null;
  createdAt?: string;
}

export interface DashboardSummary {
  totals: {
    riders: number;
    verified: number;
    pendingVerification: number;
    correctionRequired: number;
    drafts: number;
    vehicles: number;
    groups: number;
    parkingPoints: number;
    openDuplicates: number;
    openSupport: number;
  };
  completionRate: number;
  duplicateRate: number;
  medianTurnaroundHours: number | null;
  groupCoverage: { covered: number; total: number };
  funnel: { stage: string; count: number }[];
  registrationsByDay: { date: string; count: number }[];
  byGroup: { groupName: string; count: number }[];
  recentActivity: { action: string; actorName?: string | null; entityType?: string | null; at: string }[];
  definitions: Record<string, string>;
}

export interface ReportType {
  key: string;
  name: string;
  description?: string;
  fields: (string | { key: string; label?: string })[];
}

export interface ReportExport {
  id: ID;
  reportType: string;
  purpose: string;
  status?: string;
  rowCount?: number | null;
  filters?: Record<string, unknown> | null;
  createdAt: string;
  expiresAt?: string | null;
  fileName?: string | null;
  downloadAvailable?: boolean;
  downloadPath?: string | null;
  downloadedAt?: string | null;
  downloadCount?: number | null;
}

export interface PrivacyNotice {
  version: string;
  language: string;
  content: string;
  title?: string;
  publishedAt?: string;
}

export interface Disclosure {
  id: ID;
  subjectPersonId?: ID;
  subjectName?: string | null;
  recipientOrgId?: ID;
  recipientOrgName?: string | null;
  purpose: string;
  dataCategories: string[];
  legalBasis: string;
  expiryAt?: string | null;
  createdAt?: string;
  disclosedByName?: string | null;
}

export interface SupportRequest {
  id: ID;
  category: SupportCategory;
  status: SupportStatus;
  description?: string | null;
  subjectPersonId?: ID | null;
  subjectName?: string | null;
  subject?: PersonRef | null;
  requesterName?: string | null;
  field?: string | null;
  proposedValue?: string | null;
  reason?: string | null;
  resolutionSummary?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  reference?: string | null;
  subjectSystemId?: string | null;
  requestedBy?: { id: ID; name?: string | null } | string | null;
  resolvedBy?: { id: ID; name?: string | null } | string | null;
}

export interface Notification {
  id: ID;
  title: string;
  body?: string | null;
  type?: string | null;
  readAt?: string | null;
  createdAt: string;
  organisationName?: string | null;
}

export interface User {
  id: ID;
  phoneE164: string;
  status: string;
  legalName?: string | null;
  name?: string | null;
  displayName?: string | null;
  personId?: ID | null;
  person?: { id: ID; legalName: string } | null;
  roles: RoleAssignment[];
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AuditEvent {
  id: ID;
  action: string;
  actorId?: ID | null;
  actorName?: string | null;
  entityType?: string | null;
  entityId?: ID | null;
  requestId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  at?: string;
}

/** Lookup entries may be plain strings or objects; normalise with `toOptions`. */
export type LookupEntry =
  | string
  | { key?: string; code?: string; value?: string; id?: ID; label?: string; name?: string; labelSw?: string; labelEn?: string; outcome?: string; required?: boolean };

export interface Lookups {
  wards: LookupEntry[];
  documentTypes: LookupEntry[];
  reasonCodes: LookupEntry[];
  vehicleMakes: LookupEntry[];
  consentPurposes: LookupEntry[];
  genders?: LookupEntry[];
  verificationMethods?: LookupEntry[];
  roles?: LookupEntry[];
}
