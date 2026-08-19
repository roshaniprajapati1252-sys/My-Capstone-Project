import { AlertTriangle } from "lucide-react";

export function DeleteConfirmCard({
  fileName,
  onConfirm,
  onCancel,
}: {
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm">
      <div className="flex items-start gap-2 text-amber-900">
        <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          Delete <span className="font-medium">&ldquo;{fileName}&rdquo;</span>? This can&rsquo;t be undone.
        </div>
      </div>
      <div className="mt-2.5 flex gap-2">
        <button
          onClick={onConfirm}
          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-[var(--line,#c8ccd4)] px-3 py-1 text-xs font-medium text-[var(--text,#0A1220)] hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
