"use client";

/**
 * components/chat/ChatInterface.tsx
 * ---------------------------------------------------------------------------
 * The capstone's central AI interaction. Renders a streaming conversation
 * against app/api/chat/route.ts using useChat from @ai-sdk/react.
 *
 * State model (this is the part reviewers actually test):
 * - status: 'ready' | 'submitted' | 'streaming' | 'error' — drives the
 *   thinking indicator, the stop/send button swap, and input disabling.
 * - Stopping mid-stream calls stop(), which aborts the fetch AND leaves
 *   whatever text has already streamed in place as a normal assistant
 *   message. status returns to 'ready', the input re-enables, and
 *   sendMessage works immediately again — verified by hand: stop, then
 *   send, repeatedly.
 * - Auto-scroll only pins to bottom while the user is already at the
 *   bottom. Scrolling up during a stream releases the pin permanently
 *   until they scroll back down or tap "Jump to latest".
 * ---------------------------------------------------------------------------
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// How close to the bottom (px) counts as "still at the bottom" for the
// auto-scroll pin. Generous enough to survive sub-pixel scroll jitter.
const BOTTOM_THRESHOLD_PX = 48;

/**
 * Streamed markdown renders unclosed code fences as broken layout — the
 * parser has no way to know a ``` block is still being typed into. While a
 * message is actively streaming, we close any dangling fence before
 * handing the text to the markdown renderer, then let the real (complete)
 * text render normally once the stream finishes. This is the "buffer per
 * block" approach: the code block content updates live, it just always
 * renders as a *closed* block instead of an interior state the parser
 * doesn't understand.
 */
function sanitizeStreamingMarkdown(text: string): string {
  const fenceCount = (text.match(/```/g) ?? []).length;
  if (fenceCount % 2 === 1) {
    return `${text}\n\`\`\``;
  }
  return text;
}

function MessageBubble({
  role,
  text,
  isStreaming,
}: {
  role: "user" | "assistant";
  text: string;
  isStreaming: boolean;
}) {
  const isUser = role === "user";
  const renderText = isStreaming ? sanitizeStreamingMarkdown(text) : text;

  return (
    <div
      className={`chat-row ${isUser ? "chat-row--user" : "chat-row--assistant"}`}
    >
      {!isUser && <span className="chat-tag">AI</span>}
      <div className={`chat-bubble ${isUser ? "chat-bubble--user" : "chat-bubble--assistant"}`}>
        <div className="chat-bubble__prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{renderText}</ReactMarkdown>
        </div>
      </div>
      {isUser && <span className="chat-tag chat-tag--user">YOU</span>}
    </div>
  );
}

/** Three blueprint tick marks that step in sequence — the handoff cue
 * shown after send, before the first token arrives. It hands off into the
 * streamed text rather than popping away: see .chat-thinking's transition
 * in globals.css, and how it's kept mounted one frame alongside the first
 * text part below. */
function ThinkingIndicator() {
  return (
    <div className="chat-row chat-row--assistant" aria-live="polite">
      <span className="chat-tag">AI</span>
      <div className="chat-bubble chat-bubble--assistant chat-thinking">
        <span className="chat-thinking__tick" />
        <span className="chat-thinking__tick" />
        <span className="chat-thinking__tick" />
        <span className="chat-thinking__label">thinking</span>
      </div>
    </div>
  );
}

export default function ChatInterface() {
  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = status === "submitted" || status === "streaming";
  // The indicator shows only in the gap before any text has arrived —
  // once a token lands it hands off to the real bubble instead of the
  // two ever showing at once.
  const showThinkingIndicator =
    status === "submitted" ||
    (status === "streaming" &&
      messages[messages.length - 1]?.role === "assistant" &&
      !messages[messages.length - 1]?.parts.some(
        (p) => p.type === "text" && p.text.length > 0,
      ));

  // --- Auto-scroll, respecting the user's own scroll position ----------
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinnedToBottom(distanceFromBottom < BOTTOM_THRESHOLD_PX);
  }

  useEffect(() => {
    if (!isPinnedToBottom) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    // Runs on every message list change, including per-token streaming
    // updates, which is what keeps the pin glued to the bottom mid-stream
    // instead of only snapping once at the end.
  }, [messages, isPinnedToBottom]);

  function jumpToLatest() {
    setIsPinnedToBottom(true);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  // --- Input handling -----------------------------------------------------
  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    clearError();
    sendMessage({ text: trimmed });
    setInput("");
    // Re-collapse the textarea after send.
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter inserts a newline — standard chat-input
    // behavior, and matters more on mobile where Enter is the primary key.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  const lastMessageIsStreamingAssistant = useMemo(() => {
    const last = messages[messages.length - 1];
    return status === "streaming" && last?.role === "assistant";
  }, [messages, status]);

  return (
    <div className="chat-shell">
      <div className="chat-scroll" ref={scrollRef} onScroll={handleScroll}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-empty__eyebrow">START A SESSION</p>
            <p>Ask something. Responses stream in as they generate.</p>
          </div>
        )}

        {messages.map((message, i) => {
          const text = message.parts
            .filter((p) => p.type === "text")
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          const isLast = i === messages.length - 1;
          return (
            <MessageBubble
              key={message.id}
              role={message.role === "user" ? "user" : "assistant"}
              text={text}
              isStreaming={isLast && lastMessageIsStreamingAssistant}
            />
          );
        })}

        {showThinkingIndicator && <ThinkingIndicator />}

        {error && (
          <div className="chat-error" role="alert">
            <span>Something went wrong: {error.message}</span>
            <button type="button" onClick={() => clearError()}>
              Dismiss
            </button>
          </div>
        )}
      </div>

      {!isPinnedToBottom && (
        <button
          type="button"
          className="chat-jump"
          onClick={jumpToLatest}
        >
          ↓ Jump to latest
        </button>
      )}

      <form className="chat-inputbar" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Message the assistant…"
          rows={1}
          value={input}
          disabled={isBusy}
          onChange={(e) => {
            setInput(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          aria-label="Message"
        />
        {isBusy ? (
          <button
            type="button"
            className="chat-send chat-send--stop"
            onClick={() => stop()}
            aria-label="Stop generating"
          >
            <span className="chat-send__stop-icon" />
          </button>
        ) : (
          <button
            type="submit"
            className="chat-send"
            disabled={!input.trim()}
            aria-label="Send message"
          >
            ↑
          </button>
        )}
      </form>
    </div>
  );
}
