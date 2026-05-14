import Image from "next/image";

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex bg-white flex-col items-center justify-center z-50">
      <div className="w-[256px] h-[78px]">
        <Image
          src="/logo_capella.webp"
          alt="Capella"
          width={256}
          height={78}
          className="animate-pulse w-full"
          priority
        />
      </div>
    </div>
  );
}