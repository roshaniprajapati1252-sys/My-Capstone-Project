"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { FindingsTable } from "./FindingsTable";
import { DeleteConfirmCard } from "./DeleteConfirmCard";

/**
 * Each state answers a different question. That's the design brief in one
 * line — resist the urge to reuse one card shell with a swapped label.
 *
 *   input-streaming  → "what is it doing?"      (the query is still forming)
 *   input-available  → "with what input?"       (query locked, request sent)
 *   output-available → "what came back?"        (the actual result)
 *   output-error      → "what went wrong?"       (recoverable, not a crash)
 */

type ToolPartProps = {
  part: any; // UIMessage tool part, e.g. { type: 'tool-searchDriveFiles', state, input, output, toolCallId }
  addToolResult?: (args: { tool: string; toolCallId: string; output: unknown }) => void;
};

export function ToolPart({ part, addToolResult }: ToolPartProps) {
  const toolName = part.type.replace("tool-", "");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={part.state}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="my-2 max-w-md"
      >
        {part.state === "input-streaming" && <InputStreaming toolName={toolName} part={part} />}
        {part.state === "input-available" && (
          <InputAvailable toolName={toolName} part={part} addToolResult={addToolResult} />
        )}
        {part.state === "output-available" && <OutputAvailable toolName={toolName} part={part} />}
        {part.state === "output-error" && <OutputError toolName={toolName} part={part} />}
      </motion.div>
    </AnimatePresence>
  );
}

// ── 1. input-streaming: the model is still deciding what to send ─────────
function InputStreaming({ toolName, part }: { toolName: string; part: any }) {
  const partialQuery = part.input?.query ?? "";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--line,#c8ccd4)] bg-[var(--surface-muted,#f3f4f6)] px-3 py-2 text-sm text-[var(--text-muted,#6b7280)]">
      <Search size={14} className="shrink-0 opacity-60" />
      <span className="font-mono text-xs">
        {toolName}
        <span className="opacity-50">(</span>
        <span className="animate-pulse">{partialQuery || "…"}</span>
        <span className="opacity-50">)</span>
      </span>
    </div>
  );
}

// ── 2. input-available: request locked in, executing ─────────────────────
function InputAvailable({
  toolName,
  part,
  addToolResult,
}: {
  toolName: string;
  part: any;
  addToolResult?: ToolPartProps["addToolResult"];
}) {
  // deleteFile has no execute() — this is where we intercept for confirmation
  if (toolName === "deleteFile" && addToolResult) {
    return (
      <DeleteConfirmCard
        fileName={part.input.fileName}
        onConfirm={() =>
          addToolResult({
            tool: "deleteFile",
            toolCallId: part.toolCallId,
            output: { deleted: true, fileId: part.input.fileId },
          })
        }
        onCancel={() =>
          addToolResult({
            tool: "deleteFile",
            toolCallId: part.toolCallId,
            output: { deleted: false, reason: "cancelled by user" },
          })
        }
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--line,#c8ccd4)] bg-[var(--surface,#fff)] px-3 py-2 text-sm">
      <Loader2 size={14} className="shrink-0 animate-spin text-[var(--accent,#1B3A6B)]" />
      <span>
        Searching for <span className="font-medium">&ldquo;{part.input?.query}&rdquo;</span>
        {part.input?.fileType && part.input.fileType !== "any" && (
          <span className="text-[var(--text-muted,#6b7280)]"> · {part.input.fileType}</span>
        )}
      </span>
    </div>
  );
}

// ── 3. output-available: render as a real component, not JSON ────────────
function OutputAvailable({ toolName, part }: { toolName: string; part: any }) {
  if (toolName === "searchDriveFiles") {
    return <FindingsTable query={part.output.query} files={part.output.files} />;
  }
  if (toolName === "deleteFile") {
    return part.output.deleted ? (
      <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
        <Trash2 size={14} className="mr-1.5 inline" />
        File deleted.
      </div>
    ) : (
      <div className="rounded-lg border border-[var(--line,#c8ccd4)] bg-[var(--surface-muted,#f3f4f6)] px-3 py-2 text-sm text-[var(--text-muted,#6b7280)]">
        Deletion cancelled.
      </div>
    );
  }
  return null;
}

// ── 4. output-error: designed first, not an afterthought ─────────────────
function OutputError({ toolName, part }: { toolName: string; part: any }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900">
      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-600" />
      <div>
        <div className="font-medium">Couldn&rsquo;t complete {toolName.replace(/([A-Z])/g, " $1").toLowerCase()}</div>
        <div className="mt-0.5 text-red-700">{part.errorText || "Something went wrong. Try rephrasing your request."}</div>
      </div>
    </div>
  );
}
