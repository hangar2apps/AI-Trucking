# Marketing & Dashboard Frontend

Samsara-inspired marketing site for the AI-Trucking platform. Product name is **`app`** until final branding is ready — change `NEXT_PUBLIC_PRODUCT_NAME` in `.env.local`.

## Routes

| Route | Description |
|-------|-------------|
| `/survey/1` … `/survey/10` | Lead survey — submits to backend, sends welcome email |
| `/survey/complete` | Thank-you + inbox confirmation |
| `/demo` | 10-step interactive tour (uses backend seed data) |
| `/app` | Fleet map with route overlay |
| `/app/loads` | Loads list (LD-1042 highlighted) |
| `/app/loads/[id]` | Load detail + AI email draft |
| `/app/proximity` | Proximity search |
| `/app/trip-media` | Trip media with sample dashcam video |
| `/app/demo-climax` | Scripted demo sequence |

## Data source

The app **connects directly to the FastAPI backend** (`NEXT_PUBLIC_API_URL`). If the backend is offline, it falls back to `src/lib/mock-data.ts` and shows an amber banner.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Backend must run at `http://localhost:8000` for live data and survey email delivery.

### Survey emails

Configure on the **backend** (not frontend):

```
RESEND_API_KEY=re_...
FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
```

Leads are always saved to the database; email sends when Resend is configured.

## Rename product

Update `NEXT_PUBLIC_PRODUCT_NAME` in `.env.local` or edit `src/lib/brand.ts`.
