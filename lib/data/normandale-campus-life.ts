export type NeedTag = "reset" | "people" | "help" | "productive";
export type VibeTag = "quiet" | "social" | "campus" | "outdoors";
export type TimeTag = "quick" | "between" | "stay";

export interface CampusItem {
  id: string;
  title: string;
  type: "spot" | "events" | "support" | "community";
  blurb: string;
  whyItFits: string;
  costLabel: string;
  location: string;
  url: string;
  sourceLabel: string;
  needTags: NeedTag[];
  vibeTags: VibeTag[];
  timeTags: TimeTag[];
}

export const NEED_OPTIONS: Array<{ id: NeedTag; label: string }> = [
  { id: "reset", label: "Reset" },
  { id: "people", label: "Be around people" },
  { id: "help", label: "Need help" },
  { id: "productive", label: "Do something useful" }
];

export const VIBE_OPTIONS: Array<{ id: VibeTag; label: string }> = [
  { id: "quiet", label: "Quiet" },
  { id: "social", label: "Social" },
  { id: "campus", label: "Campus life" },
  { id: "outdoors", label: "Fresh air" }
];

export const TIME_OPTIONS: Array<{ id: TimeTag; label: string }> = [
  { id: "quick", label: "10-20 min" },
  { id: "between", label: "Between classes" },
  { id: "stay", label: "Longer block" }
];

export const NORMANDALE_CAMPUS_ITEMS: CampusItem[] = [
  {
    id: "japanese-garden",
    title: "Walk the Japanese Garden",
    type: "spot",
    blurb: "A calm, actually pretty place to breathe, walk, or just get your head back together for a minute.",
    whyItFits: "Best when campus feels loud, your brain feels full, or you need a quiet reset without leaving school.",
    costLabel: "Free",
    location: "Behind the Kopp Student Center",
    url: "https://www.normandale.edu/why-normandale/community/japanese-garden/index.html",
    sourceLabel: "Normandale Japanese Garden",
    needTags: ["reset"],
    vibeTags: ["quiet", "outdoors"],
    timeTags: ["quick", "between", "stay"]
  },
  {
    id: "kopp-student-center",
    title: "Hang out in the Kopp Student Center",
    type: "spot",
    blurb: "The main campus hang space with lounge areas, food nearby, and a lot more life than sitting alone somewhere random.",
    whyItFits: "Good when you want campus energy, a place to land between classes, or just to not disappear after class ends.",
    costLabel: "Free",
    location: "Kopp Student Center",
    url: "https://www.normandale.edu/current-students/get-involved/kopp-center.html",
    sourceLabel: "Kopp Student Center",
    needTags: ["reset", "people"],
    vibeTags: ["social", "campus"],
    timeTags: ["quick", "between", "stay"]
  },
  {
    id: "student-life-events",
    title: "Check Student Life events",
    type: "events",
    blurb: "The easiest way to find what is actually happening on campus this week, from pop-ups to bigger events.",
    whyItFits: "Best when you want a real reason to stay on campus and maybe do something more fun than going straight home.",
    costLabel: "Usually free",
    location: "Student Life",
    url: "https://www.normandale.edu/current-students/get-involved/student-life.html",
    sourceLabel: "Normandale Student Life",
    needTags: ["people", "reset"],
    vibeTags: ["social", "campus"],
    timeTags: ["between", "stay"]
  },
  {
    id: "clubs-organizations",
    title: "Find a club or organization",
    type: "community",
    blurb: "If you want campus to feel less like class-only mode, this is where that starts.",
    whyItFits: "Best for meeting people, building routine, and making campus feel more like your place.",
    costLabel: "Free",
    location: "The Zone / Kopp Student Center",
    url: "https://www.normandale.edu/current-students/get-involved/clubs-organizations/index.html",
    sourceLabel: "Clubs and Organizations",
    needTags: ["people"],
    vibeTags: ["social", "campus"],
    timeTags: ["between", "stay"]
  },
  {
    id: "academic-support",
    title: "Use the Academic Support Centers",
    type: "support",
    blurb: "Tutoring, writing help, PASS, study help, and real support when coursework starts stacking up.",
    whyItFits: "Good when you do not need motivation, you need actual help and want to stop feeling stuck.",
    costLabel: "Free",
    location: "C building",
    url: "https://www.normandale.edu/current-students/tutoring-and-support/academic-support-centers/",
    sourceLabel: "Academic Support Centers",
    needTags: ["help", "productive"],
    vibeTags: ["quiet", "campus"],
    timeTags: ["between", "stay"]
  },
  {
    id: "study-tools-tech",
    title: "Get study tools and tech help",
    type: "support",
    blurb: "Help with D2L, time management, borrowing tools, and figuring out the campus tech side of being a student.",
    whyItFits: "Best when the problem is not the class itself, but the systems around the class.",
    costLabel: "Free",
    location: "Academic Support Centers",
    url: "https://www.normandale.edu/current-students/tutoring-and-support/academic-support-centers/study-aids.html",
    sourceLabel: "Study Tools & Technologies",
    needTags: ["help", "productive"],
    vibeTags: ["quiet", "campus"],
    timeTags: ["between", "stay"]
  },
  {
    id: "advising-counseling",
    title: "Talk to Advising or Counseling",
    type: "support",
    blurb: "For academic planning, career questions, transfer direction, or when life is hitting a little hard.",
    whyItFits: "Best when you want a real person, not more guessing.",
    costLabel: "Free",
    location: "C 1115",
    url: "https://www.normandale.edu/current-students/advising-counseling-and-career-center/index.html",
    sourceLabel: "Advising, Counseling and Career Center",
    needTags: ["help"],
    vibeTags: ["quiet", "campus"],
    timeTags: ["between", "stay"]
  },
  {
    id: "academic-calendar",
    title: "Check the academic calendar",
    type: "support",
    blurb: "Not exciting, but honestly one of the smartest ways to stop being surprised by deadlines and no-class days.",
    whyItFits: "Best when your week feels chaotic and you need clarity fast.",
    costLabel: "Free",
    location: "Online",
    url: "https://www.normandale.edu/current-students/academic-resources/calendar.html",
    sourceLabel: "Academic Calendar",
    needTags: ["productive", "help"],
    vibeTags: ["quiet"],
    timeTags: ["quick", "between"]
  }
];
