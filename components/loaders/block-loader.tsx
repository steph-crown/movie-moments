import { PRIMARY_COLOR } from "@/lib/constants";
import { InlineLoader } from "./inline-loader";

export function BlockLoader({ showOverlay }: { showOverlay?: boolean }) {
  return (
    <div className="w-screen h-screen absolute top-0 left-0 flex justify-center items-center">
      <InlineLoader
        color={PRIMARY_COLOR}
        className="size-6 relative z-[10000]"
      />

      {showOverlay && <div className="absolute inset-0 bg-black/35 z-10" />}
    </div>
  );
}
