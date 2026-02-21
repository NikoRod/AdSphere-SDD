# Campaign Feature – Development Memory

> Source of truth: `features/campaign/spec/campaign.spec.md`

---

## Files Created

| File | Purpose |
|---|---|
| `features/campaign/domain/campaign.state.ts` | Core discriminated union types |
| `features/campaign/domain/campaign.rules.ts` | Pure validation functions |
| `features/campaign/domain/campaign.validation.ts` | `CampaignValidationResult` type |
| `features/campaign/domain/campaign.schema.ts` | Zod external contract validation |
| `features/campaign/domain/campaign.machine.ts` | Pure state transition function |
| `features/campaign/application/validateCampaign.usecase.ts` | Application use case |
| `features/campaign/ui/CampaignForm.tsx` | React UI component |
| `features/campaign/tests/campaign.rules.test.ts` | Vitest domain rule suite |
| `features/campaign/tests/campaign.machine.test.ts` | Vitest machine transition suite |

---

## Layer-by-layer Summary

### 1. Domain Types — `campaign.state.ts`

Discriminated union `CampaignCreationState` with 8 states derived strictly from the spec:

`idle` → `editing` → `validating` → `invalid` | `conflict_detected` | `ready_to_publish` → `published`  
Any state → `error`

Key types:
- `CampaignDraft` — `screenIds` typed as `[string, ...string[]]` (non-empty at type level)
- `ValidationErrorCode` — 8 codes: `EMPTY_NAME`, `INVALID_DATE_RANGE`, `INVALID_DATE_FORMAT`, `OVERLAPPING_TIME_SLOTS`, `EMPTY_SCREEN_SELECTION`, `MEDIA_SIZE_EXCEEDS_LIMIT`, `MEDIA_TYPE_NOT_ALLOWED`, `INVALID_TIME_FORMAT`
- `PublishedState` — holds `campaignId: string` (not `draft`), per contract requirement

### 2. Validation Rules — `campaign.rules.ts`

- `validateCampaignDraft(draft): ValidationError[]` — runs all 5 business rules independently
- Each rule is a separate private function:
  - `validateName` → `EMPTY_NAME`
  - `validateDateRange` → `INVALID_DATE_FORMAT` (bad ISO) or `INVALID_DATE_RANGE` (start ≥ end)
  - `validateScreenIds` → `EMPTY_SCREEN_SELECTION`
  - `validateTimeSlots` → `INVALID_TIME_FORMAT` + `OVERLAPPING_TIME_SLOTS`
  - `validateMediaAsset` → `MEDIA_SIZE_EXCEEDS_LIMIT` + `MEDIA_TYPE_NOT_ALLOWED`
- No libraries — `Date.parse()` for ISO 8601, regex for HH:mm
- Conflict detection intentionally excluded

### 3. Validation Result Type — `campaign.validation.ts`

```ts
type CampaignValidationResult =
  | { type: "invalid"; errors: [ValidationError, ...ValidationError[]] }
  | { type: "conflict" }
  | { type: "valid" };
```

Used as the payload of the consolidated `VALIDATION_RESULT` event.

### 4. State Machine — `campaign.machine.ts`

- `CampaignEvent` discriminated union with 6 events:
  `START_CREATION`, `UPDATE_DRAFT`, `VALIDATE`, `VALIDATION_RESULT`, `PUBLISH`, `SYSTEM_ERROR`
- `transition(state, event): CampaignCreationState` — pure, explicit, no fallthrough
- `VALIDATION_RESULT` replaces the original three separate events (`VALIDATION_FAILED`, `VALIDATION_PASSED`, `CONFLICT_FOUND`), consolidated via `CampaignValidationResult`
- `SYSTEM_ERROR` is valid from any state
- `published` and `error` are terminal — all events return state unchanged

### 5. Use Case — `validateCampaign.usecase.ts`

```
validateCampaign(editingState)
  1. transition(state, VALIDATE)      → validating
  2. validateCampaignDraft(draft)     → ValidationError[]
  3. Build CampaignValidationResult
  4. transition(state, VALIDATION_RESULT) → invalid | ready_to_publish
```

- Pure function, no side effects
- Returns state unchanged if not `"editing"`
- Does not produce `conflict` result (not yet implemented)

### 6. UI Component — `CampaignForm.tsx`

- `"use client"` — Next.js App Router
- `useState<CampaignCreationState>({ status: "idle" })`
- All writes go through `transition()` or `validateCampaign()` — no direct state mutation
- Renders: Start button → draft inputs (name, startDate, endDate) → Validate → errors or Publish → success with `campaignId`
- Styled with **Tailwind CSS v4**: centered card, indigo primary buttons, grey secondary, colour-coded state badge, red error container, green/emerald success containers

### 7. Contract Validation — `campaign.schema.ts`

- First line of defense before raw data hits the pure Domain layer.
- Implemented with **Zod**, strictly mirroring the domain constraints.
- Exports `CampaignSchema`, the inferred `CampaignInput` type, and a `validateCampaign(data)` parser.
- Validates structural integrity: regex for HH:mm schemas, ISO 8601 datetimes, URL formats, and cross-field logic (startDate < endDate, non-overlapping timeSlots).

### 8. Domain Testing — `campaign.rules.test.ts` & `campaign.machine.test.ts`

- Fully isolated **Vitest** suites proving the determinism of the Domain layer.
- `rules.test.ts` covers every variation of the 5 business rules (empty names, invalid formats, inverted ranges, overlaps, size bounds, invalid media types).
- `machine.test.ts` covers the 6 state transitions, verifying draft retention, terminal state ignorances, and payload structures.
- Zero UI dependencies or mocks required.

---

## Key Design Decisions

- **`EMPTY_NAME` / `INVALID_DATE_FORMAT`** added to `ValidationErrorCode` after spec update to distinguish name errors from date errors and format errors from range errors.
- **`PublishedState.campaignId`** — spec contract requires the published state to return a server-generated ID, not the draft.
- **Consolidated `VALIDATION_RESULT`** — user refactored to a single event carrying `CampaignValidationResult` to keep the event surface minimal and the result type reusable.
- **No conflict result from use case** — conflict detection deferred; use case only emits `invalid` or `valid`.
