export const dynamic = "force-dynamic";

async function getHealth() {
  try {
    const res = await fetch("https://api.github.com/zen", { cache: "no-store" });
    return {
      status: res.ok ? "ok" : "error",
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      status: "error",
      checkedAt: new Date().toISOString(),
    };
  }
}

export default async function HealthPage() {
  const health = await getHealth();
  return (
    <div className="flex flex-col gap-4">
      <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs uppercase tracking-widest text-[#C89B3C]">
        OUTPUT.
      </p>
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight">
        System Health
      </h1>
      <pre className="max-w-xl rounded border border-[#1B3A6B] bg-[#1B3A6B]/10 p-4 font-[family-name:var(--font-ibm-plex-mono)] text-sm">
        {JSON.stringify(health, null, 2)}
      </pre>
    </div>
  );
}
