export type CompanyTag = "solo" | "date" | "friends" | "family";
export type BudgetTag = "free" | "cheap" | "medium" | "splurge";
export type VibeTag = "outdoors" | "arts" | "cozy" | "active" | "scenic";
export type TimeTag = "quick" | "half-day" | "full-day";

export interface OutingItem {
  id: string;
  title: string;
  type: "museum" | "park" | "day-trip" | "garden" | "city-spot";
  blurb: string;
  whyItFits: string;
  costLabel: string;
  costHint: string;
  city: string;
  url: string;
  sourceLabel: string;
  companyTags: CompanyTag[];
  budgetTags: BudgetTag[];
  vibeTags: VibeTag[];
  timeTags: TimeTag[];
}

export const COMPANY_OPTIONS: Array<{ id: CompanyTag; label: string }> = [
  { id: "solo", label: "Just me" },
  { id: "date", label: "Date / two people" },
  { id: "friends", label: "Friends" },
  { id: "family", label: "Family" }
];

export const BUDGET_OPTIONS: Array<{ id: BudgetTag; label: string }> = [
  { id: "free", label: "Free" },
  { id: "cheap", label: "Cheap" },
  { id: "medium", label: "Mid" },
  { id: "splurge", label: "Bigger plan" }
];

export const VIBE_OPTIONS: Array<{ id: VibeTag; label: string }> = [
  { id: "outdoors", label: "Outdoors" },
  { id: "arts", label: "Arts" },
  { id: "cozy", label: "Low-key" },
  { id: "active", label: "Do something" },
  { id: "scenic", label: "Pretty views" }
];

export const TIME_OPTIONS: Array<{ id: TimeTag; label: string }> = [
  { id: "quick", label: "Quick" },
  { id: "half-day", label: "Half day" },
  { id: "full-day", label: "Full day" }
];

export const MINNESOTA_OUTINGS: OutingItem[] = [
  {
    id: "mia",
    title: "Minneapolis Institute of Art",
    type: "museum",
    blurb: "A no-pressure art day with enough variety that you can wander for 45 minutes or three hours.",
    whyItFits: "Great when you want to get out without spending money and still feel like you did something real.",
    costLabel: "Free",
    costHint: "General admission is free.",
    city: "Minneapolis",
    url: "https://new.artsmia.org/",
    sourceLabel: "Minneapolis Institute of Art",
    companyTags: ["solo", "date", "friends", "family"],
    budgetTags: ["free", "cheap"],
    vibeTags: ["arts", "cozy"],
    timeTags: ["quick", "half-day"]
  },
  {
    id: "como-zoo",
    title: "Como Park Zoo & Conservatory",
    type: "garden",
    blurb: "Animals, plants, and an easy walkable campus that feels like a real outing without a huge plan.",
    whyItFits: "Perfect if you want something wholesome, easy, and actually fun for almost any kind of day.",
    costLabel: "Free",
    costHint: 'Admission is free, with voluntary donations.',
    city: "Saint Paul",
    url: "https://comozooconservatory.org/",
    sourceLabel: "Como Park Zoo & Conservatory",
    companyTags: ["solo", "date", "friends", "family"],
    budgetTags: ["free", "cheap"],
    vibeTags: ["outdoors", "cozy", "scenic"],
    timeTags: ["half-day", "full-day"]
  },
  {
    id: "sculpture-garden",
    title: "Minneapolis Sculpture Garden",
    type: "city-spot",
    blurb: "Easy outdoor art, skyline views, and a solid answer for when you want to get out without overplanning.",
    whyItFits: "Good for a short hang, a cute date, or a solo reset when you need fresh air and something visual.",
    costLabel: "Free",
    costHint: "The garden is free to visit.",
    city: "Minneapolis",
    url: "https://walkerart.org/visit/garden/",
    sourceLabel: "Walker Art Center",
    companyTags: ["solo", "date", "friends", "family"],
    budgetTags: ["free", "cheap"],
    vibeTags: ["arts", "scenic", "outdoors"],
    timeTags: ["quick", "half-day"]
  },
  {
    id: "minnehaha",
    title: "Minnehaha Falls",
    type: "park",
    blurb: "Classic waterfall walk energy with enough room to keep it simple or turn it into a longer park day.",
    whyItFits: "One of the easiest answers when you want to leave the house and not think too hard.",
    costLabel: "Free",
    costHint: "Public park access is free.",
    city: "Minneapolis",
    url: "https://www.minneapolisparks.org/parks-destinations/parks-lakes/minnehaha_regional_park/",
    sourceLabel: "Minneapolis Park & Recreation Board",
    companyTags: ["solo", "date", "friends", "family"],
    budgetTags: ["free", "cheap"],
    vibeTags: ["outdoors", "active", "scenic"],
    timeTags: ["quick", "half-day"]
  },
  {
    id: "state-park-day",
    title: "Minnesota State Park Day Trip",
    type: "day-trip",
    blurb: "Pick a park, bring snacks, and turn one random day into a real reset.",
    whyItFits: "Best for when you need nature and want the day to feel bigger than errands and screens.",
    costLabel: "About $7 per day",
    costHint: "Daily vehicle permits are around $7.",
    city: "Statewide",
    url: "https://www.dnr.state.mn.us/state_parks/permit.html",
    sourceLabel: "Minnesota DNR",
    companyTags: ["solo", "date", "friends", "family"],
    budgetTags: ["cheap", "medium"],
    vibeTags: ["outdoors", "active", "scenic"],
    timeTags: ["half-day", "full-day"]
  },
  {
    id: "mill-city",
    title: "Mill City Museum",
    type: "museum",
    blurb: "A solid city outing if you want history, something indoors, and a plan that feels more intentional.",
    whyItFits: "Works well for friends or family when you want a real activity without needing a full road trip.",
    costLabel: "Around $16",
    costHint: "Adult museum tickets are in the mid-teens.",
    city: "Minneapolis",
    url: "https://www.mnhs.org/millcity",
    sourceLabel: "Minnesota Historical Society",
    companyTags: ["solo", "date", "friends", "family"],
    budgetTags: ["cheap", "medium"],
    vibeTags: ["arts", "cozy"],
    timeTags: ["half-day"]
  },
  {
    id: "arboretum",
    title: "Minnesota Landscape Arboretum",
    type: "garden",
    blurb: "Big pretty grounds, seasonal flowers, and main-character walk energy.",
    whyItFits: "A strong pick when you want a calmer paid outing that still feels special and photogenic.",
    costLabel: "Around $20",
    costHint: "General admission is usually around twenty dollars.",
    city: "Chaska",
    url: "https://arb.umn.edu/visit/hours-and-admission",
    sourceLabel: "Minnesota Landscape Arboretum",
    companyTags: ["solo", "date", "friends", "family"],
    budgetTags: ["medium", "splurge"],
    vibeTags: ["outdoors", "cozy", "scenic"],
    timeTags: ["half-day", "full-day"]
  },
  {
    id: "north-shore",
    title: "North Shore Scenic Drive",
    type: "day-trip",
    blurb: "Lake Superior views, cute stops, and a full-day answer for when you want something memorable.",
    whyItFits: "The kind of plan that gets people out of the house because it actually feels worth leaving for.",
    costLabel: "Free to drive, pay for stops",
    costHint: "The drive itself is free; food, gas, and stop choices set the real cost.",
    city: "North Shore",
    url: "https://www.exploreminnesota.com/article/scenic-driving-routes",
    sourceLabel: "Explore Minnesota",
    companyTags: ["solo", "date", "friends", "family"],
    budgetTags: ["cheap", "medium", "splurge"],
    vibeTags: ["scenic", "outdoors"],
    timeTags: ["full-day"]
  }
];
