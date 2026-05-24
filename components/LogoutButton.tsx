"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <button
      onClick={logout}
      className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded-lg hover:bg-gray-800"
    >
      Déconnexion
    </button>
  );
}
