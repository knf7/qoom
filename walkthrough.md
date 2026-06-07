# Qoom Product Launch & Walkthrough Guide (Demo-Day Optimized)

Welcome to **Qoom**, a production-grade, security-hardened, multi-agent AI innovation operating system. The platform is **100% compile-complete** and optimized for live presentations, hackathons, and real-world deployment.

---

## 🗺️ Hardened Monorepo Architecture

```
qoom/
├── apps/
│   ├── web/                         # React 18 frontend (Vite, Tailwind, Zustand, DOMPurify)
│   │   ├── src/
│   │   │   ├── store/useStore.ts    # Global state store for session & real-time websocket scan events
│   │   │   └── pages/
│   │   │       ├── Landing.tsx      # Space hero page with 5-agent stack overview
│   │   │       ├── Auth.tsx         # Sign-in/up gates with Framer Motion transitions
│   │   │       ├── Dashboard.tsx    # Register pitch concepts & deploy scans
│   │   │       ├── ScanResult.tsx   # Live step-by-step progress timeline & verdict metrics
│   │   │       ├── Passport.tsx     # Publicly shareable innovation passport cards
│   │   │       └── Analytics.tsx    # Distributed allocation percentages & indices
│   │   └── Dockerfile               # Production multi-stage build serving React via secure Nginx
│   │
│   └── api/                         # NestJS core application server
│       ├── src/
│       │   ├── main.ts              # Server boot: sets CORS, Helmet, pipes & filters
│       │   ├── app.module.ts        # App imports registering secure rate limiters
│       │   ├── ai/gemini.service.ts # Gemini API integration with local high-fidelity fallback
│       │   ├── agents/              # Dimension executors (Market, Moat, Tech, etc.)
│       │   ├── auth/                # Hashed auth & session services
│       │   ├── database/            # Database configurations & soft delete middlewares
│       │   ├── queue/               # Resilient out-of-process job executor with fallbacks
│       │   ├── websocket/           # WebSocket gateway pushing status events
│       │   ├── modules/scan.service.ts # Core Rest endpoints & firewall validations
│       │   └── security/            # JWT guards, rate limiters, user decorators
│       └── Dockerfile               # Production compilation runner
│
├── packages/
│   ├── types/index.ts               # Shared TypeScript contracts & Zod schemas
│   ├── prompts/index.ts             # Hardened system prompts enforcing JSON format
│   ├── security/index.ts            # Custom PromptFirewall and ResponseValidator
│   └── ui/index.ts                  # Shared design system HSL tokens & glassmorphic guidelines
│
├── docker-compose.yml               # One-click deployment (PG, Redis, API, Web)
└── .github/workflows/ci.yml         # CI workflow tracking lints, builds, and audits
```

---

## ⚡ 1. Monorepo Alignment (NPM Workspaces)
To guarantee seamless setup out-of-the-box without requiring external global shell packages (like `pnpm`), Qoom is configured to use native **NPM Workspaces**. 
- Symbolic linking between `@qoom/types`, `@qoom/prompts`, `@qoom/security`, `@qoom/ui`, and applications is managed natively.
- All typescript declaration mapping mismatches (`TS5069`) have been successfully resolved by disabling declaration output maps inside end-applications.

## 🔒 2. Proactive Prompts Firewall & Inputs Sanitizer
- User pitch inputs are parsed by `PromptFirewallService.validatePrompt`.
- It enforces strict length limits (**2,000 characters**) to defend against buffer/compute exhaustion.
- It tests pitches against heuristical regular expression signatures blocking jailbreak, prompt leakage, and admin overrides.
- All incoming JSON bodies are recursively parsed by `SanitizerInterceptor` to strip HTML/script tags and block XSS/injections.

## 🎯 3. Resilient Gemini API & Live Demo Fallback
- **Cloud Mode**: If a valid `GEMINI_API_KEY` is provided inside your `.env`, Qoom queries Google's fast, structured `"gemini-1.5-flash"` model, applying exponential backoff retry algorithms to recover from sluggish network requests.
- **Demo-Day Fallback Mode**: If `GEMINI_API_KEY` is missing or left as the default placeholder, the backend **will not crash**. Instead, `GeminiService` arms a high-fidelity local AI evaluator.
  - It simulates active network latency (a realistic `1,500ms` delay) so that progress timelines, skeleton loading states, and "AI thinking indicators" on the dashboard animate.
  - It analyzes the pitch context: strong ideas (e.g. including terms like "AI", "SaaS", "marketplace") compile a highly detailed positive score; weak ideas (e.g. "selling sand") compile a critical KILL verdict; otherwise, it returns a PIVOT scorecard—all structured to match Zod JSON specifications.
  - **Verdict Rule**: Weighted average score $\ge 75$ returns **BUILD** (Green glow); $50 - 74$ returns **PIVOT** (Orange glow); $<50$ returns **KILL** (Rose glow).

## 🗄️ 4. Supabase DB connection & Resilient Queue fallback
- **Database Connection**: Database operations are routed through Prisma. Registering a database creates transactional writes, indexed lookups, and applies a custom middleware converting delete actions into secure soft deletes.
- **Queue Fallback**: In production, scans execute asynchronously out-of-process via BullMQ to avoid thread blockages. Because local Docker is offline, the service **automatically degrades to a secure in-memory background scheduler**, ensuring local runs function without requiring Redis.

## 🧠 5. Master Production Prompt (V3.1 Real) & Pre-Flight Clarification OS
* **Stage 0 Pre-Flight Filter**: Validates raw inputs first. If confidence $<0.6$ or core concepts are missing, the orchestrator halts agent execution immediately, bypassing costly API calls, and generates a structured `NEEDS_CLARIFICATION` payload.
* **Stage 1 Pitch Normalization**: Structures pitches into standard schema `{ problem, target_user, solution, category, business_model_guess }`.
* **Stage 2 Isolation Dispatch**: Specialized agents receive only this normalized structured JSON. This prevents jailbreaks and guarantees uniform analytical context.
* **Stage 4 Confidence Safeguards**: Computes score only if agent consensus average confidence $\ge 0.7$, otherwise outputs an `INCOMPLETE_IDEA` and halts with custom development questions.
* **Dynamic Clarification HUD Panel**: When a scan triggers `NEEDS_CLARIFICATION`, the UI switches to a glowing amber HUD listing specific **Missing Pillars** and **Venture Development Questions**, with an easy one-click action to refine the concept.
* **Consensus Synthesis Highlights**: Successful scans now display beautiful, dedicated cards detailing compiled **Core Strengths**, **Vulnerabilities & Risks**, and **Immediate Action Steps** from the investment partner synthesis.

---

## 🚀 One-Click Local Launch Instructions

To fire up Qoom locally, open your macOS terminal and run:

### 1. Provision Environment Variables
Copy `.env.example` into `.env` (already prepared for you in the monorepo root):
```bash
# Open the .env file and paste in your credentials
# (Provide your Supabase DATABASE_URL and optional GEMINI_API_KEY)
```

### 2. Run the Development Workspace
NPM Workspaces will boot both the NestJS API and React Client concurrently in development hot-reload mode:
```bash
npm run dev
```

### 3. Access Qoom
- **React Client Portal**: Open [http://localhost:5173](http://localhost:5173) to analyze your first idea!
- **NestJS API Server**: Listens on [http://localhost:3001](http://localhost:3001).

---

## 🌐 Production Deployment

The platform is fully configured and live in production:

### 1. Backend API (Render)
- **Deployment URL**: `https://qoom.onrender.com`
- **Database**: Connected to **Supabase** via transaction pooler (`aws-1-ap-southeast-1.pooler.supabase.com:6543`).
- **Caching & Queue**: Integrated with **Upstash Redis** (`optimal-iguana-144252.upstash.io:6379`).
- **Auto-deployment**: Enabled on Render linked to GitHub repo `knf7/qoom` (branch `main`).

### 2. Frontend Client (Vercel)
- **Deployment URL**: `https://qoom-web.vercel.app`
- **Build Settings**: Uses `npm run build` and automatically resolves the API URL to `https://qoom.onrender.com` when run in production.
- **Auto-deployment**: Automatically redeploys on every git push to the `main` branch.

---

## 🎨 واجهة وتصميم الابتكار الحديث (Redesign V3.3)

تم تحسين واجهة المنصة بالكامل لتكون متوافقة مع المتطلبات الجديدة:
1. **تصميم الصفحة الرئيسية الجديد (Landing Page & Input Box):**
   - في حال كان المستخدم مسجلاً للدخول، تظهر له لوحة مدخلات تفاعلية `ThinkingCanvas` في الصفحة الرئيسية مباشرة لكتابة فكرته والبدء في الفحص فوراً.
   - في حال عدم تسجيل الدخول، تظهر أزرار الدعوة للإجراء (CTA) الافتراضية مع زر تسجيل الدخول.

2. **تعديل وتنسيق الهيدر للغات اليمين-إلى-يسار (RTL Navigation bar):**
   - تم تعديل ترتيب عناصر الهيدر بالكامل ليكون ملائماً للـ RTL: الشعار باليمين، وتفاصيل الحساب باليسار (فوق يسار).
   - إظهار زر سريع للانتقال إلى "المشاريع كاملة" (لوحة التحكم) في أعلى اليسار.
   - إظهار رصيد تحليلات المستخدم المتوفر (`scanCredits`) بجانب صورته الرمزية في الهيدر.
   - حساب الأحرف الأولى للمستخدم ديناميكياً وعرضها كرمز تعبيري شخصي بدلاً من الرمز الثابت.

3. **تجاوز القيود اليومية بنظام النقاط (Credits Limit Bypass):**
   - عند إطلاق فحص جديد: إذا كان لدى المستخدم رصيد مدفوع (`scanCredits > 0`)، يتم خصم نقطة واحدة وتخطي حدود الـ 24 ساعة اليومية فوراً.
   - إذا لم يكن لديه رصيد، يُطبق القيد المجاني المعتاد (2 فحص أولي، ثم فحص واحد كل 24 ساعة).
   - لا تُحتسب التحليلات الفاشلة (`FAILED`) ضمن الحدود المفروضة.

## 🎨 تحسينات الواجهة والتحليلات العامة (Redesign V3.4)

تمت معالجة جميع الملاحظات بنجاح وإعادة تنظيم الواجهات لتكون استجابتها وجودتها في أعلى مستوى:

1. **استجابة الهيدر على الهواتف (TopNav Mobile Responsiveness):**
   - تم إخفاء أزرار التنقل المركزية (المشاريع، مساعد الأفكار، التحليلات العامة) على الشاشات الصغيرة لتجنب التداخل والتراص على الهواتف.
   - تم دمج خيار "مساعد الأفكار (Co-Pilot)" بالكامل داخل قائمة الملف الشخصي المنسدلة لضمان إمكانية التنقل السلس لجميع الصفحات من الهواتف المحمولة.
   - عند عدم تسجيل الدخول، يتم إظهار زر "تسجيل الدخول" في القائمة العلوية للهواتف لتسهيل دخول المستخدمين.

2. **محاذاة القوائم والنصوص العربية من اليمين (RTL List Alignment):**
   - تم تعديل كروت نتائج الوكلاء (ما أعرفه وما لا أعرفه) وقوائم التوليفة الاستراتيجية (أولوية عالية، متوسطة، منخفضة) في صفحة `ScanResult.tsx`.
   - تم ضبط اتجاه تدفق النصوص ليكون RTL بالكامل ومحاذاته لليمين `text-right` و `dir="rtl"`.
   - تم تعديل ترتيب الـ DOM لتظهر النقاط الملونة `•` (أخضر، برتقالي، أحمر) على يمين النص بشكل صحيح ومتناسق بدلاً من ظهورها في أقصى اليسار.

3. **إظهار وحساب تحليلات المشاريع (Portfolio Analytics Calculations):**
   - تم تحديث آلية حساب الإحصائيات التراكمية في صفحة `Analytics.tsx` لدعم مطابقة حالات الـ `verdict` المخزنة بقاعدة البيانات (`PASS`, `FAIL`, `PARTIAL`, `FAILED`) مع التوزيع الاستراتيجي للمحفظة (`BUILD`, `PIVOT`, `KILL`).
   - تم ضبط شارات وتلوين أحدث عمليات الفحص لتظهر النصوص والقرارات بشكل صحيح ومترجم للغة العربية، لتتطابق تماماً مع معايير الـ V3 الفعالة وتظهر الإحصائيات بدقة (تجنب القيمة 0%).

