import { tool } from "ai";
import { z } from "zod";

/**
 * TOOL 1: searchDriveFiles
 * Server-side, auto-executing tool. The model calls it, execute() runs
 * immediately, result streams back — no user action required.
 *
 * Keep the schema small and honest (per mentor tips): every field is a
 * field the model can hallucinate, so only ask for what execute() needs.
 */
export const searchDriveFiles = tool({
  description:
    "Search the user's connected Google Drive for files matching a query. " +
    "Use this when the user asks to find, look up, or reference a document, " +
    "sheet, or slide deck they own.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe("Search terms — file name, topic, or keywords. Not a full sentence."),
    fileType: z
      .enum(["doc", "sheet", "slide", "any"])
      .optional()
      .describe("Restrict results to a file type. Omit or use 'any' for no filter."),
  }),
  // execute = server tool. No execute = client/human-in-the-loop tool (see below).
  execute: async ({ query, fileType }) => {
    // Replace with a real Google Drive:search_files MCP call.
    // Simulated latency + occasional failure so the error state is real, not theoretical.
    await new Promise((r) => setTimeout(r, 900));

    if (query.toLowerCase().includes("fail")) {
      // Throwing here is what produces the 'output-error' tool part —
      // test this path deliberately, don't just hope it never happens.
      throw new Error("Drive API rate limit exceeded. Try again in a moment.");
    }

    const mock = [
      { id: "1a2b", name: "Q3 Content Calendar", type: "sheet", relevance: 0.94, snippet: "…rows for Aug–Oct posting cadence, OUTPUT. brand tokens applied…" },
      { id: "3c4d", name: "Capstone Case Study Draft", type: "doc", relevance: 0.81, snippet: "…problem / what I did / what came of it, three-beat structure…" },
      { id: "5e6f", name: "FE-06 Architecture Notes", type: "doc", relevance: 0.63, snippet: "…streaming route.ts, Vercel AI SDK, OpenRouter fallback…" },
    ].filter((f) => fileType === undefined || fileType === "any" || f.type === fileType);

    return {
      query,
      count: mock.length,
      files: mock,
    };
  },
});

/**
 * TOOL 2: deleteFile
 * Human-in-the-loop tool. NOTE: no execute() function — that's what tells
 * the AI SDK this is a client-confirmed action. The model proposes the call,
 * the client renders a confirmation UI, and the *client* sends the result
 * back via addToolResult() only after the user approves.
 */
export const deleteFile = tool({
  description:
    "Delete a file from the user's Drive. DESTRUCTIVE — always requires " +
    "explicit user confirmation before it runs. Only call this when the " +
    "user has clearly asked to delete a specific, named file.",
  inputSchema: z.object({
    fileId: z.string().describe("The id of the file to delete, from a prior search result."),
    fileName: z.string().describe("Human-readable file name, shown in the confirmation prompt."),
  }),
  // no execute — client owns this one
});

export const tools = {
  searchDriveFiles,
  deleteFile,
};
