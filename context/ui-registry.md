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
| Commission Calculator | `commission-calculator.tsx` | `/calculator`, `/commission-calculator` |
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

## Icons

All icons are from `lucide-react`. Common icons used:

- `LayoutDashboard`, `PieChart`, `Users`, `FileText`, `Briefcase`, `PlayCircle`, `Wallet`, `AlertOctagon`
- `Settings`, `CreditCard`, `Plug`, `Shield`, `Crown`, `Building2`, `FolderKanban`, `Grid3X3`
- `Sun`, `Moon`, `LifeBuoy`, `LoaderCircle`, `Cloud`, `LogOut`, `ChevronsUpDown`, `Check`, `Plus`

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Next in technical series: `context/code-standards.md`
- Related business context: AFFiNE OS (`https://affine.commissionk.it`)
