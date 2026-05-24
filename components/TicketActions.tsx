"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "VALID" | "USED" | "CANCELLED";

export default function TicketActions({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: Status) {
    setLoading(true);
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-white font-medium mb-4">Actions</h3>
      <div className="flex gap-3 flex-wrap">
        {currentStatus !== "VALID" && (
          <button
            onClick={() => updateStatus("VALID")}
            disabled={loading}
            className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-xl text-sm transition disabled:opacity-50"
          >
            Marquer Valide
          </button>
        )}
        {currentStatus !== "CANCELLED" && (
          <button
            onClick={() => updateStatus("CANCELLED")}
            disabled={loading}
            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-sm transition disabled:opacity-50"
          >
            Annuler le ticket
          </button>
        )}
      </div>
    </div>
  );
}
