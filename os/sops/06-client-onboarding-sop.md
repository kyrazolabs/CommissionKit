# SOP-06: Client Onboarding

## Purpose
Convert trial users into activated, paying customers through a structured onboarding experience.

## Activation Definition
A trial user is **activated** when they complete their first commission run. Activated users convert at 3-5x the rate of non-activated users.

## Onboarding Milestones

| Milestone | Target Day | Success Signal |
|-----------|-----------|----------------|
| Account created | Day 0 | Stripe + DB registration |
| First commission plan created | Day 1-2 | DB event: plan created |
| First rep added | Day 1-3 | DB event: rep created |
| First deal added | Day 2-4 | DB event: deal created |
| First commission run completed | Day 3-7 | DB event: run completed |
| Payout tracker viewed | Day 5-10 | Page view event |
| Upgrade to paid | Day 7-14 | Stripe subscription created |

## Day-by-Day Playbook

### Day 0 (Trial Start)
**Auto:** Welcome email with setup guide
**Auto:** In-app checklist appears ("Create your first plan")

**Email:**
```
Subject: Welcome to CommissionKit — let's get your first plan running

Hi [Name],

Your 14-day trial is live. Here's what to do in the next 10 minutes:

1. Create your first commission plan (3 min)
2. Add your reps (2 min)
3. Import your deals via CSV (5 min)

[Link to step-by-step guide]

I'll check in on Wednesday to see how it's going.

Best,
[Your name]
```

### Day 3 (Check-In)
**Trigger:** Automated email + manual outreach for high-value leads

**Email:**
```
Subject: How's your first commission plan looking?

Hi [Name],

Quick check-in: have you had a chance to set up your first plan?

If you're stuck, reply to this email and I'll walk you through it. Most users are up and running in under 10 minutes.

[Link to book a 10-min setup call]
```

**If plan NOT created:** Personal outreach. Offer 10-min setup call.
**If plan created but no deals:** Send CSV template + import guide.
**If deals imported but no run:** Encourage first run. "Click 'Run Commissions' — it takes 30 seconds."

### Day 7 (Mid-Trial)
**Trigger:** Automated email

**Email:**
```
Subject: You're halfway through your trial — here's what you might be missing

Hi [Name],

You're on day 7 of your trial. Here's what Growth/Pro users love:

- Rep self-service portal (no more "are my numbers right?" DMs)
- Dispute workflow (reps flag issues directly in the app)
- Payout tracker (approve and track every payment)

[Link to upgrade or explore features]
```

### Day 10 (Urgency)
**Trigger:** Automated email + personal outreach for Pro leads

**Email:**
```
Subject: 4 days left on your CommissionKit trial

Hi [Name],

Your trial ends in 4 days. To keep your data and continue using CommissionKit, upgrade before [date].

[Link to pricing/plans]

Questions? Reply to this email — I'm here to help.
```

### Day 14 (Trial End)
**Trigger:** Automated email

**Email:**
```
Subject: Your trial has ended — here's how to keep going

Hi [Name],

Your 14-day trial has ended. To continue using CommissionKit:

[Upgrade link]

If you need more time, reply to this email and I'll extend your trial.
```

### Day 17 (Win-Back)
**Trigger:** Automated email to non-converters

**Email:**
```
Subject: Come back anytime

Hi [Name],

I noticed you didn't upgrade after your trial. No pressure — I'd love to understand what was missing.

Reply with your feedback and I'll send you a extended trial + a personal walkthrough.
```

## Pro Plan Onboarding Call

**All Pro plan customers get a 30-minute onboarding call within 48 hours of subscribing.**

**Agenda:**
1. Understand their commission structure (5 min)
2. Set up first plan together (10 min)
3. Show payout tracker + dispute workflow (5 min)
4. Explain support channels (2 min)
5. Q&A (8 min)

**After call:**
- Send follow-up email with recording, documentation links, direct support contact
- Add to Pro customer Slack/WhatsApp group (if applicable)

## Tracking
Monitor in dashboard:
- Trial-to-activation rate (target: 40%)
- Activation-to-paid rate (target: 50%)
- Time to first plan (target: <2 days)
- Time to first run (target: <5 days)
