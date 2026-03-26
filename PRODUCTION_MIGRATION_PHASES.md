# Production Migration Phases

This document is the execution tracker for converting this repo from mock-data-heavy UI into a production-ready platform.

## Goal

Remove mock business data, wire all critical flows to real APIs and persistent storage, and ship role dashboards that reflect real system state.

## Status Legend

- [ ] Not started
- [~] In progress
- [x] Completed
- [!] Blocked

## Global Rules (Apply To Every Phase)

- No business KPI should remain hardcoded in page components.
- No role-sensitive auth logic should rely on localStorage only.
- Every migrated page must use typed API/service functions.
- Each phase closes only after acceptance criteria are met.

## Master Phase Tracker

- [x] Phase 1: Foundation and Auth Hardening
- [~] Phase 2: Data Model and Core Domain APIs
- [ ] Phase 3: Dashboard and Sidebar De-Mocking
- [~] Phase 4: Messaging and Notification Real Data
- [ ] Phase 5: Wallet, Commissions, and Payments Lifecycle
- [ ] Phase 6: Disputes, Verifications, and Ops Flows
- [ ] Phase 7: QA, Performance, and Production Cutover

---

## Phase 1: Foundation and Auth Hardening

### Objective
Establish secure auth/session patterns and foundational API/data access structure.

### Tasks

- [x] Replace localStorage-only auth in `lib/hooks/useAuth.ts` with server-validated auth flow.
- [x] Refactor `lib/auth-context.tsx` to consume real auth endpoints.
- [x] Standardize one sub-admin route namespace (`sub-admin` or `subadmin`).
- [x] Add API client layer (request wrapper, typed errors, retry policy).
- [x] Define initial auth/user contracts (request + response schemas).
- [x] Add environment flags for controlled mock fallback only in development.

### Acceptance Criteria

- Login/session validation is server-backed.
- Role-based guards no longer trust localStorage as source of truth.
- One canonical sub-admin route tree remains.
- API client is used for auth calls.

### Deliverables

- Updated auth hook/context.
- Base API client module.
- Auth contract typings/schemas.
- Route normalization decision implemented.

---

## Phase 2: Data Model and Core Domain APIs

### Objective
Create production data structures required by major business workflows.

### Tasks

- [x] Expand Prisma schema beyond logs/payments/auth logs.
- [x] Add core models: User, Role, Service, Job, Booking, MessageThread, Message, Wallet, Transaction, Dispute, Verification.
- [ ] Generate migrations and validate local/staging data setup.
- [~] Create typed service modules for core domain operations.
- [~] Add API routes for CRUD/query operations used by dashboards.

### Acceptance Criteria

- Core domain entities are persistable and queryable.
- No critical dashboard depends on in-component business arrays.

### Deliverables

- Updated `prisma/schema.prisma` and migrations.
- New `app/api/*` domain endpoints.
- `lib/services/*` or equivalent typed data-access modules.

---

## Phase 3: Dashboard and Sidebar De-Mocking

### Objective
Replace static cards/charts/badges/navigation stats with live data sources.

### Tasks

- [x] Migrate admin dashboard (`app/admin/page.tsx`) off hardcoded metrics.
- [~] Migrate provider dashboard (`app/provider/page.tsx`) off hardcoded blocks.
- [x] Migrate agent dashboard (`app/agent/page.tsx`) off hardcoded blocks.
- [~] Remove static sidebar badges in admin/agent/other role layouts.
- [ ] Add loading/empty/error states for each dashboard panel.

### Acceptance Criteria

- No static business KPI arrays remain in role dashboards.
- Sidebar notification/count badges are API-driven.

### Deliverables

- Live dashboard queries/hooks.
- Unified dashboard card contracts.

---

## Phase 4: Messaging and Notification Real Data

### Objective
End localStorage-based pseudo-chat and pseudo-notification behavior.

### Tasks

- [ ] Create message/thread persistence and APIs.
- [ ] Refactor role message pages to fetch/send via APIs.
- [ ] Replace localStorage event sync patterns in header/message components.
- [ ] Migrate notifications to API-backed unread/read states.
- [ ] Add pagination and read receipts where needed.

### Acceptance Criteria

- Messages survive reload/session/device.
- Notifications are generated from real events, not seeded arrays.

### Deliverables

- Messaging + notification APIs and hooks.
- Updated components without localStorage inbox sync dependencies.

---

## Phase 5: Wallet, Commissions, and Payments Lifecycle

### Objective
Connect payment gateways to full ledger, wallet, and payout workflows.

### Tasks

- [ ] Add wallet + ledger + commissions data structures.
- [ ] Link payment transaction callbacks to wallet/ledger updates.
- [ ] Migrate withdrawals pages to real balances and eligibility checks.
- [ ] Migrate commissions pages to computed data from real transactions.
- [ ] Add reconciliation and export paths for finance/admin roles.

### Acceptance Criteria

- Financial figures shown to users/admin come from persisted transactions.
- Withdrawal and commission calculations are reproducible from ledger data.

### Deliverables

- Wallet/commission APIs.
- Real transaction-driven UI in relevant role pages.

---

## Phase 6: Disputes, Verifications, and Ops Flows

### Objective
Productionize operational workflows currently mocked in admin/agent areas.

### Tasks

- [ ] Add dispute and verification models with lifecycle states.
- [ ] Build assignment and resolution APIs for agent/admin workflows.
- [ ] Migrate disputes pages in admin and agent portals.
- [ ] Migrate verifications pages to real queue/status data.
- [ ] Add audit trail for operational actions.

### Acceptance Criteria

- Dispute and verification records are stateful, searchable, and auditable.
- Admin and agent queues reflect live backend state.

### Deliverables

- Dispute/verification APIs.
- Updated operations pages with live data.

---

## Phase 7: QA, Performance, and Production Cutover

### Objective
Finalize quality, reliability, and release readiness.

### Tasks

- [ ] Remove remaining business mock arrays and fake seeded constants.
- [ ] Add integration tests for all role dashboards and critical workflows.
- [ ] Add error observability and API latency tracking.
- [ ] Validate role permissions, auth expiration, and session recovery.
- [ ] Complete migration checklist and rollout plan.

### Acceptance Criteria

- Critical workflows pass integration testing.
- No production-facing page uses hardcoded business mock data.
- Release checklist fully green.

### Deliverables

- Test coverage report.
- Production runbook and rollback plan.

---

## Current Execution Log

- 2026-03-25: Created initial phased execution tracker and marked Phase 1 as in progress.
- 2026-03-25: Added `lib/api/client.ts` request foundation and auth contract/service modules.
- 2026-03-25: Updated `lib/hooks/useAuth.ts` to prefer server session (`/api/auth/session`) with compatibility fallback.
- 2026-03-25: Added signed cookie session utilities and auth API routes (`/api/auth/login`, `/api/auth/session`, `/api/auth/logout`).
- 2026-03-25: Wired login page to auth API and added legacy `subadmin` to `sub-admin` redirect.
- 2026-03-25: Expanded Prisma schema with core domain entities (users, services, jobs, messages, wallet, disputes, verification).
- 2026-03-25: Added initial domain API endpoints (`/api/users/me`, `/api/services`, `/api/jobs`, `/api/disputes`, `/api/messages/threads`).
- 2026-03-25: Added live admin dashboard endpoint (`/api/admin/dashboard`) and replaced `app/admin/page.tsx` hardcoded KPI/chart/card data with API-driven values.
- 2026-03-25: Updated `components/admin-sidebar.tsx` to use live user/job/dispute badge counts from the admin dashboard endpoint.
- 2026-03-25: Added live agent dashboard endpoint (`/api/agent/dashboard`) and replaced `app/agent/page.tsx` hardcoded stats/disputes/performance/activity blocks with API data.
- 2026-03-25: Added live provider dashboard endpoint (`/api/provider/dashboard`) and replaced `components/pages/provider-dashboard-page.tsx` mock stats/jobs with API data.
- 2026-03-25: Added live agent notification endpoint (`/api/agent/notifications`) and removed hardcoded notification list in `app/agent/layout.tsx`.
- 2026-03-25: Started Phase 4 by removing localStorage admin-inbox sync from `app/agent/messages/page.tsx` and hydrating admin thread metadata from `/api/messages/threads`.

## Next Immediate Steps

1. Finish provider home (`app/provider/page.tsx`) KPI and recent job blocks with API data.
2. Replace static notification/badge data in remaining role layouts (secretary, shopkeeper, sub-admin).
3. Continue Phase 4 by migrating provider and secretary message pages off localStorage inbox sync.
