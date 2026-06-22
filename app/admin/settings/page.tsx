"use client";

import { useEffect, useState, FormEvent } from "react";

export default function SettingsPage() {
  const [form, setForm]       = useState({ lieu: "", date: "", heure: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => { setForm({ lieu: d.lieu, date: d.date, heure: d.heure }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError("Erreur lors de la sauvegarde");
    }
  }

  const fields = [
    { key: "lieu" as const,  label: "Lieu",  placeholder: "ex : Palais des Congrès, Abidjan",       type: "text" },
    { key: "date" as const,  label: "Date",  placeholder: "ex : Samedi 5 juillet 2026",              type: "text" },
    { key: "heure" as const, label: "Heure", placeholder: "ex : 19h00 (Portes ouvertes à 18h30)",    type: "text" },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Paramètres du Gala</h1>
        <p className="text-gray-400 text-sm mt-1">Ces informations apparaissent sur tous les tickets PDF.</p>
      </div>

      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-800 rounded-xl" />)}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
              />
            </div>
          ))}

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
          )}

          {saved && (
            <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
              Paramètres sauvegardés — les prochains PDFs utiliseront ces infos.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl transition"
          >
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </button>
        </form>
      )}

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Aperçu sur le ticket PDF</p>
        <div className="space-y-2">
          {fields.map(({ key, label }) => (
            <div key={key} className="flex items-start gap-3">
              <span className="text-amber-400 text-xs font-bold uppercase w-12 shrink-0 pt-0.5">{label}</span>
              <span className="text-gray-300 text-sm">{form[key] || <span className="text-gray-600 italic">non défini</span>}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
