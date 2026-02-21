# Feature: Campaign Creation

## Purpose

Allow a user to create and validate a campaign before publishing it.

The feature must strictly control state transitions and enforce business rules before allowing publication.

---

## Inputs

A CampaignDraft consists of:

- name: string (non-empty)
- startDate: ISO 8601 string
- endDate: ISO 8601 string
- screenIds: array of string (must contain at least 1 item)
- timeSlots: array of TimeSlot
- mediaAsset: MediaAsset

---

## TimeSlot Definition

A TimeSlot consists of:

- startTime: string (HH:mm, 24h format)
- endTime: string (HH:mm, 24h format)

Constraints:
- startTime must be before endTime
- TimeSlots must not overlap

---

## MediaAsset Definition

A MediaAsset consists of:

- url: string
- type: "image" | "video"
- sizeInMb: number

Constraints:
- sizeInMb must be <= 50
- type must match allowed formats

---

## Business Rules

1. name must not be empty
2. startDate must be before endDate
3. screenIds must contain at least 1 item
4. timeSlots must not overlap
5. mediaAsset must pass validation
6. Campaign cannot move to "ready_to_publish" if any rule fails
7. startDate and endDate must be valid ISO 8601 strings

---

## States

The Campaign Creation feature must use the following states:

- idle
- editing
- validating
- invalid
- conflict_detected
- ready_to_publish
- published
- error

---

## State Definitions

idle:
No campaign is being created.

editing:
User is modifying campaign data.

validating:
System is checking business rules.

invalid:
One or more business rules failed.

conflict_detected:
Campaign conflicts with existing scheduled campaigns.

ready_to_publish:
All validations passed and no conflicts detected.

published:
Campaign has been successfully published.

error:
Unexpected system failure.

---

## Allowed Transitions

idle -> editing

editing -> validating

validating -> invalid
validating -> conflict_detected
validating -> ready_to_publish

invalid -> editing

conflict_detected -> editing

ready_to_publish -> published

Any state -> error

---

## Error Cases

- Invalid date range
- Overlapping time slots
- Empty screen selection
- Media size exceeds limit
- Media type not allowed
- Invalid time format

The following validation error codes must exist:

- EMPTY_NAME
- INVALID_DATE_RANGE
- INVALID_DATE_FORMAT
- OVERLAPPING_TIME_SLOTS
- EMPTY_SCREEN_SELECTION
- MEDIA_SIZE_EXCEEDS_LIMIT
- MEDIA_TYPE_NOT_ALLOWED
- INVALID_TIME_FORMAT

---

## Non-Functional Requirements

- All validation must be deterministic.
- No implicit state transitions.
- No UI component may infer state outside the defined list.
- All states must be represented as a discriminated union in TypeScript.

---

## Contract Requirements

- Invalid state must include at least one ValidationError.
- Published state must return a generated campaignId (string).
- ValidationError must include:
  - code (ValidationErrorCode)
  - message (string)
- Error state must contain a system error message.
- screenIds must be modeled as a non-empty array.

---

## Events

The Campaign Creation state machine must respond to the following events:

- START_CREATION
- UPDATE_DRAFT
- VALIDATE
- CONFLICT_FOUND
- VALIDATION_FAILED
- VALIDATION_PASSED
- PUBLISH
- SYSTEM_ERROR

Each transition must be triggered exclusively by one of these events.
No state transition may occur without an explicit event.