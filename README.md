# ProjectPilot Frontend Base

A clean starter for the ProjectPilot LMS frontend using Next.js App Router, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, and Lucide React.

## Requirements
- Node.js 20.9+
- npm

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```
Open http://localhost:3000.

## Environment
Set `NEXT_PUBLIC_API_BASE_URL` to the backend API base URL, including the version prefix, for example:
`http://localhost:4000/api/v1`

The backend port and deployed URL should be confirmed from the backend project before integration.

## Included
- Responsive dashboard shell with sidebar and top bar
- Starter routes for public landing, login/register placeholders, and student/mentor/admin dashboards
- Shared API client with typed response/error handling and request ID support
- TanStack Query provider
- Reusable Button, Card, Badge, and Skeleton components
- Role-aware navigation configuration (presentation only; not an authorization boundary)
- Lightweight starter styling

## Important integration notes
- Authentication is intentionally not implemented yet. Do not treat placeholder pages or navigation visibility as security.
- The API client accepts an injected access-token provider. Add the real token/session strategy after checking the backend auth contract.
- Every placeholder dashboard uses sample UI copy only; no backend endpoints are assumed.
- The backend must enforce all authentication and role permissions.
