---
name: AutoTaller Pro
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#1d4ed8'
  on-secondary: '#ffffff'
  secondary-container: '#4069f2'
  on-secondary-container: '#fffbff'
  tertiary: '#4d556b'
  on-tertiary: '#ffffff'
  tertiary-container: '#656d84'
  on-tertiary-container: '#eef0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b7c4ff'
  on-secondary-fixed: '#001551'
  on-secondary-fixed-variant: '#0039b5'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-performance, enterprise-grade environment tailored specifically for modern automotive service facilities and fleet workshop networks. The user base spans master technicians, workshop supervisors, service advisors, and inventory controllers—roles requiring rapid data processing, immediate operational feedback, and zero visual ambiguity under high-stress garage conditions.

The design movement is **Modern Corporate Utility**: an engineered blend of modern enterprise SaaS (clean, dense, structural) and ergonomic workshop ergonomics. Interfaces feature high information density without cognitive clutter, crisp structural hierarchy, clear status delineations, and tactile affordances that guarantee confidence in every dispatch, diagnostic change, or parts order.

## Colors

The system uses a calibrated palette constructed for functional distinction and high legibility across diagnostic displays, tablets, and desktop workstations.

- **Primary Actions & Focus (`#2563EB`)**: Drives primary buttons, dynamic highlights, active step indicators, and primary links.
- **Interactive State Hover/Active (`#1D4ED8`)**: Used for depressed states, hover fills, and emphasized navigation nodes.
- **Deep Slate/Neutral Dark (`#0F172A`)**: Sets high-contrast foundational typography, prominent dark headers, sidebar rails, and terminal states.
- **Secondary Slate (`#64748B`)**: Secondary text, metadata, table column headers, and structural icons.
- **Canvas & Containers**: Pure white (`#FFFFFF`) surfaces rest over a muted workshop slate background (`#F8FAFC`), bordered cleanly by fine hairline dividers (`#E2E8F0`).

### Semantic Workshop Status Indicators
Each operational state pairs a bold 600-shade foreground text/icon with a tinted 50/100-shade container fill for maximum peripheral recognition:
- **Completed / Delivered / Operational**: `#16A34A` text on `#DCFCE7` surface.
- **Diagnostic In Progress**: `#7C3AED` text on `#EDE9FE` surface.
- **In Active Repair**: `#2563EB` text on `#DBEAFE` surface.
- **Awaiting Parts / Action**: `#F59E0B` text on `#FEF3C7` surface.
- **Pending Intake / Unassigned**: `#D97706` text on `#FEF9C3` surface.
- **Critical / Work Order Cancelled / Overdue**: `#DC2626` text on `#FEE2E2` surface.

## Typography

Typography is powered by `Inter` across all structural tiers to leverage its exceptional tall x-height, distinct tabular numerals, and legibility on both low-spec garage tablets and 4K dispatch consoles.

- **Tabular Figures (`tnum`)**: Mandatory for VIN numbers, part SKUs, torque specs, hourly labor rates, repair estimate totals, and stopwatch timers.
- **Uppercase Micro-labels (`label-sm`)**: Reserved strictly for workshop status chips, badge metadata, VIN identifiers, and technical table headers.

## Layout & Spacing

The layout is built upon a 12-column responsive fluid grid designed to display large sets of structured automotive data:

- **Desktop (1280px+)**: 12 columns with `2rem` outer margins and `1.5rem` gutters. Layout hosts a fixed 260px collapsible command sidebar, persistent work-order filter ribbons, and a dynamic multi-pane technician kanban or master repair ledger.
- **Tablet / Touch-terminal (768px – 1023px)**: 8 columns with `1.5rem` outer margins and `1rem` gutters. Collapses navigation into an icon rail or top app bar; repair order tables reflow into dense card stacks.
- **Mobile Handheld (320px – 767px)**: 4 columns with `1rem` outer margins and `1rem` gutters. Single-column linear layout prioritizing rapid VIN scanning, checklist toggles, and photo upload touchpoints.
- **Vertical Spacing Rhythm**: All vertical cadences conform strictly to the 4px/8px incremental grid. Standard form groupings leverage `space-md` (16px), while modal headers and card interiors default to `space-lg` (24px).

## Elevation & Depth

Visual hierarchy uses crisp, low-contrast structural borders combined with soft ambient drop shadows to distinguish interactive cards from the background canvas without visual weight:

- **Level 0 (Surface Base)**: Slate background (`#F8FAFC`) with no shadow.
- **Level 1 (Cards, Work Order Rows, Table Containers)**: Pure white (`#FFFFFF`) surface framed by a 1px border (`#E2E8F0`) and an ambient micro-shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Level 2 (Hovered Cards, Floating Action Bars, Dropdowns)**: Elevated card state: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, Vehicle Inspection Drawers, Overlays)**: High-priority dialogue screens: `0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)`, backed by a 50% opacity slate-900 overlay backdrop.

## Shapes

The interface embraces an engineered, dependable geometry:
- **Base Rounding (`rounded-md` / 0.375rem - 0.5rem)**: Standard buttons, text inputs, dropdown selects, and data table headers.
- **Large Rounding (`rounded-lg` / 0.5rem - 0.75rem)**: Standard workshop cards, vehicle detail sheets, telemetry panels, and invoice containers.
- **Extra-Large Rounding (`rounded-xl` / 1rem)**: Major operational dashboards, inspection photo galleries, and modal dialogue containers.
- **Full Pill (`rounded-full`)**: Operational status badges, technician avatar chips, and bay occupancy tags.

## Components

### Buttons
- **Primary**: Solid `#2563EB`, text `#FFFFFF`, font weight 600, border radius `rounded-lg`, hover `#1D4ED8`, subtle inner top-highlight.
- **Secondary / Neutral**: White surface `#FFFFFF`, 1px border `#E2E8F0`, text `#0F172A`, hover `#F8FAFC`.
- **Destructive**: White surface with 1px border `#FEE2E2`, text `#DC2626`, hover `#FEE2E2`.
- **Dimensions**: Desktop default 40px height; tablet/shopfloor touch targets 48px height.

### Input Fields & Selects
- Height 40px (48px for shop floor mode), `#FFFFFF` fill, 1px border `#E2E8F0`, placeholder `#64748B`.
- Focused state: 1px border `#2563EB` with an ambient 3px outer ring in `rgba(37, 99, 235, 0.15)`.

### Operational Status Badges (Chips)
- Compact, pill-shaped tags (`rounded-full`) using uppercase `label-sm` tracking.
- Composed of a solid 6px indicator dot paired with matching text and background tint:
  - *Finalizada/Entregada*: Green dot `#16A34A`, background `#DCFCE7`, text `#16A34A`.
  - *En Reparación*: Blue dot `#2563EB`, background `#DBEAFE`, text `#2563EB`.
  - *En Diagnóstico*: Purple dot `#7C3AED`, background `#EDE9FE`, text `#7C3AED`.
  - *En Espera (Repuestos)*: Orange dot `#F59E0B`, background `#FEF3C7`, text `#F59E0B`.
  - *Pendiente*: Amber dot `#D97706`, background `#FEF9C3`, text `#D97706`.
  - *Alerta / Cancelada*: Red dot `#DC2626`, background `#FEE2E2`, text `#DC2626`.

### Cards & Work Order Containers
- Surfaces in pure white (`#FFFFFF`) with `rounded-xl` borders and `#E2E8F0` framing.
- Header bars include vehicle metadata (Plate, Year/Make/Model) on the left and status badges with estimated completion times on the right.

### Tables & Data Grids
- Sticky headers on background `#F8FAFC` with 1px bottom border `#E2E8F0`.
- Cells padded at 12px vertical by 16px horizontal; numeric cells and license plate identifiers styled in monospaced/tabular figures.
- Alternating subtle zebra striping (`#FFFFFF` to `#F8FAFC`) on complex inventory and labor logs.

### Checkboxes & Technical Checklists
- Square dimensions (20x20px), radius `rounded`, border 1.5px `#64748B`.
- Checked state: Solid `#2563EB` with crisp white checkmark SVG.
- Specialized inspection tri-state button group: [Pass / Fail / N/A] for digital vehicle inspections (DVI).