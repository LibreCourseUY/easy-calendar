# Easy Calendar

A lightweight multi-calendar web app built with Preact and Vite. The card board at `/` lists every calendar; each one lives under its own endpoint (`/trabajo`, `/fing`, ...) with a month-by-month view.

## Features

- Card board at `/` listing all calendars (name, description, event count)
- Multiple calendars, each served under `/<endpoint>`
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

Set your calendars with the `VITE_CALENDAR_DATA` environment variable. Optionally set a custom title with `VITE_CALENDAR_TITLE`:

```bash
VITE_CALENDAR_TITLE="My Calendar" VITE_CALENDAR_DATA='{"calendars":[{"endpoint":"trabajo","name":"Trabajo","description":"Work stuff","events":[{"name":"Meeting","date":"15/01/2026","type":"meeting"}]}]}' npm run dev
```

Or load the included sample data:

```bash
VITE_CALENDAR_DATA="$(cat sample-data.json)" npm run dev
```

Without the env var, `sample-data.json` is used by default.

## Calendar JSON Format

The top level holds a `calendars` array. Each calendar has an endpoint (its URL path), a card name, a description and its events:

```json
{
  "calendars": [
    {
      "endpoint": "trabajo",
      "name": "Trabajo",
      "description": "Reuniones y entregas del equipo.",
      "events": [
        { "name": "Team Standup", "date": "15/01/2026", "type": "meeting", "time": "09:00" },
        { "name": "Project Deadline", "date": "28/02/2026", "type": "deadline", "time": "17:00" }
      ]
    }
  ]
}
```

| Field         | Format       | Description                                    |
|---------------|-------------|------------------------------------------------|
| `endpoint`    | string      | URL path segment; the calendar lives at `/endpoint` |
| `name`        | string      | Card name, also used as the calendar heading   |
| `description` | string      | Card description                               |
| `events`      | array       | List of events (see below)                     |

Each event is an object with these fields:

| Field  | Format       | Description                        |
|--------|-------------|------------------------------------|
| `name` | string      | Event name (displayed in tooltip)  |
| `date` | `dd/mm/yyyy`| Day/month/year, zero-padded        |
| `type` | string      | Category name (determines color)   |
| `time` | `hh:mm` (optional) | Time of day, 24h format; events sort by time in tooltip |

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
