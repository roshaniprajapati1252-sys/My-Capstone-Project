## Tools (FE-07)

### `searchDriveFiles`
Server-side, auto-executing.

**Input:** `{ query: string; fileType?: "doc" | "sheet" | "slide" | "any" }`
**Output:** `{ query: string; count: number; files: Array<{ id, name, type, relevance, snippet }> }`
**Errors:** throws on simulated Drive API failure — renders as a designed red error card, not a crash.

### `deleteFile`
Client-confirmed (human-in-the-loop) — no `execute()`. Model proposes the call, client shows a confirm/cancel card, deletion only proceeds after explicit user approval.

**Input:** `{ fileId: string; fileName: string }`
**Output:** `{ deleted: true; fileId: string } | { deleted: false; reason: string }`

### Tool part states
| State | Shows |
|---|---|
| `input-streaming` | Dashed card, query still typing in |
| `input-available` | Spinner card (or confirmation card for `deleteFile`) |
| `output-available` | Real component — `FindingsTable` — not raw JSON |
| `output-error` | Red card, plain-English message |

