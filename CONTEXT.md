# OncoBot v3 Context

## Recent Updates

### Bot Component
- Created animated SVG bot component from oncobot.svg
- Component located at `/components/bot.tsx`
- Features:
  - Responsive design with customizable error text
  - Animated flashing text effect using Framer Motion
  - Purple and blue color scheme with slate-600 text background
  - Proper theme support for both light and dark modes
  - Used in `/app/not-found.tsx` and `/app/global-error.tsx`

### Health Profile
- Fixed roman numeral display issue (Stage IV now displays correctly)
- Located at `/components/health-profile/HealthProfileSection.tsx`

## Project Status
- Build successful with Next.js 15.4.2 (Turbopack)
- All TypeScript errors resolved
- Linting warnings present but non-critical (image optimization suggestions)