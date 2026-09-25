import Image from "next/image";

/**
 * The site's mark.
 *
 * Every header renders this rather than its own <img>, so the logo cannot
 * drift between pages — which is how the public headers and the dashboard
 * topbar ended up showing it at different sizes.
 */
export default function Logo({
  light = false,
  size = "default",
}: {
  light?: boolean;
  /** "compact" for the dashboard topbar, which is only 64px tall. */
  size?: "default" | "compact";
}) {
  return (
    <div className="flex items-center">
      <Image
        src="/logo-v2.png"
        alt="Energy Tail"
        width={160}
        height={75}
        priority
        className={`${size === "compact" ? "h-10" : "h-14"} w-auto object-contain ${
          light ? "brightness-0 invert" : ""
        }`}
      />
    </div>
  );
}
