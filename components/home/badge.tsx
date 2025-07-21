import { Badge as BaseBadge } from "@/components/home/ui/badge";
import { cn } from "@/lib/utils";

interface BadgeProps {
  text: string;
  className?: string;
}

export function Badge({ text, className }: BadgeProps) {
  return (
    <BaseBadge
      variant="outline"
      className={cn("border-[#0A0A0A]/50 w-fit font-inter", className)}
    >
      {text}
    </BaseBadge>
  );
}
