# Layer

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Setup Instructions

1. Copy `env.example` to `.env.local` and fill in your configuration values
2. Start the backend server: `cd backend && npm run dev`
3. Start the frontend: `npm run dev`

## Troubleshooting

### SSL Protocol Error

If you encounter `net::ERR_SSL_PROTOCOL_ERROR` when accessing the dashboard, this is likely because:

1. **Backend server is not running** - Make sure your backend server is running on port 4000
2. **Wrong protocol** - The frontend is trying to use HTTPS but the backend is running on HTTP
3. **Environment variables not set** - Ensure you have the correct API URL in your environment

**Solution:**
- Copy `env.example` to `.env.local`
- Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in your `.env.local` file
- Make sure your backend server is running with `cd backend && npm run dev`
- Restart your frontend development server

### API Configuration

The application uses environment variables for API configuration:

- `NEXT_PUBLIC_API_URL` - Frontend API base URL (default: http://localhost:4000)
- `API_URL` - Backend API base URL (default: http://localhost:4000)

For production, update these to your actual API endpoints.
