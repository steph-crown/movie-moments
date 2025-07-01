import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

export default function Rooms() {
  return (
    <div>
      <div className="flex justify-end gap-4">
        <div className="flex gap-8">
          <Popover>
            <PopoverTrigger className="text-xs font-medium flex gap-1 items-center">
              All rooms
              <ChevronDown className="h-4" />
            </PopoverTrigger>

            <PopoverContent>Place content for the popover here.</PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger className="text-xs font-medium flex gap-1 items-center">
              Last created
              <ChevronDown className="h-4" />
            </PopoverTrigger>

            <PopoverContent>Place content for the popover here.</PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
