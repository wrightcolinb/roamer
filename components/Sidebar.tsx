"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Destination } from "@/lib/types";

interface SidebarProps {
  destination: Destination | null;
  onClose: () => void;
  onUpdate: (updated: Destination) => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({ destination, onClose, onUpdate, onDelete }: SidebarProps) {
  const [status, setStatus] = useState<Destination["status"]>("dreaming");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (destination) {
      setStatus(destination.status);
      setNotes(destination.notes);
    }
  }, [destination]);

  async function handleStatusChange(newStatus: Destination["status"]) {
    if (!destination) return;
    setStatus(newStatus);
    await supabase.from("destinations").update({ status: newStatus }).eq("id", destination.id);
    onUpdate({ ...destination, status: newStatus });
  }

  async function handleNotesBlur() {
    if (!destination || notes === destination.notes) return;
    await supabase.from("destinations").update({ notes }).eq("id", destination.id);
    onUpdate({ ...destination, notes });
  }

  async function handleDelete() {
    if (!destination) return;
    if (!confirm(`Remove ${destination.name} from your map?`)) return;
    await supabase.from("destinations").delete().eq("id", destination.id);
    onDelete(destination.id);
  }

  const isOpen = destination !== null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed z-40 bg-gray-900 text-white shadow-xl
          transition-transform duration-300 ease-in-out

          /* Mobile: bottom sheet */
          inset-x-0 bottom-0 h-[70vh] rounded-t-2xl
          ${isOpen ? "translate-y-0" : "translate-y-full"}

          /* Desktop: right panel */
          md:inset-y-0 md:right-0 md:left-auto md:bottom-auto
          md:w-96 md:h-full md:rounded-none
          ${isOpen ? "md:translate-x-0" : "md:translate-x-full"}
          md:translate-y-0
        `}
      >
        {destination && (
          <div className="flex h-full flex-col overflow-y-auto p-6">
            <div className="mb-6 flex items-start justify-between">
              <h2 className="text-xl font-semibold">{destination.name}</h2>
              <button
                onClick={onClose}
                className="ml-4 shrink-0 text-gray-400 hover:text-white"
                aria-label="Close sidebar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <label className="mb-1 text-sm text-gray-400">Status</label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as Destination["status"])}
              className="mb-5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="been">Been</option>
              <option value="planning">Planning</option>
              <option value="dreaming">Dreaming</option>
            </select>

            <label className="mb-1 text-sm text-gray-400">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes about this place…"
              rows={5}
              className="mb-5 resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />

            <p className="mb-6 text-sm text-gray-500">
              Added {new Date(destination.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="flex-1" />

            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 hover:bg-red-900/30"
            >
              Delete destination
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
