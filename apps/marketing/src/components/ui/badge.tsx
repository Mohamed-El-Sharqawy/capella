import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-red-600 text-white",
        outline:
          "text-foreground border-black/10 bg-white/80 backdrop-blur-sm",
        success:
          "border-transparent bg-emerald-600 text-white",
        luxury:
          "border-transparent bg-black text-white shadow-md",
        trending:
          "border-transparent bg-white/95 text-black backdrop-blur-sm shadow-sm border border-black/5",
        glass:
          "border-white/20 bg-black/10 text-white backdrop-blur-md",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.2em]",
        default: "px-2 py-1 text-[9px] font-bold uppercase tracking-[0.15em]",
        lg: "px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
