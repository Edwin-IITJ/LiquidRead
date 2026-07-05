const VARIANT_CONFIG = {
  insight: {
    border: "#6366f1",
    bg: "rgba(99, 102, 241, 0.06)",
    icon: "💡",
  },
  warning: {
    border: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.06)",
    icon: "⚠️",
  },
  context: {
    border: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.06)",
    icon: "ℹ️",
  },
} as const;

export default function CalloutBlock({
  variant,
  text,
}: {
  variant: "insight" | "warning" | "context";
  text: string;
}) {
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.context;

  return (
    <div
      className="blk-callout"
      style={{
        borderLeftColor: config.border,
        backgroundColor: config.bg,
      }}
    >
      <span className="blk-callout__icon" aria-hidden="true">
        {config.icon}
      </span>
      <p className="blk-callout__text">{text}</p>
    </div>
  );
}
