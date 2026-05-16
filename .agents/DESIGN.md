# CommissionKit Design System & Philosophy

CommissionKit is designed to feel **premium, precise, and highly utilitarian.** As a core revops and finance platform, it must convey trust, clarity, and absolute accuracy. The aesthetic is a clean, modern B2B SaaS dashboard interface built primarily on a grayscale foundation with primary teal accents.

---

## 1. Visual Identity

### Color Palette
The platform uses semantic CSS variables mapped to specific HSL values for seamless Light and Dark mode support.

#### Light Mode (Default)
- **Background**: `#FFFFFF` (`0 0% 100%`) — Pure white for the main app canvas.
- **Surface (Sidebar/Header)**: `#FAFAFA` (`0 0% 98%`) — Subtle off-white to distinguish navigation from content.
- **Card Background**: `#FFFFFF` (`0 0% 100%`)
- **Borders**: `#E5E7EB` (Gray-200, `220 13% 91%`)
- **Text (Primary)**: `#111827` (Gray-900, `222 39% 11%`) — High contrast for headings and primary data.
- **Text (Secondary/Muted)**: `#6B7280` (Gray-500, `220 9% 46%`)

#### Dark Mode
- **Background**: `#0F0F0F` (`0 0% 6%`) — True black/deep gray.
- **Surface (Sidebar/Header)**: `#0F0F0F` (`0 0% 6%`)
- **Card Background**: `#171717` (`0 0% 9%`)
- **Borders**: `#262626` (`0 0% 15%`)
- **Text (Primary)**: `#EDEDED` (`0 0% 93%`)
- **Text (Secondary/Muted)**: `#858585` (`0 0% 52%`)

#### Primary Accent (Both Themes)
- **Primary Action**: Teal-600 (`174 72% 35%` in Light, `174 60% 48%` in Dark).
- **Secondary/Accent**: `#F0FDFA` in light, `#212121` in dark.

### Typography
- **Primary Font**: `Inter` (fallback: `-apple-system, sans-serif`)
- **Principles**:
  - Tight tracking for headings (`-0.02em` to `-0.03em`).
  - Strict use of tabular numbers (`tabular-nums`) for all financial data to ensure precise vertical alignment in tables.

### Iconography
- **Primary Pack**: `Lucide React`
- **Principles**:
  - **No Emojis**: Emojis are strictly prohibited in the UI as they compromise the professional, financial nature of the platform.
  - Consistent stroke width of `2px`.
  - Sizing: Standard UI icons are `16px` (`size-4`) or `14px` (`size-3.5`) for dense UI.
  - Usage: Always pair with text labels in primary navigation and action buttons to ensure clarity.

---

## 2. UI/UX Principles

### High-Utility Aesthetics
- **Clarity over Flash**: Avoid excessive gradients, heavy drop shadows, or "glassmorphism". Favor clean borders, subtle shadows (`shadow-sm`, `shadow-card`), and distinct background contrasts.
- **Custom Scrollbars**: The application uses a custom thin scrollbar with a teal (`primary`) thumb to match the branding.
- **Subtle Interactions**: 
  - Hover states: Uses custom `hover-elevate` utility for subtle background color changes.
  - Button transitions: `transition-colors duration-200`.

### Data Clarity
- **Financial Precision**: All currency values are formatted using `Intl.NumberFormat` (e.g., via `formatCurrency`).
- **Status Indicators**: 
  - `PENDING`: Amber/Yellow backgrounds with dark yellow text.
  - `APPROVED / CLOSED WON`: Teal/Emerald backgrounds with dark teal text.
  - `REJECTED / CLOSED LOST`: Rose backgrounds with dark red text.
- **Empty States**: Always include a clean, muted Lucide icon (e.g., `Activity`, `Briefcase`) and clear, actionable placeholder text when no data is present.

---

## 3. Component Architecture (shadcn/ui)

The platform is built on standard `shadcn/ui` components located in `src/components/ui/`, tailored to our precise CSS variables:

- **Border Radius**: 
  - Base radius: `10px` (`0.625rem`).
  - Stat cards and buttons generally use `rounded-xl` (`14px`) or `rounded-2xl` for a modern, approachable feel.
- **Buttons**: Primary buttons use solid teal; secondary actions use `variant="outline"` or `variant="ghost"`.
- **Inputs & Selects**: Clean borders (`border-input`), focusing with a subtle ring (`ring-primary`).
- **Tables**: Clean dividers (`border-b`), uppercase tracking-wide headers (`text-[11px] font-semibold text-muted-foreground uppercase tracking-wider`).
- **Dialogs/Modals**: Centered surfaces with clear Title/Description headers and right-aligned action footers.

### Layouts
- **Sidebar**: Clean, fixed-width sidebar (`bg-sidebar`). Active states highlighted with a primary accent.
- **Page Wrapper**: Maximum width constraints (e.g., `max-w-[1200px]`) ensure readability on ultra-wide monitors.
- **Dashboard Headers**: Clear Page Title, breadcrumbs/period selectors, and top-level action buttons (e.g., "Add Deal") aligned to the right.

---

## 4. Accessibility & Localization
- **High Contrast**: Ensure a minimum contrast ratio of 4.5:1 for all text.
- **Theme Support**: Fully responsive Light and Dark mode using the `.dark` class hierarchy.
- **Responsive Design**: Mobile-first approach. Complex tables must provide a stacked or scrollable view on mobile screens.

---
**CommissionKit — Precision by Design.**
