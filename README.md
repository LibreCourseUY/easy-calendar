# Easy Calendar

A lightweight year-view calendar web app built with Preact and Vite. Load your events via a JSON environment variable and view them month by month.

## Features

- Month-by-month calendar view with colored event cells
- Hover/click to see event details in a tooltip
- Search events by name, click to jump to that date
- Filter by event type (focused type highlights, others dim)
- Dark mode / light mode (respects system preference)
- Spanish / English language toggle (Spanish default)
- Mobile-friendly layout

## Getting Started

```bash
npm install
npm run dev
```

Set your events with the `VITE_CALENDAR_DATA` environment variable:

```bash
VITE_CALENDAR_DATA='[{"name":"Meeting","date":"15/01/2026","type":"meeting"}]' npm run dev
```

Or load the included sample data:

```bash
VITE_CALENDAR_DATA="$(cat sample-data.json)" npm run dev
```

Without the env var, `sample-data.json` is used by default.

## Event JSON Format

Each event is an object with three fields:

```json
[
  {
    "name": "Team Standup",
    "date": "15/01/2026",
    "type": "meeting"
  },
  {
    "name": "Project Deadline",
    "date": "28/02/2026",
    "type": "deadline"
  }
]
```

| Field  | Format       | Description                        |
|--------|-------------|------------------------------------|
| `name` | string      | Event name (displayed in tooltip)  |
| `date` | `dd/mm/yyyy`| Day/month/year, zero-padded        |
| `type` | string      | Category name (determines color)   |

Event types get deterministic colors from their name hash. Each type appears as a filter button in the UI.

## Build

```bash
npm run build
```

Output is in `dist/`.

## Tech Stack

- [Preact](https://preactjs.com/) (3kB React alternative)
- [Vite](https://vitejs.dev/) (fast dev server and bundler)
- Vanilla CSS with CSS custom properties for theming
