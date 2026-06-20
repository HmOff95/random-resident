# Phase 2 Setup & Testing Guide

## What Has Been Implemented

Phase 2 code is now complete with all files created and modified. The implementation includes:

✅ **Authentication** - Email/password sign up and sign in  
✅ **Database Integration** - Residents loaded from Supabase  
✅ **Photo Upload** - Upload avatars to Supabase Storage  
✅ **Editor Panel** - "My Resident" floating panel for editing your resident  
✅ **Auth Gating** - Home page shows login link if not signed in  
✅ **RLS Policies** - Users can only edit their own resident data  

## Step-by-Step Setup

### Step 1: Create `.env.local` file

Create a new file named `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from:
- **URL**: Supabase Dashboard → Settings → API → Project URL
- **Anon Key**: Supabase Dashboard → Settings → API → Project API keys (anon/public)

### Step 2: Set up Supabase Database & Storage

In your Supabase dashboard, open the **SQL Editor** and run this SQL:

```sql
create table public.residents (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'New Resident',
  photo_url text,
  color text not null default '#9CA3AF',
  sociability double precision not null default 0.5,
  energy double precision not null default 0.5,
  created_at timestamptz not null default now()
);

alter table public.residents enable row level security;

create policy "residents_select_all"
  on public.residents for select
  using (true);

create policy "residents_insert_own"
  on public.residents for insert
  with check (auth.uid() = id);

create policy "residents_update_own"
  on public.residents for update
  using (auth.uid() = id);
```

### Step 3: Create Storage Bucket for Avatars

In Supabase Dashboard:
1. Go to **Storage**
2. Click **New bucket**
3. Name it `avatars` and make it **public**
4. Run this SQL in the SQL Editor:

```sql
create policy "avatar_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatar_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Step 4: (Optional) Disable Email Confirmation

For easier testing, you can disable email confirmation:
- Supabase Dashboard → Authentication → Providers → Email
- Turn off **Confirm email**
- This lets you sign up and immediately enter the app

## Testing the Implementation

### Run the dev server:
```bash
npm run dev
```

The app will start at `http://localhost:3000` (or the next available port if 3000 is in use).

### Test Checklist:

1. **Sign Up**
   - [ ] Click "Go to Sign In" on home page
   - [ ] Switch to "Create Account" mode
   - [ ] Enter email and password
   - [ ] Click "Sign Up"
   - [ ] Should redirect to home and show the living room
   - [ ] Check Supabase Table Editor: verify `residents` row was created with your email as the default name

2. **Living Room & Residents**
   - [ ] You should see residents loaded from the database
   - [ ] Names match the database
   - [ ] Residents should have the colors from the database
   - [ ] They should move around (collision-aware from Phase 1.5)

3. **Edit Your Resident**
   - [ ] Click "My Resident" button (bottom-right)
   - [ ] A panel should slide in from the right
   - [ ] You should see your current name and a color circle
   - [ ] Change your name and click "Save Name"
   - [ ] Your circle's label should update immediately
   - [ ] Refresh the page - your new name should still be there

4. **Upload Photo**
   - [ ] In the "My Resident" panel, click the file upload area
   - [ ] Select an image file (JPG, PNG, etc.)
   - [ ] Wait for upload to complete
   - [ ] Your circle should now show the photo instead of the solid color
   - [ ] Refresh the page - photo should still be there
   - [ ] Close and re-open the panel - photo preview should show

5. **Sign Out**
   - [ ] Click the "Sign Out" button (top-right)
   - [ ] Should redirect to `/login` page

6. **Sign In**
   - [ ] From login page, enter your email and password
   - [ ] Click "Sign In"
   - [ ] Should load your living room with your resident's updated name and photo

7. **Multiple Users (Advanced)**
   - Sign up with different email addresses in different browsers/private windows
   - Each user should see all residents in the room
   - Each user can only edit their own resident (can't change another's name/photo)

## File Structure

New files added:
- `lib/supabase/client.ts` - Supabase client
- `lib/supabase/types.ts` - ResidentRow type
- `lib/auth.ts` - useAuth hook
- `app/login/page.tsx` - Login/signup page
- `components/ResidentEditorPanel.tsx` - Editor panel
- `components/MainContent.tsx` - Auth-gated wrapper
- `.env.local.example` - Config template

Modified files:
- `lib/types.ts` - Added `photo_url` field to Resident
- `app/page.tsx` - Uses MainContent wrapper
- `lib/residentStore.ts` - Added `loadResidents` and `updateResidentIdentity`
- `components/WorldView.tsx` - Fetches from Supabase
- `components/ResidentAvatar.tsx` - Shows photo if available

## Troubleshooting

**"Invalid API key" or "Unauthorized" errors:**
- Check `.env.local` is in the project root (not a subfolder)
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY match your Supabase project
- Restart the dev server after updating `.env.local`

**Cannot see residents after sign in:**
- Make sure you ran the SQL to create the `residents` table
- Check that the table has Row Level Security (RLS) enabled
- Make sure the "residents_select_all" policy exists (should allow `for select using (true)`)

**Photo upload fails:**
- Check that the `avatars` bucket exists in Storage
- Verify it's set to public
- Check the RLS policies on the bucket

**Cannot update your resident:**
- Make sure the `residents_update_own` policy exists
- It should check `auth.uid() = id`

## Next Steps

Phase 3 will add:
- Real-time cross-client synchronization of movement
- WebSocket connections to share resident positions between browsers
- Live updates when other users move
