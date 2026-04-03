import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ── Reference Data ──────────────────────────────────────────────────────────

const AGENCIES = [
  { name: "Nexus Digital Group", slug: "nexus-digital", email: "contact@nexusdigital.com", phone: "+1 (555) 100-2000", address: "350 5th Avenue, New York, NY 10118", plan: "enterprise", maxClients: 50 },
  { name: "Peak Performance Media", slug: "peak-performance", email: "info@peakmedia.com", phone: "+44 20 7946 0958", address: "71 Queen Victoria St, London EC4V 4AY", plan: "professional", maxClients: 20 },
];

const CLIENTS = [
  { name: "TechVision Solutions", slug: "techvision", industry: "Technology", website: "techvision.io", email: "ops@techvision.io", phone: "+1 (555) 201-3000", status: "active" },
  { name: "GreenLeaf Organics", slug: "greenleaf", industry: "Food & Beverage", website: "greenleaf.com", email: "analytics@greenleaf.com", phone: "+1 (555) 301-4000", status: "active" },
  { name: "UrbanFit Apparel", slug: "urbanfit", industry: "Retail / Fashion", website: "urbanfit.co", email: "marketing@urbanfit.co", phone: "+1 (555) 401-5000", status: "active" },
  { name: "CloudSync SaaS", slug: "cloudsync", industry: "SaaS / Software", website: "cloudsync.io", email: "data@cloudsync.io", phone: "+1 (555) 501-6000", status: "active" },
  { name: "MediCare Plus", slug: "medicareplus", industry: "Healthcare", website: "medicareplus.com", email: "ops@medicareplus.com", phone: "+1 (555) 601-7000", status: "active" },
  { name: "FinanceHub Capital", slug: "financehub", industry: "Financial Services", website: "financehub.com", email: "reports@financehub.com", phone: "+1 (555) 701-8000", status: "active" },
  { name: "TravelWise Adventures", slug: "travelwise", industry: "Travel & Hospitality", website: "travelwise.com", email: "digital@travelwise.com", phone: "+1 (555) 801-9000", status: "active" },
  { name: "EduLearn Academy", slug: "edulearn", industry: "Education", website: "edulearn.org", email: "tech@edulearn.org", phone: "+1 (555) 901-0001", status: "inactive" },
  { name: "AutoDrive Motors", slug: "autodrive", industry: "Automotive", website: "autodrive.com", email: "marketing@autodrive.com", phone: "+49 30 1234 5678", status: "active" },
];

const SOURCES_PER_CLIENT = [
  [
    { type: "google_analytics", platform: "Google Analytics 4", name: "GA4 - Main Property" },
    { type: "google_ads", platform: "Google Ads", name: "Google Ads - Search" },
    { type: "facebook_ads", platform: "Meta Ads", name: "Meta Ads - Conversion" },
  ],
  [
    { type: "google_analytics", platform: "Google Analytics 4", name: "GA4 - Ecommerce" },
    { type: "facebook_ads", platform: "Meta Ads", name: "Meta Ads - Awareness" },
    { type: "linkedin", platform: "LinkedIn", name: "LinkedIn - B2B Leads" },
  ],
  [
    { type: "google_analytics", platform: "Google Analytics 4", name: "GA4 - Storefront" },
    { type: "google_ads", platform: "Google Ads", name: "Google Ads - Shopping" },
    { type: "facebook_ads", platform: "Meta Ads", name: "Meta Ads - Retargeting" },
  ],
  [
    { type: "google_analytics", platform: "Google Analytics 4", name: "GA4 - App" },
    { type: "facebook_ads", platform: "Meta Ads", name: "Meta Ads - App Installs" },
    { type: "google_ads", platform: "Google Ads", name: "Google Ads - Display" },
  ],
  [
    { type: "google_analytics", platform: "Google Analytics 4", name: "GA4 - Portal" },
    { type: "google_ads", platform: "Google Ads", name: "Google Ads - Health" },
    { type: "csv_import", platform: "Manual Import", name: "Patient Metrics Import" },
  ],
  [
    { type: "google_analytics", platform: "Google Analytics 4", name: "GA4 - Corporate" },
    { type: "linkedin", platform: "LinkedIn", name: "LinkedIn - Thought Leadership" },
    { type: "google_ads", platform: "Google Ads", name: "Google Ads - Finance" },
  ],
  [
    { type: "google_analytics", platform: "Google Analytics 4", name: "GA4 - Booking Engine" },
    { type: "facebook_ads", platform: "Meta Ads", name: "Meta Ads - Retargeting" },
    { type: "google_ads", platform: "Google Ads", name: "Google Ads - Travel" },
  ],
  [
    { type: "google_analytics", platform: "Google Analytics 4", name: "GA4 - LMS" },
    { type: "google_ads", platform: "Google Ads", name: "Google Ads - Education" },
  ],
  [
    { type: "google_analytics", platform: "Google Analytics 4", name: "GA4 - Dealership" },
    { type: "google_ads", platform: "Google Ads", name: "Google Ads - Auto" },
    { type: "facebook_ads", platform: "Meta Ads", name: "Meta Ads - Dealership" },
  ],
];

const COUNTRIES = ["United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Netherlands", "Spain", "Italy", "Japan"];
const DEVICES = ["desktop", "mobile", "tablet"];

// ── Per-Vertical Profiles ───────────────────────────────────────────────────
// Each industry has unique GA4 traffic, conversion, and ad spend profiles.

interface VerticalProfile {
  sessions: number;
  pageviewsPerSession: number;
  newUserRate: number; // 0-1 proportion of sessions that are new users
  bounceRate: number; // 0-100
  avgSessionDuration: number; // seconds
  conversionRate: number; // 0-1
  avgRevenuePerConversion: number; // dollars
  // Ad metrics (per ad source)
  dailyImpressions: number;
  ctr: number; // 0-1
  cpc: number; // dollars
  adConversionRate: number; // 0-1
  dailySpend: number; // dollars
  // Growth profile
  growthRate: number; // 0-1 annual growth factor
  seasonality: number; // 0-1 amplitude of seasonal variation
  seasonPeakMonth: number; // 0-11 month of peak season
}

const VERTICALS: Record<string, VerticalProfile> = {
  Technology: {
    sessions: 4200, pageviewsPerSession: 3.2, newUserRate: 0.45,
    bounceRate: 35, avgSessionDuration: 210, conversionRate: 0.042, avgRevenuePerConversion: 145,
    dailyImpressions: 85000, ctr: 0.032, cpc: 4.50, adConversionRate: 0.028, dailySpend: 3500,
    growthRate: 0.18, seasonality: 0.08, seasonPeakMonth: 9,
  },
  "Food & Beverage": {
    sessions: 2100, pageviewsPerSession: 4.5, newUserRate: 0.55,
    bounceRate: 42, avgSessionDuration: 155, conversionRate: 0.028, avgRevenuePerConversion: 65,
    dailyImpressions: 42000, ctr: 0.028, cpc: 2.10, adConversionRate: 0.022, dailySpend: 1800,
    growthRate: 0.10, seasonality: 0.18, seasonPeakMonth: 11,
  },
  "Retail / Fashion": {
    sessions: 5500, pageviewsPerSession: 5.8, newUserRate: 0.52,
    bounceRate: 38, avgSessionDuration: 195, conversionRate: 0.038, avgRevenuePerConversion: 85,
    dailyImpressions: 120000, ctr: 0.041, cpc: 1.80, adConversionRate: 0.032, dailySpend: 5200,
    growthRate: 0.14, seasonality: 0.30, seasonPeakMonth: 10,
  },
  "SaaS / Software": {
    sessions: 3100, pageviewsPerSession: 4.0, newUserRate: 0.38,
    bounceRate: 28, avgSessionDuration: 280, conversionRate: 0.035, avgRevenuePerConversion: 320,
    dailyImpressions: 65000, ctr: 0.025, cpc: 8.50, adConversionRate: 0.018, dailySpend: 4200,
    growthRate: 0.25, seasonality: 0.05, seasonPeakMonth: 0,
  },
  Healthcare: {
    sessions: 1600, pageviewsPerSession: 3.8, newUserRate: 0.60,
    bounceRate: 48, avgSessionDuration: 135, conversionRate: 0.015, avgRevenuePerConversion: 180,
    dailyImpressions: 28000, ctr: 0.018, cpc: 6.20, adConversionRate: 0.012, dailySpend: 1500,
    growthRate: 0.08, seasonality: 0.04, seasonPeakMonth: 0,
  },
  "Financial Services": {
    sessions: 2800, pageviewsPerSession: 3.5, newUserRate: 0.40,
    bounceRate: 36, avgSessionDuration: 245, conversionRate: 0.025, avgRevenuePerConversion: 280,
    dailyImpressions: 55000, ctr: 0.022, cpc: 12.00, adConversionRate: 0.016, dailySpend: 3800,
    growthRate: 0.12, seasonality: 0.06, seasonPeakMonth: 1,
  },
  "Travel & Hospitality": {
    sessions: 6500, pageviewsPerSession: 6.2, newUserRate: 0.58,
    bounceRate: 40, avgSessionDuration: 205, conversionRate: 0.055, avgRevenuePerConversion: 210,
    dailyImpressions: 160000, ctr: 0.038, cpc: 1.50, adConversionRate: 0.035, dailySpend: 5800,
    growthRate: 0.20, seasonality: 0.45, seasonPeakMonth: 6,
  },
  Education: {
    sessions: 1100, pageviewsPerSession: 4.2, newUserRate: 0.50,
    bounceRate: 46, avgSessionDuration: 260, conversionRate: 0.018, avgRevenuePerConversion: 95,
    dailyImpressions: 18000, ctr: 0.015, cpc: 3.00, adConversionRate: 0.010, dailySpend: 800,
    growthRate: 0.15, seasonality: 0.35, seasonPeakMonth: 8,
  },
  Automotive: {
    sessions: 3800, pageviewsPerSession: 5.0, newUserRate: 0.48,
    bounceRate: 43, avgSessionDuration: 175, conversionRate: 0.020, avgRevenuePerConversion: 480,
    dailyImpressions: 95000, ctr: 0.029, cpc: 5.50, adConversionRate: 0.014, dailySpend: 4800,
    growthRate: 0.09, seasonality: 0.15, seasonPeakMonth: 3,
  },
};

// Country weights vary per source — US-dominant but each vertical has a different mix
const COUNTRY_WEIGHTS: Record<string, Record<string, number>> = {
  Technology: { "United States": 0.32, "United Kingdom": 0.15, "Germany": 0.10, "France": 0.06, Canada: 0.08, "Australia": 0.04, "Netherlands": 0.05, "Spain": 0.04, "Italy": 0.04, "Japan": 0.12 },
  "Food & Beverage": { "United States": 0.45, "United Kingdom": 0.12, "Germany": 0.08, "France": 0.10, Canada: 0.10, "Australia": 0.03, "Netherlands": 0.03, "Spain": 0.04, "Italy": 0.03, "Japan": 0.02 },
  "Retail / Fashion": { "United States": 0.38, "United Kingdom": 0.18, "Germany": 0.08, "France": 0.10, Canada: 0.06, "Australia": 0.04, "Netherlands": 0.03, "Spain": 0.05, "Italy": 0.04, "Japan": 0.04 },
  "SaaS / Software": { "United States": 0.40, "United Kingdom": 0.14, "Germany": 0.08, "France": 0.05, Canada: 0.07, "Australia": 0.06, "Netherlands": 0.05, "Spain": 0.03, "Italy": 0.03, "Japan": 0.09 },
  Healthcare: { "United States": 0.55, "United Kingdom": 0.10, "Germany": 0.06, "France": 0.04, Canada: 0.08, "Australia": 0.02, "Netherlands": 0.03, "Spain": 0.03, "Italy": 0.02, "Japan": 0.07 },
  "Financial Services": { "United States": 0.35, "United Kingdom": 0.20, "Germany": 0.08, "France": 0.05, Canada: 0.06, "Australia": 0.05, "Netherlands": 0.05, "Spain": 0.04, "Italy": 0.03, "Japan": 0.09 },
  "Travel & Hospitality": { "United States": 0.28, "United Kingdom": 0.16, "Germany": 0.10, "France": 0.12, Canada: 0.06, "Australia": 0.08, "Netherlands": 0.04, "Spain": 0.07, "Italy": 0.05, "Japan": 0.04 },
  Education: { "United States": 0.42, "United Kingdom": 0.14, "Germany": 0.08, "France": 0.06, Canada: 0.09, "Australia": 0.05, "Netherlands": 0.04, "Spain": 0.03, "Italy": 0.03, "Japan": 0.06 },
  Automotive: { "United States": 0.30, "United Kingdom": 0.10, "Germany": 0.18, "France": 0.08, Canada: 0.05, "Australia": 0.03, "Netherlands": 0.04, "Spain": 0.05, "Italy": 0.05, "Japan": 0.12 },
};

// Device weights also vary per vertical
const DEVICE_WEIGHTS: Record<string, Record<string, number>> = {
  Technology: { desktop: 0.55, mobile: 0.35, tablet: 0.10 },
  "Food & Beverage": { desktop: 0.40, mobile: 0.50, tablet: 0.10 },
  "Retail / Fashion": { desktop: 0.38, mobile: 0.52, tablet: 0.10 },
  "SaaS / Software": { desktop: 0.65, mobile: 0.28, tablet: 0.07 },
  Healthcare: { desktop: 0.50, mobile: 0.42, tablet: 0.08 },
  "Financial Services": { desktop: 0.58, mobile: 0.34, tablet: 0.08 },
  "Travel & Hospitality": { desktop: 0.35, mobile: 0.55, tablet: 0.10 },
  Education: { desktop: 0.48, mobile: 0.44, tablet: 0.08 },
  Automotive: { desktop: 0.42, mobile: 0.48, tablet: 0.10 },
};

// Campaign performance weights — each campaign has a different efficiency
const CAMPAIGN_WEIGHTS: Record<string, { impressionsShare: number; ctrMultiplier: number; convMultiplier: number; spendShare: number }> = {
  "Brand Awareness": { impressionsShare: 0.30, ctrMultiplier: 0.7, convMultiplier: 0.5, spendShare: 0.20 },
  "Retargeting": { impressionsShare: 0.15, ctrMultiplier: 1.8, convMultiplier: 2.5, spendShare: 0.25 },
  "Seasonal Sale": { impressionsShare: 0.25, ctrMultiplier: 1.2, convMultiplier: 1.6, spendShare: 0.25 },
  "Product Launch": { impressionsShare: 0.18, ctrMultiplier: 1.4, convMultiplier: 1.8, spendShare: 0.20 },
  "Newsletter Signup": { impressionsShare: 0.07, ctrMultiplier: 0.9, convMultiplier: 1.2, spendShare: 0.05 },
  "Webinar Promo": { impressionsShare: 0.05, ctrMultiplier: 1.1, convMultiplier: 1.4, spendShare: 0.05 },
};

// ── Utilities ───────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dateRange(startStr: string, endStr: string): Date[] {
  const dates: Date[] = [];
  const current = new Date(startStr);
  const end = new Date(endStr);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function growthFactor(day: number, totalDays: number, annualRate: number): number {
  // Smooth exponential growth over the period
  return Math.pow(1 + annualRate, day / 365);
}

function seasonalFactor(month: number, peakMonth: number, amplitude: number): number {
  // Sinusoidal seasonal pattern peaking at peakMonth
  const offset = (month - peakMonth + 12) % 12;
  return 1 + amplitude * Math.cos((2 * Math.PI * offset) / 12);
}

// ── Main Seed ───────────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding DataBridge Analytics database...\n");

  // Agencies
  console.log("Creating agencies...");
  const agencies = await Promise.all(AGENCIES.map((a) => db.agency.create({ data: a })));

  // Clients
  console.log("Creating clients...");
  const clients = await Promise.all(
    CLIENTS.map((c, i) =>
      db.client.create({ data: { ...c, agencyId: i < 5 ? agencies[0].id : agencies[1].id } })
    )
  );

  // Users
  console.log("Creating users...");
  const users = await Promise.all([
    db.user.create({ data: { email: "admin@databridge.io", password: "$2b$10$placeholder_hash_for_demo", firstName: "Sarah", lastName: "Chen", role: "SUPER_ADMIN", isActive: true } }),
    db.user.create({ data: { email: "marie@nexusdigital.com", password: "$2b$10$placeholder_hash_for_demo", firstName: "Marie", lastName: "Dubois", role: "AGENCY_ADMIN", agencyId: agencies[0].id, isActive: true } }),
    db.user.create({ data: { email: "james@peakmedia.com", password: "$2b$10$placeholder_hash_for_demo", firstName: "James", lastName: "Wilson", role: "AGENCY_ADMIN", agencyId: agencies[1].id, isActive: true } }),
    ...clients.slice(0, 4).map((c) =>
      db.user.create({ data: { email: `analyst@${c.slug}.com`, password: "$2b$10$placeholder_hash_for_demo", firstName: "Analyst", lastName: c.name.split(" ")[0], role: "SME", agencyId: c.agencyId, isActive: true } })
    ),
    ...clients.slice(4, 8).map((c) =>
      db.user.create({ data: { email: `ops@${c.slug}.com`, password: "$2b$10$placeholder_hash_for_demo", firstName: "Operator", lastName: c.name.split(" ")[0], role: "SME", agencyId: c.agencyId, isActive: true } })
    ),
  ]);

  // Data Sources
  console.log("Creating data sources...");
  const allSources: { id: string; clientIdx: number; type: string }[] = [];
  for (let ci = 0; ci < clients.length; ci++) {
    const sources = SOURCES_PER_CLIENT[ci] || SOURCES_PER_CLIENT[0];
    for (const src of sources) {
      const created = await db.dataSource.create({
        data: {
          ...src,
          accountId: `ACC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: clients[ci].status === "active" ? "active" : "paused",
          lastSync: clients[ci].status === "active" ? new Date(Date.now() - Math.random() * 86400000 * 2) : null,
          syncFrequency: src.type === "google_ads" ? "hourly" : "daily",
          clientId: clients[ci].id,
        },
      });
      allSources.push({ id: created.id, clientIdx: ci, type: created.type });
    }
  }

  // Data Points
  console.log(`Generating coherent data points for ${allSources.length} sources...`);
  const dates = dateRange("2025-01-01", "2026-04-30");
  const totalDays = dates.length;
  let totalPoints = 0;
  const BATCH_SIZE = 5000;
  let batch: Record<string, string | number | Date>[] = [];

  for (let si = 0; si < allSources.length; si++) {
    const src = allSources[si];
    const ci = src.clientIdx;
    const client = CLIENTS[ci];
    const profile = VERTICALS[client.industry] || VERTICALS.Technology;
    const rng = seededRandom(si * 10000 + 42);
    const isActive = client.status === "active";

    // Source-specific modifier (different sources for same client get different traffic shares)
    const sourceShare = src.type === "google_analytics" ? 1.0
      : src.type === "google_ads" ? 0.7
      : src.type === "facebook_ads" ? 0.6
      : src.type === "linkedin" ? 0.35
      : 0.5; // csv_import

    // Per-client unique noise base so each client differs
    const clientNoise = 0.85 + rng() * 0.30;

    for (let di = 0; di < totalDays; di++) {
      const date = dates[di];
      const dayOfWeek = date.getDay();
      const month = date.getMonth();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendFactor = isWeekend ? (profile.industry === "Travel & Hospitality" ? 1.2 : 0.65) : 1.0;

      const grow = growthFactor(di, totalDays, profile.growthRate);
      const season = seasonalFactor(month, profile.seasonPeakMonth, profile.seasonality);

      // Small daily random noise (autocorrelated — uses previous day's noise)
      const dailyNoise = () => clamp(0.82 + rng() * 0.36, 0.6, 1.4);
      const noise = dailyNoise() * clientNoise;

      // If client is inactive after a certain date, reduce to near-zero
      const activityFactor = isActive ? 1.0 : (di < 200 ? 1.0 : 0.05);

      const baseFactor = weekendFactor * grow * season * noise * activityFactor;

      // ── GA4 metrics ──────────────────────────────────────────────────────
      if (src.type === "google_analytics" || src.type === "csv_import") {
        const sessions = Math.round(profile.sessions * sourceShare * baseFactor);
        const pageviews = Math.round(sessions * profile.pageviewsPerSession * (0.9 + rng() * 0.2));
        const users = Math.round(sessions * profile.newUserRate + sessions * (1 - profile.newUserRate) * 0.75);
        const bounceRate = clamp(profile.bounceRate + (rng() - 0.5) * 12, 15, 75);
        const avgSessionDuration = clamp(profile.avgSessionDuration + (rng() - 0.5) * 60, 40, 500);
        const conversions = Math.round(sessions * profile.conversionRate * (0.7 + rng() * 0.6));
        const revenue = Math.round(conversions * profile.avgRevenuePerConversion * (0.8 + rng() * 0.4) * 100) / 100;

        const gaMetrics = [
          { metric: "sessions", value: sessions },
          { metric: "pageviews", value: pageviews },
          { metric: "users", value: users },
          { metric: "bounceRate", value: Math.round(bounceRate * 100) / 100 },
          { metric: "avgSessionDuration", value: Math.round(avgSessionDuration) },
          { metric: "conversions", value: conversions },
          { metric: "revenue", value: revenue },
        ];

        for (const { metric, value } of gaMetrics) {
          batch.push({ sourceId: src.id, metric, value, date, device: "all", country: "", campaign: "" });
          totalPoints++;
        }

        // Device breakdown every 3 days
        if (di % 3 === 0) {
          const dw = DEVICE_WEIGHTS[client.industry] || DEVICE_WEIGHTS.Technology;
          for (const device of DEVICES) {
            const df = dw[device];
            const dSessions = Math.round(sessions * df * (0.9 + rng() * 0.2));
            const dPageviews = Math.round(dSessions * profile.pageviewsPerSession * (0.9 + rng() * 0.2));
            const dUsers = Math.round(dSessions * profile.newUserRate + dSessions * (1 - profile.newUserRate) * 0.75);
            const dBounce = clamp(profile.bounceRate + (rng() - 0.5) * 15 + (device === "mobile" ? 5 : -3), 15, 80);
            const dDuration = clamp(profile.avgSessionDuration + (rng() - 0.5) * 80 + (device === "desktop" ? 20 : -15), 30, 500);

            for (const dm of [
              { metric: "sessions", value: dSessions },
              { metric: "pageviews", value: dPageviews },
              { metric: "users", value: dUsers },
              { metric: "bounceRate", value: Math.round(dBounce * 100) / 100 },
              { metric: "avgSessionDuration", value: Math.round(dDuration) },
            ]) {
              batch.push({ sourceId: src.id, metric: dm.metric, value: dm.value, date, device, country: "", campaign: "" });
              totalPoints++;
            }
          }
        }

        // Country breakdown every 10 days
        if (di % 10 === 0) {
          const cw = COUNTRY_WEIGHTS[client.industry] || COUNTRY_WEIGHTS.Technology;
          for (const country of COUNTRIES) {
            const cWeight = cw[country] || 0.02;
            const cSessions = Math.round(sessions * cWeight * (0.85 + rng() * 0.3));
            const cPageviews = Math.round(cSessions * profile.pageviewsPerSession * (0.9 + rng() * 0.2));
            const cUsers = Math.round(cSessions * profile.newUserRate + cSessions * (1 - profile.newUserRate) * 0.75);
            const cConversions = Math.round(cSessions * profile.conversionRate * (0.6 + rng() * 0.8));

            for (const cm of [
              { metric: "sessions", value: cSessions },
              { metric: "pageviews", value: cPageviews },
              { metric: "users", value: cUsers },
              { metric: "conversions", value: cConversions },
            ]) {
              batch.push({ sourceId: src.id, metric: cm.metric, value: cm.value, date, device: "all", country, campaign: "" });
              totalPoints++;
            }
          }
        }
      }

      // ── Ad metrics (google_ads, facebook_ads, linkedin) ────────────────
      if (src.type === "google_ads" || src.type === "facebook_ads" || src.type === "linkedin") {
        // Platform-specific CTR and CPC adjustments
        const platformAdjust = src.type === "google_ads" ? { ctrMul: 1.1, cpcMul: 1.0 }
          : src.type === "facebook_ads" ? { ctrMul: 1.3, cpcMul: 0.7 }
          : { ctrMul: 0.8, cpcMul: 1.4 }; // LinkedIn is expensive but lower CTR

        const impressions = Math.round(profile.dailyImpressions * sourceShare * baseFactor * (0.8 + rng() * 0.4));
        const ctr = clamp(profile.ctr * platformAdjust.ctrMul * (0.8 + rng() * 0.4), 0.005, 0.10);
        const clicks = Math.round(impressions * ctr);
        const spend = Math.round(clicks * profile.cpc * platformAdjust.cpcMul * (0.85 + rng() * 0.3) * 100) / 100;
        const conversions = Math.round(clicks * profile.adConversionRate * (0.6 + rng() * 0.8));
        const costPerClick = clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0;

        const adMetrics = [
          { metric: "impressions", value: impressions },
          { metric: "clicks", value: clicks },
          { metric: "ctr", value: Math.round(ctr * 10000) / 100 }, // stored as percentage (e.g. 3.20)
          { metric: "spend", value: spend },
          { metric: "conversions", value: conversions },
          { metric: "costPerClick", value: costPerClick },
        ];

        for (const { metric, value } of adMetrics) {
          batch.push({ sourceId: src.id, metric, value, date, device: "all", country: "", campaign: "" });
          totalPoints++;
        }

        // Campaign attribution every 4 days
        if (di % 4 === 0) {
          for (const [campaignName, cw] of Object.entries(CAMPAIGN_WEIGHTS)) {
            const cImpressions = Math.round(impressions * cw.impressionsShare * (0.8 + rng() * 0.4));
            const cCtr = clamp(ctr * cw.ctrMultiplier * (0.85 + rng() * 0.3), 0.003, 0.12);
            const cClicks = Math.round(cImpressions * cCtr);
            const cSpend = Math.round(spend * cw.spendShare * (0.8 + rng() * 0.4) * 100) / 100;
            const cConversions = Math.round(clicks * profile.adConversionRate * cw.convMultiplier * (0.5 + rng()) * 0.3);
            const cCpc = cClicks > 0 ? Math.round((cSpend / cClicks) * 100) / 100 : 0;

            for (const cm of [
              { metric: "impressions", value: cImpressions },
              { metric: "clicks", value: cClicks },
              { metric: "ctr", value: Math.round(cCtr * 10000) / 100 },
              { metric: "spend", value: cSpend },
              { metric: "conversions", value: cConversions },
              { metric: "costPerClick", value: cCpc },
            ]) {
              batch.push({ sourceId: src.id, metric: cm.metric, value: cm.value, date, device: "all", country: "", campaign: campaignName });
              totalPoints++;
            }
          }
        }

        // Device breakdown for ads every 5 days
        if (di % 5 === 0) {
          const dw = DEVICE_WEIGHTS[client.industry] || DEVICE_WEIGHTS.Technology;
          for (const device of DEVICES) {
            const df = dw[device];
            const dImpressions = Math.round(impressions * df * (0.9 + rng() * 0.2));
            const dCtr = clamp(ctr * (device === "mobile" ? 1.15 : device === "desktop" ? 0.95 : 0.85) * (0.85 + rng() * 0.3), 0.003, 0.12);
            const dClicks = Math.round(dImpressions * dCtr);
            const dSpend = Math.round(spend * df * (0.85 + rng() * 0.3) * 100) / 100;

            for (const dm of [
              { metric: "impressions", value: dImpressions },
              { metric: "clicks", value: dClicks },
              { metric: "spend", value: dSpend },
            ]) {
              batch.push({ sourceId: src.id, metric: dm.metric, value: dm.value, date, device, country: "", campaign: "" });
              totalPoints++;
            }
          }
        }
      }

      // Flush batch
      if (batch.length >= BATCH_SIZE) {
        await db.dataPoint.createMany({ data: batch });
        batch = [];
      }
    }
  }

  if (batch.length > 0) {
    await db.dataPoint.createMany({ data: batch });
  }
  console.log(`Created ${totalPoints.toLocaleString()} data points`);

  // Pipelines
  console.log("Creating pipelines...");
  const pipelineTemplates = [
    { name: "Daily GA4 Ingestion", description: "Automated daily extraction from Google Analytics 4", status: "active", frequency: "daily", steps: ["Extract GA4 Data", "Validate Schema", "Transform Metrics", "Load to Warehouse"] },
    { name: "Meta Ads Sync", description: "Hourly synchronization of Meta advertising data", status: "active", frequency: "hourly", steps: ["Connect Meta API", "Pull Campaign Data", "Normalize Fields", "Store Results"] },
    { name: "Monthly KPI Report", description: "End-of-month KPI aggregation and reporting", status: "active", frequency: "monthly", steps: ["Aggregate Daily Data", "Calculate KPIs", "Generate Report", "Distribute to Stakeholders"] },
    { name: "Cross-Platform Merge", description: "Merge data across Google, Meta, and LinkedIn", status: "active", frequency: "daily", steps: ["Extract All Sources", "Deduplicate Records", "Join on Date", "Output Unified"] },
    { name: "Real-Time Dashboard Feed", description: "Near real-time data streaming to dashboards", status: "paused", frequency: "hourly", steps: ["Stream Events", "Buffer Queue", "Transform", "Push to Dashboard"] },
    { name: "CSV Import Pipeline", description: "Automated CSV file import and validation", status: "active", frequency: "daily", steps: ["Watch Directory", "Parse CSV", "Validate Data", "Import to DB"] },
    { name: "Revenue Attribution", description: "Multi-touch revenue attribution modeling", status: "active", frequency: "weekly", steps: ["Collect Touchpoints", "Apply Attribution Model", "Calculate Revenue", "Store Results"] },
    { name: "Data Quality Check", description: "Automated data quality validation and alerts", status: "active", frequency: "daily", steps: ["Sample Data", "Check Nulls", "Validate Ranges", "Send Alerts"] },
  ];
  const stepTypes = ["extract", "transform", "load", "validate", "enrich"];
  for (const client of clients) {
    const numPipelines = 1 + Math.floor(Math.random() * 3);
    const usedNames = new Set<string>();
    for (let p = 0; p < numPipelines; p++) {
      let template = pipelineTemplates[(clients.indexOf(client) * 3 + p) % pipelineTemplates.length];
      if (usedNames.has(template.name)) template = pipelineTemplates[(clients.indexOf(client) * 3 + p + 5) % pipelineTemplates.length];
      usedNames.add(template.name);
      const pipeline = await db.pipeline.create({
        data: { name: template.name, description: template.description, status: client.status === "active" ? template.status : "paused", frequency: template.frequency, clientId: client.id },
      });
      await Promise.all(template.steps.map((stepName, i) =>
        db.pipelineStep.create({ data: { pipelineId: pipeline.id, name: stepName, type: stepTypes[i % stepTypes.length], order: i + 1, config: JSON.stringify({ retryCount: 3, timeout: 300 }), status: "active" } })
      ));
    }
  }

  // Reports
  console.log("Creating reports...");
  const reportTypes = ["performance", "pipeline", "custom"];
  const reportFormats = ["pdf", "csv", "xlsx", "json"];
  for (let i = 0; i < 35; i++) {
    const clientIdx = i % clients.length;
    await db.report.create({
      data: {
        title: `${clients[clientIdx].name} - ${reportTypes[i % 3].charAt(0).toUpperCase() + reportTypes[i % 3].slice(1)} Report`,
        description: `Automated ${reportTypes[i % 3]} analysis for ${clients[clientIdx].name}`,
        type: reportTypes[i % 3], format: reportFormats[i % 4], status: "completed",
        generatedAt: new Date(Date.now() - i * 86400000 * 3), clientId: clients[clientIdx].id, userId: users[0].id,
      },
    });
  }

  // Templates
  console.log("Creating templates...");
  await Promise.all([
    db.template.create({ data: { name: "Executive Dashboard", description: "High-level KPI summary for C-suite stakeholders", category: "marketing", isDefault: true, config: JSON.stringify({ widgets: [], refreshRate: 300 }) } }),
    db.template.create({ data: { name: "Channel Performance", description: "Cross-channel comparison and attribution analysis", category: "marketing", isDefault: true, config: JSON.stringify({ widgets: [], refreshRate: 300 }) } }),
    db.template.create({ data: { name: "Conversion Funnel", description: "Full funnel analysis from awareness to conversion", category: "sales", isDefault: false, config: JSON.stringify({ widgets: [], refreshRate: 300 }) } }),
    db.template.create({ data: { name: "ROI Calculator", description: "Return on investment tracking across all campaigns", category: "finance", isDefault: true, config: JSON.stringify({ widgets: [], refreshRate: 300 }) } }),
    db.template.create({ data: { name: "Weekly Operations", description: "Operational metrics and data pipeline health", category: "operations", isDefault: false, config: JSON.stringify({ widgets: [], refreshRate: 300 }) } }),
    db.template.create({ data: { name: "Competitor Benchmark", description: "Industry benchmarking and competitive positioning", category: "marketing", isDefault: false, config: JSON.stringify({ widgets: [], refreshRate: 300 }) } }),
    db.template.create({ data: { name: "Budget Allocation", description: "Optimal budget distribution across channels", category: "finance", isDefault: true, config: JSON.stringify({ widgets: [], refreshRate: 300 }) } }),
    db.template.create({ data: { name: "Customer Journey", description: "Multi-touch customer journey visualization", category: "sales", isDefault: false, config: JSON.stringify({ widgets: [], refreshRate: 300 }) } }),
  ]);

  // Activity Logs
  console.log("Creating activity logs...");
  const actions = ["login", "logout", "create_pipeline", "update_source", "generate_report", "export_data", "update_client", "create_user", "update_branding", "run_pipeline"];
  const resources = ["pipeline", "source", "report", "client", "user", "branding", "dashboard"];
  for (let i = 0; i < 500; i++) {
    await db.activityLog.create({
      data: {
        userId: users[i % users.length].id,
        action: actions[i % actions.length],
        resource: resources[i % resources.length],
        details: `Performed ${actions[i % actions.length]} on ${resources[i % resources.length]}`,
        ipAddress: `192.168.${Math.floor(i / 100)}.${(i % 256)}`,
        createdAt: new Date(Date.now() - i * 86400000 * 0.5),
      },
    });
  }

  // Conversations
  console.log("Creating sample AI conversations...");
  const conv1 = await db.aIConversation.create({ data: { userId: users[0].id, title: "Campaign Performance Analysis" } });
  await db.aIMessage.createMany({ data: [
    { conversationId: conv1.id, role: "user", content: "What was our best performing campaign last month?" },
    { conversationId: conv1.id, role: "assistant", content: "Based on the data, the 'Retargeting' campaign delivered the highest ROI across all channels. It generated 12,400 conversions with a cost per acquisition of $18.50, which is 32% below your average CPA." },
  ]});
  const conv2 = await db.aIConversation.create({ data: { userId: users[1].id, title: "Data Pipeline Troubleshooting" } });
  await db.aIMessage.createMany({ data: [
    { conversationId: conv2.id, role: "user", content: "Why is the Meta Ads pipeline showing errors?" },
    { conversationId: conv2.id, role: "assistant", content: "The Meta Ads pipeline encountered authentication errors on 3 of the last 7 sync attempts. I recommend re-authenticating the Meta Ads source in your data source settings." },
  ]});

  console.log("\nSeeding complete!");
  console.log(`Database statistics:`);
  console.log(`  Agencies: ${await db.agency.count()}`);
  console.log(`  Clients: ${await db.client.count()}`);
  console.log(`  Users: ${await db.user.count()}`);
  console.log(`  Data Sources: ${await db.dataSource.count()}`);
  console.log(`  Data Points: ${await db.dataPoint.count()}`);
  console.log(`  Pipelines: ${await db.pipeline.count()}`);
  console.log(`  Reports: ${await db.report.count()}`);
  console.log(`  Templates: ${await db.template.count()}`);
  console.log(`  Activity Logs: ${await db.activityLog.count()}`);
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
