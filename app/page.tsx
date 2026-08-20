import dynamic from "next/dynamic";

const ChatInterface = dynamic(() => import("@/components/chat/ChatInterface"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-[#EDEFF3]/50">
      Loading assistant…
    </div>
  ),
});

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs uppercase tracking-widest text-[#C89B3C]">
          OUTPUT.
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 max-w-xl text-[#EDEFF3]/70">
          Your Google Workspace and Telegram, in one place. Everything below
          is a placeholder route -- build proceeds screen by screen.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Docs", href: "/docs" },
          { name: "Gmail", href: "/gmail" },
          { name: "Calendar", href: "/calendar" },
          { name: "Drive", href: "/drive" },
          { name: "Telegram", href: "/telegram" },
        ].map((item) => (
          
           <a key={item.href}
            href={item.href}
            className="rounded border border-[#1B3A6B] bg-[#1B3A6B]/10 p-5 transition-colors hover:border-[#C89B3C]"
          >
            <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-medium">
              {item.name}
            </p>
            <p className="mt-1 font-[family-name:var(--font-ibm-plex-mono)] text-xs text-[#EDEFF3]/50">
              {item.href}
            </p>
          </a>
        ))}
      </div>

      <div>
        <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs uppercase tracking-widest text-[#C89B3C]">
          Assistant
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-xl font-semibold tracking-tight">
          Ask the agent
        </h2>
        {/* Fixed-height wrapper: chat-shell fills 100% of its parent, so it
            needs a parent with a real height rather than "grow forever". */}
        <div className="mt-4 h-[32rem] max-h-[70vh]">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}