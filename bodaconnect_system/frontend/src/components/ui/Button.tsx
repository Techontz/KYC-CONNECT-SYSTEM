import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors select-none disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/35";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover shadow-[0_1px_2px_rgba(0,17,102,.08)]",
  secondary: "border-[1.5px] border-ink/85 text-ink bg-white hover:bg-surface",
  ghost: "text-ink hover:bg-mint-50",
  danger: "bg-danger text-white hover:bg-danger-900",
  dark: "bg-forest text-white hover:bg-forest-900",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-4 text-sm",
  md: "min-h-11 px-5 text-[15px]",
  lg: "min-h-13 px-7 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], block && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon,
  block,
  className,
  children,
  external,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  block?: boolean;
  className?: string;
  children: ReactNode;
  external?: boolean;
}) {
  const cls = cn(base, variants[variant], sizes[size], block && "w-full", className);
  if (external)
    return (
      <a href={href} className={cls} target="_blank" rel="noreferrer">
        {icon}
        {children}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-mint-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/35",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
