# FIT50 Implementation Plan

## Document Purpose

This document serves as the comprehensive blueprint for building the FIT50 fitness challenge platform. It establishes design standards, technical architecture, feature specifications, product definitions, and build methodology. All development decisions should reference this document to ensure consistency and alignment with the original vision.

---

## 1. Project Overview

### 1.1 Concept Summary

FIT50 is a 50-day fitness challenge platform inspired by Tommy Grainger's watercolour art style. The platform combines a free daily tracker website with premium digital products and branded merchandise. The core value proposition centers on habit formation through sticky, visual tracking that mirrors the tactile experience of paper-based journaling. The challenge draws from the user's experience with the 75 Hard challenge, incorporating lessons learned about what makes a tracker effective at building lasting habits.

The platform serves dual purposes: it provides a free functional tracker that demonstrates value to users, while simultaneously building an email list and brand awareness that enables monetization through digital products and merchandise. This freemium model reduces barrier to entry while creating clear upgrade pathways for committed users.

### 1.2 Target Audience

The primary audience consists of fitness enthusiasts aged 25-45 who have attempted and failed at longer-term fitness commitments. These users value aesthetic design, appreciate the accountability of daily tracking, and are motivated by visual progress indicators. They have typically tried challenges like 75 Hard, Couch to 5K, or January fitness resolutions and understand the value of structured accountability but want a more approachable 50-day format.

The secondary audience includes corporate wellness programs seeking structured challenge content for employee engagement, fitness studios looking for branded challenge materials, and fitness influencers wanting to offer their audiences a downloadable or trackable challenge. These secondary audiences represent potential B2B revenue opportunities in year two of operation.

### 1.3 Core Value50 delivers three interconnected Propositions

FIT value streams that work together to create a complete ecosystem.

The first value stream is the free daily tracker. This provides persistent state management with optional cloud sync, enabling users to track nine daily habits across fifty days without any friction. The tracker uses localStorage for anonymous users, meaning someone can begin the challenge immediately without creating an account, while offering optional Supabase authentication for users who want to sync across devices. The sticky nature of daily checking—combined with visual streak indicators—creates the habit formation loop that was missing from the user's 75 Hard experience.

The second value stream is premium digital products. These enhance the tracking experience beyond what the free website offers. The Notion template at €1.99 provides a portable, customizable tracking system that works on mobile and desktop with features like streak motivation, reminders, and progress analytics. The enhanced PDF tracker at €4.99 offers a printable option for users who prefer physical journaling. The complete package at €9.99 bundles both with additional meal guides and workout videos. These products generate revenue while giving users more tools to succeed.

The third value stream is branded merchandise. The physical products—water bottles, egg timers, training t-shirts and vests—serve as both motivation tools and community identity markers. Users who complete the challenge often want commemorative items, and the branded merchandise satisfies this demand while generating revenue through dropshipping arrangements.

### 1.4 Brand Positioning

FIT50 occupies the intersection of aesthetic fitness content and functional habit tracking. Unlike clinical fitness apps that feel like spreadsheets or basic printable trackers that feel generic, FIT50 positions itself as art-inspired motivation. The watercolour design system—featuring Tommy Grainger's distinctive visual style—creates emotional resonance that competitors cannot easily replicate. The design is not merely decorative; it reinforces the brand's message that fitness should be approached with creativity and personal expression rather than military discipline.

This differentiation is the primary competitive moat. While functionality can be copied, the distinctive visual identity creates brand recognition and emotional connection that drives user loyalty. The partnership with Tommy Grainger provides authentic artistic credibility that cannot be faked, and the handmade paper textures with visible fibers create a tactile digital experience that users remember.

---

## 2. Design System

### 2.1 Color Palette

The color palette draws from Tommy Grainger's watercolour art style, with each color serving specific functional and emotional purposes within the design system. These colors appear consistently across all components, from background fills to accent elements, creating visual coherence throughout the platform.

| Color Name | Hex Code | Usage | Emotional Association |
|------------|----------|-------|---------------------|
| Coral | #E88B5A | Primary accent, hero section left | Energy, warmth, action |
| Teal | #4A9B9B | Secondary accent, rules cards | Calm, stability, growth |
| Lavender | #D8B8D0 | Calculator section, FAQ | Softness, approachability |
| Cream | #F2D9A2 | Tracker's unchecked state, backgrounds | Warmth, natural, paper-like |
| Charcoal | #2A2A2A | Text, workout sections | Grounding, contrast |
| White | #FEFEFE | Card backgrounds, content areas | Cleanliness, space |
| Red | #D4B3D | Error states, alerts | Urgency, attention |

### 2.2 Typography

The typography system employs two typefaces to create visual hierarchy while maintaining the handcrafted aesthetic.

**Primary Typeface: Larsim**

This custom typeface serves as the display font for headings and brand elements. Its organic, hand-lettered qualities reinforce the watercolour art direction. The font is embedded as a base64 data URI in the application.

**Fallback Typeface: Titan One**

When Larsim fails to load, Titan One (via Google Fonts) provides equivalent display heading characteristics.

**Body Typeface: Space Grotesk**

Selected for its contemporary, geometric qualities that balance the display fonts, Space Grotesk provides excellent readability for body text.

**Font Usage Specifications**

| Element | Font | Size | Weight | Transform |
|---------|------|------|--------|-----------|
| Brand/Logo | Larsim/Titan One | 24px | 400 | Uppercase |
| Section Headings | Larsim/Titan One | 48-56px | 400 | Uppercase |
| Subheadings | Larsim/Titan One | 16-20px | 400 | None |
| Body Text | Space Grotesk | 14-16px | 400-500 | None |
| Labels | Space Grotesk | 10-12px | 600 | Uppercase |
| Buttons | Larsim/Titan One | 11-12px | 400 | Uppercase |

### 2.3 Visual Effects

The visual effect system creates the distinctive watercolour aesthetic through layered procedural generation and texture overlays.

**Watercolour Canvas Effect**

The background of each section uses a canvas-generated watercolour effect consisting of four distinct layers. The base layer fills the section with the designated section color. Light areas (15 organic ellipses) simulate paper showing through the paint. Dark areas (12 ellipses) create pigment pooling. Soft bloom gradients eliminate harsh edges.

**Paper Texture Overlay**

A high-resolution handmade paper texture applies as a full-cover overlay across all sections. The texture uses mixBlendMode: 'multiply' at 15% opacity, creating the impression that the digital content exists on physical paper.

**Paint Splatter Decorations**

Each section includes procedurally generated paint splatters using bezier curve paths with 12 control points. Each main splatter includes 8 satellite droplets of varying sizes.

**Paint Drips**

Section transitions feature canvas-rendered drips using smooth radial gradients in section-appropriate colors, with heights ranging from 20-55 pixels.

### 2.4 Layout System

Every major section follows a consistent wrapper pattern using the WatercolourSection component containing WatercolourCanvas, PaperTexture, PaintSplatters, PaintDrips, and content area.

**Grid Specifications**

- Rules: 3-column grid, 20px gaps
- Workouts: 5-column layout
- Tracker: 10-column grid (50 days)
- Shop: 4-column grid (desktop)

**Spacing Scale (8px base)**

- xs: 8px, sm: 16px, md: 24px, lg: 32px, xl: 40px, xxl: 60px
- Section padding vertical: 100px

**Responsive Breakpoints**

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Mobile | < 640px | Single column, reduced padding |
| Tablet | 640-1024px | 2-column grids |
| Desktop | > 1024px | Full layout |

---

## 3. Technical Architecture

### 3.1 Technology Stack

| Component | Solution |
|-----------|----------|
| Frontend | Next.js (React) |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Local Storage | Browser localStorage |
| Shop | Gumroad + external dropship |
| Deployment | Vercel |

### 3.2 Component Architecture

**Base Visual Components**

- WatercolourCanvas: Generates procedural watercolour backgrounds
- PaperTexture: Applies paper texture overlay
- PaintSplatter: Creates decorative splatter elements
- PaintDrips: Renders section-edge drip effects
- WatercolourSection: Wraps content sections with all effects

**Feature Components**

- Nav, Hero, Calculator, Rules, Workouts, Tracker, Shop, FAQ, Footer

**Data Components**

- TrackerContext: Global tracker state (anonymous or authenticated)
- AuthProvider: Supabase authentication state
- ProductData: Shop product catalog

### 3.3 Data Models

**User Table (Supabase)**

```
users {
  id: uuid (primary key)
  email: string (unique)
  created_at: timestamp
  name: string (optional)
}
```

**Progress Table (Supabase)**

```
progress {
  id: uuid (primary key)
  user_id: uuid (foreign key)
  day: integer (1-50)
  habit_id: string
  completed: boolean
  updated_at: timestamp
  
  unique constraint: (user_id, day, habit_id)
}
```

**LocalStorage Schema (Anonymous)**

```
fit50_tracker {
  currentDay: number
  habitCompletions: { [habitId]: { [day]: boolean } }
  streakCount: number
  longestStreak: number
  lastUpdated: ISO8601 string
  startDate: ISO8601 string
}
```

---

## 4. Feature Specifications

### 4.1 Website Sections

**Hero Section**
- Split-screen: coral (60%) / teal (40%)
- Headline: "The 50-Day Challenge"
- Call-to-action buttons: "Start Now", "See Rules"
- Animated marquee: "Let's Get After It!"
- Paint drip effects at section boundary

**Date Calculator Section**
- Lavender background
- Date picker input
- Displays projected finish date with day of week

**Rules Section**
- 9 teal cards in 3x3 grid
- Rule number, emoji, title, description
- Expandable tips on click

**Workouts Section**
- Charcoal background
- 4 workout lines (A, B, C, D)
- 5 exercises per line
- 5th exercise in teal (finisher)

**Daily Tracker Section**
- 50-day grid (10 columns)
- 9 habit checkboxes
- Streak display
- PDF download button

**Shop Section**
- Product cards in responsive grid
- Links to Gumroad (digital) and dropship (physical)

**FAQ Section**
- Lavender background
- Expandable questions
- Topics: missed days, workout modification, audiobooks, cold shower temp

**Footer Section**
- Charcoal background
- FIT50 logo
- Tommy Grainger credit
- Email capture field
- Social links

### 4.2 Daily Tracker Functionality

**Habits (9)**

1. Chill Out (cold shower)
2. Fuel Right (macros)
3. Crispy Clarity (no alcohol)
4. Fresh Lungs (no smoking)
5. Open Mind (meditation)
6. Move Your Body (workout)
7. Wet The Lips (water)
8. Keep Walking (steps)
9. Feed Your Brain (reading)

**Core Logic**
- Display days 1-50 sequentially
- Current day highlighted
- Checkbox for each habit per day

**Streak Calculation**
- Count consecutive days with 7+ habits complete
- Streak breaks if fewer than 5 completions
- Current streak and longest streak displayed

**Persistence**
- Anonymous: localStorage
- Logged in: Supabase
- Auto-sync on login

---

## 5. Products & Monetization

### 5.1 Product Catalog

| Product | Price | Description |
|---------|-------|-------------|
| Free Website | €0 | Full tracker, all sections |
| Notion Template | €1.99 | Full feature set per habit |
| Enhanced PDF Tracker | €4.99 | Printable with tips |
| Complete Package | €9.99 | Notion + PDF + meal guide |
| Branded Water Bottle | €12 | Dropship |
| Egg Timer | €15 | Dropship - 1/3/5 min |
| Training Tee - Men | €25 | Print-on-demand |
| Training Tee - Women | €25 | Print-on-demand |

### 5.2 Notion Template Features

| Habit | Feature | Implementation |
|-------|---------|----------------|
| Move Your Body | Exercise selector | Checkboxes for workout lines (A-D), exercises within each |
| Wet The Lips | Water tracking | +100ml/+500ml increments, 2.5L target, visual fill meter, reminders |
| Fuel Right | Macro targets | Input for Protein/Carbs/Fat (g), fill bars |
| Open Mind | Meditation timer | 10-minute timer with start/stop |
| Fresh Lungs | Non-smoking | "Smoke-Free Day" toggle, streak counter |
| Keep Walking | Step counter | Daily input, progress bar |
| Feed Your Brain | Book tracker | 5 book slots, pages read, progress % |
| Chill Out | Cold shower | Daily checkbox |
| Crispy Clarity | No alcohol | Daily checkbox |

**Design:** FIT50 branding (coral/teal), Larsim headings, progress dashboards, streak displays, encouraging completion messages, weekly review sections.

---

## 6. Build Phases

### Phase 1: Foundation (Week 1)

- Set up Next.js project with TypeScript
- Configure styling (Tailwind or preferred approach)
- Install Supabase client
- Create watercolour component library
- Implement PaperTexture with uploaded image
- Set up layout wrapper with responsive breakpoints

### Phase 2: Core Website (Week 2)

- Implement Hero section with split layout and marquee
- Build Calculator section with date logic
- Create Rules section with expandable cards
- Construct Workouts section with exercise data
- Design Shop section with product cards
- Build FAQ section with accordions
- Implement Footer with email capture
- Connect all sections with navigation

### Phase 3: Daily Tracker (Week 3)

- Create TrackerContext for state management
- Build 50-day grid component
- Implement habit checkboxes with completion logic
- Add streak calculation and display
- Implement localStorage persistence
- Build tracker UI with visual polish

### Phase 4: Authentication (Week 4)

- Set up Supabase project and database schema
- Implement Supabase Auth provider
- Create login/signup modals or pages
- Build sync logic (localStorage ↔ Supabase)
- Handle edge cases (new device sync, conflicts)
- Test authentication flows

### Phase 5: Products & Commerce (Week 5)

- Finalize Notion template with all features
- Create enhanced PDF tracker
- Set up Gumroad embed for digital products
- Add product links to shop section
- Implement email capture
- Build email collection flows

### Phase 6: Polish & Launch (Week 6)

- Comprehensive testing across devices
- Optimize watercolour canvas performance
- Implement error boundaries and fallbacks
- Configure deployment to Vercel
- Launch to public

---

## 7. Testing Strategy

### Functionality Testing

- Tracker state persistence (close/reopen browser)
- Streak calculation accuracy
- Date calculations (calculator)
- Authentication flows (login/logout/sync)
- Product links (external)

### Performance Testing

- Canvas rendering speed on mobile
- Page load times
- Memory usage during sessions

### User Acceptance Testing

- Recruit testers from target audience
- Complete 50-day simulation (or accelerated)
- Gather feedback on usability and motivation
- Iterate on design based on feedback

---

## 8. Launch Strategy

### Pre-Launch Checklist

- [ ] All website sections implemented and styled
- [ ] Daily tracker fully functional with localStorage
- [ ] Authentication working with Supabase
- [ ] Notion template created and tested
- [ ] PDF tracker created
- [ ] Gumroad products configured and tested
- [ ] Shop links functional
- [ ] Email capture integrated
- [ ] Mobile responsive verified
- [ ] Performance acceptable
- [ ] Domain configured, SSL active
- [ ] Analytics tracking configured

### Launch Channels

- Social media (Instagram, TikTok, Twitter)
- Email to personal network
- Reddit fitness communities
- Tommy Grainger cross-promotion

### Post-Launch Metrics

- Daily active tracker users
- Email signups per day
- Product purchases
- Social media engagement

---

## 9. Summary

FIT50 combines distinctive watercolour aesthetics with functional habit tracking to create a monetizable fitness challenge platform. The freemium model maximizes user acquisition while the product suite (Notion template, PDF tracker, merchandise) generates revenue from committed users.

**Core Principles:**

1. Maintain watercolour aesthetic as primary differentiator
2. Prioritize tracker functionality as core value delivery
3. Keep barriers low with optional authentication
4. Price competitively while generating meaningful margin
5. Build for launch readiness rather than indefinite development
