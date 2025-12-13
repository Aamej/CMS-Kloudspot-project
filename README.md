# Kloudspot Crowd Manager

Real-time crowd analytics dashboard for monitoring site occupancy, visitor demographics, and entry/exit activity.

Built with React 19, TypeScript, Tailwind CSS, and Recharts.

## What's Inside

- Live occupancy tracking with WebSocket updates
- Footfall and dwell time analytics
- Demographics breakdown (male/female distribution)
- Paginated entry/exit logs with real-time alerts
- JWT authentication

## Getting Started

**Requirements:** Node.js v18 or higher

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Opens at `http://localhost:3000`

## Configuration

API and socket endpoints are configured in:
- `services/api.ts` → `BASE_URL`
- `services/socket.ts` → `SOCKET_URL`

Currently pointing to: `https://hiring-dev.internal.kloudspot.com`

## Test Credentials

```
Email: test@test.com
Password: 1234567890
```

## Folder Structure

```
├── components/     # UI components (Sidebar, Header, Overview, CrowdEntries)
├── services/       # API client and socket connection
├── types.ts        # TypeScript interfaces
├── constants.ts    # Static data and config
└── App.tsx         # Root component with view routing
```
