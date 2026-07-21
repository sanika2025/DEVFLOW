# Dark Mode UI Guidelines

This document defines the color mappings and implementation logic for
Dark Mode across the application. The platform uses **Indigo** as its
primary brand color with a premium dark theme built on **Zinc**
neutrals.

## 1. Base Colors

  Light Mode               Dark Mode
  ------------------------ -----------
  White `#FFFFFF`          `#09090B`
  Card `#FFFFFF`           `#18181B`
  Elevated `#F8FAFC`       `#27272A`
  Primary Text `#0F172A`   `#FAFAFA`
  Secondary `#64748B`      `#A1A1AA`
  Muted `#94A3B8`          `#71717A`
  Border `#E2E8F0`         `#3F3F46`

## 2. Primary (Indigo)

  Light       Dark
  ----------- -----------
  `#EEF2FF`   `#1E1B4B`
  `#E0E7FF`   `#312E81`
  `#C7D2FE`   `#4338CA`
  `#6366F1`   `#818CF8`
  `#4F46E5`   `#6366F1`
  `#4338CA`   `#818CF8`
  `#312E81`   `#A5B4FC`

## 3. Success (Emerald)

  Light       Dark
  ----------- -----------
  `#ECFDF5`   `#052E16`
  `#D1FAE5`   `#064E3B`
  `#A7F3D0`   `#166534`
  `#047857`   `#6EE7B7`
  `#10B981`   `#34D399`

## 4. Error (Rose)

  Light       Dark
  ----------- -----------
  `#FFF1F2`   `#4C0519`
  `#FFE4E6`   `#881337`
  `#FECDD3`   `#BE123C`
  `#E11D48`   `#FDA4AF`
  `#F43F5E`   `#FB7185`

## 5. Warning (Amber)

  Light       Dark
  ----------- -----------
  `#FFFBEB`   `#451A03`
  `#FEF3C7`   `#78350F`
  `#FDE68A`   `#92400E`
  `#B45309`   `#FCD34D`

## 6. Tailwind Mapping

``` text
bg-white        -> dark:bg-zinc-900
bg-slate-50     -> dark:bg-zinc-950
text-slate-900  -> dark:text-zinc-50
text-slate-500  -> dark:text-zinc-400
border-slate-200-> dark:border-zinc-800

bg-indigo-50    -> dark:bg-indigo-950
bg-indigo-100   -> dark:bg-indigo-900
bg-indigo-200   -> dark:bg-indigo-800
bg-indigo-400   -> dark:bg-indigo-700
bg-indigo-500   -> dark:bg-indigo-600
bg-indigo-600   -> dark:bg-indigo-500

bg-emerald-50   -> dark:bg-emerald-950
bg-rose-50      -> dark:bg-rose-950
bg-amber-50     -> dark:bg-amber-950
```

## 7. Components

-   **App Background:** `bg-slate-50` → `dark:bg-zinc-950`
-   **Cards:** `bg-white border-slate-200` →
    `dark:bg-zinc-900 dark:border-zinc-800`
-   **Primary Button:** `bg-indigo-600 hover:bg-indigo-700` →
    `dark:bg-indigo-500 dark:hover:bg-indigo-400`
-   **Secondary Button:** `bg-white border-slate-300` →
    `dark:bg-zinc-800 dark:border-zinc-700`
-   **Inputs:** `bg-white border-slate-300` →
    `dark:bg-zinc-900 dark:border-zinc-700`
-   **Code Blocks:** `bg-slate-800` →
    `dark:bg-black dark:border-zinc-800`
-   **Progress:** Track `dark:bg-zinc-800`; Progress `bg-emerald-500`

## 8. Implementation Strategy

-   Use Tailwind `dark:` classes only.
-   Preserve light mode defaults.
-   Use Zinc for neutral surfaces.
-   Use Indigo for branding and primary actions.
-   Use Emerald for success, Rose for errors, Amber for warnings.
-   Follow WCAG AA contrast ratios.
-   Avoid hardcoded colors; prefer centralized design tokens.
