// ---------------------------------------------------------------------------
// Campaign Creation – Validate Campaign Use Case
// Pure function. No side effects. No external dependencies.
// ---------------------------------------------------------------------------

import type { CampaignCreationState } from "../domain/campaign.state";
import type { CampaignValidationResult } from "../domain/campaign.validation";
import { validateCampaignDraft } from "../domain/campaign.rules";
import { transition } from "../domain/campaign.machine";

/**
 * Application use case: validate a campaign draft.
 *
 * Steps (only when state is "editing"):
 *   1. Transition editing → validating via VALIDATE event.
 *   2. Run all business-rule validators against the draft.
 *   3. Build a CampaignValidationResult from the results.
 *   4. Dispatch VALIDATION_RESULT to produce the final state.
 *
 * If the state is not "editing", it is returned unchanged.
 * The function is pure: no mutations, no side effects.
 */
export function validateCampaign(
    state: CampaignCreationState
): CampaignCreationState {
    if (state.status !== "editing") {
        return state;
    }

    // Step 1: move to "validating".
    const validatingState = transition(state, { type: "VALIDATE" });

    // Guard: transition() may return unchanged state if the event is not
    // applicable. This should never happen given the guard above, but keeps
    // the function total.
    if (validatingState.status !== "validating") {
        return state;
    }

    // Step 2: run business-rule validation (conflict detection excluded).
    const errors = validateCampaignDraft(validatingState.draft);

    // Step 3: build CampaignValidationResult.
    const result: CampaignValidationResult =
        errors.length > 0
            ? { type: "invalid", errors: [errors[0]!, ...errors.slice(1)] }
            : { type: "valid" };

    // Step 4: dispatch VALIDATION_RESULT.
    return transition(validatingState, { type: "VALIDATION_RESULT", result });
}
