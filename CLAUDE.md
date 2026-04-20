- Fonts: Poppins for all text — 400 body, 500 medium, 
  600 semibold, 700 bold, 800 display/headings
  
  # RaketMo — Claude Code Instructions

## What This App Is
RaketMo is a two-sided local gig marketplace. Job posters set a
budget and receive bids from local workers (Raketeers). Think
Uber meets Craigslist, built for neighborhood gig work.

## Design System
- Dark mode only. Never use white backgrounds.
- All colors from /lib/theme.ts — never hardcode hex values
- Fonts: Poppins (headings/labels) and Poppins (body)

## Code Rules
- TypeScript strict — no 'any' types
- All components in /components, screens in /app
- Use NativeWind for styling, not StyleSheet unless required
- Use React Query for all Supabase data fetching
- Use Zustand for auth state and UI state only
- Every screen must handle loading, error, and empty states

## Component Patterns
- Cards always use bgCard background with border token
- Primary buttons: blue gradient, borderRadius xl, Syne font
- Secondary buttons: bgCard background, border token
- Section headers: Poppins 700, textPrimary
- Subtext: Poppins, textMuted

## File Naming
- Screens: kebab-case in /app
- Components: PascalCase in /components
- Hooks: camelCase prefixed with 'use'

## Supabase Tables (build against these)
- users, business_profiles, jobs, bids, messages,
  reviews, categories

## Never Do
- Never use inline styles for colors or spacing
- Never create one-off components — check /components first
- Never skip TypeScript types
- Never hardcode user IDs or API keys