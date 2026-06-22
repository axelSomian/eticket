"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

type CreatedTicket = {
  id: string;
  ticketNumber: string;
  ticketType: string;
};

export default function CreateTicketPage() {
  const [form, setForm] = useState({ ticketType: "INDIVIDUEL", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ tickets: CreatedTicket[]; qrCodes: string[] } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur lors de la création");
      setLoading(false);
      return;
    }

    setCreated(data);
    setLoading(false);
  }

  function resetForm() {
    setCreated(null);
    setForm({ ticketType: "INDIVIDUEL", note: "" });
  }

  if (created) {
    const isGbonhi = created.tickets.length > 1;
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">
            {isGbonhi ? "6 tickets Gbonhi créés !" : "Ticket créé !"}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {isGbonhi ? "Offre Gbonhi — 6 places" : created.tickets[0].ticketNumber}
          </p>
        </div>

        {isGbonhi ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-300 text-sm font-medium">Tickets générés</p>
              <a
                href={`/api/tickets/batch-pdf?ids=${created.tickets.map((t) => t.id).join(",")}`}
                target="_blank"
                rel="noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                6 PDFs en un fichier
              </a>
            </div>
            {created.tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 bg-gray-800/50 rounded-xl px-4 py-3">
                <span className="font-mono text-amber-400 text-sm">{t.ticketNumber}</span>
                <div className="flex gap-2">
                  <Link
                    href={`/ticket/${t.id}`}
                    target="_blank"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg text-xs transition"
                  >
                    Voir
                  </Link>
                  <Link
                    href={`/admin/tickets/${t.id}`}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition"
                  >
                    Détails
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center gap-4">
            <p className="text-gray-300 text-sm font-medium">QR Code du ticket</p>
            <div className="bg-white p-3 rounded-xl">
              <Image src={created.qrCodes[0]} alt="QR Code" width={200} height={200} />
            </div>
            <div className="flex gap-3 w-full">
              <Link
                href={`/ticket/${created.tickets[0].id}`}
                target="_blank"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-xl text-sm text-center transition"
              >
                Voir le ticket
              </Link>
              <Link
                href={`/admin/tickets/${created.tickets[0].id}`}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-sm text-center transition"
              >
                Détails
              </Link>
            </div>
          </div>
        )}

        <button
          onClick={resetForm}
          className="w-full border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white py-3 rounded-xl text-sm transition"
        >
          Créer un autre ticket
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Créer un ticket</h1>
        <p className="text-gray-400 text-sm mt-1">Sélectionnez l&apos;offre</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        {/* Offre */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Offre</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "INDIVIDUEL", label: "Individuel", sub: "1 ticket — 10 mil" },
              { value: "GBONHI", label: "Gbonhi", sub: "6 tickets — 50 mil" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition ${
                  form.ticketType === opt.value
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <input
                  type="radio"
                  name="ticketType"
                  value={opt.value}
                  checked={form.ticketType === opt.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className={`font-semibold text-sm ${form.ticketType === opt.value ? "text-amber-400" : "text-white"}`}>
                  {opt.label}
                </span>
                <span className="text-gray-500 text-xs">{opt.sub}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Note (optionnel)</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="Remarque particulière..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm resize-none"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-xl transition"
        >
          {loading
            ? "Création en cours..."
            : form.ticketType === "GBONHI"
            ? "Créer 6 tickets Gbonhi"
            : "Créer le ticket"}
        </button>
      </form>
    </div>
  );
}
