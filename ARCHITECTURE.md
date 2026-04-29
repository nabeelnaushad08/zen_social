# ZenSocial — System Architecture

> Production-grade multi-tenant social media content management & client approval platform.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prisma Schema](#2-prisma-schema) — see `prisma/schema.prisma`
3. [Folder Structure](#3-folder-structure)
4. [Data Flow](#4-data-flow)

---

## 1. Architecture Overview

### Tenancy Model

**Discriminated single-database multi-tenancy.**

All client data lives in one MySQL database. Every tenant-scoped table carries a `clientId` foreign key. All server actions and API handlers filter by `session.clientId` before executing any query — there is no cross-tenant data access path.

```
Admin (1) ──────── manages ──────────► Clients (N)
                                           │
                                     each Client has
                                           │
                                 MonthlyBatch (per month)
                                           │
                              MonthlyContentItem[] (per batch)
                                           │
                              Approval + DesignRequest + TextEditHistory
```

### Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 App Router | RSC for zero-waterfall data fetching |
| Styling | Tailwind CSS + shadcn/ui | Premium component primitives |
| Auth | NextAuth.js v5 | Credentials + JWT, middleware-enforced routes |
| ORM | Prisma 5 | Type-safe queries, migration tooling |
| Database | MySQL on Hostinger | Cost-effective, reliable, Prisma-native support |
| Media | Cloudinary | CDN, transformations, signed uploads |
| Hosting | Vercel (or Hostinger VPS) | Edge middleware for auth, global CDN |
| Email | Resend | Transactional notifications |

### Request Lifecycle

```
Browser
  │
  ├─ Page load ──► Next.js RSC ──► Prisma ──► MySQL      (read path)
  │
  ├─ Form submit ─► Server Action ──► Prisma ──► MySQL    (write path, no REST round-trip)
  │
  └─ File upload ─► Cloudinary (direct, signed) ──► Server Action persists Media row
```

### Security Perimeter

- **Middleware** (`src/middleware.ts`): Validates JWT on every request; redirects unauthenticated users; blocks `CLIENT` role from accessing `/admin/*` and vice versa.
- **Service layer** (`src/lib/services/*`): Every query function accepts `{ clientId }` and appends it to all WHERE clauses. Admin queries omit this filter but require `role === ADMIN`.
- **Cloudinary**: Upload signatures generated server-side; unsigned uploads are disabled on the Cloudinary account.
- **Audit log**: Every mutation writes an `AuditLog` row with the acting userId, entity, and IP.

---

## 2. Prisma Schema

See [`prisma/schema.prisma`](./prisma/schema.prisma) for the full, annotated schema.

### Entity Relationship Summary

```
User ──1:1──► Client ──N:1──► Niche
                │
                ├──N:1──► Package ──1:N──► PackageCategory ──1:N──► ContentTemplate
                │                                                          │
                │                                               ContentTemplatePlatform
                │                                                    (M:N with Platform)
                │
                └──1:N──► MonthlyBatch ──1:N──► MonthlyContentItem
                                                       │
                          ┌────────────────────────────┤
                          │                            │
                    MonthlyContentPlatform      ContentPlatformCaption
                    (M:N with Platform)         (per-platform caption override)
                          │
                          ├──► Approval (1:1)
                          ├──► DesignRequest (1:N) ──► DesignRequestAsset ──► Media
                          └──► TextEditHistory (1:N)
```

### Key Design Decisions

**ContentTemplate vs MonthlyContentItem**
`ContentTemplate` is the reusable master — created once by Admin, used many times.
`MonthlyContentItem` is the delivery instance — one per batch assignment. It stores client text overrides and the approval state. This separates "what was designed" from "what was delivered and approved."

**Platform captions at item level, not template level**
Captions are stored on `ContentPlatformCaption` (linked to `MonthlyContentItem`), not on the template. A dental client's Instagram caption for a banner differs from a café client's even if they used the same template.

**TextEditHistory as an immutable ledger**
Every change to `tagline`, `caption`, or `cta` appends a row to `TextEditHistory` with old/new values. The current live value lives on `MonthlyContentItem`. This allows rollback without extra complexity.

**isLocked on MonthlyContentItem**
Once a content item is fully approved and sent to production, `isLocked = true`. The client UI disables all edit controls. If a design request is subsequently completed, Admin unlocks it, client re-approves.

---

## 3. Folder Structure

```
zen_social/
│
├── prisma/
│   ├── schema.prisma          # Single source of truth for DB shape
│   ├── migrations/            # Auto-generated by prisma migrate dev
│   └── seed.ts                # Seeds platforms, sample niche, admin user
│
├── src/
│   │
│   ├── app/                   # Next.js App Router
│   │   │
│   │   ├── (auth)/            # Public auth routes (no layout chrome)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   │
│   │   ├── (admin)/           # Admin-only, guarded by middleware
│   │   │   ├── layout.tsx     # Admin shell: sidebar, topbar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx   # KPIs: clients, batches pending, requests open
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx   # Client list + search
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [clientId]/
│   │   │   │       ├── page.tsx        # Client detail
│   │   │   │       └── batches/
│   │   │   │           └── [batchId]/
│   │   │   │               └── page.tsx
│   │   │   ├── niches/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [nicheId]/
│   │   │   │       └── page.tsx
│   │   │   ├── packages/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [packageId]/
│   │   │   │       └── page.tsx
│   │   │   ├── templates/
│   │   │   │   ├── page.tsx           # Template library, filterable by niche/type
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Upload + configure new template
│   │   │   │   └── [templateId]/
│   │   │   │       └── page.tsx
│   │   │   ├── batches/
│   │   │   │   ├── page.tsx           # All batches across all clients
│   │   │   │   └── new/
│   │   │   │       └── page.tsx       # Create batch: pick client, month, templates
│   │   │   └── design-requests/
│   │   │       └── page.tsx           # Queue view: PENDING → IN_PROGRESS → DONE
│   │   │
│   │   ├── (client)/          # Client-only, guarded by middleware
│   │   │   ├── layout.tsx     # Client shell: simple topbar, brand colors
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx   # Current month batch summary, pending approvals count
│   │   │   ├── content/
│   │   │   │   ├── page.tsx           # Grid of content items, platform filter
│   │   │   │   └── [itemId]/
│   │   │   │       └── page.tsx       # Detail: preview, text edit, approve, request change
│   │   │   ├── approvals/
│   │   │   │   └── page.tsx           # History of approved items
│   │   │   └── design-requests/
│   │   │       └── page.tsx           # Client's submitted design requests + status
│   │   │
│   │   ├── preview/           # Public (unauthenticated) content preview
│   │   │   └── [clientSlug]/
│   │   │       └── [batchId]/
│   │   │           └── page.tsx       # Shareable preview link (read-only)
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       └── webhooks/
│   │           └── cloudinary/
│   │               └── route.ts      # Cloudinary upload notification hook
│   │
│   ├── actions/               # Next.js Server Actions (mutations)
│   │   ├── admin/
│   │   │   ├── clients.ts     # createClient, updateClient, deactivateClient
│   │   │   ├── niches.ts      # createNiche, updateNiche
│   │   │   ├── packages.ts    # createPackage, updatePackage
│   │   │   ├── templates.ts   # createTemplate, publishTemplate, archiveTemplate
│   │   │   ├── batches.ts     # createBatch, addItemToBatch, publishBatch
│   │   │   └── design-requests.ts  # updateDesignRequestStatus
│   │   └── client/
│   │       ├── content.ts     # updateTextFields, filterByPlatform
│   │       ├── approvals.ts   # approveItem, requestRevision
│   │       └── design-requests.ts  # submitDesignRequest
│   │
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton (prevents connection exhaustion)
│   │   ├── auth.ts            # NextAuth config, session typing
│   │   ├── cloudinary.ts      # Upload signature generator, asset URL builder
│   │   ├── notifications.ts   # createNotification helper
│   │   ├── audit.ts           # writeAuditLog helper
│   │   └── utils.ts           # cn(), formatDate(), slugify()
│   │
│   ├── lib/services/          # Query functions — all DB reads live here
│   │   ├── admin/
│   │   │   ├── client-service.ts
│   │   │   ├── template-service.ts
│   │   │   ├── batch-service.ts
│   │   │   └── design-request-service.ts
│   │   └── client/
│   │       ├── content-service.ts
│   │       ├── approval-service.ts
│   │       └── design-request-service.ts
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   │   ├── admin/
│   │   │   ├── BatchBuilder.tsx
│   │   │   ├── TemplateUploader.tsx
│   │   │   ├── DesignRequestQueue.tsx
│   │   │   └── ClientCard.tsx
│   │   ├── client/
│   │   │   ├── ContentGrid.tsx
│   │   │   ├── ContentItemCard.tsx
│   │   │   ├── TextEditForm.tsx
│   │   │   ├── ApproveButton.tsx
│   │   │   ├── DesignRequestForm.tsx
│   │   │   └── PlatformFilter.tsx
│   │   └── shared/
│   │       ├── MediaPreview.tsx   # Renders image or video from Cloudinary URL
│   │       ├── StatusBadge.tsx
│   │       └── NotificationBell.tsx
│   │
│   ├── types/
│   │   ├── next-auth.d.ts     # Augments Session with role, clientId
│   │   └── index.ts           # Re-exports Prisma types + any custom unions
│   │
│   └── middleware.ts          # Auth guard + role-based route protection
│
├── .env.local                 # DATABASE_URL, NEXTAUTH_SECRET, CLOUDINARY_*
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Data Flow

### Flow A — Admin Uploads a Content Template

```
1. Admin opens /admin/templates/new
2. Fills in: name, niche, package category, content type, default text fields
3. Clicks "Upload Design" → Cloudinary Upload Widget opens
   a. Browser fetches a signed upload params from Server Action (cloudinary.ts)
   b. Browser uploads directly to Cloudinary (bypasses our server, no bandwidth cost)
   c. Cloudinary returns { public_id, secure_url, format, width, height, bytes }
4. Server Action: createTemplate()
   a. Upserts Media row with Cloudinary data
   b. Creates ContentTemplate row linked to Media
   c. Creates ContentTemplatePlatform rows for each selected platform
5. Template enters status = DRAFT
6. Admin reviews and calls publishTemplate() → status = PUBLISHED
7. AuditLog row written: action="PUBLISHED_TEMPLATE"
```

### Flow B — Admin Creates a Monthly Batch for a Client

```
1. Admin opens /admin/batches/new, selects Client + Month + Year
2. createBatch() Server Action creates MonthlyBatch (status=DRAFT)
3. Admin picks templates from the published library
   (filtered by client's niche + package categories)
4. addItemToBatch() Server Action creates MonthlyContentItem for each:
   a. Copies default text from ContentTemplate into item (tagline, caption, cta)
   b. Creates MonthlyContentPlatform rows for the template's platforms
   c. Creates ContentPlatformCaption rows (pre-filled with default captions)
   d. Creates Approval row (status=PENDING)
5. Admin reviews the draft batch in preview mode
6. publishBatch() Server Action:
   a. Sets batch status = PUBLISHED, publishedAt = now()
   b. Creates Notification for the client: type=BATCH_PUBLISHED
   c. Sends email via Resend (optional)
   d. Writes AuditLog: action="PUBLISHED_BATCH"
```

### Flow C — Client Views Their Content

```
1. Client logs in → NextAuth session contains { userId, clientId, role: "CLIENT" }
2. /client/content page (RSC): 
   a. content-service.ts: getContentItems({ clientId, month, year, platformFilter? })
   b. Prisma query joins: MonthlyBatch → MonthlyContentItem → ContentTemplate → Media
   c. Optional WHERE filter: MonthlyContentPlatform.platformId = platformFilter
3. Client sees a grid of cards (image/video thumbnail + text + status badge)
4. Platform filter bar at top — clicking "Instagram" re-fetches with platformId param
5. Each card links to /client/content/[itemId] for detail view
```

### Flow D — Client Edits Text and Approves Content

```
Text Edit:
1. Client edits tagline/caption/CTA in TextEditForm
2. updateTextFields() Server Action:
   a. Reads current values from MonthlyContentItem
   b. Updates MonthlyContentItem with new values
   c. Appends TextEditHistory row: { field, oldValue, newValue }
   d. Writes AuditLog: action="EDITED_TEXT_FIELD"

Approval:
1. Client clicks "Approve" on a content item
2. approveItem() Server Action:
   a. Validates: item belongs to client's batch (tenancy check)
   b. Validates: item is not isLocked
   c. Upserts Approval: { status=APPROVED, approvedAt=now(), approvedByIp }
   d. Updates MonthlyContentItem.approvalStatus = APPROVED
   e. Checks if ALL items in batch are APPROVED → if yes, notifies Admin
   f. Writes AuditLog: action="APPROVED_CONTENT"
   g. Creates Notification for Admin

Revision Request (via approval):
1. Client clicks "Request Revision" + enters a note
2. requestRevision() Server Action:
   a. Upserts Approval: { status=REVISION_REQUESTED, revisionNote }
   b. Updates MonthlyContentItem.approvalStatus = REVISION_REQUESTED
   c. Notifies Admin
```

### Flow E — Client Submits a Design Change Request

```
1. Client opens DesignRequestForm for a specific content item
2. Fills in: comment (required), optional reference file(s)
3. If file attached:
   a. Browser uploads to Cloudinary (signed, folder="design-requests/<clientId>")
   b. Returns { public_id, secure_url }
4. submitDesignRequest() Server Action:
   a. Creates Media rows for any uploaded files
   b. Creates DesignRequest: { clientId, contentItemId, status=PENDING, comment }
   c. Creates DesignRequestAsset rows linking request to Media
   d. Creates Notification for Admin: type=DESIGN_REQUEST_SUBMITTED
   e. Writes AuditLog: action="SUBMITTED_DESIGN_REQUEST"

Admin processes it:
5. Admin opens /admin/design-requests (Kanban: PENDING | IN_PROGRESS | COMPLETED)
6. Admin moves card to IN_PROGRESS → updateDesignRequestStatus() sets status + notifies client
7. Admin uploads revised design as a new ContentTemplate (or replaces Media asset)
8. Admin marks COMPLETED → client notified, item unlocked for re-approval
```

### Flow F — Notification Delivery

```
Every significant action calls createNotification(userId, type, title, body, link):
  → Inserts Notification row (isRead=false)

Client/Admin dashboard polls or uses SSE /api/notifications/stream:
  → Returns unread count + latest items
  → Marking read calls updateNotification(id, { isRead: true })
```

---

## Premium UX Principles

### Speed
- **All data fetched in RSCs** — no client-side loading spinners for initial page load.
- **Optimistic updates** in Server Actions with `useOptimistic` for approval/text edits.
- **Cloudinary CDN** serves all media; use `f_auto,q_auto` transformations globally.
- **Database indexes** on every FK, status column, and common filter column.

### Design Language
- **Neutral palette** (zinc/slate) with a single brand accent. No gradient overload.
- **Dense information, generous whitespace** — Linear-style data tables, not heavy cards.
- **Micro-interactions**: approval button animates to checkmark; status badges pulse while PENDING.
- **Empty states** are designed, not afterthoughts — "No content yet" screens guide next action.

### Reliability
- Every mutation is wrapped in a Prisma `$transaction` where multiple rows must succeed together.
- `TextEditHistory` means no edit is ever lost — rollback is always possible.
- `AuditLog` provides a full chain of custody for every approval decision.
