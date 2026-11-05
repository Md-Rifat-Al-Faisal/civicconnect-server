# CivicConnect - Server API

The backend REST API for **CivicConnect**, a community-driven social development event management platform where citizens and volunteers create, join, and manage local community impact initiatives.

Live API: [Insert Render/Vercel URL here]

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5
- **Database**: MongoDB (Official native driver)
- **Security & JWT**: Jose (JWKS-based verification against Next.js BetterAuth)
- **CORS & Environment**: CORS, Dotenv

## Key Endpoints

- `GET /` - Root health check
- `GET /events` - Get all upcoming social development events (filtered by date, supports search and category filter)
- `GET /recent-events` - Get 6 most recent upcoming events for the homepage showcase
- `GET /events/:id` - Get single event details
- `POST /events` - Create a new event (protected, requires future date validation)
- `GET /my-events` - Get all events created by the authenticated user (protected)
- `PUT /events/:id` - Update an event with creator ownership check (protected)
- `DELETE /events/:id` - Delete an event and clean up joined records (protected)
- `POST /join-event` - Join/volunteer for an event with duplicate prevention (protected)
- `GET /joined-events` - Get all events joined by the authenticated user (protected)
- `GET /check-joined/:eventId` - Check volunteer participation status for an event (protected)
- `DELETE /joined-events/:id` - Leave/cancel attendance for a joined event (protected)

## Environment Variables

- `PORT` - Port to run the server on (default: 8000)
- `CLIENT_URL` - URL of the Next.js client application for CORS and JWKS lookup
- `MONGODB_URI` - MongoDB Atlas connection string
