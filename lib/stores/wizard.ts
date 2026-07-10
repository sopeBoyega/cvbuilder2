"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { WizardState } from "@/lib/validation/wizard";

type WizardStore = WizardState & {
  set: (patch: Partial<WizardState>) => void;
  reset: () => void;
};

function initialState(): WizardState {
  return {
    draftId: crypto.randomUUID(),
    step: "job",
    jobId: null,
    resumeId: null,
  };
}

export const useWizard = create<WizardStore>()(
  persist(
    (set) => ({
      ...initialState(),
      set: (patch) => set(patch),
      reset: () => set(initialState()),
    }),
    {
      name: "cv-wizard",
      /*
       * Persisted state is untrusted input: it survives across deploys, so a
       * stale or corrupt shape can outlive the code that wrote it. Validate on
       * rehydrate and discard anything that no longer fits the contract.
       */
      merge: (persisted, current) => {
        const result = WizardState.partial().safeParse(persisted);
        return { ...current, ...(result.success ? result.data : {}) };
      },
    },
  ),
);

const subscribeToHydration = (onChange: () => void) =>
  useWizard.persist.onFinishHydration(onChange);

const getHydrated = () => useWizard.persist.hasHydrated();

/** On the server nothing has rehydrated, by definition. */
const getHydratedOnServer = () => false;

/**
 * `persist` rehydrates asynchronously, so on first paint the store still holds
 * `initialState()`. Guards that redirect on a missing jobId/resumeId must wait
 * for this, or they'll bounce the user out of a step they legitimately reached.
 *
 * This is a subscription to an external store, which is precisely what
 * `useSyncExternalStore` is for — an effect + setState would both trip
 * cascading-render lint and race hydration that finished before subscribing.
 */
export function useWizardHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getHydratedOnServer,
  );
}
