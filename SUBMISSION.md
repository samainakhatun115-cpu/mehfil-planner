# Submit Mehfil to PromptWars Challenge 5

Challenge 5, Celebration and Event Planner, closes **1 November 2026, 11:59 PM IST**. You get **3 submission attempts**. Open every link in a private window before you use one.

Official page: [promptwars.in/promptwarsVirtual.html](https://promptwars.in/promptwarsVirtual.html). Support: promptwarssupport@hack2skill.com.

You must be 18 or older and in India. Use one account. Do not copy someone else's repo.

## Where the credits come from

Rank inside one challenge, from the virtual challenge page:

- 1st 5,000 · 2nd 4,500 · 10th 1,600
- ranks 11–50 about 1,200–1,500
- ranks 51–100 about 1,000–1,100
- ranks 101–400 about 500–900

The same site also says swag-store credits go to the **top 50**, and that the elite 50 receive Virtual Credits. Treat top 50 as the band that reliably pays. Credits expire **1 January 2027**.

Extra pots:

- Top 5 Instagram reels in a challenge: 4,000
- Top 50 for 3 challenges in a row: 25,000
- Top 3 women developers in a challenge: 1,500

A beginner scores by covering all four parts of the brief (budget, timeline, vendors, ideas) and the six review checks: code quality, security, efficiency, tests, accessibility, and alignment with the problem. A finished small app beats a large unfinished one.

## Do these in order

1. Register on the PromptWars / Hack2skill challenge page, or confirm you already are. If the portal will not let you in, email promptwarssupport@hack2skill.com before you spend the week polishing.
2. Create a Gemini key at [Google AI Studio](https://aistudio.google.com/apikey). Put it only in the server environment as `GEMINI_API_KEY`.
3. Open this project in **Google Antigravity** and add one personal touch: a day-of schedule line, a note for your city, or a theme you care about. Keep a prompt log (tool, prompt, what changed). In the form and on LinkedIn, name the tools you actually used. Do not claim an Antigravity-only build if that is not true.
4. Push a **public** GitHub repo. Confirm the repo is under 10 MB and that `.env`, `.env.local`, and `node_modules` are not in the history (`git log --all -- .env.local` should be empty).
5. Deploy on Vercel (or another host) and set `GEMINI_API_KEY` in that host's environment, not in the repo. Open the live URL in a private window and generate a plan.
6. Record the video in the script below. Upload it as **unlisted** on YouTube, or to Google Drive as "anyone with the link". No API key on screen.
7. Write the LinkedIn post from the outline below, in your own words. The URL must open without a login wall if the form checker cannot see it. If LinkedIn forces a login, say so in the post settings (public) and test the URL while logged out.
8. Paste the two boxes below into the form, then edit them so they match what you actually shipped. Submit once. Save the 2nd and 3rd attempts for a broken link or a video that will not play.
9. Optional: post a short Instagram reel of the same demo. Top 5 reels pay 4,000 credits.

## Video script (2–3 minutes)

1. Say the problem in one sentence: people planning a wedding, birthday, or community event need a budget, a timeline, and a vendor list, not a wall of text.
2. Click **Use the birthday example**: 30 guests, ₹20,000, outdoor, vegetarian food, simple decor, photography.
3. Click **Generate plan**. Wait until the Gemini badge appears. If you only have a sample badge, stop and fix the server key before you film the submission cut.
4. Show the budget total against ₹20,000. Change one amount until the over-budget line appears, then change it back.
5. Open Timeline, check one task, and point at the countdown.
6. Open Vendors. Say that these are categories, not real shops. Type a contact name you are willing to show on camera, or a clearly fake placeholder you will delete, and set the status to Confirmed.
7. Open Ideas. Type: "Make the decor cheaper and keep the photographer." Click **Refine plan**. Show that the checked task and the contact are still there.
8. End on the live URL.

## LinkedIn post — fill this in yourself

Do not paste a story you did not live. Use this order:

- One sentence on the problem (planning a real celebration with a fixed budget).
- What Mehfil does in four words: budget, timeline, vendors, ideas.
- The tool you used for the last personal change (Antigravity, Cursor, or both — whichever is true).
- One thing that broke (a bad JSON reply, a date off by one, a key leaking into a log) and how you fixed it.
- What you would add next.
- The live URL and the GitHub URL.
- Hashtags you actually want: `#BuildWithAI` `#PromptWars` `#GoogleforDevelopers`.

## Form: deployed version updates

Edit this so it matches your deploy. It must stay under 1,024 characters.

```
Mehfil is a celebration planner for weddings, birthdays, and community gatherings. The host enters the event type, date, city, guest count, budget in rupees, diet, indoor or outdoor setting, and a short wish. One server call to Gemini returns a structured plan: estimated budget lines, dated tasks, vendor categories, and personalized ideas. Estimates are labeled as estimates, not confirmed prices. Vendor rows are categories only; the host types any real contact. Changing an amount, checking a task, or saving a vendor contact keeps that edit when the host refines the plan with a follow-up note. The plan is stored in this browser. The page shows planned spend against the budget, an over-budget warning, a countdown, and labeled controls that work from the keyboard.
```

## Form: GenAI services used

Edit the model name if you changed `GEMINI_MODEL`. Stay under 1,024 characters.

```
Google Gemini (default model gemini-3.6-flash, override with the server env var GEMINI_MODEL) is called only from POST /api/plan. GEMINI_API_KEY is read on the server and is never sent to the browser. Gemini returns JSON for the summary, budget estimates, dated tasks, vendor categories, and idea cards. A follow-up note calls the same route with the current plan so Gemini can revise it. The server then merges locked host edits back in, and it drops any business name or phone number the model adds. If the key is missing, Preview a sample plan shows local estimates and does not call Gemini. No other generative model is used in the app.
```

## Checklist before you click Submit

- The app covers budget, timeline, vendor checklist, and ideas.
- Generate works on the live URL, and the badge says Gemini, not Sample.
- GitHub is public and under 10 MB.
- No `.env` file and no API key in the repo or the video.
- The demo video plays while logged out.
- Both written boxes match the deployed app and are under 1,024 characters.
- The LinkedIn URL opens.
- This is attempt 1 of 3, unless you are fixing a broken link.

After this challenge, enter the next one. Three challenges in the top 50 in a row are worth more than a single first place.
