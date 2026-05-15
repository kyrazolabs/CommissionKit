# CommissionKit Design System & Philosophy

CommissionKit is designed to feel **premium, precise, and high-performance.** As a sales platform, it must convey trust and accuracy while maintaining a modern, "SaaS-forward" aesthetic.

---

## 1. Visual Identity

### Color Palette
- **Primary**: `#0D9488` (Teal-600) — Represents growth, health, and precision.
- **Secondary/Action**: `#111827` (Gray-900) — Used for heavy contrast and deep background elements.
- **Surface (Dark Mode)**: 
  - Background: `#030712` (Zinc-950)
  - Cards: `#09090b` (Zinc-900)
  - Borders: `rgba(255,255,255,0.08)`
- **Surface (Light Mode)**:
  - Background: `#f9fafb` (Gray-50)
  - Cards: `#ffffff`
  - Borders: `#e5e7eb` (Gray-200)

### Typography
- **Primary Font**: `Inter` (or system-default sans-serif)
- **Principles**:
  - Tight tracking for headings (`-0.02em`).
  - High contrast between primary text (`foreground`) and secondary metadata (`muted-foreground`).
  - Tabular numbers for all financial data to ensure alignment.

### Iconography
- **Primary Pack**: `Lucide React`
- **Principles**:
  - Consistent stroke width of `2px`.
  - Minimalist and geometric forms.
  - Sizing: Standard UI icons are `16px` (`h-4 w-4`) or `18px` (`h-[18px] w-[18px]`).
  - Usage: Always paired with text labels in primary navigation to ensure clarity.

---

## 2. UI/UX Principles

### The "WOW" Factor (Rich Aesthetics)
- **Glassmorphism**: Subtle use of `backdrop-blur` and semi-transparent backgrounds for overlays and sticky headers.
- **Micro-Animations**: 
  - Hover states: Scale up by `1.02` for interactive cards.
  - Transitions: Smooth `200ms` eases for all state changes.
  - Loaders: Custom spinners that match the primary brand color.
- **Vibrant Gradients**: Use of radial gradients in the background to add depth (e.g., a faint teal glow in the top-right corner).

### Data Clarity
- **Financial Precision**: All currency values are formatted using `Intl.NumberFormat`.
- **Status Indicators**: 
  - `PENDING`: Amber/Yellow (Caution)
  - `APPROVED/WON`: Green/Emerald (Success)
  - `REJECTED/LOST`: Red/Rose (Error/Stop)
- **Empty States**: Always include a clean, branded illustration or icon when no data is present.

---

## 3. Component Architecture

### Layouts
- **Sidebar**: Fixed-width, deep-background sidebar for navigation to maintain focus.
- **Header**: Simple, high-utility header with workspace selectors and theme toggles.
- **Page Wrapper**: Maximum width of `1280px` (or `5xl` in Tailwind) to ensure readability on ultra-wide monitors.

### Interactive Elements
- **Buttons**: Rounded-xl corners, bold text, and high-contrast primary states.
- **Dialogs/Modals**: Centered with a strong backdrop blur (`blur-sm`).
- **Inputs**: Clean, minimalist borders that highlight in primary teal when focused.

---

## 4. Accessibility & Localization
- **High Contrast**: Ensure a minimum contrast ratio of 4.5:1 for all text.
- **Theme Support**: Native dark and light mode support using the `dark:` class modifier.
- **Responsive Design**: Mobile-first approach. All complex tables must provide a stacked or scrollable view on mobile.

---
**CommissionKit — Precision by Design.**
