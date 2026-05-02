"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { ClipboardList, Calendar, ExternalLink, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ClientTask {
  id: string; title: string; description: string | null; status: string;
  link: string | null; linkLabel: string | null; dueDate: string | null;
  sortOrder: number; createdAt: string;
}

function statusColor(s: string) {
  if (s === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (s === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
  if (s === "CANCELLED") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-700";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") return <CheckCircle2 className="size-5 text-emerald-500" />;
  if (status === "IN_PROGRESS") return <Clock className="size-5 text-blue-500" />;
  if (status === "CANCELLED") return <AlertCircle className="size-5 text-gray-400" />;
  return <Clock className="size-5 text-amber-500" />;
}

export default function TasksPage() {
  const { data, isLoading } = useSWR("/api/client/tasks", fetcher);
  const tasks: ClientTask[] = data?.data ?? [];

  const open = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");
  const done = tasks.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tasks"
        description={`${open.length} open · ${done.length} completed`}
      />

      <div className="p-8 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No tasks" description="Tasks assigned by your account manager will appear here." />
        ) : (
          <>
            {open.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Open ({open.length})</h2>
                <div className="space-y-3">
                  {open.map((t) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="border-l-4 border-l-primary/30">
                        <CardContent className="p-4 flex items-start gap-3">
                          <StatusIcon status={t.status} />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{t.title}</p>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>{t.status.replace("_"," ")}</span>
                            </div>
                            {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                              {t.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  Due {new Date(t.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {t.link && (
                                <a href={t.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                  <ExternalLink className="size-3" />{t.linkLabel || t.link}
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {done.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed / Cancelled ({done.length})</h2>
                <div className="space-y-2">
                  {done.map((t) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="opacity-60">
                        <CardContent className="p-4 flex items-start gap-3">
                          <StatusIcon status={t.status} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm line-through">{t.title}</p>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>{t.status.replace("_"," ")}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
