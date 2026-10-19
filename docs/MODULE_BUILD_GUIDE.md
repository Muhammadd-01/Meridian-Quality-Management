# Module Build Guide

How the ~200 pages added to match the DreamsCore reference
(https://dreamscore.dreamstechnologies.com/tailwind/traffic-overview.html) are built.
Several build sessions work **in this same folder at the same time**, so the file
ownership rules below are strict.

## Architecture (already in place)

| Piece | File | Notes |
| --- | --- | --- |
| Page catalogue | `src/modules/catalog.js` | Every new page: path, label, icon, component file, `blurb` (scope). Drives routes, sidebar, Explore menu, page bar, search. **Frozen.** |
| Routes | `src/modules/index.js` | Lazily loads `src/modules/<file>.jsx` for each catalogue page. `bare: true` pages render without the app shell. **Frozen.** |
| Module collections | `src/modules/<group>/entities.js` | `export const ENTITIES = { … }` — same shape as `src/data/entities.js`. Merged into the main registry automatically, so global search, audit log, notifications and import/export work with no extra code. |
| Seed data | `src/modules/<group>/data.js` | Demo records, each with `isDemo: true`. Must not import `src/data/entities.js` (circular). |
| Pages | `src/modules/<group>/pages/**.jsx` | Each starts as a placeholder (`<PagePending />`). Replace the placeholder's body; keep the file name and default export. |

### Shared kits (`src/components/module/`, **frozen** — wrap or copy into your folder if you need something different)

- **`ModuleListPage`** — full record page from a registered entity: KPI cards, search (+ `?q=`), tabs, filters,
  sortable/paginated table or card grid, view/add/edit/delete, bulk delete, duplicate check (`dedupeKeys`),
  import/export, Quick Create (`?action=new`). Props documented at the top of the file.
  Reference implementation: `src/modules/commerce/pages/Customers.jsx` + `src/modules/commerce/entities.js`.
- **`DashboardKit`** — `DashboardHero`, `KpiGrid` (StatCard + colour-coded sparkline), `Panel`, `BarList`,
  `TrendChart` (area/bar/line), `DonutChart`, `MiniTable`, `ToneBadge`, `DemoNotice`, `CHART_COLORS`, `TONES`.
- **`ReportView`** — standalone report page from a definition `{ id, module, title, description, formula, entities, dateField, build }`.
  Reference implementation: `src/modules/platform/pages/reports/LeadConversionReport.jsx`.
- **`useCollections(['a','b'])`** (`src/hooks/useCollections.js`) — live read of several collections; `useCollection(type)` for read/write of one.
- Existing UI: `PageHeader`, `StatCard`, `StatusBadge`, `Modal`, `ConfirmDialog`, `DataTable`, `Pagination`, `SearchInput`,
  `FilterDropdown`, `ProgressBar`, `EmptyState`, `useToast`, `DataTransferActions`, `useQuickAction`, `useSearch`, `useSort`, `usePagination`.

## File ownership (parallel sessions)

| Group | Owns | Pages |
| --- | --- | --- |
| commerce | `src/modules/commerce/**` | Ecommerce + BI dashboards and pages, Management (Customers ✔ example, Invoices, Payments), Sales & Ecommerce reports |
| finance | `src/modules/finance/**` | Finance, Accounting, Banking, Crypto dashboards and pages |
| logistics | `src/modules/logistics/**` | Logistics, Real Estate, Travel dashboards and pages, Inventory & Logistics reports |
| hospitality | `src/modules/hospitality/**` | Hotel, Restaurant POS, Food Delivery, School, SEO dashboards and pages |
| people | `src/modules/people/**` | Hospital, HRM, AI Analytics dashboards and pages, Users & Access, HRM + Helpdesk reports |
| apps | `src/modules/apps/**` | Chat, AI Chat, Voice/Video Call, Email, File Manager, Kanban, Notes, To Do, Workflow & Approvals |
| platform | `src/modules/platform/**` **and the app shell** (`src/components/layout/*`, `src/styles/index.css`) | Layout variants, account/auth/error pages, Documentation/FAQ/Changelog, CRM/PM/General reports, Report Builder, Activity Log |
| uikit | `src/modules/uikit/**` | UI Elements: base UI, forms, tables, charts, icons |

Rules:
1. Edit **only** files inside your own folder(s). Everything else (catalogue, router, navigation, kits, `src/features/*`,
   `src/data/*`, `tailwind.config.js`, `package.json`) is read-only for you. Need a shared change? Note it in your status file.
2. Add any internal components, hooks or data files you need inside your folder.
3. Do **not** commit, stash, reset or switch branches. Do not run `npm install`.
4. Build into your own scratch folder so builds don't collide: `npx vite build --outDir <your scratchpad>/dist --emptyOutDir`.
   Keep your files compiling at all times — a syntax error breaks the other sessions' builds too.
5. Write progress and anything left over to `docs/module-status/<group>.md` (your file only).

## Quality bar (every page)

- Same design system: `.card`, `.btn-*`, `.badge-*`, `.form-*`, `.data-table`, `gray-*` / `primary-*` / `accent-*` /
  `success|warning|danger|info` tokens, `font-display` headings. No hard-coded hex colours for surfaces or text, so
  **light and dark mode both work** (Theme menu in the header).
- Pages are **working**, not static mock-ups: records live in localStorage through registered entities; create/edit/delete,
  status changes and filters actually work; figures are computed from records. Anything illustrative (a chart with no
  underlying records, a simulated live feed) is labelled with `DemoNotice` or a "Demo" badge. Never present simulated data as real.
- Things that need a backend (sending email, real calls, payments, AI models) work locally and say so plainly
  (e.g. "messages are stored in this browser"), using real browser APIs where they exist (camera preview via `getUserMedia`).
- Domain data should feel real and relevant (Pakistani and international names, PKR amounts where money is involved).
- Forms: every input has an associated `<label htmlFor>`; submit buttons are `type="submit" form="<form id>"`; validation messages
  are linked with `aria-describedby`.
- Motion: reuse `animate-rise-in`, `card-lift`, `menu-panel`, `animate-fade-in`; no new keyframes needed.
- Responsive: no horizontal page overflow at 360px (reload after resizing the viewport).

## Verify before reporting done

1. `npx vite build --outDir <scratchpad>/dist --emptyOutDir` passes.
2. Start a preview (`preview_start` with `meridian-dev`), open each of your routes in light and dark mode: no console errors,
   create/edit/delete works, filters work, nothing overflows at 360px.
3. Update `docs/module-status/<group>.md`: pages done, collections added (key names), anything not done and why.
