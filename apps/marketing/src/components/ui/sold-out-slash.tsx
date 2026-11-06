/**
 * Diagonal strike drawn over a colour swatch whose variants are all sold out.
 * Place inside a `relative` swatch element.
 */
export function SoldOutSlash() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <span className="block h-px w-[70%] rotate-45 bg-neutral-700 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]" />
    </span>
  );
}
