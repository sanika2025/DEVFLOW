# Dark Mode UI Color System

This document defines the dark-mode color system for the Life Manager platform.

The dark theme should feel **premium, calm, readable, and consistent** while preserving the existing visual identity based on Indigo, Blue, Emerald, Violet, Slate, and Zinc.

---

## 1. Dark Mode Design Principles

- Use **Zinc/Slate** for application surfaces and backgrounds.
- Use **Indigo** as the primary interactive/accent color.
- Use **Blue** for informational and secondary actions.
- Use **Emerald** for success, money-positive states, and completed items.
- Use **Amber** for warnings and upcoming items.
- Use **Red/Rose** only for destructive, overdue, or error states.
- Avoid pure black for large surfaces; use `#020617`, `#0f172a`, `#18181b`, or `#1e1e1e`.
- Avoid pure white text except for primary headings and important values.
- Preserve the existing light-mode component structure; only change colors.
- Do not introduce new colors unless absolutely necessary.

---

# 2. Core Dark Theme Palette

| Purpose | Color |
|---|---|
| App background | `#020617` |
| Primary surface | `#0f172a` |
| Secondary surface | `#1e1e1e` |
| Elevated surface | `#1f2937` |
| Input background | `#1e293b` |
| Primary text | `#f8fafc` |
| Secondary text | `#cbd5e1` |
| Muted text | `#94a3b8` |
| Disabled text | `#64748b` |
| Border | `#334155` |
| Subtle border | `#1e293b` |
| Primary accent | `#6366f1` |
| Primary accent hover | `#4f46e5` |
| Secondary blue | `#3b82f6` |
| Success | `#10b981` |
| Success light | `#34d399` |
| Warning | `#f59e0b` |
| Error | `#ef4444` |
| Rose error | `#f43f5e` |

---

# 3. Application Background

Use:

```text
Background: #020617
```

For large content areas, a subtle gradient is allowed:

```text
from-slate-900
to-indigo-900
```

Recommended:

```css
background: linear-gradient(
  135deg,
  #020617 0%,
  #0f172a 55%,
  #111827 100%
);
```

Do not use bright gradients in dark mode.

---

# 4. Sidebar

### Sidebar

```text
Background: #0f172a
Border: #1e293b
```

### Sidebar text

```text
Default: #94a3b8
Hover: #cbd5e1
Active: #ffffff
```

### Active navigation item

```text
Background: rgba(99, 102, 241, 0.15)
Text: #a78bfa
Icon: #818cf8
```

Use:

```text
bg-indigo-900/30
text-indigo-300
```

if Tailwind opacity utilities are available.

---

# 5. Header

```text
Background: #0f172a
Border: #1e293b
```

Primary heading:

```text
#f8fafc
```

Secondary text:

```text
#94a3b8
```

Search box:

```text
Background: #1e293b
Border: #334155
Text: #f8fafc
Placeholder: #64748b
```

---

# 6. Cards

Default card:

```text
Background: #0f172a
Border: #1e293b
```

Elevated card:

```text
Background: #1e293b
Border: #334155
```

Hover:

```text
Border: #4f46e5
Background: #111827
```

Recommended shadow:

```text
rgba(0, 0, 0, 0.2)
```

Do not use heavy white shadows.

---

# 7. Primary Buttons

Primary action:

```text
Background: #4f46e5
Text: #ffffff
```

Hover:

```text
Background: #6366f1
```

Pressed:

```text
Background: #4338ca
```

Use for:

- Add Task
- Add Routine
- Add Shift
- Save
- Create
- Start
- Continue

---

# 8. Secondary Buttons

```text
Background: #1e293b
Border: #334155
Text: #cbd5e1
```

Hover:

```text
Background: #334155
Text: #ffffff
```

---

# 9. Success / Money

Use Emerald.

Primary:

```text
#10b981
```

Light:

```text
#34d399
```

Dark surface:

```text
rgba(16, 185, 129, 0.12)
```

Text:

```text
#34d399
```

Use for:

- Completed tasks
- Completed routines
- Income
- Positive balance
- Savings
- Successful actions
- Healthy progress

Example:

```text
bg-emerald-900/30
text-emerald-300
border-emerald-700
```

---

# 10. Warning

Use Amber:

```text
#f59e0b
```

Dark background:

```text
rgba(245, 158, 11, 0.12)
```

Use for:

- Upcoming deadlines
- Pending items
- Schedule conflicts
- Approaching home visits
- Financial warnings

Example:

```text
bg-amber-900/30
text-amber-300
border-amber-700
```

---

# 11. Error / Overdue / Destructive

Primary:

```text
#ef4444
```

Alternative:

```text
#f43f5e
```

Dark background:

```text
rgba(239, 68, 68, 0.12)
```

Use for:

- Overdue tasks
- Failed actions
- Delete confirmation
- Validation errors

Never use red for normal informational content.

---

# 12. Typography

### Primary heading

```text
#f8fafc
```

### Secondary heading

```text
#e2e8f0
```

### Body text

```text
#cbd5e1
```

### Secondary text

```text
#94a3b8
```

### Placeholder

```text
#64748b
```

### Disabled

```text
#475569
```

Avoid using `#ffffff` for every text element.

---

# 13. Inputs

Default:

```text
Background: #1e293b
Border: #334155
Text: #f8fafc
Placeholder: #64748b
```

Focus:

```text
Border: #6366f1
Ring: rgba(99, 102, 241, 0.3)
```

Error:

```text
Border: #ef4444
```

---

# 14. Tables / Lists

Table background:

```text
#0f172a
```

Row:

```text
#0f172a
```

Row hover:

```text
#1e293b
```

Divider:

```text
#1e293b
```

Primary text:

```text
#f8fafc
```

Secondary text:

```text
#94a3b8
```

---

# 15. Status Colors

| Status | Background | Text |
|---|---|---|
| Completed | `rgba(16,185,129,.12)` | `#34d399` |
| Active | `rgba(99,102,241,.15)` | `#a78bfa` |
| Pending | `rgba(245,158,11,.12)` | `#fbbf24` |
| Overdue | `rgba(239,68,68,.12)` | `#f87171` |
| Disabled | `#1e293b` | `#64748b` |
| Info | `rgba(59,130,246,.12)` | `#60a5fa` |

---

# 16. Module-Specific Colors

## Money

Primary:

```text
#10b981
```

Income:

```text
#34d399
```

Expense:

```text
#f43f5e
```

Budget warning:

```text
#f59e0b
```

Balance card:

```text
from-emerald-900
to-slate-900
```

---

## Shifts

Primary:

```text
#6366f1
```

Night:

```text
#8b5cf6
```

Morning:

```text
#f59e0b
```

Evening:

```text
#f97316
```

Day Off:

```text
#10b981
```

---

## Home Visits

Primary:

```text
#f59e0b
```

Upcoming:

```text
#fbbf24
```

Completed:

```text
#10b981
```

---

## Routine

Primary:

```text
#3b82f6
```

Completed:

```text
#10b981
```

Pending:

```text
#f59e0b
```

Missed:

```text
#ef4444
```

---

## Tasks

Primary:

```text
#6366f1
```

High priority:

```text
#ef4444
```

Medium priority:

```text
#f59e0b
```

Low priority:

```text
#10b981
```

Completed:

```text
#10b981
```

---

# 17. Charts

Use the existing platform colors.

Recommended sequence:

```text
#6366f1
#3b82f6
#10b981
#8b5cf6
#f59e0b
#f43f5e
```

Chart background:

```text
transparent
```

Grid:

```text
rgba(148, 163, 184, 0.12)
```

Axis labels:

```text
#64748b
```

Tooltip:

```text
#0f172a
border: #334155
text: #f8fafc
```

Do not use bright chart backgrounds.

---

# 18. Modals / Dialogs

Overlay:

```text
rgba(0, 0, 0, 0.65)
```

Modal:

```text
Background: #0f172a
Border: #334155
```

Header:

```text
#f8fafc
```

Description:

```text
#94a3b8
```

---

# 19. Dropdowns

```text
Background: #0f172a
Border: #334155
Text: #e2e8f0
```

Hover:

```text
Background: #1e293b
```

Selected:

```text
Background: rgba(99,102,241,0.15)
Text: #a78bfa
```

---

# 20. Scrollbars

Use subtle dark scrollbars.

Track:

```text
#0f172a
```

Thumb:

```text
#334155
```

Hover:

```text
#475569
```

---

# 21. Recommended Tailwind Mapping

Prefer these classes throughout dark mode:

```text
bg-slate-950
bg-slate-900
bg-slate-800
bg-slate-700

text-slate-50
text-slate-100
text-slate-200
text-slate-300
text-slate-400
text-slate-500

border-slate-800
border-slate-700
border-slate-600

bg-indigo-600
bg-indigo-500
text-indigo-300
text-indigo-400

bg-blue-600
text-blue-300

bg-emerald-600
text-emerald-300

bg-amber-600
text-amber-300

bg-red-600
text-red-300

bg-rose-600
text-rose-300
```

---

# 22. Avoid These Patterns

Do NOT:

- Make every card `bg-black`.
- Use pure white backgrounds in dark mode.
- Use pure white text everywhere.
- Replace every color with Indigo.
- Use red for normal notifications.
- Use bright gradients across the entire page.
- Introduce random new colors.
- Change component spacing/layout just because dark mode is enabled.
- Remove visual hierarchy.
- Make borders brighter than the content.
- Use excessive glow effects.

---

# 23. Dark Mode Component Formula

For most components, follow:

```text
Page
  ↓
#020617

Header / Sidebar
  ↓
#0f172a

Card
  ↓
#0f172a

Elevated Card
  ↓
#1e293b

Border
  ↓
#334155

Heading
  ↓
#f8fafc

Body
  ↓
#cbd5e1

Muted
  ↓
#94a3b8

Primary Action
  ↓
#4f46e5

Success
  ↓
#10b981

Warning
  ↓
#f59e0b

Error
  ↓
#ef4444
```

---

# 24. Overall Visual Direction

The final dark theme should feel:

**Dark + Clean + Premium + Calm + Professional**

The existing Life Manager identity must remain recognizable.

The dark mode should look like the same application viewed through a dark visual system — **not like a completely different application.**
