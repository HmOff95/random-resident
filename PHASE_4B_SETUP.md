# Phase 4b Setup Guide — AI Tick with Groq

This document guides you through the manual setup required to complete Phase 4b implementation.

## Step 1: Get Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Create an account or log in
3. Navigate to API Keys section
4. Create a new API key (save this, you'll need it in Step 2)

## Step 2: Add Environment Variables to Vercel

In your Vercel project settings:

1. Go to **Settings → Environment Variables**
2. Add the following variables:

```
GROQ_API_KEY=your-groq-api-key-from-step-1
```

Generate a random 32+ character string for the tick secret (you can use an online password generator or run:
```bash
openssl rand -hex 32
```

Then add:
```
TICK_SECRET=your-generated-random-string
```

3. Save and redeploy

## Step 3: Add Local Environment Variables

Update your local `.env.local` file with:

```
# Add these to your existing file
GROQ_API_KEY=your-groq-api-key
TICK_SECRET=your-tick-secret
```

## Step 4: Supabase Migration

1. Go to your Supabase project → **SQL Editor**
2. Create a new query and run this migration:

```sql
-- Add mood + tick tracking to residents
alter table public.residents
  add column mood text not null default 'content',
  add column last_ticked_at timestamptz not null default now(),
  add column ai_reason text,
  add column ai_reason_set_at timestamptz;
```

Wait for the migration to complete successfully.

## Step 5: Get Service Role Key

1. In your Supabase project, go to **Settings → API**
2. Copy the `service_role` secret key (the one marked "SECRET")
3. Add it to both Vercel and local `.env.local`:

**Vercel Environment Variables:**
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Local `.env.local`:**
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **CRITICAL**: Never commit this key to version control. Never use it in any client-side code. It bypasses Row-Level Security entirely.

## Step 6: Test Locally

Once all environment variables are set, test the tick endpoint:

```bash
curl -H "Authorization: Bearer YOUR_TICK_SECRET" http://localhost:3000/api/tick
```

Replace `YOUR_TICK_SECRET` with the actual secret you generated.

Expected responses:
- ✅ **Success (no residents)**: `{"message":"No residents to process"}`
- ✅ **Success (residents processed)**: `{"processed":N,"results":[...]}`
- ❌ **Auth failure**: `{"error":"Unauthorized"}` (check TICK_SECRET)

## Step 7: Deploy to Vercel

After testing locally:

```bash
git add .
git commit -m "Phase 4b: AI Tick with Groq"
git push
```

Vercel will redeploy automatically. The cron job will start running every 5 minutes on the deployed environment.

## Step 8: Verify Deployment

1. In Vercel project, go to **Settings → Crons**
2. You should see `/api/tick` scheduled for every 5 minutes
3. Monitor the deployment's function logs to see tick executions

## Troubleshooting

### "GROQ_API_KEY is missing"
- Verify GROQ_API_KEY is in Vercel Environment Variables
- Redeploy after adding the variable
- Check it doesn't have any leading/trailing spaces

### "Unauthorized" response
- Double-check your Authorization header uses the exact TICK_SECRET you set
- Format: `Authorization: Bearer YOUR_SECRET` (with space after Bearer)

### "Service role key is invalid"
- Verify you copied the `service_role` key (not the `anon` key)
- It should be a long string starting with `eyJ...`
- Confirm it's in `.env.local` for local testing

### Groq API errors
- Check Groq's status page: [status.groq.com](https://status.groq.com)
- Verify your API key is valid and not expired
- Rate limits: Groq has per-minute rate limits; reduce BATCH_SIZE if hitting limits
- Model name: If `llama-3.1-8b-instant` is deprecated, check [Groq docs](https://console.groq.com/docs/models) for current models

### Memories not being created
- Verify the tick ran successfully (check function logs)
- Confirm Supabase migrations completed
- Check that residents have `used: false` topics in the database

---

## What's Now Running

✅ **Vercel Cron**: Every 5 minutes, Vercel calls `/api/tick` with the TICK_SECRET  
✅ **Groq Call**: The endpoint fetches up to 20 residents and calls Groq with their traits/memories/pending topics  
✅ **Result Storage**: AI-generated reasons, moods, and memories are written back to Supabase  
✅ **Room Display**: Residents show AI-generated reasons instead of rule-based reasons on their next intent re-roll

## Next Steps

After confirming the tick works:
- Monitor Groq API usage in your console
- Adjust BATCH_SIZE if needed (currently 20 residents per batch)
- Adjust schedule in `vercel.json` if needed (currently `*/5 * * * *` = every 5 minutes)

For local development, you can test the endpoint any time with the curl command above. Vercel Cron only runs on deployed environments.
