// Fictional demo knowledge. Used by db:seed and tenant:export.
export const EXPERTS = [
  { name: "An Peeters", role: "Senior Payroll Consultant", country: "BE", topics: ["notice periods", "end-of-year premium", "PC 200"], email: "an.peeters@example.com" },
  { name: "Joris Maes", role: "Social Legislation Analyst", country: "BE", topics: ["meal vouchers", "indexation", "benefits"], email: "joris.maes@example.com" },
  { name: "Sanne de Vries", role: "Payroll Specialist", country: "NL", topics: ["holiday allowance", "CAO", "notice periods"], email: "sanne.devries@example.com" },
  { name: "Lukas Becker", role: "Payroll Team Lead", country: "DE", topics: ["Weihnachtsgeld", "notice periods", "Minijob"], email: "lukas.becker@example.com" },
  { name: "Elise Janssens", role: "Customer Success Manager", country: "BE", topics: ["customer escalations", "meal vouchers"], email: "elise.janssens@example.com" },
  { name: "Tom Willems", role: "Knowledge Manager", country: "BE", topics: ["policy governance"], email: "tom.willems@example.com" },
];
// Owner ids below refer to EXPERTS order (1-based, identity restarts on seed).

export const DOCS = [
  // --- Belgium: notice periods (conflict #1) ---
  {
    title: "Procedure: Calculating notice periods (BE) v4",
    body: "Since the Single Status Act, notice for employer-initiated termination is expressed in weeks based on seniority. 0–3 months: 1 week. 3–6 months: 3 weeks. 6–9 months: 4 weeks. 1–2 years: 7 weeks. 2–3 years: 9 weeks. From 5 years: 15 weeks, plus 3 weeks per additional started year of seniority up to 20 years. Applies to blue- and white-collar workers alike.",
    sourceType: "sharepoint", sourceUrl: "https://sharepoint.example.com/payroll-be/notice-periods-v4",
    country: "BE", status: "current", ownerId: 1, reviewedAt: "2026-05-12",
  },
  {
    title: "Onboarding checklist: Belgian terminations",
    body: "Quick reference for new consultants. Notice for white-collar workers with 2–3 years seniority: 6 weeks. Blue-collar workers follow the separate sector table. Always double-check the joint committee.",
    sourceType: "sharepoint", sourceUrl: "https://sharepoint.example.com/onboarding/be-terminations-checklist",
    country: "BE", status: "current", ownerId: 6, reviewedAt: "2023-02-01",
  },
  // --- Belgium: end-of-year premium (conflict #2) ---
  {
    title: "Policy: End-of-year premium, PC 200 (BE)",
    body: "White-collar employees under joint committee 200 are entitled to an end-of-year premium equal to one gross monthly salary. Employees with at least 6 months of seniority in the reference year receive it pro rata to the months worked. Paid with the December payroll.",
    sourceType: "sharepoint", sourceUrl: "https://sharepoint.example.com/payroll-be/pc200-end-of-year-premium",
    country: "BE", status: "current", ownerId: 1, reviewedAt: "2026-03-20",
  },
  {
    title: "Teams #payroll-be: 13th month for new joiners?",
    body: "Q: New PC 200 joiner in September, do they get anything in December? A (posted 2024-11-14): No, under PC 200 you need a full year of service before the end-of-year premium applies. We told customer Brightline the same last year.",
    sourceType: "teams", sourceUrl: "https://teams.example.com/payroll-be/thread/8812",
    country: "BE", status: "current", ownerId: 5, reviewedAt: "2024-11-14",
  },
  // --- Belgium: meal vouchers (stale #3) ---
  {
    title: "Benefits guide: Meal vouchers (BE) 2023",
    body: "Maximum employer contribution per meal voucher: €6.91. Minimum employee contribution: €1.09. Maximum face value: €8.00.",
    sourceType: "sharepoint", sourceUrl: "https://sharepoint.example.com/benefits-be/meal-vouchers-2023",
    country: "BE", status: "superseded", ownerId: 2, reviewedAt: "2023-01-10",
  },
  {
    title: "Legal update: Meal voucher ceiling raised (BE)",
    body: "Effective 2026-01-01 the maximum employer contribution per meal voucher rises to €8.91, maximum face value €10.00. Minimum employee contribution unchanged at €1.09. Update payroll parameters before the January run.",
    sourceType: "legal_feed", sourceUrl: "https://legalfeed.example.com/be/2025-12-meal-vouchers",
    country: "BE", status: "current", ownerId: 2, reviewedAt: "2025-12-15",
  },
  {
    title: "Ticket SR-40217: Customer asked why meal voucher cost went up",
    body: "Customer Brightline (BE, 240 FTE) saw higher employer cost in January. Cause: new €8.91 ceiling applied automatically because their policy says 'maximum legal contribution'. Resolved by explaining the legal update and sharing the change notice.",
    sourceType: "ticket", sourceUrl: "https://servicedesk.example.com/SR-40217",
    country: "BE", status: "current", ownerId: 5, reviewedAt: "2026-01-22",
  },
  {
    title: "Legal update: Automatic wage indexation PC 200, January 2026",
    body: "Salaries under PC 200 are indexed by 2.21% on 2026-01-01. Applies to actual and scale salaries. The indexed salary is the basis for the end-of-year premium calculation.",
    sourceType: "legal_feed", sourceUrl: "https://legalfeed.example.com/be/2026-01-pc200-index",
    country: "BE", status: "current", ownerId: 2, reviewedAt: "2026-01-05",
  },
  // --- Netherlands (scope trap #4) ---
  {
    title: "Holiday allowance and '13th month' (NL)",
    body: "In the Netherlands there is no statutory 13th month. Employees are entitled to a holiday allowance (vakantiegeld) of at least 8% of gross annual salary, usually paid in May. A 13th month only applies if the CAO or employment contract provides for it.",
    sourceType: "sharepoint", sourceUrl: "https://sharepoint.example.com/payroll-nl/holiday-allowance",
    country: "NL", status: "current", ownerId: 3, reviewedAt: "2026-04-02",
  },
  {
    title: "Notice periods (NL)",
    body: "Employer notice period depends on contract duration: under 5 years: 1 month; 5–10 years: 2 months; 10–15 years: 3 months; 15+ years: 4 months. Employee notice period is 1 month unless agreed otherwise.",
    sourceType: "sharepoint", sourceUrl: "https://sharepoint.example.com/payroll-nl/notice-periods",
    country: "NL", status: "current", ownerId: 3, reviewedAt: "2025-11-18",
  },
  // --- Germany ---
  {
    title: "Weihnachtsgeld (Christmas bonus) (DE)",
    body: "There is no statutory entitlement to Weihnachtsgeld in Germany. It arises from collective agreements (Tarifvertrag), the employment contract, or company practice (betriebliche Übung) after three consecutive unconditional payments.",
    sourceType: "sharepoint", sourceUrl: "https://sharepoint.example.com/payroll-de/weihnachtsgeld",
    country: "DE", status: "current", ownerId: 4, reviewedAt: "2025-10-30",
  },
  {
    title: "Kündigungsfristen: statutory notice periods (DE)",
    body: "Basic notice period is 4 weeks to the 15th or end of the month. For employer terminations it extends with tenure: 2 years: 1 month; 5 years: 2 months; 8 years: 3 months; up to 7 months at 20 years.",
    sourceType: "sharepoint", sourceUrl: "https://sharepoint.example.com/payroll-de/kuendigungsfristen",
    country: "DE", status: "current", ownerId: 4, reviewedAt: "2026-02-14",
  },
  {
    title: "Teams #payroll-de: Minijob limit 2026",
    body: "Reminder for everyone: Minijob earnings limit is €603/month from 2026-01-01, tied to the minimum wage. Check customers with fixed €556 setups.",
    sourceType: "teams", sourceUrl: "https://teams.example.com/payroll-de/thread/2290",
    country: "DE", status: "current", ownerId: 4, reviewedAt: "2026-01-08",
  },
];
