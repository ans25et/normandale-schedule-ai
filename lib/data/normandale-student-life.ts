export type NeedTag =
  | "friends"
  | "study"
  | "stress"
  | "basic-needs"
  | "leadership"
  | "belonging"
  | "career";

export type EnergyTag = "low" | "medium" | "high";
export type VibeTag = "quiet" | "social" | "productive";
export type TimeTag = "quick" | "medium" | "deep";

export interface StudentLifeItem {
  id: string;
  title: string;
  type: "resource" | "club" | "space" | "program";
  blurb: string;
  whyItHelps: string;
  url: string;
  location?: string;
  contact?: string;
  needTags: NeedTag[];
  energyTags: EnergyTag[];
  vibeTags: VibeTag[];
  timeTags: TimeTag[];
  sourceLabel: string;
}

export const NEED_OPTIONS: Array<{ id: NeedTag; label: string }> = [
  { id: "friends", label: "Meet people" },
  { id: "study", label: "Get school help" },
  { id: "stress", label: "Feel less stressed" },
  { id: "basic-needs", label: "Handle real-life stuff" },
  { id: "leadership", label: "Build leadership" },
  { id: "belonging", label: "Find my people" },
  { id: "career", label: "Do something useful for my future" }
];

export const ENERGY_OPTIONS: Array<{ id: EnergyTag; label: string }> = [
  { id: "low", label: "Low energy" },
  { id: "medium", label: "Normal energy" },
  { id: "high", label: "Ready to do something" }
];

export const VIBE_OPTIONS: Array<{ id: VibeTag; label: string }> = [
  { id: "quiet", label: "Quiet" },
  { id: "social", label: "People around" },
  { id: "productive", label: "Focused / useful" }
];

export const TIME_OPTIONS: Array<{ id: TimeTag; label: string }> = [
  { id: "quick", label: "10-20 min" },
  { id: "medium", label: "30-60 min" },
  { id: "deep", label: "1+ hour" }
];

export const NORMANDALE_STUDENT_LIFE_ITEMS: StudentLifeItem[] = [
  {
    id: "clubs-organizations",
    title: "Clubs and Organizations",
    type: "club",
    blurb: "Browse clubs, join meetings, or start one if your thing is missing.",
    whyItHelps: "Best when you want community, fun, and people with the same interests.",
    url: "https://www.normandale.edu/current-students/get-involved/clubs-organizations/index.html",
    location: "The Zone / Kopp Student Center",
    contact: "studentlife@normandale.edu · 952-358-8179",
    needTags: ["friends", "belonging", "leadership"],
    energyTags: ["medium", "high"],
    vibeTags: ["social"],
    timeTags: ["medium", "deep"],
    sourceLabel: "Normandale Clubs and Organizations"
  },
  {
    id: "student-senate",
    title: "Student Senate",
    type: "program",
    blurb: "Student government, campus leadership, and a direct voice in college life.",
    whyItHelps: "Great if you want leadership experience, community impact, and resume value.",
    url: "https://www.normandale.edu/current-students/get-involved/clubs-organizations/index.html",
    location: "Fireside Room, Kopp Student Center",
    contact: "studentlife@normandale.edu · 952-358-8125",
    needTags: ["leadership", "career", "belonging"],
    energyTags: ["medium", "high"],
    vibeTags: ["social", "productive"],
    timeTags: ["medium", "deep"],
    sourceLabel: "Normandale Clubs and Organizations"
  },
  {
    id: "program-board",
    title: "Normandale Program Board",
    type: "program",
    blurb: "Help plan campus events and make student life more fun for everyone.",
    whyItHelps: "Strong pick if you want creative leadership and a social campus role.",
    url: "https://www.normandale.edu/current-students/get-involved/clubs-organizations/index.html",
    location: "The Zone, Kopp Student Center",
    contact: "eve.christensen@normandale.edu · 952-358-8658",
    needTags: ["friends", "leadership", "career"],
    energyTags: ["medium", "high"],
    vibeTags: ["social", "productive"],
    timeTags: ["medium", "deep"],
    sourceLabel: "Normandale Clubs and Organizations"
  },
  {
    id: "kopp-center",
    title: "Kopp Student Center",
    type: "space",
    blurb: "The main student hub with lounge space, events, programs, and a place to hang between classes.",
    whyItHelps: "Easy win when you want somewhere welcoming without overthinking it.",
    url: "https://www.normandale.edu/current-students/get-involved/kopp-center.html",
    location: "Kopp Student Center",
    needTags: ["friends", "belonging", "stress"],
    energyTags: ["low", "medium", "high"],
    vibeTags: ["social", "quiet"],
    timeTags: ["quick", "medium", "deep"],
    sourceLabel: "Normandale Kopp Center"
  },
  {
    id: "tutoring-center",
    title: "Tutoring Center",
    type: "resource",
    blurb: "Free one-on-one tutoring for many classes, including lots of STEM courses.",
    whyItHelps: "Best move if school is feeling heavy and you need real help fast.",
    url: "https://www.normandale.edu/current-students/tutoring-and-support/academic-support-centers/tutoring-center.html",
    location: "College Services C2190",
    contact: "tutoringcenter@normandale.edu · 952-358-8624",
    needTags: ["study", "career"],
    energyTags: ["low", "medium"],
    vibeTags: ["productive", "quiet"],
    timeTags: ["medium", "deep"],
    sourceLabel: "Normandale Tutoring Center"
  },
  {
    id: "writing-center",
    title: "Writing Center",
    type: "resource",
    blurb: "Writing support for any course, any draft stage, and any major.",
    whyItHelps: "A solid choice when your brain is stuck on papers, discussion posts, or essays.",
    url: "https://www.normandale.edu/current-students/tutoring-and-support/academic-support-centers/",
    location: "College Services C2190",
    contact: "writingcenter@normandale.edu · 952-358-8624",
    needTags: ["study"],
    energyTags: ["low", "medium"],
    vibeTags: ["productive", "quiet"],
    timeTags: ["medium", "deep"],
    sourceLabel: "Normandale Academic Support Centers"
  },
  {
    id: "study-tools-tech",
    title: "Study Tools and Tech",
    type: "resource",
    blurb: "Help with D2L, syllabi, time management, study skills, calculator loans, and laptops.",
    whyItHelps: "Good if you are not failing a class exactly, but school still feels messy or overwhelming.",
    url: "https://www.normandale.edu/current-students/tutoring-and-support/academic-support-centers/study-aids.html",
    location: "Academic Support Centers",
    needTags: ["study", "stress", "basic-needs"],
    energyTags: ["low", "medium"],
    vibeTags: ["productive"],
    timeTags: ["quick", "medium"],
    sourceLabel: "Normandale Study Tools & Technologies"
  },
  {
    id: "advising-counseling-career",
    title: "Advising, Counseling and Career Center",
    type: "resource",
    blurb: "Academic advising, personal counseling, and career planning in one place.",
    whyItHelps: "Best when you feel unsure, overwhelmed, off-track, or need an actual person to talk to.",
    url: "https://www.normandale.edu/current-students/advising-counseling-and-career-center/index.html",
    location: "College Services C1115",
    contact: "advising@normandale.edu · 952-358-8261",
    needTags: ["stress", "career", "study"],
    energyTags: ["low", "medium"],
    vibeTags: ["quiet", "productive"],
    timeTags: ["medium", "deep"],
    sourceLabel: "Normandale Advising, Counseling and Career Center"
  },
  {
    id: "student-resource-center",
    title: "Student Resource Center",
    type: "resource",
    blurb: "Help with food, housing, childcare, transportation, laptops, emergency aid, and more.",
    whyItHelps: "This is the move when real life is making school harder than it needs to be.",
    url: "https://www.normandale.edu/student-experience/health.html",
    location: "Student Services",
    contact: "studentservices@normandale.edu · 952-358-8100",
    needTags: ["basic-needs", "stress"],
    energyTags: ["low"],
    vibeTags: ["productive", "quiet"],
    timeTags: ["quick", "medium"],
    sourceLabel: "Normandale Health and Wellness"
  },
  {
    id: "mental-health",
    title: "Mental Health Support",
    type: "resource",
    blurb: "Free confidential counseling support for currently enrolled students.",
    whyItHelps: "Good when stress is turning into shutdown, panic, or feeling alone.",
    url: "https://www.normandale.edu/student-experience/health.html",
    location: "Advising and Counseling",
    contact: "studentservices@normandale.edu · 952-358-8100",
    needTags: ["stress", "belonging"],
    energyTags: ["low"],
    vibeTags: ["quiet"],
    timeTags: ["medium", "deep"],
    sourceLabel: "Normandale Health and Wellness"
  },
  {
    id: "library",
    title: "Library Support",
    type: "space",
    blurb: "Research help plus a quieter academic space when you need to lock in.",
    whyItHelps: "Best for low-drama, focused time when you want to get something done.",
    url: "https://www.normandale.edu/student-experience/index.html",
    location: "Normandale Library",
    needTags: ["study", "stress"],
    energyTags: ["low", "medium"],
    vibeTags: ["quiet", "productive"],
    timeTags: ["quick", "medium", "deep"],
    sourceLabel: "Normandale Student Experience"
  },
  {
    id: "student-services",
    title: "Student Services",
    type: "resource",
    blurb: "Questions about registration, billing, records, financial aid, and key dates.",
    whyItHelps: "Use this when the problem is admin stuff, not classwork.",
    url: "https://www.normandale.edu/current-students/student-services/index.html",
    location: "1st Floor, College Services",
    contact: "studentservices@normandale.edu · 952-358-8100",
    needTags: ["basic-needs", "study"],
    energyTags: ["low", "medium"],
    vibeTags: ["productive"],
    timeTags: ["quick", "medium"],
    sourceLabel: "Normandale Student Services"
  },
  {
    id: "npowered",
    title: "NPowered",
    type: "program",
    blurb: "A support program for students in developmental education, EAP, corequisite, and similar courses.",
    whyItHelps: "Great if you want structure, encouragement, and accountability while building confidence.",
    url: "https://www.normandale.edu/current-students/tutoring-and-support/academic-support-centers/developmental-education.html",
    needTags: ["study", "stress", "belonging"],
    energyTags: ["low", "medium"],
    vibeTags: ["productive"],
    timeTags: ["medium", "deep"],
    sourceLabel: "Normandale NPowered"
  }
];
