import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const session = await getSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "scanner") redirect("/scan");

  const { error, redirect: redirectTo } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Gala de Retrouvailles</h1>
          <p className="text-gray-400 mt-1 text-sm">Accès réservé</p>
        </div>

        <form
          method="POST"
          action="/api/auth/login"
          className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5"
        >
          {redirectTo && (
            <input type="hidden" name="redirect" value={redirectTo} />
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              Mot de passe incorrect
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold py-3 rounded-xl transition"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
