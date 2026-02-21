import { ValidationError } from "./campaign.state";

export type CampaignValidationResult =
    | { type: "invalid"; errors: [ValidationError, ...ValidationError[]] }
    | { type: "conflict" }
    | { type: "valid" };