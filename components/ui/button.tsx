"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils/cn";

type ButtonSize = "default" | "sm" | "lg" | "icon";
type ButtonWeight = "solid" | "hollow" | "ghost";

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-sm",
  lg: "h-10 px-4 text-sm",
  icon: "size-9",
};

const weightClasses: Record<ButtonWeight, string> = {
  solid: "bg-primary text-primary-foreground hover:opacity-90",
  hollow:
    "border border-primary bg-[var(--page-bg)] text-primary shadow-sm hover:bg-primary/8",
  ghost: "bg-transparent text-primary hover:bg-primary/8",
};

export type ButtonProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children"
> & {
  asChild?: boolean;
  size?: ButtonSize;
  weight?: ButtonWeight;
  text?: string;
  children?: React.ReactNode;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      className,
      size = "default",
      weight = "solid",
      text,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          sizeClasses[size],
          weightClasses[weight],
          className,
        )}
        type={asChild ? undefined : type}
        {...props}
      >
        {text ?? children}
      </Comp>
    );
  },
);

Button.displayName = "Button";
