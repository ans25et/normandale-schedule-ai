"use client";

import { useMemo, useState } from "react";

import {
  ENERGY_OPTIONS,
  NEED_OPTIONS,
  NORMANDALE_STUDENT_LIFE_ITEMS,
  TIME_OPTIONS,
  VIBE_OPTIONS,
  type EnergyTag,
  type NeedTag,
  type StudentLifeItem,
  type TimeTag,
  type VibeTag
} from "@/lib/data/normandale-student-life";

export default function HomePage() {
  const [need, setNeed] = useState<NeedTag>("study");
  const [energy, setEnergy] = useState<EnergyTag>("low");
  const [vibe, setVibe] = useState<VibeTag>("productive");
  const [time, setTime] = useState<TimeTag>("medium");

  const recommendations = useMemo(() => {
    return [...NORMANDALE_STUDENT_LIFE_ITEMS]
      .map((item) => ({
        item,
        score: scoreItem(item, { need, energy, vibe, time })
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 4)
      .map((entry) => entry.item);
  }, [need, energy, vibe, time]);

  const topPick = recommendations[0];

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">Normandale-only · no uploads · real campus links</span>
        <h1>Normandale Next Move</h1>
        <p>
          A tiny student-life helper for when you do not know what you need next. Pick your vibe, energy, and time, then get the
          best Normandale club, support service, or campus move for right now.
        </p>
        <div className="note-strip">
          <span>No PDFs</span>
          <span>ADHD-friendly</span>
          <span>Student life</span>
          <span>Built from Normandale pages</span>
        </div>
        <div className="hero-stripe" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <div className="panel-inner">
            <h2 className="section-title">Quick Match</h2>
            <p className="section-copy">Four clicks. One better next step.</p>

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
                <h3>Energy level</h3>
                <div className="chip-grid">
                  {ENERGY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={energy === option.id ? "chip-btn active" : "chip-btn"}
                      onClick={() => setEnergy(option.id)}
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
            <p className="section-copy">Based on what you picked right now.</p>

            {topPick ? (
              <article className="schedule-card spotlight-card">
                <span className="vibe-badge">Top pick</span>
                <h3>{topPick.title}</h3>
                <p>{topPick.blurb}</p>
                <div className="detail-stack">
                  <div className="detail-pill">{labelForType(topPick.type)}</div>
                  {topPick.location ? <div className="detail-pill">{topPick.location}</div> : null}
                </div>
                <p className="helper-copy">{topPick.whyItHelps}</p>
                {topPick.contact ? <p className="muted">{topPick.contact}</p> : null}
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
          <p className="section-copy">Not just one answer. A few solid options.</p>
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
                <p className="helper-copy">{item.whyItHelps}</p>
                <div className="detail-stack">
                  {item.location ? <div className="detail-pill">{item.location}</div> : null}
                  <div className="detail-pill">{item.sourceLabel}</div>
                </div>
                {item.contact ? <p className="muted">{item.contact}</p> : null}
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
          <h2 className="section-title">Why This Is Easier</h2>
          <div className="mini-grid">
            <article className="step-card">
              <h3>No uploads</h3>
              <p>No transcript, no schedule PDF, no parser errors.</p>
            </article>
            <article className="step-card">
              <h3>Normandale-only</h3>
              <p>Every recommendation points to a real Normandale page or campus resource.</p>
            </article>
            <article className="step-card">
              <h3>Still useful</h3>
              <p>Students can actually use this between classes, during stress, or when they feel lost.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

function scoreItem(
  item: StudentLifeItem,
  filters: { need: NeedTag; energy: EnergyTag; vibe: VibeTag; time: TimeTag }
): number {
  let score = 0;

  if (item.needTags.includes(filters.need)) {
    score += 5;
  }
  if (item.energyTags.includes(filters.energy)) {
    score += 2;
  }
  if (item.vibeTags.includes(filters.vibe)) {
    score += 2;
  }
  if (item.timeTags.includes(filters.time)) {
    score += 2;
  }

  return score;
}

function labelForType(type: StudentLifeItem["type"]): string {
  switch (type) {
    case "club":
      return "Club / community";
    case "space":
      return "Campus spot";
    case "program":
      return "Program";
    case "resource":
    default:
      return "Support resource";
  }
}
