import { cn } from "@/lib/utils";

// Shared with the casa-vida repo's admin panel so both back-office tools
// read as the same product (same asset, same .logo-mark CSS mask).
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("logo-mark size-8", className)}
    />
  );
}
