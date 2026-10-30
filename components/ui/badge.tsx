import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-healthcare-100 text-healthcare-800 hover:bg-healthcare-200",
        secondary:
          "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200",
        destructive:
          "border-transparent bg-red-100 text-red-800",
        outline: "text-slate-700 border-slate-300",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning: "border-amber-300 bg-amber-50 text-amber-800 font-medium",
        medicine: "border-blue-200 bg-blue-50 text-blue-900 shadow-sm",
        uncertainMedicine: "border-amber-300 bg-amber-50 text-amber-900 shadow-sm border-dashed",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
