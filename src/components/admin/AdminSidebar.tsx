"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, Layers, Package, FileImage,
  Calendar, MessageSquare, Star, LogOut, Sparkles, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/admin/dashboard",        icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/clients",          icon: Users,           label: "Clients" },
  { href: "/admin/niches",           icon: Layers,          label: "Niches" },
  { href: "/admin/packages",         icon: Package,         label: "Packages" },
  { href: "/admin/templates",        icon: FileImage,       label: "Templates" },
  { href: "/admin/batches",          icon: Calendar,        label: "Monthly Engine" },
  { href: "/admin/design-requests",  icon: MessageSquare,   label: "Design Requests" },
  { href: "/admin/feedback",         icon: Star,            label: "Feedback" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 h-full bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-semibold text-white text-base">ZenSocial</span>
          <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wider">
            Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item, i) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-[hsl(var(--sidebar-accent))] text-white"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="size-3 opacity-50" />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white transition-all duration-150"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
