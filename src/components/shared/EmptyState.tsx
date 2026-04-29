import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 px-8 text-center", className)}>
      <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="size-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-base">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
