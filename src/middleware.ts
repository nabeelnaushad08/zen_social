import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // ── Page route guards ────────────────────────────────────────────────────
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/client/dashboard", req.url));
    }
    if (pathname.startsWith("/client") && role !== "CLIENT") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // ── API route guards — return JSON 403 instead of redirect ───────────────
    if (pathname.startsWith("/api/admin") && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (pathname.startsWith("/api/client") && role !== "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  },
  {
    callbacks: {
      // withAuth will only call the middleware function when token exists;
      // unauthenticated requests are redirected to the signIn page automatically.
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  // Match all admin/client page routes AND all protected API routes.
  // Excludes: /, /login, /preview/*, /api/auth/*, /api/webhooks/*
  matcher: [
    "/admin/:path*",
    "/client/:path*",
    "/api/admin/:path*",
    "/api/client/:path*",
    "/api/upload/:path*",
    "/api/notifications/:path*",
    "/api/platforms/:path*",
  ],
};
