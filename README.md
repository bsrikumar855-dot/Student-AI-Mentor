# Drishta Frontend — Student & Faculty Pathways

Drishta is an explainable student-mentorship dashboard built for transparency, natural language advice, and oversight governance.

---

## 🎨 Theme & Tokens Location
All layout style tokens, transparent frosted glass values, color overrides, and noise layers are defined centrally in CSS using the Tailwind CSS v4 `@theme` directive:
- **Location:** [`src/design/tokens.css`](file:///c:/Users/SANTHEESH/OneDrive/Documents/Desktop/Student-AI-  Tutor/src/design/tokens.css)

Theme variables include:
- `--font-display`: Fraunces (serif for greeting headers)
- `--font-sans`: Inter (UI text, buttons, body copy)
- `--font-mono`: IBM Plex Mono (for core-computed metrics and scores)
- `--color-decide`: `#3E4A9E` (Indigo — deterministic calculations indicator)
- `--color-speak`: `#C1793A` (Amber — AI verbal layers phrasing)
- `--color-guard`: `#276B52` (Green — oversight intervention checks)
- `--color-risk-high`: `#B0434F` (Clay — flagging a student status alert, never crash-red)

---

## 🔌 Mock to Real API Swap Contract
Drishta is architected to separate the networking boundary from our view components. Transitioning to a live backend is a matter of changing configuration:

1. **Disable MSW Worker:**
   In [`src/main.tsx`](file:///c:/Users/SANTHEESH/OneDrive/Documents/Desktop/Student-AI-  Tutor/src/main.tsx), comment out the mock setup wrapper start trigger:
   ```typescript
   // Comment this block to disable browser mocks:
   // startMockServiceWorker().then(() => { ... })
   
   // Direct mount:
   ReactDOM.createRoot(document.getElementById('root')!).render(
     <React.StrictMode>
       <AppProviders>
         <AppRouter />
       </AppProviders>
     </React.StrictMode>
   );
   ```

2. **Redirect Client Endpoint:**
   In [`src/api/client.ts`](file:///c:/Users/SANTHEESH/OneDrive/Documents/Desktop/Student-AI-  Tutor/src/api/client.ts), update the base URL string:
   ```typescript
   // Change from relative intercept to production server URL:
   const BASE_URL = 'https://api.drishta.university.edu';
   ```

3. **No Component Rewrites:**
   Every API hook (in `src/api/hooks.ts`) and fetch query (in `src/api/client.ts`) remains unchanged. The Zod schemas will parse the live server responses directly.

---

## ⚙️ Commands Guide

### 1. Install Packages
```bash
npm install
```

### 2. Start Local Development Server
Starts the Vite server on port 5173 with MSW capturing fetches:
```bash
npm run dev
```

### 3. Compile Production Bundle
Validates strict TypeScript types and outputs distribution bundle:
```bash
npm run build
```

### 4. Run Primitives & SM-2 Tests
Runs the Vitest unit suites for primitives class validation and SM-2 arithmetic logic:
```bash
npm run test
```

### 5. Run E2E Integration Journeys
Runs Playwright E2E tests (automatically launches the web server internally, runs sequential Chrome head checks, and outputs results):
```bash
npm run test:e2e
```
