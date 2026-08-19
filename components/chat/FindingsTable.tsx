import { FileText, FileSpreadsheet, Presentation } from "lucide-react";

type DriveFile = {
  id: string;
  name: string;
  type: "doc" | "sheet" | "slide";
  relevance: number;
  snippet: string;
};

const ICONS = { doc: FileText, sheet: FileSpreadsheet, slide: Presentation };

export function FindingsTable({ query, files }: { query: string; files: DriveFile[] }) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--line,#c8ccd4)] bg-[var(--surface,#fff)] px-3 py-3 text-sm text-[var(--text-muted,#6b7280)]">
        No files found for &ldquo;{query}&rdquo;.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line,#c8ccd4)] bg-[var(--surface,#fff)]">
      <div className="border-b border-[var(--line,#c8ccd4)] bg-[var(--surface-muted,#f3f4f6)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted,#6b7280)]">
        {files.length} result{files.length !== 1 ? "s" : ""} · &ldquo;{query}&rdquo;
      </div>
      <ul>
        {files.map((f) => {
          const Icon = ICONS[f.type];
          return (
            <li
              key={f.id}
              className="flex items-start gap-2.5 border-b border-[var(--line,#eceef1)] px-3 py-2.5 last:border-0"
            >
              <Icon size={15} className="mt-0.5 shrink-0 text-[var(--accent,#1B3A6B)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-[var(--text,#0A1220)]">{f.name}</span>
                  <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted,#6b7280)]">
                    {Math.round(f.relevance * 100)}%
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted,#6b7280)]">{f.snippet}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
