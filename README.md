# Random Resident - Phase 1 Prototype

A Tomodachi Life-inspired web app prototype featuring self-contained frontend residents that move around a bounded room driven by simple rule-based intents.

## Features

- **No Backend, No Auth, No AI**: Everything runs client-side
- **Rule-Based Intents**: Residents make autonomous decisions based on traits and simulation logic
- **Smooth Animation**: Framer Motion handles movement transitions
- **Reason Labels**: Each resident displays why they're doing what they're doing
- **Trait-Based Behavior**: Residents have varying sociability and energy levels

## Tech Stack

- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Framer Motion** for smooth animations

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
app/
  page.tsx              -> Main page rendering WorldView
  layout.tsx            -> Root layout
  globals.css           -> Global styles with Tailwind
  
components/
  WorldView.tsx         -> Bounded room container
  ResidentAvatar.tsx    -> Individual resident with animation
  
lib/
  types.ts              -> TypeScript types and constants
  simulation.ts         -> Intent decision logic
  residentStore.ts      -> Zustand store with tick simulation
```

## How It Works

1. **WorldView** initializes 4 residents with random traits and positions
2. Every 500ms, the store's `tick()` function runs:
   - Checks if each resident's current intent duration has expired
   - If expired, calls `decideNextIntent()` to determine new behavior
   - Updates position if moving (wander/seek_resident)
3. **ResidentAvatar** animates smoothly to new positions using Framer Motion
4. Reason labels update in real-time to reflect current intent

## Intent Types

- **Idle**: Resident stays in place, reason like "is taking a break"
- **Wander**: Resident moves to random position, reason like "feels like wandering around"
- **Seek Resident**: Resident moves toward another resident, reason like "wants to hang out with Mira"

## Phase 1 Architecture

The code is structured so that `resident.intent.reason` is the single point that will later be replaced by AI-generated text (Phase 4), without needing to change ResidentAvatar, WorldView, or the store's shape.

## Future Phases

- Phase 2: Photo uploads for avatars
- Phase 3: Backend persistence
- Phase 4: AI-generated intent reasons
