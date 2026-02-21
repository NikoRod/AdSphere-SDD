import { describe, it, expect } from "vitest";
import { transition } from "../domain/campaign.machine";
import type { CampaignCreationState, CampaignDraft } from "../domain/campaign.state";

const mockDraft: CampaignDraft = {
    name: "Winter Sale",
    startDate: "2026-12-01T00:00:00Z",
    endDate: "2026-12-31T23:59:59Z",
    screenIds: ["screen-2"],
    timeSlots: [],
    mediaAsset: { url: "https://example.com/winter.jpg", type: "image", sizeInMb: 12 },
};

describe("State Machine: Campaign Creation transition()", () => {
    it("transitions from idle to editing on START_CREATION with an empty draft", () => {
        const state: CampaignCreationState = { status: "idle" };
        const next = transition(state, { type: "START_CREATION" });
        expect(next.status).toBe("editing");
        if (next.status === "editing") {
            expect(next.draft).toBeDefined();
            expect(next.draft.name).toBe("");
        }
    });

    it("transitions from editing to validating on VALIDATE, keeping the draft", () => {
        const state: CampaignCreationState = { status: "editing", draft: mockDraft };
        const next = transition(state, { type: "VALIDATE" });
        expect(next.status).toBe("validating");
        if (next.status === "validating") {
            expect(next.draft).toBe(mockDraft);
        }
    });

    it("transitions from validating to invalid on VALIDATION_RESULT(invalid)", () => {
        const state: CampaignCreationState = { status: "validating", draft: mockDraft };
        const next = transition(state, {
            type: "VALIDATION_RESULT",
            result: { type: "invalid", errors: [{ code: "EMPTY_NAME", message: "Name is empty" }] },
        });
        expect(next.status).toBe("invalid");
        if (next.status === "invalid") {
            expect(next.errors).toHaveLength(1);
        }
    });

    it("transitions from validating to ready_to_publish on VALIDATION_RESULT(valid)", () => {
        const state: CampaignCreationState = { status: "validating", draft: mockDraft };
        const next = transition(state, {
            type: "VALIDATION_RESULT",
            result: { type: "valid" },
        });
        expect(next.status).toBe("ready_to_publish");
    });

    it("transitions to error from any state on SYSTEM_ERROR", () => {
        const state: CampaignCreationState = { status: "editing", draft: mockDraft };
        const next = transition(state, {
            type: "SYSTEM_ERROR",
            error: { message: "Database unreachable" },
        });
        expect(next.status).toBe("error");
        if (next.status === "error") {
            expect(next.error.message).toBe("Database unreachable");
        }
    });

    it("transitions from ready_to_publish to published on PUBLISH", () => {
        const state: CampaignCreationState = { status: "ready_to_publish", draft: mockDraft };
        const next = transition(state, {
            type: "PUBLISH",
            campaignId: "test-campaign-id",
        });
        expect(next.status).toBe("published");
        if (next.status === "published") {
            expect(next.campaignId).toBe("test-campaign-id");
        }
    });

    it("ignores invalid transitions without throwing (e.g., START_CREATION from ready_to_publish)", () => {
        const state: CampaignCreationState = { status: "ready_to_publish", draft: mockDraft };
        const next = transition(state, { type: "START_CREATION" });

        // Pure function returns the same state object reference when no transition is matched
        expect(next).toBe(state);
    });
});
