"use client";

import { create } from "zustand";

import {
  deleteApplication,
  moveApplication,
} from "@/lib/actions/application";
import type { ApplicationStatus } from "@/lib/validation/application";

export type KanbanCard = {
  id: string;
  status: ApplicationStatus;
  jobTitle: string;
  company: string | null;
  atsScore: number | null;
  nextAction: string | null;
  /** ISO string; drives within-column ordering (most-recent first). */
  updatedAtIso: string;
};

type KanbanStore = {
  cards: KanbanCard[];
  /** Replace board state from the server (called on mount / after nav). */
  hydrate: (cards: KanbanCard[]) => void;
  /** Optimistically move a card between columns, reverting if the server says no. */
  move: (id: string, status: ApplicationStatus) => Promise<void>;
  /** Optimistically delete, restoring the card if the server rejects it. */
  destroy: (id: string) => Promise<void>;
};

export const useKanban = create<KanbanStore>((set, get) => ({
  cards: [],

  hydrate: (cards) => set({ cards }),

  move: async (id, status) => {
    const previous = get().cards;
    const card = previous.find((entry) => entry.id === id);
    if (!card || card.status === status) return;

    // Optimistic: change column and bump recency so it lands on top.
    set({
      cards: previous.map((entry) =>
        entry.id === id
          ? { ...entry, status, updatedAtIso: new Date().toISOString() }
          : entry,
      ),
    });

    const result = await moveApplication({ applicationId: id, status });
    if (!result.ok) set({ cards: previous });
  },

  destroy: async (id) => {
    const previous = get().cards;
    set({ cards: previous.filter((entry) => entry.id !== id) });

    const result = await deleteApplication({ applicationId: id });
    if (!result.ok) set({ cards: previous });
  },
}));
