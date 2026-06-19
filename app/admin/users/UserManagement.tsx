"use client";

import { useState } from "react";

type User = {
  id: string;
  username: string;
  role: "ADMIN" | "SCANNER";
  createdAt: string;
};

export default function UserManagement({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [form, setForm] = useState({ username: "", password: "", role: "SCANNER" as "ADMIN" | "SCANNER" });
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUsers((u) => [...u, data]);
      setForm({ username: "", password: "", role: "SCANNER" });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setUsers((u) => u.filter((x) => x.id !== id));
  }

  async function changePassword(id: string) {
    if (!newPassword || newPassword.length < 6) {
      alert("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    setNewPassword("");
    setShowPasswordFor(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
          <p className="text-gray-400 text-sm mt-1">{users.length} compte{users.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setError(""); }}
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition"
        >
          + Ajouter
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createUser}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4"
        >
          <h2 className="text-white font-semibold">Nouvel utilisateur</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom d&apos;utilisateur</label>
              <input
                type="text"
                required
                autoCapitalize="none"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                placeholder="scanner1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                placeholder="min. 6 caractères"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rôle</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "ADMIN" | "SCANNER" }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm"
              >
                <option value="SCANNER">Scanner</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-xl text-sm transition"
            >
              {loading ? "Création…" : "Créer"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {users.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-10">Aucun utilisateur</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {users.map((u) => (
              <div key={u.id} className="px-4 sm:px-6 py-4">
                {/* Main row */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-sm shrink-0">
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{u.username}</span>
                      {u.id === currentUserId && (
                        <span className="text-xs text-gray-500">(vous)</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        u.role === "ADMIN"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {u.role === "ADMIN" ? "Admin" : "Scanner"}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Créé le {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setShowPasswordFor(showPasswordFor === u.id ? null : u.id);
                        setNewPassword("");
                      }}
                      className="text-xs text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-800 transition whitespace-nowrap"
                    >
                      Mdp
                    </button>
                    {u.id !== currentUserId && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition"
                      >
                        Suppr.
                      </button>
                    )}
                  </div>
                </div>

                {/* Change password panel */}
                {showPasswordFor === u.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nouveau mot de passe (min. 6)"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 min-w-0"
                    />
                    <button
                      onClick={() => changePassword(u.id)}
                      className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-2 rounded-xl text-sm transition"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => { setShowPasswordFor(null); setNewPassword(""); }}
                      className="shrink-0 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
