"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveStats } from "@/app/api/events/route";

export default function LiveStats({ initial }: { initial: LiveStats }) {
  const [stats, setStats] = useState<LiveStats>(initial);
  const [live, setLive] = useState(false);
  const [flash, setFlash] = useState<keyof LiveStats | null>(null);
  const prevRef = useRef<LiveStats>(initial);

  useEffect(() => {
    let es: EventSource;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/events");

      es.onopen = () => setLive(true);

      es.onmessage = (e) => {
        const next: LiveStats = JSON.parse(e.data);
        const prev = prevRef.current;

        if (next.revenue !== prev.revenue) setFlash("revenue");
        else if (next.used !== prev.used) setFlash("used");
        else if (next.total !== prev.total) setFlash("total");
        else if (next.cancelled !== prev.cancelled) setFlash("cancelled");

        prevRef.current = next;
        setStats(next);
        setTimeout(() => setFlash(null), 600);
      };

      es.onerror = () => {
        setLive(false);
        es.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      es?.close();
    };
  }, []);

  const formatFCFA = (n: number) =>
    n.toLocaleString("fr-FR") + " FCFA";

  const cards = [
    { key: "total" as const, label: "Total invités", value: stats.total, color: "text-amber-400" },
    { key: "valid" as const, label: "Valides", value: stats.valid, color: "text-green-400" },
    { key: "used" as const, label: "Entrés", value: stats.used, color: "text-blue-400" },
    { key: "cancelled" as const, label: "Annulés", value: stats.cancelled, color: "text-red-400" },
    { key: "vip" as const, label: "Gbonhi (tickets)", value: stats.vip, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue card */}
      <div className={`bg-gray-900 border rounded-2xl p-6 transition-all duration-300 ${
        flash === "revenue" ? "border-amber-500/50 bg-amber-500/5" : "border-gray-800"
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Recettes totales</p>
            <p className="text-4xl font-bold text-amber-400 transition-all duration-300">
              {formatFCFA(stats.revenue)}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>
                <span className="text-white font-medium">{stats.individuelPaid}</span> Individuel
                {" "}× 10 000
              </span>
              <span className="text-gray-700">·</span>
              <span>
                <span className="text-white font-medium">{stats.gbonhiOffersPaid}</span> offre
                {stats.gbonhiOffersPaid > 1 ? "s" : ""} Gbonhi
                {" "}× 50 000
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border transition-colors ${
              live
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-gray-800 text-gray-500 border-gray-700"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              {live ? "Live" : "Reconnexion…"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(({ key, label, value, color }) => (
          <div
            key={key}
            className={`bg-gray-900 border rounded-2xl p-5 transition-all duration-300 ${
              flash === key ? "border-amber-500/50 bg-amber-500/5 scale-[1.02]" : "border-gray-800"
            }`}
          >
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-bold mt-2 transition-all duration-300 ${color}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
