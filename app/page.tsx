"use client";

import { useMemo, useState } from "react";

import {
  NEED_OPTIONS,
  NORMANDALE_CAMPUS_ITEMS,
  TIME_OPTIONS,
  VIBE_OPTIONS,
  type CampusItem,
  type NeedTag,
  type TimeTag,
  type VibeTag
} from "@/lib/data/normandale-campus-life";

const CAMPUS_HIGHLIGHTS = [
  {
    title: "Japanese Garden",
    blurb: "The prettiest reset on campus. Quiet, free, and actually calming.",
    location: "Spring through fall",
    url: "https://www.normandale.edu/why-normandale/community/japanese-garden/index.html"
  },
  {
    title: "Kopp Student Center",
    blurb: "The heart of campus life. Lounge, eat, meet up, or just stop feeling isolated.",
    location: "Kopp",
    url: "https://www.normandale.edu/current-students/get-involved/kopp-center.html"
  },
  {
    title: "The Zone + Clubs",
    blurb: "Where campus starts feeling more social and less like class-then-leave mode.",
    location: "Kopp",
    url: "https://www.normandale.edu/current-students/get-involved/clubs-organizations/index.html"
  }
] as const;

const QUICK_LINKS = [
  {
    title: "Student Life events",
    blurb: "See what is happening on campus this week.",
    cta: "Open events",
    url: "https://www.normandale.edu/current-students/get-involved/student-life.html"
  },
  {
    title: "Academic support",
    blurb: "Tutoring, writing help, PASS, and study support.",
    cta: "Get support",
    url: "https://www.normandale.edu/current-students/tutoring-and-support/academic-support-centers/"
  },
  {
    title: "Advising and counseling",
    blurb: "Talk to someone about school, transfer, career, or stress.",
    cta: "Get help",
    url: "https://www.normandale.edu/current-students/advising-counseling-and-career-center/index.html"
  }
] as const;

export default function HomePage() {
  const [need, setNeed] = useState<NeedTag>("reset");
  const [vibe, setVibe] = useState<VibeTag>("campus");
  const [time, setTime] = useState<TimeTag>("between");

  const recommendations = useMemo(() => {
    return [...NORMANDALE_CAMPUS_ITEMS]
      .map((item) => ({
        item,
        score: scoreItem(item, { need, vibe, time })
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 4)
      .map((entry) => entry.item);
  }, [need, vibe, time]);

  const topPick = recommendations[0];

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">Normandale-only · campus life · real student resources</span>
        <h1>Normandale Next Move</h1>
        <p>
          A simple Normandale-only guide for when you are on campus and do not know what to do next. Get a quick reset, find people,
          get help, or make campus feel more like your place.
        </p>
        <div className="note-strip">
          <span>Between classes</span>
          <span>Real campus spots</span>
          <span>Events and clubs</span>
          <span>Support that actually helps</span>
        </div>
        <div className="hero-stripe" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-mini-grid">
          <article className="hero-mini-card">
            <strong>Need a reset?</strong>
            <span>Japanese Garden, quiet corners, low-pressure campus breathing room.</span>
          </article>
          <article className="hero-mini-card">
            <strong>Need people?</strong>
            <span>Student Life, clubs, Kopp energy, and things actually happening.</span>
          </article>
          <article className="hero-mini-card">
            <strong>Need help?</strong>
            <span>Tutoring, advising, counseling, and tools that make school feel less heavy.</span>
          </article>
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <div className="panel-inner">
            <h2 className="section-title">Quick Match</h2>
            <p className="section-copy">Three clicks. One better move right now.</p>

            <div className="step-list">
              <article className="step-card">
                <h3>What do you need most?</h3>
                <div className="chip-grid">
                  {NEED_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={need === option.id ? "chip-btn active" : "chip-btn"}
                      onClick={() => setNeed(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </article>

              <article className="step-card">
                <h3>What kind of vibe feels right?</h3>
                <div className="chip-grid">
                  {VIBE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={vibe === option.id ? "chip-btn active" : "chip-btn"}
                      onClick={() => setVibe(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </article>

              <article className="step-card">
                <h3>How much time do you have?</h3>
                <div className="chip-grid">
                  {TIME_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={time === option.id ? "chip-btn active" : "chip-btn"}
                      onClick={() => setTime(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-inner">
            <h2 className="section-title">Best Next Move</h2>
            <p className="section-copy">Based on what campus feels like for you right now.</p>

            {topPick ? (
              <article className="schedule-card spotlight-card">
                <span className="vibe-badge">Top pick</span>
                <h3>{topPick.title}</h3>
                <p>{topPick.blurb}</p>
                <div className="detail-stack">
                  <div className="detail-pill">{labelForType(topPick.type)}</div>
                  <div className="detail-pill">{topPick.location}</div>
                  <div className="detail-pill">{topPick.costLabel}</div>
                </div>
                <p className="helper-copy">{topPick.whyItFits}</p>
                <a className="primary-btn link-btn" href={topPick.url} target="_blank" rel="noreferrer">
                  Open official page
                </a>
                <p className="source-note">Source: {topPick.sourceLabel}</p>
              </article>
            ) : null}
          </div>
        </aside>
      </div>

      <section className="panel panel-spaced">
        <div className="panel-inner">
          <h2 className="section-title">More Good Fits</h2>
          <p className="section-copy">A few good options, not just one.</p>
          <div className="results-grid">
            {recommendations.map((item, index) => (
              <article className="schedule-card" key={item.id}>
                <div className="schedule-header">
                  <div>
                    <h3>{index === 0 ? "Top pick" : `Option ${index + 1}`}</h3>
                    <div className="muted">{labelForType(item.type)}</div>
                  </div>
                  <span className={`fit-pill ${index === 0 ? "best" : index === 1 ? "good" : "possible"}`}>
                    {index === 0 ? "Best fit" : index === 1 ? "Good fit" : "Try this too"}
                  </span>
                </div>
                <p>{item.blurb}</p>
                <p className="helper-copy">{item.whyItFits}</p>
                <div className="detail-stack">
                  <div className="detail-pill">{item.location}</div>
                  <div className="detail-pill">{item.costLabel}</div>
                </div>
                <a className="secondary-btn link-btn" href={item.url} target="_blank" rel="noreferrer">
                  Open
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel panel-spaced">
        <div className="panel-inner">
          <h2 className="section-title">Must-Know Normandale Spots</h2>
          <p className="section-copy">A few campus places and pages worth knowing early.</p>
          <div className="results-grid">
            {CAMPUS_HIGHLIGHTS.map((spot) => (
              <article className="schedule-card feature-card" key={spot.title}>
                <span className="vibe-badge">Campus pick</span>
                <h3>{spot.title}</h3>
                <p>{spot.blurb}</p>
                <div className="detail-stack">
                  <div className="detail-pill">{spot.location}</div>
                </div>
                <a className="secondary-btn link-btn" href={spot.url} target="_blank" rel="noreferrer">
                  Open official page
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel panel-spaced">
        <div className="panel-inner">
          <h2 className="section-title">Quick Normandale Links</h2>
          <p className="section-copy">Use these when you want a real next step fast.</p>
          <div className="results-grid">
            {QUICK_LINKS.map((item) => (
              <article className="schedule-card event-card" key={item.title}>
                <span className="vibe-badge">Open this</span>
                <h3>{item.title}</h3>
                <p>{item.blurb}</p>
                <a className="primary-btn link-btn" href={item.url} target="_blank" rel="noreferrer">
                  {item.cta}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function scoreItem(item: CampusItem, filters: { need: NeedTag; vibe: VibeTag; time: TimeTag }): number {
  let score = 0;

  if (item.needTags.includes(filters.need)) {
    score += 5;
  }
  if (item.vibeTags.includes(filters.vibe)) {
    score += 3;
  }
  if (item.timeTags.includes(filters.time)) {
    score += 2;
  }

  return score;
}

function labelForType(type: CampusItem["type"]): string {
  switch (type) {
    case "spot":
      return "Campus spot";
    case "events":
      return "Events";
    case "community":
      return "Clubs / community";
    case "support":
    default:
      return "Support";
  }
}
