import { cn } from "@/lib/utils/string.utils";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

export function Logo({
  className,
  color = "blue",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <Link
      href="/"
      className={clsx("flex items-center gap-2 font-medium", className)}
    >
      <div className="flex size-9 items-center justify-center rounded-md">
        {/* <GalleryVerticalEnd className="size-6 text-primary" /> */}
        <Image
          src={color === "white" ? "/logo-white.svg" : "/logo.svg"}
          alt="Logo"
          width={64}
          height={64}
          // className="w-[72px] h-[72px]"
        />
      </div>

      <span
        className={cn(
          " font-semibold text-sm ",
          color === "white" ? "text-white" : "text-primary"
        )}
      >
        MovieMoments
      </span>
    </Link>
  );
}
