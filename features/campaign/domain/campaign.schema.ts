import { z } from "zod";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Parses an HH:mm string into total minutes for comparison. */
function parseHHmm(value: string): number {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return NaN;
    const hours = parseInt(match[1] as string, 10);
    const minutes = parseInt(match[2] as string, 10);
    return hours * 60 + minutes;
}

// ── Sub-schemas ─────────────────────────────────────────────────────────────

export const TimeSlotSchema = z
    .object({
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid HH:mm format"),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid HH:mm format"),
    })
    .refine((data) => {
        const start = parseHHmm(data.startTime);
        const end = parseHHmm(data.endTime);
        return !isNaN(start) && !isNaN(end) && start < end;
    }, {
        message: "startTime must be before endTime",
        path: ["startTime"],
    });

export const MediaAssetSchema = z.object({
    url: z.string().url("Must be a valid URL"),
    type: z.enum(["image", "video"]),
    sizeInMb: z.number().max(50, "Media size must be <= 50 MB"),
});

// ── Main Schema ─────────────────────────────────────────────────────────────

/**
 * Zod schema defining the contract for Campaign Creation.
 * Validates the draft before it interacts with the internal domain.
 * Mirrors rules found in campaign.rules.ts but acts as a first line of defense.
 */
export const CampaignSchema = z
    .object({
        name: z.string().trim().min(1, "Campaign name must not be empty"),
        startDate: z.string().datetime("Must be a valid ISO 8601 string"),
        endDate: z.string().datetime("Must be a valid ISO 8601 string"),
        // Non-empty array of strings
        screenIds: z.array(z.string()).nonempty("At least one screen must be selected"),
        timeSlots: z.array(TimeSlotSchema).refine((slots) => {
            if (slots.length < 2) return true;

            // Optional: only sort valid slots
            const sorted = [...slots]
                .filter(s => !isNaN(parseHHmm(s.startTime)) && !isNaN(parseHHmm(s.endTime)))
                .sort((a, b) => parseHHmm(a.startTime) - parseHHmm(b.startTime));

            for (let i = 0; i < sorted.length - 1; i++) {
                const currentEnd = parseHHmm(sorted[i]!.endTime);
                const nextStart = parseHHmm(sorted[i + 1]!.startTime);
                if (currentEnd > nextStart) {
                    return false;
                }
            }
            return true;
        }, {
            message: "Time slots must not overlap",
            path: ["timeSlots"],
        }),
        mediaAsset: MediaAssetSchema,
    })
    .refine((data) => {
        const start = Date.parse(data.startDate);
        const end = Date.parse(data.endDate);
        if (isNaN(start) || isNaN(end)) return true; // Handled by individual field regexes
        return start < end;
    }, {
        message: "startDate must be before endDate",
        path: ["startDate"],
    });

// ── Inferred Types ──────────────────────────────────────────────────────────

export type CampaignInput = z.infer<typeof CampaignSchema>;

// ── Validation Function ─────────────────────────────────────────────────────

/**
 * Validates external input against the Campaign contract.
 * Throws ZodError if invalid, returns properly typed CampaignInput if valid.
 */
export function validateCampaign(data: unknown): CampaignInput {
    return CampaignSchema.parse(data);
}
