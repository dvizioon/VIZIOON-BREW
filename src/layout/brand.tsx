import Image from "next/image";

export function BrandMark({ className = "size-10" }: { className?: string }) {
  return <Image src="/assets/logo.svg" alt="Vizioon Brew" width={80} height={80} className={`${className} h-auto object-contain`} />;
}
