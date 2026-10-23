# EstateFlow CRM

EstateFlow is a frontend-only real-estate CRM built with React and Vite. It
includes a responsive workspace, mock authentication and roles, dashboard,
lead management, lead-to-client conversion, client profiles, and property
listing management. The sales workflow includes a lead Kanban pipeline, deal
tracking, tasks and follow-ups, appointments, record notes, and activity
timelines.

## Development

```sh
npm install
npm run dev
```

Other available checks:

```sh
npm run lint
npm run build
npm run preview
```

## Demo data and authentication

Leads, clients, properties, deals, tasks, and appointments are stored in the
browser's local storage.
Property photos are stored in the same browser storage; uploads support up to
six JPG, PNG, or WebP images of 5 MB or less per property. The app does not
connect to a backend or send data to a server. Login and
registration are mock flows for frontend development; password recovery,
verification, and password changes are informational demos and do not send
email or modify credentials. In development, the login/register role selector
can be used to preview role-aware screens.

Clearing the app's local storage resets its seeded demo records.

The Sales Pipeline uses lead statuses from the Leads module so stage changes
stay in sync across both screens. Deals, tasks, and appointments can be linked
to lead/client contacts, assigned to an agent, searched, filtered, and updated.
These workflow records support local notes and activity histories. Agent views
are limited to records assigned to the signed-in demo agent.

## Dashboard, reports, calendar, and notifications

The dashboard KPIs, charts, recent activity, and follow-up list are calculated
from the saved CRM records. Reports include period filters, lead status/source
breakdowns, deal-stage totals, and agent performance. The appointments page
includes a month calendar and per-appointment reminder choices. In-app
notifications combine recent record activity with due lead/task follow-ups and
appointment reminders; read and dismissed state is saved in local storage.

This remains a frontend-only demo: in-app reminders are evaluated while the
workspace is open, and there is no email delivery or background scheduler.
Email notifications, Celery, and Redis require the backend services described
in the roadmap and are not represented as active features here.
