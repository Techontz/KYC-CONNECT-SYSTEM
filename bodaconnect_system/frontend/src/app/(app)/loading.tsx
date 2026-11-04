import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="grid grid-cols-1 gap-4">
      <span className="sr-only">Inapakia… / Loading…</span>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-28 w-full rounded-[20px]" />
      <Skeleton className="h-72 w-full rounded-[20px]" />
    </div>
  );
}
