# Market Validation Survey (Google Form)

Customer-discovery survey for trucking-industry respondents. Separate from the
in-app lead survey (`frontend/src/lib/survey-steps.ts`) — that one captures
leads; this one validates the product.

> **Mom-Test note:** the strongest signal is how people handle delays *today*
> (Q5–Q9), not whether they "like the idea." Treat Q10–Q17 as directional.

---

## Form intro blurb (paste at the top of the form)

> Replace `[A-TMS]` with whatever public name you're using.

We're building **[A-TMS]** — software that helps trucking companies run dispatch
and customer communication with an AI assistant working in the background. It
watches every load in real time, catches a delivery that's about to run late
*before your customer notices*, emails the customer a new ETA automatically, and
can reassign the load to a nearby truck to save the delivery — without a
dispatcher having to catch it by hand.

We're talking to people who actually run fleets to learn whether this would
genuinely help, or whether we're solving the wrong problem. Your honest answers
— including "I'd never use this" — are exactly what we need.

It takes about 4–5 minutes and there are no right answers. If you'd like early
access or a short call, there's a spot at the end for your email. Thanks for
helping us build something fleets would actually want.

---

## Questions

### Section 1 — About you and your fleet
1. **What's your role?** *(Multiple choice)* — Owner / Executive · Operations / Dispatch · Fleet Manager · Driver · Other
2. **How many trucks are in your fleet?** *(Multiple choice)* — 1–5 · 6–25 · 26–100 · 100+
3. **What do you primarily haul, and on what kind of lanes?** *(Short answer)*
4. **What tools do you use today for dispatch, tracking, or TMS?** *(Short answer)*

### Section 2 — How delays work for you today
5. **How often does a load run late enough to risk the delivery window?** *(Multiple choice)* — Rarely · A few times a month · Weekly · Daily
6. **When a truck is going to be late, how do you usually find out first?** *(Multiple choice)* — Driver calls in · We catch it on our tracking · The customer calls us · We often don't realize until it's already late
7. **Today, who tells the customer about a delay, and how?** *(Paragraph)*
8. **When a load needs to move to another truck, how does that happen now?** *(Paragraph)*
9. **How manual is your dispatch + customer communication today?** *(Linear scale 1–5)* — 1 = all phone calls & spreadsheets, 5 = fully automated

### Section 3 — Reaction to the product
10. **Core idea:** *"An AI that notices a load will be late before the customer does, emails the customer proactively with a new ETA, and reassigns a backup truck to save the delivery — automatically."* **How valuable would that be to your operation?** *(Linear scale 1–5)* — Not valuable → Game-changing
11. **Which of these would you actually use?** *(Checkboxes)* — Proactive delay emails to customers · Automatic truck reassignment · AI that answers customer "where's my load?" emails · Live map / fleet tracking · ETA predictions · Driver hours / compliance · None of these
12. **What's your single biggest day-to-day operational headache?** *(Paragraph)*

### Section 4 — Trust & autonomy (the big one)
13. **How comfortable are you with AI taking actions on its own — without a human approving each one?** *(Linear scale 1–5)* — Not at all → Very comfortable
14. **Which actions would you let AI do automatically vs. require a human to approve?** *(Multiple-choice grid)* — Rows: Email a customer · Reassign a load to another truck · Message a driver · Quote or commit a delivery time. Columns: AI can do it alone · Needs human approval
15. **What would make you *not* trust an AI to handle these tasks?** *(Paragraph)*

### Section 5 — Adoption
16. **How likely would you be to pilot a product like this?** *(Linear scale 1–5)* — Not likely → Would sign up today
17. **If it reliably prevented late deliveries and cut dispatcher busywork, what would you expect to pay per truck, per month?** *(Multiple choice)* — Under $10 · $10–25 · $25–50 · $50–100 · Wouldn't pay
18. **Want early access or a 15-min interview? Drop your email.** *(Short answer)*
