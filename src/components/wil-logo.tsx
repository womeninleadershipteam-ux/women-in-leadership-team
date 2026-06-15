import logoUrl from "@/assets/wil-logo.png";

export function WilLogo({ className = "h-10 w-auto", invert = false }: { className?: string; invert?: boolean }) {
  return (
    <img
      src={logoUrl}
      alt="Women in Leadership"
      className={className}
      style={invert ? { filter: "brightness(0) invert(1)" } : undefined}
      width={899}
      height={378}
      loading="eager"
    />
  );
}
