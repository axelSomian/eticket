"use client";

export default function DownloadButton({ ticketId }: { ticketId: string }) {
  return (
    <a
      href={`/api/tickets/${ticketId}/pdf`}
      download
      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-xl text-sm transition"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Télécharger le ticket (PDF)
    </a>
  );
}
