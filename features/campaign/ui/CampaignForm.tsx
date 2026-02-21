"use client";

import { useState } from "react";

import type { CampaignCreationState, CampaignDraft } from "../domain/campaign.state";
import { transition } from "../domain/campaign.machine";
import { validateCampaign } from "../application/validateCampaign.usecase";

// ── State badge colours ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<CampaignCreationState["status"], string> = {
    idle: "bg-gray-100 text-gray-600",
    editing: "bg-blue-100 text-blue-700",
    validating: "bg-yellow-100 text-yellow-700",
    invalid: "bg-red-100 text-red-700",
    conflict_detected: "bg-orange-100 text-orange-700",
    ready_to_publish: "bg-green-100 text-green-700",
    published: "bg-emerald-100 text-emerald-700",
    error: "bg-red-100 text-red-700",
};

// ── Component ────────────────────────────────────────────────────────────────

export function CampaignForm() {
    const [state, setState] = useState<CampaignCreationState>({ status: "idle" });

    // ── Helpers ────────────────────────────────────────────────────────────────

    function currentDraft(): CampaignDraft | null {
        if (
            state.status === "editing" ||
            state.status === "validating" ||
            state.status === "invalid" ||
            state.status === "conflict_detected" ||
            state.status === "ready_to_publish"
        ) {
            return state.draft;
        }
        return null;
    }

    function patchDraft(patch: Partial<CampaignDraft>) {
        const draft = currentDraft();
        if (!draft) return;
        setState((prev) =>
            transition(prev, {
                type: "UPDATE_DRAFT",
                draft: { ...draft, ...patch },
            })
        );
    }

    // ── Handlers ───────────────────────────────────────────────────────────────

    function handleStartCreation() {
        setState((prev) => transition(prev, { type: "START_CREATION" }));
    }

    function handleValidate() {
        setState((prev) => validateCampaign(prev));
    }

    function handlePublish() {
        setState((prev) =>
            transition(prev, { type: "PUBLISH", campaignId: "demo-id" })
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    const draft = currentDraft();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md border border-gray-200 p-8 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Create Campaign</h1>
                    <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[state.status]}`}
                    >
                        {state.status}
                    </span>
                </div>

                {/* Start creation */}
                {state.status === "idle" && (
                    <button
                        onClick={handleStartCreation}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md px-4 py-2 transition-colors"
                    >
                        Start Campaign Creation
                    </button>
                )}

                {/* Draft inputs */}
                {draft !== null && (
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={draft.name}
                                onChange={(e) => patchDraft({ name: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="e.g. Summer Launch"
                            />
                        </div>

                        {/* Start Date */}
                        <div className="space-y-1">
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                                Start Date
                            </label>
                            <input
                                id="startDate"
                                type="text"
                                value={draft.startDate}
                                onChange={(e) => patchDraft({ startDate: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="YYYY-MM-DD"
                            />
                        </div>

                        {/* End Date */}
                        <div className="space-y-1">
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                                End Date
                            </label>
                            <input
                                id="endDate"
                                type="text"
                                value={draft.endDate}
                                onChange={(e) => patchDraft({ endDate: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="YYYY-MM-DD"
                            />
                        </div>

                        {/* Validate button */}
                        <button
                            onClick={handleValidate}
                            disabled={state.status === "validating"}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-md px-4 py-2 transition-colors"
                        >
                            {state.status === "validating" ? "Validating…" : "Validate"}
                        </button>
                    </div>
                )}

                {/* Validation errors */}
                {state.status === "invalid" && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-1">
                        <p className="text-sm font-semibold text-red-700 mb-2">Validation errors</p>
                        <ul className="space-y-1" aria-label="Validation errors">
                            {state.errors.map((err, index) => (
                                <li key={`${err.code}-${index}`} className="text-sm text-red-600">
                                    <span className="font-medium">{err.code}</span>: {err.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Ready to publish */}
                {state.status === "ready_to_publish" && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-3">
                        <p className="text-sm font-medium text-green-700">
                            ✓ Campaign is valid and ready to publish.
                        </p>
                        <button
                            onClick={handlePublish}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md px-4 py-2 transition-colors"
                        >
                            Publish
                        </button>
                    </div>
                )}

                {/* Published success */}
                {state.status === "published" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
                        <p className="text-sm font-medium text-emerald-700">
                            Campaign published successfully.{" "}
                            <span className="text-gray-500">ID:</span>{" "}
                            <code className="font-mono text-emerald-800">{state.campaignId}</code>
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
