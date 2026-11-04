import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "./cn";

const control =
  "w-full min-h-11 rounded-[12px] border bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-4 focus:ring-brand/20 focus:border-brand disabled:bg-surface disabled:text-muted";

interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  optionalLabel?: string;
  id: string;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ label, hint, error, required, optionalLabel, id, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
          {required ? (
            <span className="text-danger" aria-hidden>
              {" "}
              *
            </span>
          ) : optionalLabel ? (
            <span className="font-normal text-muted"> ({optionalLabel})</span>
          ) : null}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-[13px] font-medium text-danger-900">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { label?: ReactNode; hint?: ReactNode; error?: string; optionalLabel?: string; wrapperClassName?: string };

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Common>(function Input(
  { label, hint, error, optionalLabel, wrapperClassName, className, id, required, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} optionalLabel={optionalLabel} id={fid} className={wrapperClassName}>
      <input
        ref={ref}
        id={fid}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fid, hint, error)}
        className={cn(control, error ? "border-danger" : "border-line", className)}
        {...rest}
      />
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Common>(function Textarea(
  { label, hint, error, optionalLabel, wrapperClassName, className, id, required, rows = 4, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} optionalLabel={optionalLabel} id={fid} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={fid}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fid, hint, error)}
        className={cn(control, "py-2.5", error ? "border-danger" : "border-line", className)}
        {...rest}
      />
    </FieldShell>
  );
});

export interface SelectOption {
  value: string;
  label: string;
}

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & Common & { options: SelectOption[]; placeholder?: string }
>(function Select({ label, hint, error, optionalLabel, wrapperClassName, className, id, required, options, placeholder, ...rest }, ref) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} optionalLabel={optionalLabel} id={fid} className={wrapperClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={fid}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fid, hint, error)}
          className={cn(control, "appearance-none pr-10", error ? "border-danger" : "border-line", className)}
          {...rest}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </FieldShell>
  );
});

export function Checkbox({
  label,
  description,
  error,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={rest.id ?? id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[12px] py-1.5">
        <input
          id={rest.id ?? id}
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-[#39B54A]"
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        <span className="flex flex-col">
          <span className="text-[15px] font-medium text-ink">{label}</span>
          {description && <span className="text-[13px] text-muted">{description}</span>}
        </span>
      </label>
      {error && (
        <p role="alert" className="ml-8 text-[13px] font-medium text-danger-900">
          {error}
        </p>
      )}
    </div>
  );
}

export function RadioCard({
  checked,
  title,
  description,
  icon,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { title: ReactNode; description?: ReactNode; icon?: ReactNode }) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-[16px] border-[1.5px] p-3.5 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/30",
        checked ? "border-brand bg-mint-50" : "border-line bg-white hover:border-muted/50",
      )}
    >
      <input id={id} type="radio" className="sr-only" checked={checked} {...rest} />
      {icon && <span className="mt-0.5 text-forest">{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold text-ink">{title}</span>
        {description && <span className="text-[13px] text-muted">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          checked ? "border-brand" : "border-line",
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-brand" />}
      </span>
    </label>
  );
}
