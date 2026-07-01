# UI Rules — CommissionKit

These rules govern how the frontend is built and maintained. All components and pages must follow them.

## 1. No Emojis

- **Emojis are strictly prohibited in the UI.**
- Use Lucide React icons exclusively.
- Icon stroke width: `2px` (Lucide default).
- Icon sizes: `14px` (`size-3.5`) for dense UI, `16px` (`size-4`) for standard UI.

## 2. Icons

- Always import icons from `lucide-react`.
- Pair icons with text labels in primary navigation and action buttons.
- Do not use icons alone for critical actions unless the meaning is universally clear (e.g., trash for delete) and has a tooltip.

## 3. Colors

- Use semantic CSS variables, never hard-coded hex values for theme-aware colors.
- Examples: `bg-primary`, `text-muted-foreground`, `border-card-border`.
- Accent color is teal (`--primary`).
- Financial data should not rely on color alone; combine with labels/status badges.

## 4. Buttons

- Primary action: `variant="default"` (solid teal).
- Secondary action: `variant="outline"` or `variant="ghost"`.
- Destructive action: `variant="destructive"`.
- All buttons include `hover-elevate active-elevate click` via the base button variant.
- Avoid multiple primary buttons in the same group.

## 5. Cards

- Use `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` from `@/components/ui/card`.
- Cards have `rounded-xl border border-card-border bg-card card-shadow`.
- Keep headers concise; use description for secondary context.

## 6. Layout

- App layout: fixed header (h-14) + fixed 220px sidebar + scrollable main content.
- Main content wrapper: `max-w-6xl mx-auto p-8 lg:px-10`.
- Page transitions use Framer Motion with `duration: 0.20` and spring easing `[0.34, 1.56, 0.64, 1]`.

## 7. Forms & Inputs

- Use `Input`, `Label`, `Select`, `Textarea`, `Switch`, `Checkbox`, `RadioGroup` from `@/components/ui/*`.
- Always associate labels with inputs.
- Use `aria-invalid` and error text for validation errors.
- Form spacing: `space-y-4` or `space-y-2`.

## 8. Tables

- Clean dividers with `border-b`.
- Headers: `text-[11px] font-semibold text-muted-foreground uppercase tracking-wider`.
- Financial columns: `text-right tabular-nums`.
- Empty states must show a Lucide icon + clear placeholder text.

## 9. Dialogs / Modals

- Use `Dialog`, `AlertDialog`, or `Sheet` from `@/components/ui/*`.
- Title + description at top.
- Action buttons right-aligned in footer.
- Primary action on the right, cancel/secondary on the left.

## 10. Empty States

- Include a muted Lucide icon (e.g., `Activity`, `Briefcase`, `FolderOpen`).
- Clear headline and optional subtext explaining what to do next.
- Provide a primary CTA when applicable.

## 11. Loading States

- Use `Spinner` component or skeleton loaders (`Skeleton`).
- Full-page first load uses `AppLoader` with cycling messages.
- Show inline spinners for mutations; use `useIsMutating` for global save indicator.

## 12. Financial Formatting

- Use `Intl.NumberFormat` or helper `formatCurrency` for currency values.
- Always apply `tabular-nums` to numbers in tables and reports.
- Show currency symbol + code when multi-currency context matters.

## 13. Accessibility

- Minimum contrast ratio 4.5:1 for text.
- Focus rings use `--ring` (teal).
- Support keyboard navigation for all interactive elements.
- Use semantic HTML (`<main>`, `<nav>`, `<header>`).

## 14. Responsive Design

- Mobile-first approach.
- Complex tables must scroll horizontally or stack on small screens.
- Sidebar collapses or becomes an overlay on mobile (handled by layout components).

## 15. Theme

- Light mode is default.
- Dark mode toggled via `.dark` class on `<html>`.
- Always test new components in both themes.

## 16. Animations

- Keep animations subtle and purposeful.
- Prefer `transition-colors duration-200` for hover.
- Use `click` utility for tactile press feedback (`scale(0.95)` on active).
- Avoid excessive motion; respect `prefers-reduced-motion` where feasible.

## 17. Navigation

- Sidebar groups: Main, Operations, Account.
- Active item: `bg-sidebar-accent text-sidebar-accent-foreground font-semibold`.
- Inactive item: `text-sidebar-foreground hover:bg-muted hover:text-foreground`.
- Enterprise engine nav items can replace standard items via `engineNavItems` from `useWorkspace`.

## 18. Images & Brand

- Logo: `/brand/logo-symbol.svg` in header.
- Brand wordmark: "CommissionKit" with "Kit" in primary teal.
- Use SVG assets from `public/brand/`.

## 19. Toasts & Notifications

- Use `sonner` toast for ephemeral feedback.
- Use in-app notification bell for persistent events.
- Toast messages should be concise and action-oriented.

## 20. Page Metadata

- Use `react-helmet-async` for `<title>`, `<meta>`, and canonical links.
- Canonical URL: `https://commissionk.it{path}` with trailing slash normalized.
- Page tracking handled by `usePageTrack`.

## 21. Code Style

- Import UI components from `@/components/ui/*`.
- Import hooks from `@/hooks/*`.
- Use `cn()` from `@/lib/utils` for conditional classes.
- Prefer functional components and hooks.
- Keep components focused; extract repeated UI into reusable components.
