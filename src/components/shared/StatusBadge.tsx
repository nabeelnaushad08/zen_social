import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, XCircle, Loader2, Circle } from "lucide-react";

type Status =
  | "PENDING" | "APPROVED" | "REVISION_REQUESTED"
  | "IN_PROGRESS" | "COMPLETED" | "REJECTED"
  | "DRAFT" | "PUBLISHED" | "ARCHIVED";

const CONFIG: Record<Status, { label: string; variant: "success" | "warning" | "info" | "destructive" | "muted" | "outline"; icon: React.ElementType }> = {
  PENDING:            { label: "Pending",            variant: "warning",     icon: Clock },
  APPROVED:           { label: "Approved",           variant: "success",     icon: CheckCircle2 },
  REVISION_REQUESTED: { label: "Revision Requested", variant: "destructive", icon: AlertCircle },
  IN_PROGRESS:        { label: "In Progress",        variant: "info",        icon: Loader2 },
  COMPLETED:          { label: "Completed",          variant: "success",     icon: CheckCircle2 },
  REJECTED:           { label: "Rejected",           variant: "destructive", icon: XCircle },
  DRAFT:              { label: "Draft",              variant: "muted",       icon: Circle },
  PUBLISHED:          { label: "Published",          variant: "success",     icon: CheckCircle2 },
  ARCHIVED:           { label: "Archived",           variant: "muted",       icon: XCircle },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = CONFIG[status] ?? { label: status, variant: "outline" as const, icon: Circle };
  const Icon = config.icon;
  return (
    <Badge variant={config.variant as never}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
