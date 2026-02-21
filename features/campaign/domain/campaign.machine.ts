// ---------------------------------------------------------------------------
// Campaign Creation – State Machine
// Derived strictly from: features/campaign/spec/campaign.spec.md
// Pure function. No side effects. No external dependencies.
// ---------------------------------------------------------------------------

import type {
    CampaignCreationState,
    CampaignDraft,
    SystemError,
} from "./campaign.state";
import { CampaignValidationResult } from "./campaign.validation";

// ── Events ───────────────────────────────────────────────────────────────────

/** Triggered when the user begins a new campaign creation flow. */
export interface StartCreationEvent {
    readonly type: "START_CREATION";
}

/** Triggered when the user modifies any field of the campaign draft. */
export interface UpdateDraftEvent {
    readonly type: "UPDATE_DRAFT";
    draft: CampaignDraft;
}

/** Triggered to initiate business-rule validation. */
export interface ValidateEvent {
    readonly type: "VALIDATE";
}

/** Triggered when the validation step returns a result. */
export interface ValidationResultEvent {
    readonly type: "VALIDATION_RESULT";
    result: CampaignValidationResult;
}

/** Triggered to publish the validated campaign. */
export interface PublishEvent {
    readonly type: "PUBLISH";
    campaignId: string;
}

/** Triggered on an unexpected system failure from any state. */
export interface SystemErrorEvent {
    readonly type: "SYSTEM_ERROR";
    error: SystemError;
}

export type CampaignEvent =
    | StartCreationEvent
    | UpdateDraftEvent
    | ValidateEvent
    | ValidationResultEvent
    | PublishEvent
    | SystemErrorEvent;

// ── Transition function ───────────────────────────────────────────────────────

/**
 * Pure state transition function for the Campaign Creation state machine.
 *
 * Only transitions explicitly defined in the spec are allowed.
 * Any event that does not apply to the current state returns the state unchanged.
 *
 * Spec-defined transitions:
 *   idle              -> editing           (START_CREATION)
 *   editing           -> validating        (VALIDATE)
 *   validating        -> invalid           (VALIDATION_RESULT)
 *   validating        -> conflict_detected (VALIDATION_RESULT)
 *   validating        -> ready_to_publish  (VALIDATION_RESULT)
 *   invalid           -> editing           (UPDATE_DRAFT)
 *   conflict_detected -> editing           (UPDATE_DRAFT)
 *   ready_to_publish  -> published         (PUBLISH)
 *   any               -> error             (SYSTEM_ERROR)
 */
export function transition(
    state: CampaignCreationState,
    event: CampaignEvent
): CampaignCreationState {
    // SYSTEM_ERROR is valid from any state.
    if (event.type === "SYSTEM_ERROR") {
        return { status: "error", error: event.error };
    }

    switch (state.status) {
        case "idle": {
            if (event.type === "START_CREATION") {
                return {
                    status: "editing",
                    draft: {
                        name: "",
                        startDate: "",
                        endDate: "",
                        screenIds: [""],
                        timeSlots: [],
                        mediaAsset: { url: "", type: "image", sizeInMb: 0 },
                    },
                };
            }
            return state;
        }

        case "editing": {
            if (event.type === "UPDATE_DRAFT") {
                return { status: "editing", draft: event.draft };
            }
            if (event.type === "VALIDATE") {
                return { status: "validating", draft: state.draft };
            }
            return state;
        }

        case "validating": {
            if (event.type === "VALIDATION_RESULT") {
                switch (event.result.type) {
                    case "invalid":
                        return {
                            status: "invalid",
                            draft: state.draft,
                            errors: event.result.errors,
                        };

                    case "conflict":
                        return {
                            status: "conflict_detected",
                            draft: state.draft,
                        };

                    case "valid":
                        return {
                            status: "ready_to_publish",
                            draft: state.draft,
                        };
                }
            }
            return state;
        }

        case "invalid": {
            if (event.type === "UPDATE_DRAFT") {
                return { status: "editing", draft: event.draft };
            }
            return state;
        }

        case "conflict_detected": {
            if (event.type === "UPDATE_DRAFT") {
                return { status: "editing", draft: event.draft };
            }
            return state;
        }

        case "ready_to_publish": {
            if (event.type === "PUBLISH") {
                return { status: "published", campaignId: event.campaignId };
            }
            return state;
        }

        case "published":
        case "error": {
            // Terminal states — no transitions defined in the spec.
            return state;
        }
    }
}
