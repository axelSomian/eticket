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

        if (next.used !== prev.used) setFlash("used");
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

  const MAX = 250;

  const cards = [
    { key: "total" as const, label: "Total invités", value: stats.total, color: "text-amber-400" },
    { key: "valid" as const, label: "Valides", value: stats.valid, color: "text-green-400" },
    { key: "used" as const, label: "Entrés", value: stats.used, color: "text-blue-400" },
    { key: "cancelled" as const, label: "Annulés", value: stats.cancelled, color: "text-red-400" },
    { key: "vip" as const, label: "Gbonhi", value: stats.vip, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-medium">Capacité</span>
            <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border transition-colors ${
              live
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-gray-800 text-gray-500 border-gray-700"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              {live ? "Live" : "Reconnexion…"}
            </span>
          </div>
          <span className="text-white font-bold">
            {stats.total} / {MAX}
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min((stats.total / MAX) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-gray-500 text-xs">{MAX - stats.total} places restantes</p>
          <p className="text-blue-400 text-xs font-medium">{stats.used} entrées</p>
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
