# HerPace Design Tokens

## Corner Radius System

### Tier 1: Small Interactive Elements → `rounded-md` (6px)
**Use for:**
- Badges (distance, duration, zone/RPE, status badges)
- Buttons within larger containers
- SegmentedControl/Tab indicators
- Form inputs
- Small action buttons (menu, icons)

**Examples:**
- CalendarDay info badges
- WorkoutSessionCard metric badges
- TabsTrigger buttons
- SegmentedControl sliding indicator
- Menu buttons

### Tier 2: Standard Containers → `rounded-lg` (8px)
**Use for:**
- All cards (including main session card)
- Day cards
- Summary boxes
- Accordion sections
- SegmentedControl/TabsList containers
- Phase boxes
- Inner content sections
- Week summary bar

**Examples:**
- WorkoutSessionCard main card
- CalendarDay card container
- Week summary bar
- Phase box in WorkoutSessionCard
- Accordion section backgrounds
- TabsList container
- SegmentedControl container

### Special: Full Circular → `rounded-full`
**Use for:**
- Circular avatars
- Step number indicators
- Icon-only circular buttons
- Badges with circular design

**Examples:**
- Step number circles in workout instructions

---

## Color System

### Background Colors
- `--background`: `#FDFBF7` (Main app background)
- `--card`: `#FCF9F3` (Card backgrounds)
- `--muted`: `#F3F0E7` (Muted sections, rest days)

### Interactive States
- Hover: `#EEEBDE` (CalendarDay hover, SegmentedControl/TabsList background)
- Active/Selected: `#FDFBF7` (Active tab indicator, selected day)

### Text Colors
- `--foreground`: `#3D3826` (Primary text)
- `--muted-foreground`: `#85837D` (Secondary text)
- Badge text: `#696863` (Tertiary text)

### Borders
- `--border`: `#EBE8E2` (Standard borders)

---

## Typography

### Font Families
- **Body**: Manrope (UI text, buttons, labels)
- **Display**: Petrona (Headings, session names, calendar day numbers)

### Font Sizes
- `text-xs`: 12px (Badge text, labels)
- `text-sm`: 14px (Buttons, tabs, body text)
- `text-base`: 16px (Session titles in CalendarDay, "Session Details")
- `text-lg`: 18px (Accordion triggers)
- `text-xl`: 20px (Session card titles, week/month date ranges)
- `text-[32px]`: 32px (Page headings like "Training Plan")

### Font Weights
- `font-normal`: 400 (Regular - default for most UI)
- `font-medium`: 500 (Medium - reserved for emphasis)
- `font-semibold`: 600 (Semi-bold - headings)

---

## Spacing

### Padding Scale
- `p-1`: 4px (SegmentedControl/TabsList container padding)
- `p-2`: 8px (Small elements)
- `p-3`: 12px (CalendarDay card, buttons)
- `p-4`: 16px (Standard card padding)

### Gap Scale
- `gap-0.5`: 2px (Heart icons)
- `gap-1`: 4px (SegmentedControl gap)
- `gap-1.5`: 6px (Badge icon-text gap)
- `gap-2`: 8px (Standard spacing)
- `gap-3`: 12px (Section spacing)
- `gap-4`: 16px (Large section spacing)

---

## Component Patterns

### SegmentedControl / Tabs Pattern
```tsx
Container: bg-[#EEEBDE] p-1 rounded-lg
Indicator: bg-[#FDFBF7] shadow-sm rounded-md
Buttons: text-foreground text-sm font-normal px-3 py-2 rounded-md
Animation: transition-all duration-300 ease-in-out
```

### Badge Pattern
```tsx
Container: bg-[#FDFBF7] border border-[#ebe8e2] rounded-md px-1.5 py-0.5
Icon: h-3.5 w-3.5 text-[#696863]
Text: text-xs text-[#696863] font-normal
```

### CalendarDay Pattern
```tsx
Card: bg-muted border border-border rounded-lg p-3
Hover: hover:bg-[#EEEBDE] hover:-translate-y-[4px] hover:scale-[1.01]
Selected: bg-[#EEEBDE] [animation:gentle-float_2s_ease-in-out_infinite]
```

---

## Animation Tokens

### Durations
- Fast: `duration-200` (200ms) - Hover states
- Standard: `duration-300` (300ms) - Tab switching, indicators
- Slow: `2s` - Gentle float animation

### Easing
- Standard: `ease-in-out` - Most transitions
- Hover: `ease-out` - CalendarDay hover

### Transforms
- Hover lift: `translateY(-4px) scale(1.01)`
- Gentle float: See CalendarDay component keyframes

---

## Shadows

- `shadow-sm`: Subtle shadow for active tabs/indicators
- `shadow-[4px_4px_0px_0px_#f3f0e7]`: WorkoutSessionCard shadow (custom)

---

## Best Practices

1. **Always use design tokens** instead of arbitrary values
2. **Maintain tier hierarchy** - smaller nested elements use smaller radius
3. **Keep animations consistent** - use standard durations and easing
4. **Use theme colors** (`text-foreground`, `bg-card`) over hex values when possible
5. **Match component patterns** - SegmentedControl and TabsList should look identical
