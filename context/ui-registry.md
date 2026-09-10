# UI Registry — CommissionKit

This registry lists the primary UI primitives, layout components, and reusable application components available in the frontend.

## shadcn/ui Primitives

Located in `artifacts/web/src/components/ui/`.

### Inputs & Selection

| Component | File | Primitive |
|-----------|------|-----------|
| Button | `button.tsx` | Radix Slot + CVA |
| Input | `input.tsx` | Native input |
| Textarea | `textarea.tsx` | Native textarea |
| Label | `label.tsx` | Radix Label |
| Select | `select.tsx` | Radix Select |
| Combobox / Command | `command.tsx` | cmdk |
| Checkbox | `checkbox.tsx` | Radix Checkbox |
| RadioGroup | `radio-group.tsx` | Radix RadioGroup |
| Switch | `switch.tsx` | Radix Switch |
| Slider | `slider.tsx` | Radix Slider |
| DatePicker | `date-picker.tsx` | react-day-picker |
| MonthPicker | `month-picker.tsx` | react-day-picker |
| Calendar | `calendar.tsx` | react-day-picker |
| InputOTP | `input-otp.tsx` | input-otp |
| DropdownMenu | `dropdown-menu.tsx` | Radix DropdownMenu (also in blog) |

### Layout & Surfaces

| Component | File | Primitive |
|-----------|------|-----------|
| Card | `card.tsx` | Custom divs |
| Sheet | `sheet.tsx` | Radix Dialog + Vaul |
| Dialog | `dialog.tsx` | Radix Dialog |
| AlertDialog | `alert-dialog.tsx` | Radix AlertDialog |
| Drawer | `drawer.tsx` | Vaul |
| Popover | `popover.tsx` | Radix Popover |
| Tooltip | `tooltip.tsx` | Radix Tooltip |
| HoverCard | `hover-card.tsx` | Radix HoverCard |
| ScrollArea | `scroll-area.tsx` | Radix ScrollArea |
| Resizable | `resizable.tsx` | react-resizable-panels |
| Separator | `separator.tsx` | Radix Separator |
| Skeleton | `skeleton.tsx` | Custom |
| Sidebar (ui) | `sidebar.tsx` | Custom |

### Navigation

| Component | File | Primitive |
|-----------|------|-----------|
| Tabs | `tabs.tsx` | Radix Tabs |
| NavigationMenu | `navigation-menu.tsx` | Radix NavigationMenu |
| Breadcrumb | `breadcrumb.tsx` | Custom |
| Accordion | `accordion.tsx` | Radix Accordion |
| Collapsible | `collapsible.tsx` | Radix Collapsible |
| Menubar | `menubar.tsx` | Radix Menubar |
| DropdownMenu | `dropdown-menu.tsx` | Radix DropdownMenu (also in blog at `artifacts/blog/src/components/ui/`) |
| ContextMenu | `context-menu.tsx` | Radix ContextMenu |
| Toggle | `toggle.tsx` | Radix Toggle |
| ToggleGroup | `toggle-group.tsx` | Radix ToggleGroup |

### Feedback

| Component | File | Primitive |
|-----------|------|-----------|
| Badge | `badge.tsx` | Custom |
| Alert | `alert.tsx` | Custom |
| Toast | `toast.tsx`, `toaster.tsx` | Radix Toast |
| Sonner | `sonner.tsx` | sonner |
| Progress | `progress.tsx` | Radix Progress |
| Spinner | `spinner.tsx` | Custom |
| Empty | `empty.tsx` | Custom |
| ConfirmDialog | `confirm-dialog.tsx` | Dialog wrapper |

### Data Display

| Component | File | Primitive |
|-----------|------|-----------|
| Table | `table.tsx` | Custom |
| Chart | `chart.tsx` | Recharts wrapper |
| Avatar | `avatar.tsx` | Radix Avatar |
| AspectRatio | `aspect-ratio.tsx` | Radix AspectRatio |
| Carousel | `carousel.tsx` | embla-carousel-react |
| Pagination | `pagination.tsx` | Custom |
| Kbd | `kbd.tsx` | Custom |
| Item | `item.tsx` | Custom list item |
| Field | `field.tsx` | Form field wrapper |
| InputGroup | `input-group.tsx` | Input + addon wrapper |

### Forms

| Component | File | Notes |
|-----------|------|-------|
| Form | `form.tsx` | React Hook Form + shadcn/ui integration |

## Layout Components

Located in `artifacts/web/src/components/layout/`.

| Component | File | Purpose |
|-----------|------|---------|
| Header | `header.tsx` | Top bar: logo, sync indicator, support, theme, language, notifications |
| Sidebar | `sidebar.tsx` | 220px nav sidebar with workspace switcher and nav groups |

## Application Components

Located in `artifacts/web/src/components/`.

| Component | File | Purpose |
|-----------|------|---------|
| NotificationBell | `notification-bell.tsx` | In-app notification badge + dropdown |
| LanguageSwitcher | `language-switcher.tsx` | i18n language selector |
| WorkspaceAvatar | `workspace-avatar.tsx` | Generated avatar for workspaces |
| CurrencyCombobox | `currency-combobox.tsx` | Currency selector with search |
| MarkdownEditor | `markdown-editor.tsx` | Tiptap-based rich text editor |
| HelpTooltip | `help-tooltip.tsx` | Contextual help icon + tooltip |
| SetupChecklist | `setup-checklist.tsx` | Inline onboarding widget — collapsible card / pill, 3-step progress, Load Sample Data |

## Blog Components

Located in `artifacts/blog/src/components/`.

| Component | File | Purpose |
|-----------|------|---------|
| LanguagePills | `language-pills.tsx` | Blog article language switcher — dropdown with Globe icon, native language labels, active language highlighted with code badge |

## Hooks

Located in `artifacts/web/src/hooks/`.

| Hook | File | Purpose |
|------|------|---------|
| useAuth | `use-auth.tsx` | Better Auth session context |
| useWorkspace | `use-workspace.tsx` | Active workspace + switcher |
| useTheme | `use-theme.tsx` | Light/dark theme |
| useRole | `use-role.ts` | Permission checks |
| useNotifications | `use-notifications.ts` | Notification state |
| useSyncStore | `use-sync-store.ts` | Zustand sync error state |
| useMobile | `use-mobile.tsx` | Mobile breakpoint detection |
| usePageTrack | `use-page-track.ts` | Analytics page tracking |
| usePageMeta | `use-page-meta.ts` | Helmet metadata helper |
| useBillingStatus | `use-billing-status.ts` | Subscription status |
| useToast | `use-toast.ts` | Toast helper |

## Utility Libraries

| File | Purpose |
|------|---------|
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `src/lib/api.ts` | `apiFetch`, `paginatedFetch` |
| `src/lib/auth-client.ts` | Better Auth client setup |
| `src/lib/format.ts` | Currency/date/formatting helpers |
| `src/lib/currencies.ts` | Currency list + metadata |
| `src/lib/analytics.ts` | Analytics event tracking |
| `src/lib/templates.ts` | File templates for CSV/XLSX import |
| `src/i18n/index.ts` | i18n initialization |

## Page Registry

Located in `artifacts/web/src/pages/`.

### Marketing / Public

| Page | File | Route |
|------|------|-------|
| Landing | `landing/index.tsx` | `/` |
| Pricing | `pricing.tsx` | `/pricing` |
| Features | `features.tsx` | `/features` |
| Solutions | `solutions.tsx` | `/solutions` |
| Contact | `contact.tsx` | `/contact` |
| Commission Calculator | `commission-calculator.tsx` | `/calculator` |
| Privacy | `legal/privacy.tsx` | `/privacy` |
| Terms | `legal/terms.tsx` | `/terms` |
| Security | `legal/security.tsx` | `/security` |

### Auth

| Page | File | Route |
|------|------|-------|
| Auth | `auth/auth.tsx` | `/login`, `/register`, `/forgot-password` |
| Reset Password | `auth/reset-password.tsx` | `/reset-password` |
| Email Verified | `auth/email-verified.tsx` | `/email-verified` |
| Accept Invite | `team/accept-invite.tsx` | `/accept-invite` |

### Dashboard

| Page | File | Route |
|------|------|-------|
| Dashboard | `dashboard.tsx` | `/dash` |
| Reports | `reports/reports.tsx` | `/dash/reports` |

### Commission

| Page | File | Route |
|------|------|-------|
| Plans | `commission/plans.tsx` | `/dash/plans` |
| Products | `commission/products.tsx` | `/dash/products` |
| Deals | `commission/deals.tsx` | `/dash/deals` |
| Runs | `commission/runs.tsx` | `/dash/runs` |
| Run Details | `commission/run-details.tsx` | `/dash/runs/:id` |

### Team

| Page | File | Route |
|------|------|-------|
| Team | `team/team.tsx` | `/dash/team` |
| Reps | `team/reps.tsx` | `/dash/reps` |

### Payouts & Portal

| Page | File | Route |
|------|------|-------|
| Payouts | `payouts/payouts.tsx` | `/dash/payouts` |
| Disputes | `payouts/disputes.tsx` | `/dash/disputes` |
| Rep Portal | `portal/rep-portal.tsx` | `/dash/reps/:id` |
| Public Portal | `portal/public-portal.tsx` | `/portal/:accessCode` |

### Settings

| Page | File | Route |
|------|------|-------|
| Settings | `settings/settings.tsx` | `/dash/settings` |
| Billing | `settings/billing.tsx` | `/dash/billing` |
| Roles | `settings/settings-roles.tsx` | `/dash/settings` (tab) |

### Integrations

| Page | File | Route |
|------|------|-------|
| Integrations | `integrations/integrations.tsx` | `/dash/integrations` |

### Enterprise (AISSOL)

| Page | File | Route |
|------|------|-------|
| Projects | `enterprise/aissol/projects.tsx` | `/dash/enterprise/projects` |
| Project Detail | `enterprise/aissol/project-detail.tsx` | `/dash/enterprise/projects/:id` |
| Matrix | `enterprise/aissol/matrix.tsx` | `/dash/enterprise/matrix` |
| Reports | `enterprise/aissol/reports.tsx` | `/dash/enterprise/reports` |
| Runs | `enterprise/aissol/runs.tsx` | `/dash/enterprise/runs` |
| Run Details | `enterprise/aissol/run-details.tsx` | `/dash/enterprise/runs/:id` |
| Rep Portal | `enterprise/aissol/rep-portal.tsx` | `/dash/reps/:id` |
| Public Portal | `enterprise/aissol/public-portal.tsx` | `/portal/:accessCode` |

## Visual Pattern Registry

*This section captures visual consistency patterns from built components. Every new component should match the patterns established here. Updated via `/imprint` after each component build.*

---

### Page Header

File: `artifacts/web/src/pages/audit-log/audit-log.tsx`
Last updated: 2026-07-21

| Property         | Class                                           |
| ---------------- | ----------------------------------------------- |
| Title            | `text-[20px] font-semibold tracking-tight`       |
| Subtitle         | `text-sm text-muted-foreground`                  |
| Icon container   | `rounded-lg bg-primary/10 text-primary size-10`  |
| Page spacing     | `space-y-6`                                      |
| Header layout    | `flex items-center justify-between`              |
| Icon + text gap  | `gap-3`                                          |

**Pattern notes:**
Page headers consistently use the icon-in-primary-badge pattern: a rounded square container with `bg-primary/10` and `text-primary`, a 20px semibold title with tight tracking, and a muted subtitle below. The icon inside is `size-5`. This pattern should be reused for any new app page.

### Card (Container)

File: `artifacts/web/src/pages/audit-log/audit-log.tsx`
Last updated: 2026-07-21

| Property         | Class                                           |
| ---------------- | ----------------------------------------------- |
| Background       | `bg-card`                                       |
| Border           | `border border-card-border`                     |
| Border radius    | `rounded-xl`                                     |
| Card title       | `text-[15px] font-semibold leading-snug tracking-tight` |
| Card header pad  | `pb-4` (via CardHeader)                         |
| Card content gap | `space-y-4` (via CardContent)                   |

**Pattern notes:**
All cards should use `rounded-xl border border-card-border bg-card`. Card titles are consistently `text-[15px] font-semibold leading-snug tracking-tight`. The Card component from shadcn/ui handles the structure; only these classes need to be passed as overrides on the Card wrapper.

### Table (Data Display)

File: `artifacts/web/src/components/audit-log/audit-log-table.tsx`
Last updated: 2026-07-21

| Property              | Class                                                     |
| --------------------- | --------------------------------------------------------- |
| Table wrapper         | `rounded-md border border-card-border bg-card overflow-hidden` |
| Header row            | `border-b border-card-border hover:bg-transparent`        |
| Header cell base      | `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` |
| Data row default      | `cursor-pointer transition-colors`                        |
| Data row even         | `even:bg-muted/10`                                       |
| Data row hover        | `hover:bg-muted/20`                                       |
| Data row expanded     | `bg-muted/50`                                             |
| Cell — standard       | `text-sm tabular-nums text-muted-foreground`              |
| Cell — emphasized     | `text-sm font-medium text-foreground`                     |
| Expand panel bg       | `bg-muted/20 border-t`                                    |
| Expand panel padding  | `px-4 py-3`                                               |
| Pagination text       | `text-sm text-muted-foreground`                           |
| Pagination button     | `variant="ghost" size="sm"` with `size-8 p-0`             |
| Pagination count      | `text-sm tabular-nums px-2`                               |
| Skeleton row          | `h-12 w-full` in `space-y-3`                              |
| Collapse icon         | `size-4` with rotation transition                         |

**Pattern notes:**
Tables use the standard shadcn/ui table primitives. The wrapper gets `rounded-md border border-card-border bg-card overflow-hidden`. Rows alternate with `even:bg-muted/10` and highlight on `hover:bg-muted/20`. Expandable rows should push content into `bg-muted/20 border-t` with `px-4 py-3`. Pagination uses ghost buttons. Empty states use the Empty component with `EmptyMedia variant="icon"` containing a custom SVG.

### Filter Chips

File: `artifacts/web/src/components/audit-log/filter-chip.tsx`
Last updated: 2026-07-21

| Property         | Class                                           |
| ---------------- | ----------------------------------------------- |
| Background       | `bg-sidebar-accent`                              |
| Border           | `border border-sidebar-border`                  |
| Border radius    | `rounded-full`                                   |
| Padding          | `px-2.5 py-0.5`                                 |
| Text             | `text-xs font-medium text-sidebar-accent-foreground` |
| Label            | `text-muted-foreground`                         |
| Value            | `max-w-[160px] truncate`                        |
| Layout           | `inline-flex items-center gap-1 transition-colors` |
| Remove button    | `rounded-full p-0.5` hover: `bg-sidebar-border text-sidebar-foreground` |

**Pattern notes:**
Filter chips use sidebar tokens (`sidebar-accent`, `sidebar-border`, `sidebar-accent-foreground`) to visually associate with the sidebar — they live at the filter bar level, not inside the main content. The pill shape (`rounded-full`) distinguishes them from content cards. The active filter chips container uses `flex items-center gap-1.5 flex-wrap`.

### Diff View (Before/After)

File: `artifacts/web/src/components/audit-log/audit-log-diff.tsx`
Last updated: 2026-07-21

| Property           | Class                                                     |
| ------------------ | --------------------------------------------------------- |
| Grid layout        | `grid grid-cols-[auto_1fr_auto_1fr] gap-x-2 gap-y-0.5 text-xs items-start` |
| Field name         | `text-muted-foreground font-medium capitalize text-right` |
| Removed value      | `text-destructive/80 bg-destructive/5 px-1.5 py-0.5 rounded truncate` |
| Added value        | `text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded truncate` |
| Dark removed bg    | `dark:bg-destructive/10`                                  |
| Dark added bg      | `dark:bg-emerald-500/10`                                   |
| Arrow separator    | `text-muted-foreground`                                   |

**Pattern notes:**
Diff rows use a 4-column grid with the field name right-aligned. Old values use destructive palette at 80% opacity with 5% background; new values use emerald green. Both have light 5% backgrounds that become 10% in dark mode. Values are truncated with full text in title attribute. This pattern should be used for any before/after comparison (audit diffs, version history, setting changes).

### Setup Checklist (Overlay Widget)

File: `artifacts/web/src/components/setup-checklist.tsx`
Last updated: 2026-07-21

| Property               | Class                                                     |
| ---------------------- | --------------------------------------------------------- |
| Background             | `bg-card`                                                 |
| Border                 | `border border-card-border`                               |
| Border radius          | `rounded-xl`                                              |
| Shadow                 | `shadow-lg` + `boxShadow: "var(--shadow-card)"`          |
| Position               | `fixed -bottom-1 right-6 z-50`                           |
| Header padding         | `px-4 py-2.5` (expanded) / `px-3.5 py-2` (collapsed)    |
| Title (expanded)       | `text-[15px] font-bold tracking-tight text-foreground`    |
| Title (collapsed)      | `text-[12px] font-semibold tabular-nums text-foreground` |
| Step row               | `rounded-md hover:bg-accent/30 cursor-pointer`           |
| Step text (incomplete) | `text-[13px] font-semibold text-foreground`              |
| Step text (complete)   | `text-[13px] font-semibold text-muted-foreground line-through` |
| Progress bar bg        | `h-1.5 rounded-full bg-muted overflow-hidden`            |
| Progress bar fill      | `h-full rounded-full bg-primary`                         |
| Progress label         | `text-[11px] font-medium text-muted-foreground tabular-nums` |
| CTA button (ring)      | `ring-1 ring-primary/30`                                 |
| Skip button            | `text-xs text-muted-foreground font-medium`              |
| Focus ring             | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` |

**Pattern notes:**
The setup checklist is a fixed overlay anchored to the bottom-right of the viewport. It uses the same card tokens as content cards. Step rows use `hover:bg-accent/30` for the hover state (not `hover:bg-muted` — accent is used for navigation items and interactive guide steps). The progress bar is a thin 6px rounded strip. Primary CTA buttons with ring use `ring-1 ring-primary/30` for subtle emphasis without full button chrome.

### Interactive Steps (Navigation Items)

File: `artifacts/web/src/components/setup-checklist.tsx`
Last updated: 2026-07-21

| Property         | Class                                                     |
| ---------------- | --------------------------------------------------------- |
| Container        | `rounded-md text-left hover:bg-accent/30 cursor-pointer`   |
| Text             | `text-[13px] font-semibold`                               |
| Gap              | `gap-2.5`                                                 |
| Padding          | `py-2 px-1`                                               |
| Completed icon   | `size-4 text-primary` (CheckCircle)                       |
| Incomplete icon  | `size-4 text-muted-foreground` (Circle)                   |
| Chevron          | `size-3.5 text-muted-foreground shrink-0 -rotate-90`     |
| Focus ring       | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` |

**Pattern notes:**
Interactive navigation/step items use a specific hover pattern: `rounded-md hover:bg-accent/30 cursor-pointer` (not `hover:bg-muted`). This distinguishes navigational click targets from content areas. Completed steps get the text-through + muted pattern; incomplete steps are `text-foreground`. The right-facing chevron (rotated from ChevronDown) indicates navigation.

---

## Icons

All icons are from `lucide-react`. Common icons used:

- `LayoutDashboard`, `PieChart`, `Users`, `FileText`, `Briefcase`, `PlayCircle`, `Wallet`, `AlertOctagon`
- `Settings`, `CreditCard`, `Plug`, `Shield`, `Crown`, `Building2`, `FolderKanban`, `Grid3X3`
- `Sun`, `Moon`, `LifeBuoy`, `LoaderCircle`, `Cloud`, `LogOut`, `ChevronsUpDown`, `Check`, `Plus`
- `ScrollText`, `ChevronLeft`, `ChevronRight`, `ChevronUp`, `ChevronDown`, `Pencil`, `Trash2`, `Plus`, `Copy`, `Download`, `Search`, `X`, `Zap`, `Minus`, `CheckCircle`, `Circle`

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Next in technical series: `context/code-standards.md`
- Related business context: AFFiNE OS (`https://affine.commissionkit.co`)
