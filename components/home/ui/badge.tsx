import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#6365F1] text-[#F8FAFC] hover:bg-[#6365F1]/80",
        secondary: "border-transparent bg-[#FF9933] text-[#F8FAFC] hover:bg-[#FF9933]/80",
        destructive: "border-transparent bg-[#EF4343] text-[#FAFAFA] hover:bg-[#EF4343]/80",
        outline: "text-[#292929]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
