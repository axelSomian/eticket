"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TableWithStats = {
  id: string;
  number: string;
  capacity: number;
  isActive: boolean;
  occupied: number;
  remaining: number;
  createdAt: string;
};

type EditState = {
  number: string;
  capacity: string;
  isActive: boolean;
};

export default function TableManagement({ initialTables }: { initialTables: TableWithStats[] }) {
  const router = useRouter();

  // Create form
  const [createForm, setCreateForm] = useState({ number: "", capacity: "" });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Edit state: tableId -> EditState
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ number: "", capacity: "", isActive: true });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    const res = await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: createForm.number,
        capacity: Number(createForm.capacity),
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setCreateError(data.error || "Erreur lors de la création");
      return;
    }

    setCreateForm({ number: "", capacity: "" });
    setShowCreateForm(false);
    router.refresh();
  }

  function startEdit(t: TableWithStats) {
    setEditingId(t.id);
    setEditState({ number: t.number, capacity: String(t.capacity), isActive: t.isActive });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  async function handleSave(id: string) {
    setSaving(true);
    setEditError("");

    const res = await fetch(`/api/admin/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: editState.number,
        capacity: Number(editState.capacity),
        isActive: editState.isActive,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setEditError(data.error || "Erreur lors de la mise à jour");
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer cette table ?")) return;

    setDeleting(id);
    setDeleteError(null);

    const res = await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(null);

    if (!res.ok) {
      setDeleteError(data.error || "Erreur lors de la suppression");
      return;
    }

    router.refresh();
  }

  async function handleToggleActive(t: TableWithStats) {
    await fetch(`/api/admin/tables/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    router.refresh();
  }

  function statusBadge(t: TableWithStats) {
    if (!t.isActive) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-700 text-gray-400 border-gray-600">
          Désactivée
        </span>
      );
    }
    if (t.remaining <= 0) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
          Complet
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">
        Disponible
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tables</h1>
          <p className="text-gray-400 text-sm mt-1">{initialTables.length} table(s)</p>
        </div>
        <button
          onClick={() => { setShowCreateForm((v) => !v); setCreateError(""); }}
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition"
        >
          + Ajouter
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Nouvelle table</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-400 mb-1">Numéro / Nom</label>
              <input
                value={createForm.number}
                onChange={(e) => setCreateForm((f) => ({ ...f, number: e.target.value }))}
                required
                placeholder="1, A, VIP-1…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-400 mb-1">Capacité</label>
              <input
                type="number"
                min={1}
                value={createForm.capacity}
                onChange={(e) => setCreateForm((f) => ({ ...f, capacity: e.target.value }))}
                required
                placeholder="10"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-xl text-sm transition"
              >
                {creating ? "Création…" : "Créer"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white px-4 py-2 rounded-xl text-sm transition"
              >
                Annuler
              </button>
            </div>
          </form>
          {createError && (
            <p className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}
        </div>
      )}

      {/* Delete error banner */}
      {deleteError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center justify-between gap-3">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="shrink-0 text-red-400 hover:text-red-300 transition">
            ✕
          </button>
        </div>
      )}

      {/* Tables grid */}
      {initialTables.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl text-center py-16 text-gray-500">
          <p>Aucune table créée.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="text-amber-400 text-sm hover:underline mt-2 inline-block"
          >
            Ajouter la première table →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {initialTables.map((t) => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
              {editingId === t.id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Numéro</label>
                    <input
                      value={editState.number}
                      onChange={(e) => setEditState((s) => ({ ...s, number: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Capacité</label>
                    <input
                      type="number"
                      min={1}
                      value={editState.capacity}
                      onChange={(e) => setEditState((s) => ({ ...s, capacity: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editState.isActive}
                      onChange={(e) => setEditState((s) => ({ ...s, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span className="text-sm text-gray-300">Active</span>
                  </label>
                  {editError && (
                    <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {editError}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSave(t.id)}
                      disabled={saving}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-2 rounded-xl text-xs transition"
                    >
                      {saving ? "Sauvegarde…" : "Sauvegarder"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white py-2 rounded-xl text-xs transition"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-widest mb-0.5">Table</p>
                      <p className="text-white text-3xl font-bold leading-none">{t.number}</p>
                    </div>
                    {statusBadge(t)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
                      <p className="text-gray-500 text-xs mb-0.5">Capacité</p>
                      <p className="text-white font-semibold">{t.capacity}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
                      <p className="text-gray-500 text-xs mb-0.5">Occupée</p>
                      <p className="text-white font-semibold">{t.occupied}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-center col-span-2">
                      <p className="text-gray-500 text-xs mb-0.5">Places restantes</p>
                      <p className={`font-semibold ${t.remaining <= 0 ? "text-red-400" : "text-green-400"}`}>
                        {t.remaining <= 0 ? "0 (Complet)" : t.remaining}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-800">
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(t)}
                      title={t.isActive ? "Désactiver" : "Activer"}
                      className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                        t.isActive
                          ? "bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400"
                          : "bg-gray-700 text-gray-400 hover:bg-green-500/10 hover:text-green-400"
                      }`}
                    >
                      {t.isActive ? "Activée" : "Désactivée"}
                    </button>

                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(t)}
                        className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
