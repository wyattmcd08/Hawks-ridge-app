# Hawks Ridge Finance

A premium, mobile-first earnings tracker PWA for hourly work at Hawks Ridge.
Dark, glassmorphic, and built to feel rewarding to open after every shift.

## Features

- **Dashboard** — estimated paycheck, weekly earnings, hours, total saved, a
  live "earned today" counter, an earnings trend chart, and animated savings
  goal rings.
- **Shift tracking** — quick add with a 5:45 AM default start, editable
  clock-out, unpaid break, automatic hours, editable hourly rate, and notes.
- **Pay calculations** — gross pay plus estimated federal, Georgia state, and
  FICA withholding, a 5% auto-savings deduction, and take-home, with a stacked
  breakdown bar.
- **Analytics** — daily / weekly / monthly earnings, hours-worked trends,
  cumulative savings growth, average hourly, and projected yearly earnings.
- **Goals** — savings goals (truck, college, detailing kit, etc.) with animated
  progress and estimated completion dates based on your average savings.
- **Live session** — clock in and watch a real-time timer and earnings counter
  with motivational visuals; clocking out logs the shift automatically.
- **PWA** — installable, offline-capable, with self-hosted fonts and a floating
  bottom navigation bar.

## Tech

React + TypeScript · Tailwind CSS v4 · Framer Motion · Recharts · Zustand
(localStorage persistence) · Vite + vite-plugin-pwa.

## Develop

```bash
npm install
npm run dev        # start dev server (regenerates PWA icons first)
npm run build      # type-check + production build
npm run preview    # preview the production build
npm run gen-icons  # regenerate PWA icons from the embedded emblem
```

All data is stored locally on device via `localStorage`. Tax figures are
withholding **estimates** for a single filer in Georgia, not financial advice.

> Note: the app ships with a generated hawk-and-ridge emblem as the logo. Drop a
> branded asset into `public/` and swap `src/components/Logo.tsx` to use it if
> you have the official Hawks Ridge mark.
