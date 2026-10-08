# 🥛 AMUL × STING ROSE — Enterprise Beverage Innovation Platform ⚡

> **Official Enterprise Pitch & Concept Prototype for GCMMF (Gujarat Co-operative Milk Marketing Federation Ltd.)**  
> An interactive high-performance WebGL/Canvas 3D animation website showcasing the groundbreaking fusion of pure homogenized Anand dairy milk and electrifying Sting energy.

---

## ✨ Features & Architecture

1. **300-Frame 3D Turntable & Scroll Canvas Engine**
   - High-performance, memory-optimized 60FPS dual-mode canvas renderer.
   - Interactive 360° direct drag orbit + automatic turntable spin toggle.
   - Custom synthesized Web Audio API sound design (can crack fizz, electric arc sweeps, and sub-bass resonance).

2. **AI Sensory Taste & Formulation Lab (`/api/ai/synthesize`)**
   - Dual-engine architecture: Google Gemini 2.5 Flash API with deterministic Neural Sensory Algorithm fallback.
   - Dynamic mood selector chips (Coding Marathon, Post-Workout, Sunset Rave, Executive Focus).
   - Real-time sliders for Caffeine, Dairy, Rose Attar, and Chill Temperature.
   - Integrated Web Speech API AI Beverage Sommelier voice narration.

3. **Live Cold-Chain IoT Telemetry Hub (`/api/coldchain/telemetry`)**
   - Live telemetry feed simulating GCMMF Anand Dairy Plant #4 (Vat Temp ~3.8°C, Nitrogen seal integrity 99.94%, 148 active Reefer fleet trucks).

4. **Interactive Orders & Cold-Chain Dispatch Drawer (`#orders-drawer`)**
   - Slide-out ledger accessible via floating right-edge tab and header button.
   - Real-time pre-order registration with cryptographic dispatch hashes (`CND-4C-...`).
   - 5-stage GPS Cold-Chain milestone tracking timeline.
   - Official printable GCMMF GST Tax Invoice generator with FSSAI license compliance (`10012021000071`).

5. **Cloud Ready & Supabase PostgreSQL Migration**
   - Built-in SQL migration script (`supabase_schema.sql`) with tables, enums, triggers, analytics views, and RLS policies.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/iliyaskittur124/Amul-Sting-Website.git
cd Amul-Sting-Website
npm install
```

### 2. Run Both Frontend & Backend
In terminal 1 (Express Backend API):
```bash
npm run server
```
*API will start on `http://localhost:5001`*

In terminal 2 (Vite Frontend):
```bash
npm run dev
```
*Frontend will start on `http://localhost:3000` (automatically proxies `/api` requests to port 5001)*

---

## ☁️ Deploying on Vercel

This repository is pre-configured for **seamless zero-configuration Vercel deployment**:

1. **Push your code to GitHub** (already done!).
2. Log into [vercel.com](https://vercel.com) and click **"Add New..." > "Project"**.
3. Import the repository: `iliyaskittur124/Amul-Sting-Website`.
4. Vercel automatically detects the configuration:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. *(Optional)* Add Environment Variables in Vercel settings:
   - `GEMINI_API_KEY`: *(Optional) Your Google Gemini API key for live AI generation*
6. Click **Deploy**!
   - Frontend is deployed to Vercel's global Edge CDN.
   - All `/api/*` endpoints are automatically handled by Vercel Serverless Functions (`api/index.js` via `vercel.json`).

---

## 🗄️ Database Setup (Supabase)

The complete PostgreSQL database schema is included in [`supabase_schema.sql`](./supabase_schema.sql):

1. Go to your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor**.
3. Paste the contents of `supabase_schema.sql` and click **Run**.
4. This creates:
   - `orders` (Dispatch ledger)
   - `ai_creations` (Formulation registry)
   - `order_milestones` (GPS cold-chain tracking events)
   - `coldchain_telemetry` (Anand plant sensor logs)
   - `v_executive_analytics` (Executive analytics view)
   - Row-Level Security (RLS) policies and seed records.

---

## 📜 Enterprise Compliance & Certification

* **FSSAI Central License:** `10012021000071`
* **Dietary Certification:** 100% Pure Vegetarian Green Dot
* **Brand Custodian:** Gujarat Co-operative Milk Marketing Federation Ltd. (GCMMF), Anand - 388001, Gujarat, India.
