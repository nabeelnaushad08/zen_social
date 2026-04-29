"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import {
  Users, FileImage, Calendar, MessageSquare,
  TrendingUp, CheckCircle2, Clock, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StatCard({
  title, value, sub, icon: Icon, color, delay,
}: { title: string; value: string | number; sub?: string; icon: React.ElementType; color: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
              {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
            </div>
            <div className={`size-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="size-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="size-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: clientsData } = useSWR("/api/admin/clients?limit=5", fetcher);
  const { data: requestsData } = useSWR("/api/admin/design-requests?status=PENDING&limit=5", fetcher);
  const { data: batchesData } = useSWR("/api/admin/batches?limit=5", fetcher);

  const totalClients = clientsData?.meta?.total ?? 0;
  const pendingRequests = requestsData?.meta?.total ?? 0;
  const recentBatches = batchesData?.data ?? [];
  const recentClients = clientsData?.data ?? [];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description={`${greeting} — here's what's happening`}
      />

      <div className="p-8 space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {clientsData ? (
            <>
              <StatCard title="Total Clients" value={totalClients} icon={Users} color="bg-blue-100 text-blue-600" delay={0} />
              <StatCard title="Pending Requests" value={pendingRequests} sub="Design change requests" icon={MessageSquare} color="bg-amber-100 text-amber-600" delay={0.06} />
              <StatCard title="This Month" value={recentBatches.filter((b: { status: string }) => b.status === "PUBLISHED").length} sub="Published batches" icon={Calendar} color="bg-emerald-100 text-emerald-600" delay={0.12} />
              <StatCard title="Approval Rate" value="94%" sub="Last 30 days" icon={TrendingUp} color="bg-purple-100 text-purple-600" delay={0.18} />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent clients */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Recent Clients</CardTitle>
                  <CardDescription>Latest onboarded accounts</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/clients">View all <ArrowRight className="size-3" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                {!clientsData ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No clients yet</p>
                ) : (
                  <div className="space-y-1">
                    {recentClients.map((client: { id: string; businessName: string; niche: { name: string } | null; isActive: boolean }) => (
                      <Link
                        key={client.id}
                        href={`/admin/clients/${client.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {client.businessName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{client.businessName}</p>
                          <p className="text-xs text-muted-foreground">{client.niche?.name ?? "No niche"}</p>
                        </div>
                        <Badge variant={client.isActive ? "success" : "muted"} className="text-[11px]">
                          {client.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Design requests */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Design Requests</CardTitle>
                  <CardDescription>Awaiting your attention</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/design-requests">View all <ArrowRight className="size-3" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                {!requestsData ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (requestsData.data ?? []).length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <CheckCircle2 className="size-8 text-emerald-500" />
                    <p className="text-sm text-muted-foreground">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(requestsData.data ?? []).map((req: { id: string; client: { businessName: string }; comment: string; status: string; createdAt: string }) => (
                      <Link
                        key={req.id}
                        href={`/admin/design-requests/${req.id}`}
                        className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{req.client.businessName}</p>
                          <StatusBadge status={req.status as never} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{req.comment}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/60">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
