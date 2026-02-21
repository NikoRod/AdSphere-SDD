// ---------------------------------------------------------------------------
// Campaign Creation – Validation Rules
// Derived strictly from: features/campaign/spec/campaign.spec.md
// No side effects. No external dependencies. Pure functions only.
// ---------------------------------------------------------------------------

import type {
    CampaignDraft,
    TimeSlot,
    ValidationError,
    ValidationErrorCode,
} from "./campaign.state";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeError(
    code: ValidationErrorCode,
    message: string
): ValidationError {
    return { code, message };
}

/**
 * Parses an HH:mm string into total minutes since midnight.
 * Returns NaN if the format is invalid.
 */
function parseHHmm(value: string): number {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return NaN;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours > 23 || minutes > 59) return NaN;
    return hours * 60 + minutes;
}

// ── Individual rule validators ───────────────────────────────────────────────

/**
 * Rule 1: name must not be empty.
 */
function validateName(draft: CampaignDraft): ValidationError[] {
    if (draft.name.trim().length === 0) {
        return [makeError("EMPTY_NAME", "Campaign name must not be empty.")];
    }
    return [];
}

/**
 * Rule 2: startDate must be before endDate.
 * Uses ISO 8601 lexicographic comparison via Date.parse — no date libraries.
 */
function validateDateRange(draft: CampaignDraft): ValidationError[] {
    const start = Date.parse(draft.startDate);
    const end = Date.parse(draft.endDate);

    if (isNaN(start) || isNaN(end)) {
        return [
            makeError(
                "INVALID_DATE_FORMAT",
                "startDate and endDate must be valid ISO 8601 strings."
            ),
        ];
    }

    if (start >= end) {
        return [
            makeError(
                "INVALID_DATE_RANGE",
                "startDate must be before endDate."
            ),
        ];
    }

    return [];
}

/**
 * Rule 3: screenIds must contain at least 1 item.
 */
function validateScreenIds(draft: CampaignDraft): ValidationError[] {
    if (draft.screenIds.length === 0) {
        return [
            makeError(
                "EMPTY_SCREEN_SELECTION",
                "At least one screen must be selected."
            ),
        ];
    }
    return [];
}

/**
 * Rule 4: timeSlots must not overlap.
 * Also validates HH:mm format and that startTime < endTime per slot.
 */
function validateTimeSlots(draft: CampaignDraft): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate format and internal order of each slot.
    for (const slot of draft.timeSlots) {
        const start = parseHHmm(slot.startTime);
        const end = parseHHmm(slot.endTime);

        if (isNaN(start) || isNaN(end)) {
            errors.push(
                makeError(
                    "INVALID_TIME_FORMAT",
                    `Time slot "${slot.startTime} – ${slot.endTime}" contains an invalid HH:mm value.`
                )
            );
            continue; // Cannot check order if format is invalid.
        }

        if (start >= end) {
            errors.push(
                makeError(
                    "INVALID_TIME_FORMAT",
                    `Time slot startTime "${slot.startTime}" must be before endTime "${slot.endTime}".`
                )
            );
        }
    }

    // Only check overlaps when all slots have valid formats.
    if (errors.length === 0) {
        const sorted = [...draft.timeSlots].sort(
            (a, b) => parseHHmm(a.startTime) - parseHHmm(b.startTime)
        );

        for (let i = 0; i < sorted.length - 1; i++) {
            const currentEnd = parseHHmm((sorted[i] as TimeSlot).endTime);
            const nextStart = parseHHmm((sorted[i + 1] as TimeSlot).startTime);
            if (currentEnd > nextStart) {
                errors.push(
                    makeError(
                        "OVERLAPPING_TIME_SLOTS",
                        `Time slot "${(sorted[i] as TimeSlot).startTime}–${(sorted[i] as TimeSlot).endTime}" overlaps with "${(sorted[i + 1] as TimeSlot).startTime}–${(sorted[i + 1] as TimeSlot).endTime}".`
                    )
                );
            }
        }
    }

    return errors;
}

/**
 * Rule 5: mediaAsset must pass validation.
 *   - sizeInMb must be <= 50
 *   - type must be "image" | "video" (enforced by the type system, guard retained
 *     in case of runtime data crossing the boundary)
 */
function validateMediaAsset(draft: CampaignDraft): ValidationError[] {
    const errors: ValidationError[] = [];

    if (draft.mediaAsset.sizeInMb > 50) {
        errors.push(
            makeError(
                "MEDIA_SIZE_EXCEEDS_LIMIT",
                `Media asset size ${draft.mediaAsset.sizeInMb} MB exceeds the 50 MB limit.`
            )
        );
    }

    if (
        draft.mediaAsset.type !== "image" &&
        draft.mediaAsset.type !== "video"
    ) {
        errors.push(
            makeError(
                "MEDIA_TYPE_NOT_ALLOWED",
                `Media type "${draft.mediaAsset.type}" is not allowed. Must be "image" or "video".`
            )
        );
    }

    return errors;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates all business rules for a CampaignDraft.
 *
 * Each rule is evaluated independently. Returns an empty array when the draft
 * is fully valid. Does NOT check for scheduling conflicts — that is handled
 * separately by the conflict detection step.
 */
export function validateCampaignDraft(draft: CampaignDraft): ValidationError[] {
    return [
        ...validateName(draft),
        ...validateDateRange(draft),
        ...validateScreenIds(draft),
        ...validateTimeSlots(draft),
        ...validateMediaAsset(draft),
    ];
}
