import Image from "next/image";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center">
      <Image
        src="/logo-trimmed.png"
        alt="Energy Tail"
        width={160}
        height={75}
        priority
        className={`h-14 w-auto object-contain ${light ? "brightness-0 invert" : ""}`}
      />
    </div>
  );
}
