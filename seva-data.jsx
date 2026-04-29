// Seed data with stories, beneficiary counts, and richer human context
const SEED_NEEDS = [
  {
    id: "n1",
    area: "Dharavi",
    city: "Mumbai",
    type: "Food Distribution",
    urgency: "High",
    title: "Hot meals for monsoon-displaced families",
    story: "240 families sheltering at the community hall after roof collapses last week. Lunch & dinner needed for 14 days.",
    requestedBy: "Asha Workers Collective",
    beneficiaries: 240,
    pledged: 2,
    needed: 5,
    requestedAt: "2h",
    lat: 19.0422, lon: 72.8533,
    mx: 0.32, my: 0.74, // map coords (normalized)
    icon: "food",
  },
  {
    id: "n2",
    area: "Govandi",
    city: "Mumbai",
    type: "Medical Camp",
    urgency: "Critical",
    title: "Pediatric fever cluster — urgent screening",
    story: "32 children under 8 with persistent high fever in Shivaji Nagar. PHC overwhelmed, doctors needed for screening Sat/Sun.",
    requestedBy: "Dr. Nair, Govandi PHC",
    beneficiaries: 32,
    pledged: 1,
    needed: 4,
    requestedAt: "38m",
    lat: 19.2183, lon: 72.9781,
    mx: 0.78, my: 0.20,
    icon: "medical",
  },
  {
    id: "n3",
    area: "Kurla",
    city: "Mumbai",
    type: "Education Support",
    urgency: "Medium",
    title: "After-school tutoring restart",
    story: "Class 7–9 students fell behind during exams. Looking for math & english tutors, 2 evenings/week.",
    requestedBy: "Saraswati Vidyalaya",
    beneficiaries: 84,
    pledged: 0,
    needed: 3,
    requestedAt: "1d",
    lat: 19.0726, lon: 72.8867,
    mx: 0.55, my: 0.50,
    icon: "edu",
  },
  {
    id: "n4",
    area: "Mankhurd",
    city: "Mumbai",
    type: "Sanitation Drive",
    urgency: "High",
    title: "Drain clearing before next rain",
    story: "Blocked drains caused waist-high flooding last week. 3 lanes need clearing & disinfection before Friday's forecast.",
    requestedBy: "Mankhurd Resident Welfare",
    beneficiaries: 1200,
    pledged: 3,
    needed: 6,
    requestedAt: "5h",
    lat: 19.1136, lon: 72.8697,
    mx: 0.62, my: 0.32,
    icon: "sanitation",
  },
  {
    id: "n5",
    area: "Chembur",
    city: "Mumbai",
    type: "Shelter Assistance",
    urgency: "Low",
    title: "Bedding & blankets for night shelter",
    story: "Winter coming — night shelter at Chembur station has 60 beds but only 22 sets of bedding. Donations & sorting help welcome.",
    requestedBy: "Apnalaya",
    beneficiaries: 60,
    pledged: 1,
    needed: 2,
    requestedAt: "3d",
    lat: 19.0507, lon: 72.9006,
    mx: 0.48, my: 0.62,
    icon: "shelter",
  },
  {
    id: "n6",
    area: "Bandra East",
    city: "Mumbai",
    type: "Medical Camp",
    urgency: "Medium",
    title: "Free eye-checkup camp for elderly",
    story: "Behrampada slum — 180+ residents above 60 haven't had eye exams in 2+ years. Optometrists needed Sun.",
    requestedBy: "Helpage India (vol)",
    beneficiaries: 180,
    pledged: 2,
    needed: 4,
    requestedAt: "9h",
    lat: 19.0596, lon: 72.8295,
    mx: 0.20, my: 0.40,
    icon: "medical",
  },
];

const SEED_VOLUNTEERS = [
  { id: "v1", name: "Ramesh Iyer",   skill: "Medical",            location: "Thane",     hours: 12, completed: 8,  rating: 4.9, color: "oklch(0.55 0.16 25)" },
  { id: "v2", name: "Priya Sharma",  skill: "Logistics",          location: "Kurla",     hours: 22, completed: 15, rating: 4.8, color: "oklch(0.50 0.14 270)" },
  { id: "v3", name: "Amit Patil",    skill: "Water & Sanitation", skillShort: "Sanitation", location: "Dharavi",  hours: 8,  completed: 5,  rating: 4.7, color: "oklch(0.55 0.10 200)" },
  { id: "v4", name: "Sara D'Souza",  skill: "Food Distribution",  location: "Andheri",   hours: 30, completed: 24, rating: 5.0, color: "oklch(0.55 0.14 60)" },
  { id: "v5", name: "Ravi Kumar",    skill: "Medical",            location: "Borivali",  hours: 18, completed: 12, rating: 4.8, color: "oklch(0.50 0.16 350)" },
  { id: "v6", name: "Fatima Sheikh", skill: "Education",          location: "Kurla",     hours: 26, completed: 19, rating: 4.9, color: "oklch(0.50 0.10 320)" },
  { id: "v7", name: "Joseph Khan",   skill: "Logistics",          location: "Chembur",   hours: 14, completed: 9,  rating: 4.6, color: "oklch(0.45 0.10 150)" },
];

// Map skills -> need types they're good for (multi-mapping)
const SKILL_TO_NEED = {
  "Medical":            ["Medical Camp"],
  "Logistics":          ["Food Distribution", "Shelter Assistance"],
  "Water & Sanitation": ["Sanitation Drive"],
  "Food Distribution":  ["Food Distribution"],
  "Education":          ["Education Support"],
};

const URGENCY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const URGENCY_CLASS = { Critical: "urg-c", High: "urg-h", Medium: "urg-m", Low: "urg-l" };
const URGENCY_COLOR = {
  Critical: "var(--crit)", High: "var(--high)", Medium: "var(--med)", Low: "var(--low)",
};

const NEED_TYPES = ["Food Distribution", "Medical Camp", "Education Support", "Sanitation Drive", "Shelter Assistance"];

// Live activity ticker entries
const SEED_FEED = [
  { time: "now",   color: "var(--sage)",     text: "<b>Sara D'Souza</b> pledged hot meals for Dharavi" },
  { time: "2m",    color: "var(--saffron)",  text: "<b>Govandi PHC</b> raised pediatric cluster to Critical" },
  { time: "12m",   color: "var(--indigo)",   text: "<b>Amit Patil</b> completed sanitation run at Mankhurd" },
  { time: "1h",    color: "var(--sage)",     text: "<b>3 volunteers</b> joined the eye-checkup camp" },
  { time: "3h",    color: "var(--saffron)",  text: "<b>New need posted</b> — Bandra East eye camp" },
  { time: "yest",  color: "var(--ink-3)",    text: "<b>240 meals served</b> at Mankhurd shelter" },
];

// Sample NLP keywords
const KEYWORD_NEED = {
  food: "Food Distribution", hunger: "Food Distribution", meal: "Food Distribution", ration: "Food Distribution",
  medical: "Medical Camp", doctor: "Medical Camp", health: "Medical Camp", hospital: "Medical Camp", fever: "Medical Camp", eye: "Medical Camp",
  water: "Sanitation Drive", sanitation: "Sanitation Drive", drain: "Sanitation Drive", clean: "Sanitation Drive",
  school: "Education Support", education: "Education Support", tutor: "Education Support", teach: "Education Support",
  shelter: "Shelter Assistance", blanket: "Shelter Assistance", flood: "Shelter Assistance", homeless: "Shelter Assistance",
};
const KEYWORD_URG = {
  urgent: "Critical", emergency: "Critical", critical: "Critical", immediate: "Critical", now: "Critical",
  soon: "Medium", moderate: "Medium",
  whenever: "Low", minor: "Low",
};

function classifyText(text) {
  const t = (text || "").toLowerCase();
  let need = null, urg = "Medium";
  for (const k of Object.keys(KEYWORD_NEED)) if (t.includes(k)) { need = KEYWORD_NEED[k]; break; }
  for (const k of Object.keys(KEYWORD_URG)) if (t.includes(k)) { urg = KEYWORD_URG[k]; break; }
  if (!need && t.length > 8) need = "Food Distribution";
  return { need, urg };
}

// Make available globally to other Babel scripts
Object.assign(window, {
  SEED_NEEDS, SEED_VOLUNTEERS, SKILL_TO_NEED,
  URGENCY_RANK, URGENCY_CLASS, URGENCY_COLOR,
  NEED_TYPES, SEED_FEED, classifyText,
});
