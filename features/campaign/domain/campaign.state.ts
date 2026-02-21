// ---------------------------------------------------------------------------
// Campaign Creation – Domain State Types
// Derived strictly from: features/campaign/spec/campaign.spec.md
// ---------------------------------------------------------------------------

// ── Supporting value types ──────────────────────────────────────────────────

export interface TimeSlot {
    /** HH:mm, 24-hour format */
    startTime: string;
    /** HH:mm, 24-hour format */
    endTime: string;
}

export interface MediaAsset {
    url: string;
    type: "image" | "video";
    /** Must be <= 50 */
    sizeInMb: number;
}

export interface CampaignDraft {
    /** Non-empty string */
    name: string;
    /** ISO 8601 */
    startDate: string;
    /** ISO 8601 */
    endDate: string;
    /** Must contain at least 1 item */
    screenIds: [string, ...string[]];
    timeSlots: TimeSlot[];
    mediaAsset: MediaAsset;
}

// ── Typed validation / error structures ────────────────────────────────────

export type ValidationErrorCode =
    | "EMPTY_NAME"
    | "INVALID_DATE_RANGE"
    | "INVALID_DATE_FORMAT"
    | "OVERLAPPING_TIME_SLOTS"
    | "EMPTY_SCREEN_SELECTION"
    | "MEDIA_SIZE_EXCEEDS_LIMIT"
    | "MEDIA_TYPE_NOT_ALLOWED"
    | "INVALID_TIME_FORMAT";

export interface ValidationError {
    code: ValidationErrorCode;
    message: string;
}

export interface SystemError {
    message: string;
}

// ── Discriminated union ─────────────────────────────────────────────────────

/** No campaign is being created. */
export interface IdleState {
    readonly status: "idle";
}

/** User is modifying campaign data. */
export interface EditingState {
    readonly status: "editing";
    draft: CampaignDraft;
}

/** System is checking business rules. */
export interface ValidatingState {
    readonly status: "validating";
    draft: CampaignDraft;
}

/** One or more business rules failed. */
export interface InvalidState {
    readonly status: "invalid";
    draft: CampaignDraft;
    errors: [ValidationError, ...ValidationError[]];
}

/** Campaign conflicts with existing scheduled campaigns. */
export interface ConflictDetectedState {
    readonly status: "conflict_detected";
    draft: CampaignDraft;
}

/** All validations passed and no conflicts detected. */
export interface ReadyToPublishState {
    readonly status: "ready_to_publish";
    draft: CampaignDraft;
}

/** Campaign has been successfully published. */
export interface PublishedState {
    readonly status: "published";
    /** Server-generated identifier for the created campaign. */
    campaignId: string;
}

/** Unexpected system failure. */
export interface ErrorState {
    readonly status: "error";
    error: SystemError;
}

// ── Root union ──────────────────────────────────────────────────────────────

export type CampaignCreationState =
    | IdleState
    | EditingState
    | ValidatingState
    | InvalidState
    | ConflictDetectedState
    | ReadyToPublishState
    | PublishedState
    | ErrorState;
