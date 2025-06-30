import clsx from "clsx";
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={clsx("flex items-center gap-2 font-medium", className)}
    >
      <div className="flex size-8 items-center justify-center rounded-md">
        <GalleryVerticalEnd className="size-6 text-primary" />
      </div>

      <span className=" font-medium">MovieMoments</span>
    </Link>
  );
}
