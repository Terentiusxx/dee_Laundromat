# Dee's Laundromat — Approved Homepage Update

This version is based on the corrected full-stack staging package and replaces the public landing page with the approved dark-navy editorial design.

## Changes

- New `app/page.tsx` homepage: dark navy masthead with laundry imagery, service benefits, image-led service cards, How It Works, Why Choose Us, Pickup & Delivery vs In-Store, FAQ, closing CTA, and footer.
- New `app/home.module.css`: responsive styling, dedicated homepage navigation, mobile dropdown, accessible FAQs, and hover/focus treatment.
- New standalone image assets in `public/images/home-*.webp`. These are distinct visual assets (not a screenshot of the entire page), so text, links, buttons and layouts are editable.
- No changes to FastAPI routes, database schema, customer screens, admin controls, or Docker Compose services.
- No fictional customer counts, fake reviews or invented operating addresses/contact numbers are displayed.

## Running the updated project

Extract the ZIP and open the `dees-laundromat` directory in your terminal:

```powershell
docker compose up --build
```

Then visit `http://localhost:3000`.

For an existing local database, replace the prior project source files **without deleting the Docker volume**. `docker compose down -v` deletes the demo/test database volume; avoid that command if you want to preserve existing test orders.

## Verification

- Python backend: 10 tests passed (`python -m unittest discover -s tests -v`).
- Homepage TypeScript/TSX parsed successfully; homepage CSS parsed successfully.
- A full Next.js `npm run build` and browser screenshot test could not be completed in this environment. Run `docker compose up --build` on your machine and check any remaining compiler diagnostics.
- Real payments, notifications and public hosting still require external integrations and production hardening; the application remains a private staging build.

## Relevant routes

- `/` — new homepage
- `/login`, `/register` — account access
- `/dashboard`, `/book-a-pickup`, `/my-orders`, `/saved-addresses`, `/payments`, `/account-settings`, `/support` — customer app
- `/admin` — staff portal
