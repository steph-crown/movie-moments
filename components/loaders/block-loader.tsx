import { PRIMARY_COLOR } from "@/lib/constants";
import { InlineLoader } from "./inline-loader";

export function BlockLoader() {
  return (
    <div className="w-screen h-screen absolute top-0 left-0 flex justify-center items-center">
      <InlineLoader color={PRIMARY_COLOR} className="size-6" />
    </div>
  );
}
