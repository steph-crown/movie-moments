import clsx from "clsx";
import { Clock2, Edit2Icon, Send } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export function ChatInput({ className }: { className?: string }) {
  return (
    <div className={clsx("px-4 lg:px-6 w-full ", className)}>
      <div className="relative w-full">
        <Textarea className="w-full h-[5rem] max-h-[12.5rem] pr-[3.75rem] text-sm" />

        <Badge
          variant="secondary"
          className="cursor-pointer border border-solid border-border py-1 px-2 gap-1.5 absolute -top-[1.875rem] right-0"
        >
          <Clock2 className="h-5 text-muted-foreground" />
          S1E1: 1:24:30
          <Edit2Icon className="h-6 text-muted-foreground" />
        </Badge>

        <div className="absolute right-3 bottom-2 flex items-end gap-2">
          <Button size="icon" className="rounded-full">
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
}
