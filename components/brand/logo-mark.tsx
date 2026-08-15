import { cn } from "@/lib/utils";

/**
 * Casa Vida isotype — a minimalist line house: a body with a gable roof
 * and an arch (doorway) inside. Shared with the casa-vida repo's admin
 * panel so both back-office tools read as the same product.
 */
export function LogoMark({
  className,
  strokeWidth = 5,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <path
        d="M14 46 L50 14 L86 46 M22 42 V86 H78 V42"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M39 86 V64 a11 11 0 0 1 22 0 V86"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
