"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveStats } from "@/app/api/events/route";

export default function LiveCounter({
  initialUsed,
  initialTotal,
}: {
  initialUsed: number;
  initialTotal: number;
}) {
  const [used, setUsed] = useState(initialUsed);
  const [total, setTotal] = useState(initialTotal);
  const [bump, setBump] = useState(false);
  const prevUsed = useRef(initialUsed);

  useEffect(() => {
    let es: EventSource;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/events");

      es.onmessage = (e) => {
        const data: LiveStats = JSON.parse(e.data);
        if (data.used !== prevUsed.current) {
          setBump(true);
          setTimeout(() => setBump(false), 500);
          prevUsed.current = data.used;
        }
        setUsed(data.used);
        setTotal(data.total + data.used + data.valid);
      };

      es.onerror = () => {
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

  return (
    <span className="text-gray-400 text-sm">
      <span
        className={`text-white font-bold transition-all duration-300 ${bump ? "text-green-400 scale-110 inline-block" : ""}`}
      >
        {used}
      </span>
      <span className="text-gray-600"> / </span>
      <span className="text-white font-bold">{initialTotal}</span>
      <span className="text-gray-500 ml-1">entrées</span>
    </span>
  );
}
