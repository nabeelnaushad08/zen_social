"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Grid3X3, CheckSquare, Palette, ArrowRight,
  CheckCircle2, Clock, AlertCircle, FileText, CreditCard,
  ClipboardList, ExternalLink, Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function StatTile({ icon: Icon, label, value, color, href }: { icon: React.ElementType; label: string; value: number; color: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`size-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function contractStatusColor(s: string) {
  if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700";
  if (s === "EXPIRED") return "bg-gray-100 text-gray-600";
  if (s === "CANCELLED") return "bg-red-100 text-red-600";
  return "bg-amber-100 text-amber-700";
}

function paymentStatusColor(s: string) {
  if (s === "PAID") return "bg-emerald-100 text-emerald-700";
  if (s === "OVERDUE") return "bg-red-100 text-red-600";
  if (s === "CANCELLED") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-700";
}

function taskStatusColor(s: string) {
  if (s === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (s === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
  if (s === "CANCELLED") return "bg-gray-100 text-gray-600";
  return "bg-amber-100 text-amber-700";
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ClientDashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useSWR("/api/client/dashboard", fetcher);
  const { data: contractsData } = useSWR("/api/client/contracts", fetcher);
  const { data: paymentsData } = useSWR("/api/client/payments", fetcher);
  const { data: tasksData } = useSWR("/api/client/tasks", fetcher);

  const d = data?.data;
  const breakdown = d?.approvalBreakdown ?? {};
  const totalItems = Object.values(breakdown).reduce((a: number, b) => a + (b as number), 0);
  const approved = breakdown["APPROVED"] ?? 0;
  const pending = breakdown["PENDING"] ?? 0;
  const revision = breakdown["REVISION_REQUESTED"] ?? 0;
  const approvalProgress = totalItems > 0 ? Math.round((approved / totalItems) * 100) : 0;

  const contracts = contractsData?.data ?? [];
  const payments = paymentsData?.data ?? [];
  const tasks = tasksData?.data ?? [];

  const activeContract = contracts.find((c: { status: string }) => c.status === "ACTIVE");
  const pendingPayments = payments.filter((p: { status: string }) => p.status === "UNPAID" || p.status === "OVERDUE");
  const openTasks = tasks.filter((t: { status: string }) => t.status === "PENDING" || t.status === "IN_PROGRESS");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description={`${greeting}, ${session?.user.firstName ?? "there"}`}
      />

      <div className="p-8 space-y-8">
        {/* Current batch hero */}
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : d?.latestBatch ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="text-xs font-medium text-primary uppercase tracking-wider">Current batch</p>
                      <h2 className="text-xl font-bold mt-0.5">
                        {MONTHS[d.latestBatch.month - 1]} {d.latestBatch.year} Content
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {d.latestBatch._count.contentItems} items ready for review
                        {d.latestBatch.dueDate && (
                          <> · Due {new Date(d.latestBatch.dueDate).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Approval progress</span>
                        <span className="font-semibold">{approved}/{totalItems} approved</span>
                      </div>
                      <Progress value={approvalProgress} className="h-2" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {approved > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="size-3.5" />{approved} approved
                        </div>
                      )}
                      {pending > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                          <Clock className="size-3.5" />{pending} pending
                        </div>
                      )}
                      {revision > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                          <AlertCircle className="size-3.5" />{revision} needs revision
                        </div>
                      )}
                    </div>
                  </div>

                  <Button asChild>
                    <Link href="/client/content">
                      Review content <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No content batch available yet. Your monthly content will appear here once published.</p>
            </CardContent>
          </Card>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            <>
              <StatTile icon={Grid3X3} label="Items to review" value={pending + revision} color="bg-amber-100 text-amber-600" href="/client/content" />
              <StatTile icon={CheckSquare} label="Approved" value={approved} color="bg-emerald-100 text-emerald-600" href="/client/approvals" />
              <StatTile icon={Palette} label="Open design requests" value={d?.openDesignRequests ?? 0} color="bg-purple-100 text-purple-600" href="/client/design-requests" />
            </>
          )}
        </div>

        {/* Contracts, Payments, Tasks — three-column row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active contract */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="size-4" /> Contract
                  </CardTitle>
                  <CardDescription>Current agreement</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild><Link href="/client/contracts">View all</Link></Button>
              </CardHeader>
              <CardContent>
                {activeContract ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{activeContract.title}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${contractStatusColor(activeContract.status)}`}>{activeContract.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activeContract.startDate).toLocaleDateString()}
                      {activeContract.endDate && <> → {new Date(activeContract.endDate).toLocaleDateString()}</>}
                    </p>
                    {activeContract.endDate && (() => {
                      const days = daysUntil(activeContract.endDate);
                      if (days === null) return null;
                      return (
                        <p className={`text-xs font-medium ${days < 0 ? "text-red-600" : days < 30 ? "text-amber-600" : "text-emerald-600"}`}>
                          {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days} days remaining`}
                        </p>
                      );
                    })()}
                    {activeContract.documentUrl && (
                      <a href={activeContract.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="size-3" /> View document
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active contract.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payments */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="size-4" /> Payments
                  </CardTitle>
                  <CardDescription>
                    {pendingPayments.length > 0 ? `${pendingPayments.length} pending` : "All up to date"}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild><Link href="/client/payments">View all</Link></Button>
              </CardHeader>
              <CardContent>
                {pendingPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No outstanding payments.</p>
                ) : (
                  <div className="space-y-2">
                    {pendingPayments.slice(0, 3).map((p: { id: string; amount: string; currency: string; status: string; dueDate: string; description: string | null }) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{p.currency} {parseFloat(p.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Due {new Date(p.dueDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${paymentStatusColor(p.status)}`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tasks */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="size-4" /> Tasks
                  </CardTitle>
                  <CardDescription>
                    {openTasks.length > 0 ? `${openTasks.length} open` : "Nothing pending"}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild><Link href="/client/tasks">View all</Link></Button>
              </CardHeader>
              <CardContent>
                {openTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {openTasks.slice(0, 4).map((t: { id: string; title: string; status: string; link: string | null; linkLabel: string | null; dueDate: string | null }) => (
                      <div key={t.id} className="space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">{t.title}</p>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${taskStatusColor(t.status)}`}>{t.status.replace("_"," ")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {t.dueDate && <span className="flex items-center gap-0.5"><Calendar className="size-3" />{new Date(t.dueDate).toLocaleDateString()}</span>}
                          {t.link && (
                            <a href={t.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                              <ExternalLink className="size-3" />{t.linkLabel || "Link"}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Batch history */}
        {d?.batchHistory?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Content history</CardTitle>
                <CardDescription>Your previous monthly batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {d.batchHistory.slice(0, 6).map((batch: { id: string; month: number; year: number; status: string; publishedAt: string; _count: { contentItems: number } }) => (
                    <div key={batch.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                      <span className="font-medium">{MONTHS[batch.month - 1]} {batch.year}</span>
                      <span className="text-muted-foreground">{batch._count.contentItems} items</span>
                      <StatusBadge status={batch.status as never} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
