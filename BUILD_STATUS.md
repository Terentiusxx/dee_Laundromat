# Build and test status — November 6, 2026

**What is completed**

- Integrated backend with persistent SQLite, account/session endpoints, address and payment alias management, bookings/quotes, status changes, support and admin messaging, customer/account management, password reset, email verification test routes, public inquiries and admin rate edits.
- Next.js frontend with customer, admin, authentication, booking, and public pages. Based on the approved Dee's Laundromat visual direction.
- Frontend calls `/api/...` through a same-origin Next.js rewrite to FastAPI, with credentials stored in HTTP-only cookies.
- Docker Compose local test setup, HTTPS example and sample database bootstrap.

**Tests executed here**

- 10 backend API tests passed, covering auth, customer isolation, addresses, payment aliases, booking creation, pricing, status transitions, support replies, password reset, account preferences, in-store bookings and inquiries.
- Direct HTTP smoke test passed against a running Uvicorn server: health, login, saved addresses and orders.
- 31 TypeScript/TSX source files parsed without syntax errors.
- All 10 CSS source files parsed without syntax errors.
- Docker Compose YAML and JSON configuration parsed successfully.

**Not verified here**

- The full Next.js TypeScript typecheck, build and browser-based UI testing. The container could not contact npm registry and does not have its browser automation binary installed. The provided Docker build and GitHub Actions workflow will perform the actual frontend build when run in an internet-connected environment.
- Real payment gateway, SMTP/SMS sending, live service availability, map routing, staff dispatch and operational laundry service. These require real account credentials and finalized business decisions.

**Important**: This is deployable as a **private staging/test build**, not an approved public production launch. Public deployment must replace sample content, disable demo mode, set up secure staff accounts, configure email and payments, and pass a production readiness/security review.
