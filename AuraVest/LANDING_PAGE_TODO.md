# TODO: Upgrade Landing Page for AuraVest

## Overview
Transform the simple login/signup page into a comprehensive landing page showcasing AuraVest features, with interactive  animations, and market data. Move authentication to a top-right modal.

## Steps to Complete

### 1. Redesign LandingPage.tsx Component
- [ ] Update `src/components/LandingPage.tsx` with full landing page layout:
  - Header with navigation and login/signup button (top-right)
  - Hero section with AuraVest branding and call-to-action
  - About section highlighting key features
  - Market overview with charts and live data
  - Featured assets section (cryptos, stocks, NFTs)
  - Footer with additional info
  - Modal for login/signup forms triggered by top-right button

### 2. Add Interactivity and Animations
- [ ] Implement animations:
  - Fade-in animations for sections on scroll
  - Hover effects on cards and buttons
  - Smooth transitions for modal open/close
  - Animated counters for market stats
- [ ] Add interactive elements:
  - Clickable asset cards with details
  - Hover tooltips on charts
  - Animated progress bars for features

### 3. Integrate Market Data and Assets
- [ ] Use existing market data from `marketData.tsx` and `mockData.ts`
- [ ] Display featured cryptos and stocks with prices
- [ ] Showcase NFT images from `public/nft/` folder
- [ ] Include technical analysis charts

### 4. Testing and Refinement
- [ ] Test all sections load properly
- [ ] Verify modal functionality and form submission
- [ ] Ensure animations work smoothly
- [ ] Check mobile responsiveness and accessibility
- [ ] Test dark mode toggle across all sections

## Notes
- Maintain existing authentication flow
- Use Tailwind CSS animations and transitions
- Reuse components like TechnicalAnalysisChart where possible
- Ensure performance with lazy loading for images
- Update progress in this TODO.md as steps are completed.
