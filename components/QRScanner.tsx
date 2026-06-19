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
    tone(523, 0,    0.14, 0.35);  // C5
    tone(784, 0.13, 0.28, 0.35);  // G5
  } else if (type === "warning") {
    tone(440, 0,    0.09, 0.3);
    tone(440, 0.16, 0.18, 0.2);
  } else {
    tone(330, 0,    0.14, 0.35, "sawtooth");
    tone(220, 0.13, 0.28, 0.35, "sawtooth");
  }
}

export default function QRScanner({ username }: { username: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Unlock AudioContext on first user interaction (required on iOS)
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
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

  const showResult = useCallback((result: ScanResult) => {
    if (audioCtxRef.current) {
      const soundType =
        result.result === "VALID" ? "success" :
        result.result === "ALREADY_USED" ? "warning" : "error";
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
      const res = await fetch(`/api/tickets/${parsed.id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sig: parsed.sig, scannedBy: username }),
      });
      showResult(await res.json());
    } catch {
      showResult({ result: "ERROR", reason: "Erreur réseau" });
    }
  }, [username, showResult]);

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
        @keyframes glow-ring {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes scan-line {
          0%, 100% { top: 20%; }
          50%       { top: 80%; }
        }
      `}</style>

      {/* Camera */}
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
                  <div key={i} className={`absolute w-10 h-10 border-amber-400 ${cls}`} />
                ))}
                <div
                  className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                  style={{ animation: "scan-line 2s ease-in-out infinite" }}
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
            Pointez la caméra sur le QR code du ticket
          </p>
        )}
      </div>

      {/* Full-screen overlay */}
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
          <ResultScreen result={scanResult} onReset={resetScan} visible={overlayVisible} />
        </div>
      )}
    </>
  );
}

function ResultScreen({
  result,
  onReset,
  visible,
}: {
  result: ScanResult;
  onReset: () => void;
  visible: boolean;
}) {
  const AUTO_CLOSE = 5;
  const [countdown, setCountdown] = useState(AUTO_CLOSE);

  const isValid   = result.result === "VALID";
  const isUsed    = result.result === "ALREADY_USED";
  const isBad     = ["FAKE", "CANCELLED", "INVALID"].includes(result.result);

  useEffect(() => {
    if (result.result !== "VALID" || !visible) return;
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); onReset(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [result.result, visible, onReset]);

  const bg = isValid
    ? "linear-gradient(160deg, #052e16 0%, #0f2d1a 40%, #030712 100%)"
    : isUsed
    ? "linear-gradient(160deg, #431407 0%, #2d1a0f 40%, #030712 100%)"
    : isBad
    ? "linear-gradient(160deg, #450a0a 0%, #2d0f0f 40%, #030712 100%)"
    : "linear-gradient(160deg, #111827 0%, #030712 100%)";

  const accentColor = isValid ? "#4ade80" : isUsed ? "#fb923c" : isBad ? "#f87171" : "#6b7280";
  const accentDim   = isValid ? "#166534" : isUsed ? "#7c2d12" : isBad ? "#7f1d1d" : "#374151";

  const title = {
    VALID:        "ACCÈS AUTORISÉ",
    ALREADY_USED: "DÉJÀ SCANNÉ",
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
      {/* Background glow blob */}
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
        {isValid ? (
          <CheckIcon color={accentColor} dimColor={accentDim} visible={visible} />
        ) : isUsed ? (
          <WarningIcon color={accentColor} dimColor={accentDim} visible={visible} />
        ) : (
          <CrossIcon color={accentColor} dimColor={accentDim} visible={visible} />
        )}
      </div>

      {/* Title */}
      <p
        style={{
          color: accentColor,
          fontSize: "clamp(1.4rem, 5vw, 2rem)",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textAlign: "center",
          marginBottom: "1.75rem",
          ...stagger(0.15),
        }}
      >
        {title}
      </p>

      {/* VALID — person info */}
      {result.result === "VALID" && (
        <div style={{ textAlign: "center", ...stagger(0.25) }}>
          <p
            style={{
              color: "white",
              fontSize: "clamp(1.6rem, 7vw, 2.5rem)",
              fontWeight: 700,
              marginBottom: "1rem",
              lineHeight: 1.1,
            }}
          >
            {result.ticket.firstName}
            <br />
            {result.ticket.lastName.toUpperCase()}
          </p>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
            <span
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#9ca3af",
                padding: "0.3rem 0.9rem",
                borderRadius: "9999px",
                fontFamily: "monospace",
                fontSize: "0.85rem",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {result.ticket.ticketNumber}
            </span>
            {result.ticket.ticketType === "VIP" && (
              <span
                style={{
                  background: "rgba(245,158,11,0.15)",
                  color: "#fbbf24",
                  border: "1px solid rgba(245,158,11,0.35)",
                  padding: "0.3rem 0.9rem",
                  borderRadius: "9999px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.05em",
                }}
              >
                VIP
              </span>
            )}
            {result.ticket.tableNumber && (
              <span
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#d1d5db",
                  padding: "0.3rem 0.9rem",
                  borderRadius: "9999px",
                  fontSize: "0.85rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Table {result.ticket.tableNumber}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ALREADY_USED — name + reason */}
      {result.result === "ALREADY_USED" && (
        <div style={{ textAlign: "center", ...stagger(0.25) }}>
          {"ticket" in result && result.ticket.firstName && (
            <p style={{ color: "white", fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {result.ticket.firstName} {result.ticket.lastName}
            </p>
          )}
          <p style={{ color: "#fdba74", fontSize: "1rem", opacity: 0.85 }}>{result.reason}</p>
        </div>
      )}

      {/* FAKE / CANCELLED / INVALID / ERROR — reason */}
      {["FAKE", "CANCELLED", "INVALID", "ERROR"].includes(result.result) && (
        <p
          style={{
            color: "#9ca3af",
            textAlign: "center",
            fontSize: "1rem",
            maxWidth: "22rem",
            lineHeight: 1.5,
            ...stagger(0.25),
          }}
        >
          {"reason" in result ? result.reason : ""}
        </p>
      )}

      {/* Auto-countdown bar (VALID only) */}
      {result.result === "VALID" && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(max(2rem, env(safe-area-inset-bottom)) + 5rem)",
            left: "1.5rem",
            right: "1.5rem",
            ...stagger(0.35),
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: "9999px",
              height: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: accentColor,
                borderRadius: "9999px",
                width: `${(countdown / AUTO_CLOSE) * 100}%`,
                transition: "width 1s linear",
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
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
          border: `1px solid rgba(255,255,255,0.12)`,
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
        Scanner le suivant
      </button>
    </div>
  );
}

function CheckIcon({
  color,
  dimColor,
  visible,
}: {
  color: string;
  dimColor: string;
  visible: boolean;
}) {
  const C = 2 * Math.PI * 52; // circle circumference r=52
  return (
    <div style={{ position: "relative", width: 128, height: 128 }}>
      {/* Pulsing ring */}
      <div
        style={{
          position: "absolute",
          inset: -10,
          borderRadius: "50%",
          border: `3px solid ${color}`,
          animation: visible ? "glow-ring 1.6s ease-out infinite" : "none",
          opacity: 0.4,
        }}
      />
      <svg viewBox="0 0 120 120" width="128" height="128">
        {/* Track circle */}
        <circle cx="60" cy="60" r="52" fill={`${dimColor}55`} stroke={`${color}25`} strokeWidth="2" />
        {/* Animated circle stroke */}
        <circle
          cx="60" cy="60" r="52"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={visible ? 0 : C}
          transform="rotate(-90 60 60)"
          style={{ transition: `stroke-dashoffset 0.6s ease 0.1s` }}
        />
        {/* Animated checkmark */}
        <path
          d="M34 60 L52 78 L86 42"
          fill="none"
          stroke={color}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="80"
          strokeDashoffset={visible ? 0 : 80}
          style={{ transition: `stroke-dashoffset 0.5s ease 0.7s` }}
        />
      </svg>
    </div>
  );
}

function CrossIcon({
  color,
  dimColor,
  visible,
}: {
  color: string;
  dimColor: string;
  visible: boolean;
}) {
  const C = 2 * Math.PI * 52;
  return (
    <svg viewBox="0 0 120 120" width="128" height="128">
      <circle cx="60" cy="60" r="52" fill={`${dimColor}55`} stroke={`${color}25`} strokeWidth="2" />
      <circle
        cx="60" cy="60" r="52"
        fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={visible ? 0 : C}
        transform="rotate(-90 60 60)"
        style={{ transition: `stroke-dashoffset 0.55s ease 0.1s` }}
      />
      <path
        d="M38 38 L82 82"
        fill="none" stroke={color} strokeWidth="5.5" strokeLinecap="round"
        strokeDasharray="63"
        strokeDashoffset={visible ? 0 : 63}
        style={{ transition: `stroke-dashoffset 0.4s ease 0.65s` }}
      />
      <path
        d="M82 38 L38 82"
        fill="none" stroke={color} strokeWidth="5.5" strokeLinecap="round"
        strokeDasharray="63"
        strokeDashoffset={visible ? 0 : 63}
        style={{ transition: `stroke-dashoffset 0.4s ease 0.85s` }}
      />
    </svg>
  );
}

function WarningIcon({
  color,
  dimColor,
  visible,
}: {
  color: string;
  dimColor: string;
  visible: boolean;
}) {
  const perimiter = 282;
  return (
    <svg viewBox="0 0 120 120" width="128" height="128">
      <polygon
        points="60,14 112,100 8,100"
        fill={`${dimColor}55`}
        stroke={`${color}25`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polygon
        points="60,14 112,100 8,100"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeDasharray={perimiter}
        strokeDashoffset={visible ? 0 : perimiter}
        style={{ transition: `stroke-dashoffset 0.6s ease 0.1s` }}
      />
      {/* Exclamation stem */}
      <line
        x1="60" y1="44" x2="60" y2="73"
        stroke={color} strokeWidth="5.5" strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset={visible ? 0 : 32}
        style={{ transition: `stroke-dashoffset 0.3s ease 0.7s` }}
      />
      {/* Exclamation dot */}
      <circle
        cx="60" cy="86" r="4"
        fill={color}
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.3s ease 0.95s`,
        }}
      />
    </svg>
  );
}
