export interface DonutItem {
  label: string;
  value: number;
  pct: string;
  color: string;
}

export interface RankedItem {
  label: string;
  value: number;
  rank?: number;
}

export interface RowBase {
  active: boolean;
  order?: number;
}

export const jobCategories = {
  stats: { total: 24, active: 22, inactive: 2, jobs: 5842 },
  donut: [
    { label: "Active", value: 22, pct: "91.7%", color: "#10b981" },
    { label: "Inactive", value: 2, pct: "8.3%", color: "#ef4444" },
  ],
  top: [
    { label: "Drilling", value: 1245 },
    { label: "Production Engineering", value: 987 },
    { label: "HSE (Health, Safety & Environment)", value: 876 },
    { label: "Process Engineering", value: 654 },
    { label: "Maintenance", value: 543 },
  ],
  tips: [
    "Job categories help organize jobs and improve search experience for users.",
    "Drag and drop to reorder categories (coming soon).",
    "Inactive categories won't show on frontend.",
    "Jobs under a category will not be affected when deactivated.",
  ],
  rows: [
    { emoji: "🛢️", color: "#3b82f6", name: "Drilling", desc: "Drilling operations and engineering jobs", slug: "drilling", jobs: 1245, active: true, order: 1 },
    { emoji: "🏭", color: "#10b981", name: "Production Engineering", desc: "Production and field engineering roles", slug: "production-engineering", jobs: 987, active: true, order: 2 },
    { emoji: "🦺", color: "#f59e0b", name: "HSE (Health, Safety & Environment)", desc: "Health, safety and environment jobs", slug: "hse", jobs: 876, active: true, order: 3 },
    { emoji: "⚙️", color: "#8b5cf6", name: "Process Engineering", desc: "Process design and optimization roles", slug: "process-engineering", jobs: 654, active: true, order: 4 },
    { emoji: "🔧", color: "#06b6d4", name: "Maintenance", desc: "Maintenance and reliability jobs", slug: "maintenance", jobs: 543, active: true, order: 5 },
    { emoji: "🚚", color: "#ef4444", name: "Logistics & Supply Chain", desc: "Logistics, procurement and supply chain", slug: "logistics-supply-chain", jobs: 432, active: true, order: 6 },
    { emoji: "💰", color: "#eab308", name: "Finance & Accounting", desc: "Finance, accounting and auditing jobs", slug: "finance-accounting", jobs: 321, active: true, order: 7 },
    { emoji: "👥", color: "#64748b", name: "Human Resources", desc: "HR, recruitment and administration roles", slug: "human-resources", jobs: 298, active: false, order: 8 },
    { emoji: "⚓", color: "#0ea5e9", name: "Marine Operations", desc: "Marine operations and offshore support", slug: "marine-operations", jobs: 256, active: true, order: 9 },
    { emoji: "🧪", color: "#a855f7", name: "Research & Development", desc: "R&D and innovation roles", slug: "research-development", jobs: 230, active: false, order: 10 },
  ],
  showing: "1 to 10 of 24 categories",
  pages: 3,
};

export const skills = {
  stats: { total: 324, active: 298, inactive: 26, demand: 156, jobs: 24876 },
  donut: [
    { label: "Programming Languages", value: 112, pct: "34.6%", color: "#3b82f6" },
    { label: "Cloud Computing", value: 58, pct: "17.9%", color: "#06b6d4" },
    { label: "Frameworks", value: 45, pct: "13.9%", color: "#f59e0b" },
    { label: "DevOps", value: 38, pct: "11.7%", color: "#ec4899" },
    { label: "Databases", value: 27, pct: "8.3%", color: "#8b5cf6" },
    { label: "Others", value: 44, pct: "13.6%", color: "#cbd5e1" },
  ],
  top: [
    { label: "JavaScript", value: 4562 },
    { label: "Python", value: 4128 },
    { label: "AWS", value: 3876 },
    { label: "SQL", value: 3542 },
    { label: "React.js", value: 3215 },
  ],
  tips: [
    "Set the order to control how skills appear in dropdowns.",
    "Inactive skills will not be shown on the frontend.",
    "High demand skills are used to highlight important skills.",
  ],
  rows: [
    { icon: "</>", color: "#3b82f6", name: "JavaScript", category: "Programming Languages", jobs: 4562, demand: "Very High", active: true, order: 1 },
    { icon: "🐍", color: "#eab308", name: "Python", category: "Programming Languages", jobs: 4128, demand: "Very High", active: true, order: 2 },
    { icon: "☁️", color: "#f97316", name: "AWS", category: "Cloud Computing", jobs: 3876, demand: "Very High", active: true, order: 3 },
    { icon: "🗄️", color: "#8b5cf6", name: "SQL", category: "Database", jobs: 3542, demand: "High", active: true, order: 4 },
    { icon: "⚛️", color: "#0ea5e9", name: "React.js", category: "Frameworks", jobs: 3215, demand: "High", active: true, order: 5 },
    { icon: "🟢", color: "#16a34a", name: "Node.js", category: "Runtime Environment", jobs: 2987, demand: "High", active: true, order: 6 },
    { icon: "🐳", color: "#2563eb", name: "Docker", category: "DevOps", jobs: 2654, demand: "High", active: true, order: 7 },
    { icon: "☸️", color: "#3b82f6", name: "Kubernetes", category: "DevOps", jobs: 2123, demand: "Medium", active: true, order: 8 },
    { icon: "📊", color: "#eab308", name: "Power BI", category: "Analytics", jobs: 1876, demand: "Medium", active: true, order: 9 },
    { icon: "📈", color: "#f97316", name: "Tableau", category: "Analytics", jobs: 1542, demand: "Medium", active: true, order: 10 },
  ],
  showing: "1 to 10 of 324 skills",
  pages: 33,
};

export const tags = {
  stats: { total: 158, active: 142, inactive: 16, inUse: 98, assignments: 6542 },
  donut: [
    { label: "1000+", value: 28, pct: "17.7%", color: "#3b82f6" },
    { label: "500 - 999", value: 32, pct: "20.3%", color: "#10b981" },
    { label: "100 - 499", value: 54, pct: "34.2%", color: "#f59e0b" },
    { label: "10 - 99", value: 30, pct: "19.0%", color: "#f97316" },
    { label: "0 - 9", value: 14, pct: "8.9%", color: "#a855f7" },
  ],
  top: [
    { label: "Remote", value: 1245, rank: 1 },
    { label: "Full Time", value: 2356, rank: 2 },
    { label: "Contract", value: 987, rank: 3 },
    { label: "Urgent Hiring", value: 1876, rank: 4 },
    { label: "Senior Level", value: 1102, rank: 5 },
  ],
  tips: [
    "Tags help users filter jobs and articles more easily.",
    "You can assign multiple tags to jobs and articles.",
    "Inactive tags will not be shown on the frontend.",
  ],
  rows: [
    { color: "#3b82f6", name: "Remote", slug: "remote", usage: 1245, active: true, created: "May 21, 2025" },
    { color: "#10b981", name: "Full Time", slug: "full-time", usage: 2356, active: true, created: "May 20, 2025" },
    { color: "#f59e0b", name: "Contract", slug: "contract", usage: 987, active: true, created: "May 19, 2025" },
    { color: "#8b5cf6", name: "Entry Level", slug: "entry-level", usage: 654, active: true, created: "May 18, 2025" },
    { color: "#ef4444", name: "Senior Level", slug: "senior-level", usage: 1102, active: true, created: "May 18, 2025" },
    { color: "#06b6d4", name: "Part Time", slug: "part-time", usage: 342, active: true, created: "May 17, 2025" },
    { color: "#f97316", name: "Internship", slug: "internship", usage: 276, active: false, created: "May 16, 2025" },
    { color: "#3b82f6", name: "Urgent Hiring", slug: "urgent-hiring", usage: 1876, active: true, created: "May 16, 2025" },
    { color: "#eab308", name: "Top Company", slug: "top-company", usage: 542, active: true, created: "May 15, 2025" },
    { color: "#ef4444", name: "Featured", slug: "featured", usage: 1162, active: true, created: "May 14, 2025" },
  ],
  showing: "1 to 10 of 158 tags",
  pages: 16,
};

export const cities = {
  stats: { total: 1486, active: 1372, inactive: 114, jobs: 72458 },
  donut: [
    { label: "United States", value: 312, pct: "21.0%", color: "#3b82f6" },
    { label: "India", value: 268, pct: "18.0%", color: "#10b981" },
    { label: "United Arab Emirates", value: 186, pct: "12.5%", color: "#a855f7" },
    { label: "Australia", value: 142, pct: "9.6%", color: "#ec4899" },
    { label: "Others", value: 578, pct: "38.9%", color: "#cbd5e1" },
  ],
  top: [
    { label: "Houston, United States", value: 3856, rank: 1 },
    { label: "London, United Kingdom", value: 2945, rank: 2 },
    { label: "Calgary, Canada", value: 2102, rank: 3 },
    { label: "Dubai, United Arab Emirates", value: 1986, rank: 4 },
    { label: "Melbourne, Australia", value: 1764, rank: 5 },
  ],
  tips: [
    "You can drag and drop cities to change the order.",
    "Inactive cities will not be shown on the frontend.",
    "Jobs and companies are linked to cities.",
  ],
  rows: [
    { name: "Houston", flag: "🇺🇸", country: "United States", region: "Texas", jobs: 3856, active: true, order: 1 },
    { name: "London", flag: "🇬🇧", country: "United Kingdom", region: "England", jobs: 2945, active: true, order: 2 },
    { name: "Calgary", flag: "🇨🇦", country: "Canada", region: "Alberta", jobs: 2102, active: true, order: 3 },
    { name: "Dubai", flag: "🇦🇪", country: "United Arab Emirates", region: "Dubai", jobs: 1986, active: true, order: 4 },
    { name: "Melbourne", flag: "🇦🇺", country: "Australia", region: "Victoria", jobs: 1764, active: true, order: 5 },
    { name: "Abu Dhabi", flag: "🇦🇪", country: "United Arab Emirates", region: "Abu Dhabi", jobs: 1612, active: true, order: 6 },
    { name: "Mumbai", flag: "🇮🇳", country: "India", region: "Maharashtra", jobs: 1458, active: true, order: 7 },
    { name: "Doha", flag: "🇶🇦", country: "Qatar", region: "Doha", jobs: 1231, active: true, order: 8 },
    { name: "Singapore", flag: "🇸🇬", country: "Singapore", region: "-", jobs: 1128, active: true, order: 9 },
    { name: "Frankfurt", flag: "🇩🇪", country: "Germany", region: "Hesse", jobs: 987, active: false, order: 10 },
  ],
  showing: "1 to 10 of 1,486 cities",
  pages: 149,
};

export const countries = {
  stats: { total: 249, active: 236, inactive: 13, jobs: 58734 },
  donut: [
    { label: "Asia", value: 92, pct: "36.9%", color: "#3b82f6" },
    { label: "Europe", value: 67, pct: "26.9%", color: "#10b981" },
    { label: "North America", value: 49, pct: "19.7%", color: "#f59e0b" },
    { label: "South America", value: 19, pct: "7.6%", color: "#ec4899" },
    { label: "Africa", value: 14, pct: "5.6%", color: "#a855f7" },
    { label: "Oceania", value: 8, pct: "3.2%", color: "#06b6d4" },
  ],
  top: [
    { label: "United States", value: 18745 },
    { label: "United Kingdom", value: 6842 },
    { label: "Canada", value: 4512 },
    { label: "Australia", value: 3876 },
    { label: "Germany", value: 3245 },
  ],
  tips: [
    "Set the order to control how countries appear in dropdowns.",
    "Inactive countries will not be shown to users on the frontend.",
    "Jobs and companies are linked to countries.",
  ],
  rows: [
    { name: "United States", flag: "🇺🇸", code: "US", region: "North America", jobs: 18745, active: true, order: 1 },
    { name: "United Kingdom", flag: "🇬🇧", code: "GB", region: "Europe", jobs: 6842, active: true, order: 2 },
    { name: "Canada", flag: "🇨🇦", code: "CA", region: "North America", jobs: 4512, active: true, order: 3 },
    { name: "Australia", flag: "🇦🇺", code: "AU", region: "Oceania", jobs: 3876, active: true, order: 4 },
    { name: "Germany", flag: "🇩🇪", code: "DE", region: "Europe", jobs: 3245, active: true, order: 5 },
    { name: "United Arab Emirates", flag: "🇦🇪", code: "AE", region: "Middle East", jobs: 2982, active: true, order: 6 },
    { name: "India", flag: "🇮🇳", code: "IN", region: "Asia", jobs: 2756, active: true, order: 7 },
    { name: "Saudi Arabia", flag: "🇸🇦", code: "SA", region: "Middle East", jobs: 2341, active: true, order: 8 },
    { name: "France", flag: "🇫🇷", code: "FR", region: "Europe", jobs: 1876, active: true, order: 9 },
    { name: "Singapore", flag: "🇸🇬", code: "SG", region: "Asia", jobs: 1559, active: false, order: 10 },
  ],
  showing: "1 to 10 of 249 countries",
  pages: 25,
};

export const industries = {
  stats: { total: 18, active: 16, inactive: 2, jobs: 8745 },
  donut: [
    { label: "Active", value: 16, pct: "88.9%", color: "#10b981" },
    { label: "Inactive", value: 2, pct: "11.1%", color: "#ef4444" },
  ],
  top: [
    { label: "Oil & Gas", value: 2145 },
    { label: "Renewable Energy", value: 1876 },
    { label: "Energy Services", value: 1432 },
    { label: "Power Generation", value: 1126 },
    { label: "Petrochemicals", value: 876 },
  ],
  tips: [
    "Set the order to control how industries appear on the frontend.",
    "Inactive industries will not be shown to users.",
    "Jobs under an industry will not be affected when you set it inactive.",
  ],
  rows: [
    { emoji: "⛏️", color: "#3b82f6", name: "Oil & Gas", desc: "Exploration, drilling, production and distribution", slug: "oil-gas", jobs: 2145, active: true, order: 1 },
    { emoji: "🌿", color: "#f97316", name: "Renewable Energy", desc: "Solar, wind, hydro, biomass and more", slug: "renewable-energy", jobs: 1876, active: true, order: 2 },
    { emoji: "🏗️", color: "#10b981", name: "Energy Services", desc: "Support services for energy operations", slug: "energy-services", jobs: 1432, active: true, order: 3 },
    { emoji: "⚡", color: "#eab308", name: "Power Generation", desc: "Conventional and non-conventional power", slug: "power-generation", jobs: 1126, active: true, order: 4 },
    { emoji: "🧪", color: "#f97316", name: "Petrochemicals", desc: "Petrochemical and downstream products", slug: "petrochemicals", jobs: 876, active: true, order: 5 },
    { emoji: "🚢", color: "#0ea5e9", name: "LNG", desc: "Liquefied Natural Gas industry", slug: "lng", jobs: 654, active: true, order: 6 },
    { emoji: "⛰️", color: "#ef4444", name: "Mining", desc: "Mining and mineral extraction", slug: "mining", jobs: 543, active: false, order: 7 },
    { emoji: "🌎", color: "#22c55e", name: "Environment & Sustainability", desc: "Environmental management and sustainability", slug: "environment-sustainability", jobs: 432, active: true, order: 8 },
    { emoji: "🏢", color: "#f59e0b", name: "Engineering & Construction", desc: "Engineering, procurement and construction", slug: "engineering-construction", jobs: 387, active: true, order: 9 },
    { emoji: "📈", color: "#3b82f6", name: "Consulting", desc: "Management and technical consulting", slug: "consulting", jobs: 274, active: false, order: 10 },
  ],
  showing: "1 to 10 of 18 industries",
  pages: 2,
};