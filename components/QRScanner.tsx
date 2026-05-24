"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

type ScanResult =
  | { result: "VALID"; ticket: { ticketNumber: string; firstName: string; lastName: string; ticketType: string; tableNumber: string | null } }
  | { result: "ALREADY_USED"; reason: string; ticket: { ticketNumber?: string; firstName?: string; lastName?: string } }
  | { result: "FAKE"; reason: string }
  | { result: "CANCELLED"; reason: string }
  | { result: "INVALID"; reason: string }
  | { result: "ERROR"; reason: string };

export default function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const processingRef = useRef(false);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [cameraError, setCameraError] = useState("");

  const resetScan = useCallback(() => {
    setScanResult(null);
    setScanning(true);
    processingRef.current = false;
  }, []);

  const handleQRCode = useCallback(async (raw: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanning(false);

    let parsed: { id?: string; sig?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      setScanResult({ result: "FAKE", reason: "QR code illisible ou non reconnu" });
      return;
    }

    if (!parsed.id || !parsed.sig) {
      setScanResult({ result: "FAKE", reason: "Format QR invalide" });
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${parsed.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sig: parsed.sig, scannedBy: "Scanner" }),
      });
      const data = await res.json();
      setScanResult(data);
    } catch {
      setScanResult({ result: "ERROR", reason: "Erreur réseau" });
    }
  }, []);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    if (!videoRef.current) return;

    reader
      .decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result && !processingRef.current) {
          handleQRCode(result.getText());
        }
        void err;
      })
      .catch(() => {
        setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      });

    return () => {
      reader.reset();
    };
  }, [handleQRCode]);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Caméra */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

        {/* Overlay de scan */}
        {scanning && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-56 h-56">
              {/* Coins du cadre */}
              {[
                "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl",
              ].map((cls, i) => (
                <div key={i} className={`absolute w-10 h-10 border-amber-400 ${cls}`} />
              ))}
              {/* Ligne de scan animée */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-amber-400/70 animate-pulse" />
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 p-6">
            <p className="text-red-400 text-center text-sm">{cameraError}</p>
          </div>
        )}
      </div>

      {/* Résultat */}
      {scanResult && (
        <div className="mt-4">
          <ResultCard result={scanResult} onReset={resetScan} />
        </div>
      )}

      {scanning && !cameraError && (
        <p className="text-center text-gray-500 text-sm mt-4">
          Pointez la caméra sur le QR code du ticket
        </p>
      )}
    </div>
  );
}

function ResultCard({ result, onReset }: { result: ScanResult; onReset: () => void }) {
  useEffect(() => {
    if (result.result !== "VALID") return;
    const t = setTimeout(onReset, 4000);
    return () => clearTimeout(t);
  }, [result, onReset]);

  const configs = {
    VALID: {
      bg: "bg-green-500/10 border-green-500/30",
      icon: "✅",
      title: "ACCÈS AUTORISÉ",
      titleColor: "text-green-400",
    },
    ALREADY_USED: {
      bg: "bg-orange-500/10 border-orange-500/30",
      icon: "⚠️",
      title: "DÉJÀ SCANNÉ",
      titleColor: "text-orange-400",
    },
    FAKE: {
      bg: "bg-red-500/10 border-red-500/30",
      icon: "🚫",
      title: "FAUX TICKET",
      titleColor: "text-red-400",
    },
    CANCELLED: {
      bg: "bg-red-500/10 border-red-500/30",
      icon: "❌",
      title: "TICKET ANNULÉ",
      titleColor: "text-red-400",
    },
    INVALID: {
      bg: "bg-red-500/10 border-red-500/30",
      icon: "❌",
      title: "INVALIDE",
      titleColor: "text-red-400",
    },
    ERROR: {
      bg: "bg-gray-800 border-gray-700",
      icon: "⚠️",
      title: "ERREUR",
      titleColor: "text-gray-400",
    },
  };

  const cfg = configs[result.result];

  return (
    <div className={`rounded-2xl border p-5 space-y-3 ${cfg.bg}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{cfg.icon}</span>
        <span className={`text-lg font-bold tracking-wide ${cfg.titleColor}`}>{cfg.title}</span>
      </div>

      {result.result === "VALID" && (
        <div className="space-y-1">
          <p className="text-white font-semibold text-lg">
            {result.ticket.firstName} {result.ticket.lastName}
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono">
              {result.ticket.ticketNumber}
            </span>
            {result.ticket.ticketType === "VIP" && (
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                VIP
              </span>
            )}
            {result.ticket.tableNumber && (
              <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                {result.ticket.tableNumber}
              </span>
            )}
          </div>
        </div>
      )}

      {result.result === "ALREADY_USED" && (
        <div>
          {"ticket" in result && result.ticket.firstName && (
            <p className="text-white font-medium">
              {result.ticket.firstName} {result.ticket.lastName}
            </p>
          )}
          <p className="text-orange-300 text-sm">{"reason" in result ? result.reason : ""}</p>
        </div>
      )}

      {["FAKE", "CANCELLED", "INVALID", "ERROR"].includes(result.result) && (
        <p className="text-gray-300 text-sm">{"reason" in result ? result.reason : ""}</p>
      )}

      <button
        onClick={onReset}
        className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition mt-2"
      >
        Scanner un autre ticket
      </button>
    </div>
  );
}
