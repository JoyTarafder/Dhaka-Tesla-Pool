# Dhaka Tesla Pool — Design.md

> Reference style: **VoltPeak** hero (light lavender-blue gradient, glass cards, bold headline, black pill buttons, floating callouts).
> Scope of this update: **visual design only**. Screens, required UI states, motion behavior and component architecture (business logic in hooks/services) are unchanged.

## 1. Design direction
Premium, calm, EV/tech feel. Light and airy, with depth from soft gradients and glass surfaces, never flashy. The evaluator penalizes animation polish that hides weak data integrity, so every animation must be **purposeful** (communicates state), never purely decorative.

### 1.1 Design decisions (locked)
| # | Element | Decision |
|---|---------|----------|
| 1 | Theme | **Light**, soft lavender-blue gradient page background |
| 2 | Primary text | Near-black `#0b0b0c` |
| 3 | Secondary text | Slate `#4b5160` |
| 4 | Accent (active/positive) | Electric blue `#3b82f6` (matches the charger's blue rim glow) |
| 5 | Success | Emerald `#10b981` (completed, seat confirmed) |
| 6 | Danger / conflict | Rose `#e11d48`, used sparingly |
| 7 | Primary button | **Black pill**, uppercase, small text, wide tracking |
| 8 | Secondary button | White/glass pill with 1px border |
| 9 | Cards | Glass: white 40–55% + `backdrop-blur-xl`, 1px white/60 border, radius 16px |
| 10 | Corner radius | Cards 16px, inputs 12px, buttons full pill |
| 11 | Headings font | **Inter Tight** (or Geist), bold, tight tracking (`-0.03em`) |
| 12 | Body font | **Inter**, regular/medium, 15–16px |
| 13 | Nav labels | Uppercase, 12px, tracking `0.08em` |
| 14 | Shadows | Soft, large blur, low opacity (never hard black) |
| 15 | Layout | 12-col grid, max width 1200px, generous whitespace |
| 16 | Component base | Tailwind CSS + shadcn/ui primitives, Framer Motion for motion only |

### 1.2 Design tokens
```css
:root {
  --bg-from: #eef0fb;
  --bg-to: #b9c0f2;
  --ink: #0b0b0c;
  --ink-muted: #4b5160;
  --accent: #3b82f6;
  --accent-soft: #dbeafe;
  --success: #10b981;
  --danger: #e11d48;
  --glass: rgba(255, 255, 255, 0.5);
  --glass-border: rgba(255, 255, 255, 0.7);
  --seat-empty: #d4d8ee;
  --shadow-card: 0 10px 40px -12px rgba(59, 70, 140, 0.25);
}
body { background: linear-gradient(135deg, var(--bg-from), var(--bg-to)); color: var(--ink); }
.glass { background: var(--glass); border: 1px solid var(--glass-border);
         backdrop-filter: blur(16px); border-radius: 16px; box-shadow: var(--shadow-card); }
```
Map these to Tailwind theme colors (`accent`, `ink`, `glass`) so no snippet uses hardcoded hex.

### 1.3 Typography scale
| Use | Size / weight |
|-----|---------------|
| Hero headline | 56–72px / 700, line-height 1.05 |
| Page title | 32px / 700 |
| Section title | 20px / 600 |
| Body | 15–16px / 400–500 |
| Caption, nav, buttons | 12–13px / 500, uppercase, tracking `0.08em` |

## 2. Screens

### Public / Auth
- **Landing page** (VoltPeak-style hero, see 2.1)
- Sign up
- Sign in

### Passenger
- Passenger dashboard
- New ride request form (pickup, destination, seat count)
- Fare estimate view
- Current ride / status tracker
- Ride details
- Ride history
- Cancel confirmation

### Driver
- Driver dashboard
- Online/offline toggle
- Available/relevant pool list
- Active pool view (passengers + seats)
- Arrival / start / complete controls
- Driver ride history

### 2.1 Landing page layout (selected points)
| Area | Choice |
|------|--------|
| Navbar | Logo left · centered links (HOME, HOW IT WORKS, FARES, SUPPORT) · right: `LOG IN` text link + black pill `SIGN UP` |
| Headline | Left column, 2 lines, bold: "Share the Ride. Split the Fare." |
| Sub text | 2–3 lines, muted slate, max width 420px |
| Primary CTA | Black pill `REQUEST A RIDE` |
| Hero visual | Right/center: Tesla (Bullet) image with soft floor shadow and a thin arc ring behind it |
| Floating callouts | 2–3 glass cards linked to the car by thin lines with dot markers: **Seat Pooling** (3 seats), **Fare Breakdown** (pool discount), **Live Status** |
| Social proof | Bottom right: overlapping avatar stack + large stat (e.g. "Riders pooling daily") |
| Background | Lavender-blue gradient, no dark sections |

### 2.2 App shell (dashboards)
- Top bar: logo, role-based nav labels (uppercase), profile avatar, black pill primary action.
- Content on glass cards over the gradient; one primary action per card.
- Passenger status tracker and driver active pool are the visual focus of each dashboard (largest card, top of page).
- Mobile: single column, sticky bottom action bar for the primary action.

## 3. Required UI states (every data-bound screen)
- **Loading:** "Loading your active ride…" (skeleton shimmer on glass card, not a blank screen)
- **Empty:** "You do not have an active ride."
- **Error:** "We could not load the ride. Please retry."
- **Capacity conflict:** "The last seat was just booked by another passenger."
- **Unauthorized:** "You do not have permission to view this ride."

Correct, reliable state handling matters more to the evaluator than animation polish. Implement these before adding motion.

| State | Visual treatment |
|-------|------------------|
| Loading | Skeleton blocks, `--seat-empty` tone, soft pulse |
| Empty | Glass card, small line icon, muted text, black pill CTA (e.g. "Request a ride") |
| Error | Glass card, rose icon, `Retry` secondary pill |
| Capacity conflict | Toast with rose accent bar, informative not alarming, offers "Find another pool" |
| Unauthorized | Glass card, lock icon, "Back to dashboard" secondary pill |

## 4. Framer Motion patterns

### Setup
```bash
npm install framer-motion
```
Wrap the app once so users with reduced-motion settings are respected:
```tsx
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```
Motion rules: duration 150–300ms, `ease: "easeOut"` or spring `{ stiffness: 300, damping: 30 }`. Snappy, not bouncy.
Use `layout` on list items/containers for smooth reflow. For changing numbers (seat count, fare), key the value inside `AnimatePresence` for a quick fade/slide swap.

### 4.1 Ride status stepper
Progress fill in accent blue on a light track.
```tsx
<div className="h-2 rounded-full bg-seat-empty">
  <motion.div
    className="h-2 rounded-full bg-accent"
    initial={{ width: 0 }}
    animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  />
</div>
```
Pulse the newly active step: `animate={{ scale: [1, 1.15, 1] }}`.

### 4.2 Seat capacity indicator (Bullet = 3 seats)
Three seat icons that fill as seats are booked.
```tsx
{seats.map((filled, i) => (
  <motion.div
    key={i}
    initial={false}
    animate={{
      backgroundColor: filled ? "var(--accent)" : "var(--seat-empty)",
      scale: filled ? [1, 1.2, 1] : 1,
    }}
    transition={{ duration: 0.3 }}
    className="w-8 h-8 rounded-full"
  />
))}
```

### 4.3 Pool-matched notification / card entrance
When Rafiq's request matches Nusrat's pool, slide the glass pool card in.
```tsx
<AnimatePresence>
  {matchedPool && (
    <motion.div
      className="glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    />
  )}
</AnimatePresence>
```

### 4.4 Concurrency-conflict toast
Critical UX moment (Shirin loses the race for the last seat). Informative, not alarming.
```tsx
<motion.div
  className="glass border-l-4 border-l-danger"
  initial={{ opacity: 0, x: 300 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 300 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>
```

### 4.5 Fare breakdown reveal
Stagger base fare → distance charge → pool discount → final fare.
```tsx
const container = { animate: { transition: { staggerChildren: 0.1 } } };
const item = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };
```
Final fare row: larger, bold, accent-colored amount; pool discount row in success green.

### 4.6 List animations
Wrap ride-request/pool-member lists in `AnimatePresence` so additions/cancellations animate instead of popping.

### 4.7 Loading / empty states
Skeleton pulse for loading; simple fade-in for empty-state illustrations. Optional polish, not required.

### 4.8 Tap feedback
On every actionable button: `whileTap={{ scale: 0.97 }}`.

### 4.9 Landing hero (visual only)
- Headline and CTA: single fade-up on load (`y: 16 → 0`, 300ms).
- Floating callout cards: fade-in with 100ms stagger; connector lines draw with `pathLength 0 → 1` once. No looping motion.

## 5. Where to deliberately avoid animation
- Page/route transitions: simple ~150ms fade, navigation should feel instant.
- Critical action buttons (arrive/start/complete): visual feedback only, never delay the actual API call.
- Map/geolocation: PRD allows static zones. Don't spend design effort here.
- No looping or parallax effects on data screens.

## 6. Component architecture notes
- Keep motion wrappers as thin presentational components (`<AnimatedSeat />`, `<StatusStepper />`, `<GlassCard />`) so business logic stays in hooks/services, not in JSX with inline animation props everywhere.
- Co-locate each screen's loading/empty/error/unauthorized variants so they're not forgotten.
- Unauthorized and capacity-conflict messages only reflect what the API returns (403 on ride access, atomic seat check on booking). The design never decides these states itself.
- Shared UI primitives: `GlassCard`, `PillButton` (primary/secondary), `NavBar`, `Callout` (glass card + connector line), `StatBadge` (avatar stack + number).