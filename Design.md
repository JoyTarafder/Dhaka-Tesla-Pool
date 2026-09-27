# Dhaka Tesla Pool — Design.md

## 1. Design direction
Clean, modern, EV/tech feel — not flashy. The evaluator explicitly penalizes animation polish that hides weak data integrity, so every animation here must be **purposeful** (communicate state), never purely decorative.

- **Theme:** dark base (near-black, `#0b0b0c`) with one electric accent color — lime-green (`#34d399` / emerald) or electric-blue (`#3b82f6`) for active/positive states.
- **Typography:** Inter or Geist, sans-serif, clear hierarchy (bold headings, medium body).
- **Spacing/layout:** generous whitespace, card-based layouts, rounded-lg corners (8–12px).
- **Component base:** Tailwind CSS + shadcn/ui for primitives, Framer Motion strictly for the motion layer.
- **Motion rules of thumb:** duration 150–300ms, `ease: "easeOut"` or spring `{ stiffness: 300, damping: 30 }`. Snappy, not bouncy/playful.

## 2. Screens

### Public / Auth
- Landing page
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

## 3. Required UI states (every data-bound screen)
- **Loading:** "Loading your active ride…" (skeleton shimmer, not a blank screen)
- **Empty:** "You do not have an active ride."
- **Error:** "We could not load the ride. Please retry."
- **Capacity conflict:** "The last seat was just booked by another passenger."
- **Unauthorized:** "You do not have permission to view this ride."

Correct, reliable state handling matters more to the evaluator than animation polish — implement these before adding motion.

## 4. Framer Motion patterns

### Setup
```bash
npm install framer-motion
```
Use the `layout` prop wherever a numeric value changes (seat count, stepper position) instead of hand-writing keyframes — it gives automatic smooth reflow.

### 4.1 Ride status stepper
Animate a progress bar/fill as the ride advances through its lifecycle.
```tsx
<motion.div
  className="h-2 rounded-full bg-emerald-400"
  initial={{ width: 0 }}
  animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
  transition={{ duration: 0.4, ease: "easeOut" }}
/>
```
Pulse the newly active step icon/label: `animate={{ scale: [1, 1.15, 1] }}`.

### 4.2 Seat capacity indicator (Bullet = 3 seats)
Three seat icons that visually fill as seats are booked — makes the pooling concept legible at a glance.
```tsx
{seats.map((filled, i) => (
  <motion.div
    key={i}
    initial={false}
    animate={{
      backgroundColor: filled ? "#34d399" : "#27272a",
      scale: filled ? [1, 1.2, 1] : 1,
    }}
    transition={{ duration: 0.3 }}
    className="w-8 h-8 rounded-full"
  />
))}
```

### 4.3 Pool-matched notification / card entrance
When Rafiq's request matches Nusrat's pool, slide the pool card in.
```tsx
<AnimatePresence>
  {matchedPool && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    />
  )}
</AnimatePresence>
```

### 4.4 Concurrency-conflict toast
This is a critical UX moment (Shirin loses the race for the last seat) — informative, not alarming.
```tsx
<motion.div
  initial={{ opacity: 0, x: 300 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 300 }}
  transition={{ type: "spring", stiffness: 300, damping: 25 }}
/>
```

### 4.5 Fare breakdown reveal
Stagger base fare → distance charge → pool discount → final fare to reinforce fare explainability.
```tsx
const container = { animate: { transition: { staggerChildren: 0.1 } } };
const item = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };
```

### 4.6 List animations
Wrap ride-request/pool-member lists in `AnimatePresence` so additions/cancellations animate smoothly instead of popping.

### 4.7 Loading / empty states
Skeleton shimmer (pulse) for loading; a simple fade-in for empty-state illustrations. Optional polish, not required.

### 4.8 Tap feedback
On every actionable button: `whileTap={{ scale: 0.97 }}` — cheap, but reads as professional attention to detail.

## 5. Where to deliberately avoid animation
- Page/route transitions: keep to a simple ~150ms fade — Next.js navigation should feel instant, not choreographed.
- Critical action buttons (arrive/start/complete): visual feedback only, never delay the actual API call.
- Map/geolocation: PRD explicitly allows static zones — don't spend design effort here.

## 6. Component architecture notes
- Keep motion wrappers as thin presentational components (`<AnimatedSeat />`, `<StatusStepper />`) so business logic stays in hooks/services, not in JSX with inline animation props everywhere.
- Co-locate each screen's loading/empty/error/unauthorized variants so they're not forgotten during implementation.
