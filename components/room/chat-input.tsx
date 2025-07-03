import clsx from "clsx";
import { Clock2, Edit2Icon, Send } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

export function ChatInput({ className }: { className?: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set height to scrollHeight, but respect max-height
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // 200px = 12.5rem
    }
  };

  useEffect(() => {
    adjustHeight(); // Adjust on mount
  }, []);

  return (
    <div className={clsx("px-4 lg:px-6 w-full", className)}>
      <div className="w-full border-input focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 rounded-[1.5rem] border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] p-4 h-max">
        <Textarea
          ref={textareaRef}
          className="w-full min-h-[3rem] max-h-[12.5rem] text-base font-medium border-none shadow-none focus-visible:ring-0 focus-visible:border-transparent bg-transparent p-0 rounded-none resize-none overflow-hidden"
          placeholder="Type your thoughts..."
          onChange={adjustHeight}
          onInput={adjustHeight}
        />

        <div className="flex items-end justify-end gap-2 mt-2">
          <Button
            variant="outline"
            className="rounded-full !text-muted-foreground"
          >
            <Clock2 className="h-5 text-muted-foreground" />
            S1E1: 1:24:30
            <Edit2Icon className="h-6 text-muted-foreground" />
          </Button>

          <Button size="icon" className="rounded-full">
            <Send />
          </Button>
        </div>
      </div>
    </div>
  );
}
