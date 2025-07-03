import clsx from "clsx";

export function InlineLoader({
  className,
  color = "white",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={clsx("size-4 animate-spin", className)}>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color || "currentColor"}
        strokeWidth="4"
        fill="none"
        className="opacity-25"
      />
      <path
        fill={color || "currentColor"}
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        className="opacity-75"
      />
    </svg>
  );
}
