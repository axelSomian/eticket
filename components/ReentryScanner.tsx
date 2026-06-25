"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

type ReentryResult =
  | { result: "REACTIVATED"; ticket: { ticketNumber: string; ticketType: string } }
  | { result: "ALREADY_VALID"; reason: string; ticket: { ticketNumber: string; ticketType: string } }
  | { result: "FAKE"; reason: string }
  | { result: "CANCELLED"; reason: string }
  | { result: "INVALID"; reason: string }
  | { result: "ERROR"; reason: string };

function playSound(ctx: AudioContext, type: "success" | "warning" | "error") {
  const tone = (freq: number, start: number, duration: number, gain: number, wave: OscillatorType = "sine") => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(ctx.destination);
    osc.type = wave;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, ctx.currentTime + start);
    env.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration + 0.05);
  };

  if (type === "success") {
    tone(440, 0,    0.10, 0.3);
    tone(660, 0.10, 0.10, 0.3);
    tone(880, 0.20, 0.25, 0.3);
  } else if (type === "warning") {
    tone(440, 0, 0.09, 0.3);
    tone(440, 0.16, 0.18, 0.2);
  } else {
    tone(330, 0, 0.14, 0.35, "sawtooth");
    tone(220, 0.13, 0.28, 0.35, "sawtooth");
  }
}

export default function ReentryScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [scanResult, setScanResult] = useState<ReentryResult | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      audioCtxRef.current.resume();
    };
    window.addEventListener("touchstart", unlock, { once: true });
    window.addEventListener("click", unlock, { once: true });
    return () => {
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("click", unlock);
    };
  }, []);

  const resetScan = useCallback(() => {
    setOverlayVisible(false);
    setTimeout(() => {
      setScanResult(null);
      processingRef.current = false;
    }, 380);
  }, []);

  const showResult = useCallback((result: ReentryResult) => {
    if (audioCtxRef.current) {
      const soundType =
        result.result === "REACTIVATED" ? "success" :
        result.result === "ALREADY_VALID" ? "warning" : "error";
      playSound(audioCtxRef.current, soundType);
    }
    setScanResult(result);
    setTimeout(() => setOverlayVisible(true), 40);
  }, []);

  const handleQRCode = useCallback(async (raw: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    let parsed: { id?: string; sig?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      showResult({ result: "FAKE", reason: "QR code illisible ou non reconnu" });
      return;
    }

    if (!parsed.id || !parsed.sig) {
      showResult({ result: "FAKE", reason: "Format QR invalide" });
      return;
    }

    try {
      const res = await fetch(`/api/tickets/${parsed.id}/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sig: parsed.sig }),
      });
      showResult(await res.json());
    } catch {
      showResult({ result: "ERROR", reason: "Erreur réseau" });
    }
  }, [showResult]);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    if (!videoRef.current) return;
    reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (result && !processingRef.current) handleQRCode(result.getText());
      void err;
    }).catch(() => setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions."));
    return () => { reader.reset(); };
  }, [handleQRCode]);

  return (
    <>
      <style>{`
        @keyframes glow-ring-blue {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes scan-line-blue {
          0%, 100% { top: 20%; }
          50%       { top: 80%; }
        }
      `}</style>

      <div className="relative w-full max-w-sm mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

          {!scanResult && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-56 h-56">
                {[
                  "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
                  "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
                  "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
                  "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl",
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-10 h-10 border-blue-400 ${cls}`} />
                ))}
                <div
                  className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                  style={{ animation: "scan-line-blue 2s ease-in-out infinite" }}
                />
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 p-6">
              <p className="text-red-400 text-center text-sm">{cameraError}</p>
            </div>
          )}
        </div>
        {!scanResult && !cameraError && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Scannez le QR code du ticket à réactiver
          </p>
        )}
      </div>

      {scanResult && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            opacity: overlayVisible ? 1 : 0,
            transform: overlayVisible ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
          }}
        >
          <ReentryResultScreen result={scanResult} onReset={resetScan} visible={overlayVisible} />
        </div>
      )}
    </>
  );
}

function ReentryResultScreen({
  result,
  onReset,
  visible,
}: {
  result: ReentryResult;
  onReset: () => void;
  visible: boolean;
}) {
  const AUTO_CLOSE = 4;
  const [countdown, setCountdown] = useState(AUTO_CLOSE);

  const isReactivated  = result.result === "REACTIVATED";
  const isAlreadyValid = result.result === "ALREADY_VALID";
  const isBad = ["FAKE", "CANCELLED", "INVALID", "ERROR"].includes(result.result);

  useEffect(() => {
    if (!isReactivated || !visible) return;
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); onReset(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isReactivated, visible, onReset]);

  const bg = isReactivated
    ? "linear-gradient(160deg, #0c1a3a 0%, #0f1f3d 40%, #030712 100%)"
    : isAlreadyValid
    ? "linear-gradient(160deg, #1a2e0a 0%, #1e3a0c 40%, #030712 100%)"
    : "linear-gradient(160deg, #450a0a 0%, #2d0f0f 40%, #030712 100%)";

  const accentColor = isReactivated ? "#60a5fa" : isAlreadyValid ? "#86efac" : "#f87171";
  const accentDim   = isReactivated ? "#1e3a8a" : isAlreadyValid ? "#166534" : "#7f1d1d";

  const title = {
    REACTIVATED:  "RÉ-ENTRÉE AUTORISÉE",
    ALREADY_VALID:"TICKET DÉJÀ VALIDE",
    FAKE:         "FAUX TICKET",
    CANCELLED:    "TICKET ANNULÉ",
    INVALID:      "TICKET INVALIDE",
    ERROR:        "ERREUR RÉSEAU",
  }[result.result];

  const stagger = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.45s ease ${delay}s, transform 0.45s ease ${delay}s`,
  });

  const C = 2 * Math.PI * 52;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow blob */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: accentColor,
          filter: "blur(100px)",
          opacity: 0.08,
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <div
        style={{
          marginBottom: "2rem",
          transform: visible ? "scale(1)" : "scale(0.4)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
        }}
      >
        {isReactivated || isAlreadyValid ? (
          <svg viewBox="0 0 120 120" width="128" height="128">
            {isReactivated && (
              <div
                style={{
                  position: "absolute",
                  inset: -10,
                  borderRadius: "50%",
                  border: `3px solid ${accentColor}`,
                  animation: visible ? "glow-ring-blue 1.6s ease-out infinite" : "none",
                  opacity: 0.4,
                }}
              />
            )}
            <circle cx="60" cy="60" r="52" fill={`${accentDim}55`} stroke={`${accentColor}25`} strokeWidth="2" />
            <circle
              cx="60" cy="60" r="52"
              fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={visible ? 0 : C}
              transform="rotate(-90 60 60)"
              style={{ transition: `stroke-dashoffset 0.6s ease 0.1s` }}
            />
            {/* Refresh arrows for re-entry */}
            <path
              d="M42 45 Q60 30 78 45"
              fill="none" stroke={accentColor} strokeWidth="5" strokeLinecap="round"
              strokeDasharray="50" strokeDashoffset={visible ? 0 : 50}
              style={{ transition: `stroke-dashoffset 0.4s ease 0.65s` }}
            />
            <path
              d="M78 75 Q60 90 42 75"
              fill="none" stroke={accentColor} strokeWidth="5" strokeLinecap="round"
              strokeDasharray="50" strokeDashoffset={visible ? 0 : 50}
              style={{ transition: `stroke-dashoffset 0.4s ease 0.75s` }}
            />
            <path
              d="M75 38 L78 45 L71 46"
              fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="20" strokeDashoffset={visible ? 0 : 20}
              style={{ transition: `stroke-dashoffset 0.3s ease 1s` }}
            />
            <path
              d="M45 82 L42 75 L49 74"
              fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="20" strokeDashoffset={visible ? 0 : 20}
              style={{ transition: `stroke-dashoffset 0.3s ease 1.1s` }}
            />
          </svg>
        ) : (
          <svg viewBox="0 0 120 120" width="128" height="128">
            <circle cx="60" cy="60" r="52" fill={`${accentDim}55`} stroke={`${accentColor}25`} strokeWidth="2" />
            <circle
              cx="60" cy="60" r="52"
              fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={visible ? 0 : C}
              transform="rotate(-90 60 60)"
              style={{ transition: `stroke-dashoffset 0.55s ease 0.1s` }}
            />
            <path d="M38 38 L82 82" fill="none" stroke={accentColor} strokeWidth="5.5" strokeLinecap="round"
              strokeDasharray="63" strokeDashoffset={visible ? 0 : 63}
              style={{ transition: `stroke-dashoffset 0.4s ease 0.65s` }}
            />
            <path d="M82 38 L38 82" fill="none" stroke={accentColor} strokeWidth="5.5" strokeLinecap="round"
              strokeDasharray="63" strokeDashoffset={visible ? 0 : 63}
              style={{ transition: `stroke-dashoffset 0.4s ease 0.85s` }}
            />
          </svg>
        )}
      </div>

      {/* Title */}
      <p
        style={{
          color: accentColor,
          fontSize: "clamp(1.3rem, 5vw, 1.8rem)",
          fontWeight: 800,
          letterSpacing: "0.10em",
          textAlign: "center",
          marginBottom: "1.75rem",
          ...stagger(0.15),
        }}
      >
        {title}
      </p>

      {/* Ticket info */}
      {(isReactivated || isAlreadyValid) && "ticket" in result && (
        <div style={{ textAlign: "center", ...stagger(0.25) }}>
          <p style={{ color: "white", fontSize: "clamp(1.2rem, 5vw, 1.6rem)", fontWeight: 700, marginBottom: "1rem" }}>
            {result.ticket.ticketType === "GBONHI" ? "OFFRE GBONHI" : "BILLET INDIVIDUEL"}
          </p>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{
              background: "rgba(255,255,255,0.08)",
              color: "#9ca3af",
              padding: "0.3rem 0.9rem",
              borderRadius: "9999px",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              {result.ticket.ticketNumber}
            </span>
          </div>
          {isReactivated && (
            <p style={{ color: accentColor, fontSize: "0.9rem", marginTop: "0.75rem", opacity: 0.8 }}>
              Le ticket peut être re-scanné à l&apos;entrée
            </p>
          )}
        </div>
      )}

      {/* Error reason */}
      {isBad && (
        <p style={{ color: "#9ca3af", textAlign: "center", fontSize: "1rem", maxWidth: "22rem", lineHeight: 1.5, ...stagger(0.25) }}>
          {"reason" in result ? result.reason : ""}
        </p>
      )}

      {/* Countdown bar */}
      {isReactivated && (
        <div style={{
          position: "absolute",
          bottom: "calc(max(2rem, env(safe-area-inset-bottom)) + 5rem)",
          left: "1.5rem",
          right: "1.5rem",
          ...stagger(0.35),
        }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "9999px", height: "3px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: accentColor,
              borderRadius: "9999px",
              width: `${(countdown / AUTO_CLOSE) * 100}%`,
              transition: "width 1s linear",
              boxShadow: `0 0 8px ${accentColor}`,
            }} />
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", textAlign: "center", marginTop: "0.5rem" }}>
            Prochain scan dans {countdown}s
          </p>
        </div>
      )}

      {/* Button */}
      <button
        onClick={onReset}
        style={{
          position: "absolute",
          bottom: "max(2rem, env(safe-area-inset-bottom))",
          left: "1.5rem",
          right: "1.5rem",
          padding: "1rem 1.5rem",
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "white",
          fontWeight: 600,
          fontSize: "1rem",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          ...stagger(0.4),
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      >
        Scanner suivant
      </button>
    </div>
  );
}
