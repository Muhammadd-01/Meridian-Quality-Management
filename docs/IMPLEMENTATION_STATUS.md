# Meridian — Implementation Status

Working checklist for the platform enhancement programme. Update it as phases land.

## Architecture facts (verified)

- React 18 + Vite 6 + Tailwind 3 (JavaScript). No backend, no auth server, no database.
- Every record collection lives in the browser's `localStorage`, seeded from `src/data/*`.
  `src/data/entities.js` is the registry of those collections (key, seed, fields, search, dedupe rules).
- `useLocalStorage` now syncs all components using the same key (same tab and other tabs) and feeds the audit log.
- Routes are code-split (`React.lazy`); initial JS dropped from 1.59 MB to ~325 KB.

## Feature matrix

| Area | Status | Notes |
| --- | --- | --- |
| Design system | Done | Lean Six Sigma Consulting palette (2026-10-29): **primary is primrose `#F2E6A2`** (buttons, active nav, selected chips/tabs, tiles, focus halo, checkboxes) with teal `#093F50` ink on it; teal 2 `#145D68` is the `brand` text/icon ink on light surfaces (primrose in dark mode); full teal ramp (`#071A1F` → `#E2EDEC`) as `teal-*`; orange `#F78D00` / rust `#A45B0B` accent; neutrals paper `#F5F3EC`, sage `#DFE7E3`, soft `#C1D2D1`, muted `#627579`, ink `#102C32`; dark mode uses ink/divider surfaces (`#102C32`, `#1F3D44`, `#27434A`). Tokens live in `tailwind.config.js` and the CSS variables at the top of `src/styles/index.css`; chart colours are theme-aware CSS variables in `src/lib/chartColors.js`. Built-in Tailwind hues are mapped onto the palette; stored records with old colour classes are remapped in CSS. |
| Light / Dark / System mode | Done | Header theme menu; saved per browser (`meridian-color-mode`), applied before first paint. Sidebar style (spruce / light) is a separate option; dark mode always uses the dark sidebar. |
| Header | Done | Search pill, Explore mega-menu (all modules + recent pages), Apps launcher, Quick Create, theme, fullscreen, notifications (All / Unread / Alerts, grouped Today / Earlier), profile menu with live task stats. Language switcher and messages from the reference are not included (no translations, no messaging backend). |
| Sidebar | Done | Favourite tiles (pin/unpin from any link, stored locally), collapsible module groups, live local-storage meter, dot-texture background. Page bar under the header shows the title and breadcrumb trail. |
| Motion | Done | Staggered card rise-in, hover lift, button press, menu pop-in, sparkline draw-in, live-dot ping; all disabled by the OS reduced-motion setting and the in-app preference. |
| Global search (Ctrl/⌘+K) | Done | Pages, quick actions, records in this browser. Opens pages with `?q=`. |
| Quick Create menu | Done | Opens existing create forms via `?action=new`. |
| Notifications | Done | Derived from audit log, task deadlines, quotation expiry. Read/unread stored locally. |
| Audit log | Done | Automatic diff of registered collections + import/export events. Local only (500 entries). |
| Import / Export | Done | CSV/XLSX/JSON import with mapping, validation, duplicate skip/update; CSV/XLSX/PDF(print)/JSON export of all/filtered/selected. |
| Traffic Overview | Done (demo / imported data) | Provider interface in `src/services/traffic`. No live analytics or realtime source connected. |
| Dashboard | Done | KPIs from live records with period comparison. "Revenue vs Target" and "Enrollment Trends" are labelled demo series. |
| Reports | Done | 13 reports with formulas, date filters, export. |
| Calendar | Done | Aggregates tasks, activities, deals, quotations, projects + user events. |
| Settings | Done | Profile, preferences, notification toggles, storage + integration status. |
| Leads | Done | Rule-based scoring, duplicate detection, lead → deal conversion. |
| Deals / Pipeline | Done | Won/lost with reason; pipeline filters, drag-and-drop, stage conversion, weighted value. |
| Quotations | Done | Status workflow + history, derived Expired, print/PDF. |
| Tasks / Timesheets | Done | Overdue badges + filter, bulk status/delete, weekly summary, live project lists. |
| Quiz Builder | Done | Answer-key validation, publish guard, short-answer preview. |
| Companies | Done | Related leads/deals/quotations/projects + activity timeline. |
| CRM look | Done | Deals Workspace (`/crm`) has a teal "field notes" hero with the about page's orbit rings and a floating primrose pipeline card, a primrose ticker of top deals (pauses on hover), numbered section kickers, a metric strip, deal cards with hover arrows, palette-coloured stages, board and charts. Every page header uses the teal `PageHeader` brand band (primrose eyebrow and icon tile, orange tab, primrose primary button, glass secondary buttons). Company logo tiles map stored colour classes to palette tones at render time; data is unchanged. |
| Contacts directory | Done | `/crm/contacts`, entity `contacts` (`meridian-contacts`). Seed derived from contact names on demo company and lead records, labelled "Demo". Search, filters, import/export, duplicate check, audit log, Quick Create, related leads/deals and activity/call/email timeline (matched by contact name). |
| Task subtasks & comments | Done | Task detail view (eye icon) on Tasks. Stored on the task record (`subtasks`, `comments`); counts shown in the table; flat exports add a subtasks summary and comment count. Comment author is the local Settings profile name. |
| Project milestones | Done | Project detail view: list, add (with due date not after project due date), complete/reopen, remove; completion % shown in the detail view and milestone count on cards. Stored on the project record (`milestones`). Not included in the Projects page's flat-file export. |
| Learner Profile | Done | Enrolled courses with progress update and mark-complete, completion history, quiz results timeline (score, pass/fail, change vs previous quiz). Enrollments stored on the learner (`enrollments`); older records fall back to `currentCourse`, labelled "From profile". Assign Course now uses the live course catalog, blocks duplicate enrollment and stores target date/notes. Completions recorded only as a count are shown as a count. |
| Messaging | Not built | Needs a messaging backend. |
| AI assistance | Not built | No model configured. |
| Roles & permissions | Not enforceable | Needs a backend; frontend checks would not be security. |
| Segment dynamic membership | Missing | Would need a rule engine over the contacts/companies collections. |
| Course modules/lessons, certificates | Missing | |

## Verification

- `npm run build` passes.
- All 27 routes rendered in the browser with no console errors; no horizontal overflow at 360 px.
- New `/crm/contacts` route plus changed Tasks, Projects and Learner Profile pages re-checked: no console errors, no overflow at 360 px. Exercised: contact create (audit entry written), contact detail relations, subtask add/complete, comment post, milestone add/complete and due-date guard, course assign/progress/complete.
- Workflows exercised in the browser: quick-create deep link, form validation, duplicate warning, lead → deal conversion, audit entries.
- Import/export, scoring, traffic metrics and every report were checked with a Node script against the real modules.
- There is no automated test suite in the repository.
- CRM palette restyle (2026-10-29): `vite build` passes; `/crm` and all five CRM sub-pages render with no console errors in light and dark mode and no horizontal overflow at 360 px; Dashboard spot-checked with the new tokens.
- Primrose-primary palette restyle (2026-10-29): `vite build` passes; all 21 app routes plus sign-in render with no console errors; an in-browser text-contrast audit over every route in light and dark mode reports no text on a fill below 2.6:1 (chart SVG ticks excluded).
