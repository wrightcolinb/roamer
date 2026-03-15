"use client";

import type { Destination } from "@/lib/types";

const STATUS_COLORS: Record<Destination["status"], string> = {
  been: "#3B82F6",
  planning: "#22C55E",
  dreaming: "#A855F7",
};

export default function Pin({ status }: { status: Destination["status"] }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill={STATUS_COLORS[status]} opacity={0.9} />
      <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  );
}
