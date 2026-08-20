import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatInterface from "./ChatInterface";

/**
 * ChatInterface.test.tsx
 * ---------------------------------------------------------------------------
 * useChat (from @ai-sdk/react) owns network I/O — actually streaming a
 * response means hitting /api/chat, which means hitting OpenRouter, which
 * costs money and isn't deterministic in a test run. So we mock useChat
 * itself and drive it through the same states the real hook produces
 * ('ready' | 'submitted' | 'streaming' | 'error'), and assert on what
 * ChatInterface does in response to each — which is the part actually
 * worth testing here, not the SDK's own internals.
 * ---------------------------------------------------------------------------
 */

const sendMessage = vi.fn();
const stop = vi.fn();
const clearError = vi.fn();

let mockState: {
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    parts: Array<{ type: string; text?: string }>;
  }>;
  status: "ready" | "submitted" | "streaming" | "error";
  error: Error | undefined;
};

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: mockState.messages,
    sendMessage,
    status: mockState.status,
    stop,
    error: mockState.error,
    clearError,
  }),
}));

vi.mock("ai", () => ({
  DefaultChatTransport: class {},
}));

beforeEach(() => {
  sendMessage.mockClear();
  stop.mockClear();
  clearError.mockClear();
  mockState = {
    messages: [],
    status: "ready",
    error: undefined,
  };
});

describe("ChatInterface", () => {
  it("shows the empty state when there are no messages", () => {
    render(<ChatInterface />);
    expect(screen.getByText(/start a session/i)).toBeInTheDocument();
  });

  it("keeps the send button disabled until there is input", async () => {
    render(<ChatInterface />);
    const sendButton = screen.getByRole("button", { name: /send message/i });
    expect(sendButton).toBeDisabled();

    await userEvent.type(
      screen.getByRole("textbox", { name: /message/i }),
      "hello",
    );
    expect(sendButton).toBeEnabled();
  });

  it("calls sendMessage with trimmed text and clears the input on submit", async () => {
    render(<ChatInterface />);
    const textarea = screen.getByRole("textbox", { name: /message/i });

    await userEvent.type(textarea, "  what does this app do?  ");
    await userEvent.click(
      screen.getByRole("button", { name: /send message/i }),
    );

    expect(sendMessage).toHaveBeenCalledWith({
      text: "what does this app do?",
    });
    expect(textarea).toHaveValue("");
  });

  it("does not submit empty or whitespace-only input", async () => {
    render(<ChatInterface />);
    const textarea = screen.getByRole("textbox", { name: /message/i });

    await userEvent.type(textarea, "   ");
    fireEvent.submit(textarea.closest("form")!);

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("sends on Enter and inserts a newline on Shift+Enter", async () => {
    render(<ChatInterface />);
    const textarea = screen.getByRole("textbox", { name: /message/i });

    await userEvent.type(textarea, "line one");
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    expect(sendMessage).not.toHaveBeenCalled();

    await userEvent.type(textarea, "{Enter}");
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it("renders existing messages by role", () => {
    mockState.messages = [
      { id: "1", role: "user", parts: [{ type: "text", text: "Hi" }] },
      {
        id: "2",
        role: "assistant",
        parts: [{ type: "text", text: "Hello there" }],
      },
    ];
    render(<ChatInterface />);

    expect(screen.getByText("Hi")).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("shows the thinking indicator while a request is submitted", () => {
    mockState.status = "submitted";
    render(<ChatInterface />);
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });

  it("swaps the send button for a stop button while busy, and calls stop()", async () => {
    mockState.status = "streaming";
    mockState.messages = [
      {
        id: "1",
        role: "assistant",
        parts: [{ type: "text", text: "partial answ" }],
      },
    ];
    render(<ChatInterface />);

    const stopButton = screen.getByRole("button", { name: /stop generating/i });
    expect(stopButton).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send message/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(stopButton);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("disables the textarea while busy", () => {
    mockState.status = "streaming";
    render(<ChatInterface />);
    expect(screen.getByRole("textbox", { name: /message/i })).toBeDisabled();
  });

  it("shows an error alert and dismisses it via clearError()", async () => {
    mockState.error = new Error("Network unreachable");
    render(<ChatInterface />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Network unreachable");

    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(clearError).toHaveBeenCalledTimes(1);
  });

  it("clears any existing error before sending a new message", async () => {
    mockState.error = new Error("previous failure");
    render(<ChatInterface />);

    await userEvent.type(
      screen.getByRole("textbox", { name: /message/i }),
      "try again",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /send message/i }),
    );

    expect(clearError).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith({ text: "try again" });
  });
});
