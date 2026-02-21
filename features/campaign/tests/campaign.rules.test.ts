import { describe, it, expect } from "vitest";
import { validateCampaignDraft } from "../domain/campaign.rules";
import type { CampaignDraft } from "../domain/campaign.state";

const validDraft: CampaignDraft = {
    name: "Summer Sale",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
    screenIds: ["screen-1"],
    timeSlots: [
        { startTime: "08:00", endTime: "12:00" },
        { startTime: "13:00", endTime: "17:00" },
    ],
    mediaAsset: { url: "https://example.com/asset.jpg", type: "image", sizeInMb: 10 },
};

describe("Domain Rules: validateCampaignDraft", () => {
    it("returns no errors for a fully valid draft", () => {
        const errors = validateCampaignDraft(validDraft);
        expect(errors).toHaveLength(0);
    });

    describe("Rule 1: Name", () => {
        it("returns EMPTY_NAME if name is empty or whitespace", () => {
            const errors = validateCampaignDraft({ ...validDraft, name: "   " });
            expect(errors).toContainEqual(expect.objectContaining({ code: "EMPTY_NAME" }));
        });
    });

    describe("Rule 2: Dates", () => {
        it("returns INVALID_DATE_FORMAT for unparseable dates", () => {
            const errors = validateCampaignDraft({ ...validDraft, startDate: "not-a-date" });
            expect(errors).toContainEqual(expect.objectContaining({ code: "INVALID_DATE_FORMAT" }));
        });

        it("returns INVALID_DATE_RANGE if startDate is on or after endDate", () => {
            const errors = validateCampaignDraft({
                ...validDraft,
                startDate: "2026-06-30T00:00:00Z",
                endDate: "2026-06-01T00:00:00Z",
            });
            expect(errors).toContainEqual(expect.objectContaining({ code: "INVALID_DATE_RANGE" }));
        });
    });

    describe("Rule 3: Screen Selection", () => {
        it("returns EMPTY_SCREEN_SELECTION if screenIds array is empty", () => {
            // Force type cast to test boundary violation
            const errors = validateCampaignDraft({ ...validDraft, screenIds: [] as any });
            expect(errors).toContainEqual(expect.objectContaining({ code: "EMPTY_SCREEN_SELECTION" }));
        });
    });

    describe("Rule 4: Time Slots", () => {
        it("returns INVALID_TIME_FORMAT for malformed HH:mm strings", () => {
            const errors = validateCampaignDraft({
                ...validDraft,
                timeSlots: [{ startTime: "25:00", endTime: "12:00" }],
            });
            expect(errors).toContainEqual(expect.objectContaining({ code: "INVALID_TIME_FORMAT" }));
        });

        it("returns INVALID_TIME_FORMAT if a slot's startTime >= endTime", () => {
            const errors = validateCampaignDraft({
                ...validDraft,
                timeSlots: [{ startTime: "12:00", endTime: "08:00" }],
            });
            expect(errors).toContainEqual(expect.objectContaining({ code: "INVALID_TIME_FORMAT" }));
        });

        it("returns OVERLAPPING_TIME_SLOTS if slots overlap", () => {
            const errors = validateCampaignDraft({
                ...validDraft,
                timeSlots: [
                    { startTime: "08:00", endTime: "12:00" },
                    { startTime: "11:00", endTime: "15:00" },
                ],
            });
            expect(errors).toContainEqual(expect.objectContaining({ code: "OVERLAPPING_TIME_SLOTS" }));
        });
    });

    describe("Rule 5: Media Asset", () => {
        it("returns MEDIA_SIZE_EXCEEDS_LIMIT if size > 50 MB", () => {
            const errors = validateCampaignDraft({
                ...validDraft,
                mediaAsset: { ...validDraft.mediaAsset, sizeInMb: 51 },
            });
            expect(errors).toContainEqual(expect.objectContaining({ code: "MEDIA_SIZE_EXCEEDS_LIMIT" }));
        });

        it("returns MEDIA_TYPE_NOT_ALLOWED if type is not image or video", () => {
            const errors = validateCampaignDraft({
                ...validDraft,
                mediaAsset: { ...validDraft.mediaAsset, type: "audio" as any },
            });
            expect(errors).toContainEqual(expect.objectContaining({ code: "MEDIA_TYPE_NOT_ALLOWED" }));
        });
    });
});
