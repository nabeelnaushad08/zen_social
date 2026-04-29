"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Grid3X3, CheckSquare, Palette, MessageCircle,
  LogOut, Sparkles, ChevronRight, Bell,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/client/dashboard",       icon: LayoutDashboard, label: "Dashboard" },
  { href: "/client/content",         icon: Grid3X3,         label: "My Content" },
  { href: "/client/approvals",       icon: CheckSquare,     label: "Approvals" },
  { href: "/client/design-requests", icon: Palette,         label: "Design Requests" },
  { href: "/client/feedback",        icon: MessageCircle,   label: "Feedback" },
];

export function ClientSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const initials = session
    ? `${session.user.firstName?.[0] ?? ""}${session.user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <aside className="flex flex-col w-60 h-full bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-semibold text-white text-base">ZenSocial</span>
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
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150",
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

      {/* User footer */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs bg-primary text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {session?.user.firstName} {session?.user.lastName}
            </p>
            <p className="text-[11px] text-[hsl(var(--sidebar-foreground))] truncate">
              {session?.user.email}
            </p>
          </div>
        </div>
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
