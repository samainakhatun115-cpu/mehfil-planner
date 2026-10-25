# Mehfil

Mehfil is a celebration planner for [PromptWars Virtual Challenge 5](https://promptwars.in/promptwarsVirtual.html): weddings, birthdays, and community gatherings. A host describes the day. The app returns a budget, a timeline, a vendor checklist, and ideas they can edit.

Estimates are labeled as estimates. Vendor rows are categories, not shop listings. The host types any real contact themselves.

## Run it locally

```bash
npm install
cp .env.example .env.local
```

Put a Gemini key in `.env.local` as `GEMINI_API_KEY`. Create one in [Google AI Studio](https://aistudio.google.com/apikey). The key stays on the server. Do not commit `.env.local`, and do not rename the variable to `NEXT_PUBLIC_`.

```bash
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

Without a key, **Preview a sample plan** still shows the layout. That preview does not call Gemini. A submission needs the live key on the host you deploy.

```bash
npm test
npm run lint
```

## What the app does

- Brief: event type, date, city, guests, budget in rupees, diet, indoor or outdoor, and a free-text wish.
- **Generate plan** calls `POST /api/plan`, which asks Gemini for one JSON plan.
- Budget lines are editable. The total is compared with the cap, and an over-budget warning appears when the estimates pass it.
- Tasks are dated, prioritized, and checkable. A countdown sits above the plan.
- Vendor status, quote, and contact are typed by the host. Contacts are not sent to Gemini.
- A follow-up note revises the plan and keeps locked edits: changed amounts, checked tasks, and vendor details.
- The brief and plan are saved in this browser.
