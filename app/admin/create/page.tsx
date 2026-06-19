"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

type CreatedTicket = {
  ticket: {
    id: string;
    ticketNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;
    ticketType: string;
    table: { number: string } | null;
  };
  qrCodeDataUrl: string;
};

type TableOption = {
  id: string;
  number: string;
  capacity: number;
  isActive: boolean;
  occupied: number;
  remaining: number;
};

export default function CreateTicketPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    ticketType: "STANDARD",
    tableId: "",
    note: "",
  });
  const [tables, setTables] = useState<TableOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedTicket | null>(null);

  useEffect(() => {
    fetch("/api/admin/tables")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTables(data);
      })
      .catch(() => {});
  }, []);

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
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      ticketType: "STANDARD",
      tableId: "",
      note: "",
    });
  }

  if (created) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Ticket créé !</h2>
          <p className="text-gray-400 text-sm mt-1">
            {created.ticket.ticketNumber} — {created.ticket.firstName} {created.ticket.lastName}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center gap-4">
          <p className="text-gray-300 text-sm font-medium">QR Code du ticket</p>
          <div className="bg-white p-3 rounded-xl">
            <Image
              src={created.qrCodeDataUrl}
              alt="QR Code"
              width={200}
              height={200}
            />
          </div>
          <div className="flex gap-3 w-full">
            <Link
              href={`/ticket/${created.ticket.id}`}
              target="_blank"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2.5 rounded-xl text-sm text-center transition"
            >
              Voir le ticket
            </Link>
            <Link
              href={`/admin/tickets/${created.ticket.id}`}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-sm text-center transition"
            >
              Détails
            </Link>
          </div>
        </div>

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
        <p className="text-gray-400 text-sm mt-1">Remplissez les informations de l&apos;invité</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
        {/* Nom / Prénom */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Prénom <span className="text-amber-400">*</span>
            </label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              placeholder="Jean"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nom <span className="text-amber-400">*</span>
            </label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
              placeholder="Dupont"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
            />
          </div>
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+33 6 00 00 00 00"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
          />
        </div>

        {/* Type + Table */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Type de billet</label>
            <select
              name="ticketType"
              value={form.ticketType}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
            >
              <option value="STANDARD">Standard</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Table <span className="text-amber-400">*</span>
            </label>
            <select
              name="tableId"
              value={form.tableId}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
            >
              <option value="" disabled hidden>Sélectionner une table</option>
              {tables.map((t) => {
                const full = t.remaining <= 0 || !t.isActive;
                const label = !t.isActive
                  ? `Table ${t.number} (Désactivée)`
                  : t.remaining <= 0
                  ? `Table ${t.number} (Complet)`
                  : `Table ${t.number} (${t.remaining} place${t.remaining > 1 ? "s" : ""} restante${t.remaining > 1 ? "s" : ""})`;
                return (
                  <option key={t.id} value={t.id} disabled={full}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Note (optionnel)</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="Régime alimentaire, besoin particulier..."
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
          {loading ? "Création en cours..." : "Créer le ticket"}
        </button>
      </form>
    </div>
  );
}
