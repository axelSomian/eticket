import { requireAdmin } from "@/lib/auth";
import ReentryScanner from "@/components/ReentryScanner";

export default async function ReentryPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Scanner — Ré-entrée</h1>
        <p className="text-gray-400 text-sm mt-1">
          Scannez le ticket d&apos;une personne qui souhaite re-rentrer. Le ticket passera de <span className="text-blue-400">Scanné</span> à <span className="text-green-400">Valide</span> pour permettre un nouveau scan à l&apos;entrée.
        </p>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl px-5 py-4 flex gap-3">
        <span className="text-blue-400 text-lg shrink-0">ℹ</span>
        <p className="text-blue-300 text-sm leading-relaxed">
          Cette action est réservée à l&apos;organisateur. Les scanners à l&apos;entrée ne gèrent que les premières entrées.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 py-4">
        <ReentryScanner />
      </div>
    </div>
  );
}
