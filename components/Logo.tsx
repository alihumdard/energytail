import Image from "next/image";

export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center">
      <Image
        src="/logo.png"
        alt="Energy Tail"
        width={90}
        height={47}
        priority
        className={`h-10 w-auto object-contain ${light ? "brightness-0 invert" : ""}`}
      />
    </div>
  );
}
