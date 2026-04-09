"use client";

import { useMemo, useState } from "react";

import {
  BUDGET_OPTIONS,
  COMPANY_OPTIONS,
  MINNESOTA_OUTINGS,
  PRICE_CAP_OPTIONS,
  SEASON_OPTIONS,
  TIME_OPTIONS,
  VIBE_OPTIONS,
  type BudgetTag,
  type CompanyTag,
  type OutingItem,
  type PriceCapTag,
  type SeasonTag,
  type TimeTag,
  type VibeTag
} from "@/lib/data/minnesota-outings";

export default function HomePage() {
  const [company, setCompany] = useState<CompanyTag>("friends");
  const [budget, setBudget] = useState<BudgetTag>("free");
  const [vibe, setVibe] = useState<VibeTag>("scenic");
  const [time, setTime] = useState<TimeTag>("half-day");
  const [season, setSeason] = useState<SeasonTag>("any");
  const [priceCap, setPriceCap] = useState<PriceCapTag>("under-25");
  const [kidFriendlyOnly, setKidFriendlyOnly] = useState(false);

  const recommendations = useMemo(() => {
    return [...MINNESOTA_OUTINGS]
      .map((item) => ({
        item,
        score: scoreItem(item, { company, budget, vibe, time, season, priceCap, kidFriendlyOnly })
      }))
      .filter((entry) => entry.score > -100)
      .sort((left, right) => right.score - left.score)
      .slice(0, 4)
      .map((entry) => entry.item);
  }, [company, budget, vibe, time, season, priceCap, kidFriendlyOnly]);

  const topPick = recommendations[0];

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">Minnesota-only · no uploads · real places</span>
        <h1>Minnesota Next Move</h1>
        <p>
          Find a reason to leave the house. Pick who you are with, what you want to spend, and the kind of vibe you want, then get
          real Minnesota ideas for solo time, friend hangs, dates, or family plans.
        </p>
        <div className="note-strip">
          <span>Solo or with people</span>
          <span>Free to paid</span>
          <span>ADHD-friendly</span>
          <span>Built from official links</span>
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
            <p className="section-copy">Fast filters, less overthinking.</p>

            <div className="step-list">
              <article className="step-card">
                <h3>Who is this for?</h3>
                <div className="chip-grid">
                  {COMPANY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={company === option.id ? "chip-btn active" : "chip-btn"}
                      onClick={() => setCompany(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </article>

              <article className="step-card">
                <h3>Budget</h3>
                <div className="chip-grid">
                  {BUDGET_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={budget === option.id ? "chip-btn active" : "chip-btn"}
                      onClick={() => setBudget(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </article>

              <article className="step-card">
                <h3>What kind of vibe do you want?</h3>
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

              <article className="step-card">
                <h3>Weather or season</h3>
                <div className="chip-grid">
                  {SEASON_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={season === option.id ? "chip-btn active" : "chip-btn"}
                      onClick={() => setSeason(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </article>

              <article className="step-card">
                <h3>Keep it under</h3>
                <div className="chip-grid">
                  {PRICE_CAP_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={priceCap === option.id ? "chip-btn active" : "chip-btn"}
                      onClick={() => setPriceCap(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </article>

              <article className="step-card">
                <h3>Extra</h3>
                <div className="chip-grid">
                  <button
                    type="button"
                    className={kidFriendlyOnly ? "chip-btn active" : "chip-btn"}
                    onClick={() => setKidFriendlyOnly((current) => !current)}
                  >
                    {kidFriendlyOnly ? "Kid-friendly only" : "Include all"}
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-inner">
            <h2 className="section-title">Best Next Move</h2>
            <p className="section-copy">Based on what sounds good right now.</p>

            {topPick ? (
              <article className="schedule-card spotlight-card">
                <span className="vibe-badge">Top pick</span>
                <h3>{topPick.title}</h3>
                <p>{topPick.blurb}</p>
                <div className="detail-stack">
                  <div className="detail-pill">{labelForType(topPick.type)}</div>
                  <div className="detail-pill">{topPick.city}</div>
                  <div className="detail-pill">{topPick.costLabel}</div>
                  {topPick.kidFriendly ? <div className="detail-pill">Kid-friendly</div> : null}
                </div>
                <p className="helper-copy">{topPick.whyItFits}</p>
                <p className="muted">{topPick.costHint}</p>
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
                <p className="helper-copy">{item.whyItFits}</p>
                <div className="detail-stack">
                  <div className="detail-pill">{item.city}</div>
                  <div className="detail-pill">{item.costLabel}</div>
                  {item.kidFriendly ? <div className="detail-pill">Kid-friendly</div> : null}
                </div>
                <p className="muted">{item.costHint}</p>
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
          <h2 className="section-title">Why This Is Better</h2>
          <div className="mini-grid">
            <article className="step-card">
              <h3>No homework setup</h3>
              <p>No account, no transcript, no schedule parser, no annoying form.</p>
            </article>
            <article className="step-card">
              <h3>Actually gets you out</h3>
              <p>It is built around real places you can go, not fake productivity guilt.</p>
            </article>
            <article className="step-card">
              <h3>Free to paid</h3>
              <p>You can pick something free, cheap, or more like a full plan depending on your budget.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

function scoreItem(
  item: OutingItem,
  filters: {
    company: CompanyTag;
    budget: BudgetTag;
    vibe: VibeTag;
    time: TimeTag;
    season: SeasonTag;
    priceCap: PriceCapTag;
    kidFriendlyOnly: boolean;
  }
): number {
  let score = 0;

  if (filters.kidFriendlyOnly && !item.kidFriendly) {
    return -999;
  }

  if (item.companyTags.includes(filters.company)) {
    score += 5;
  }
  if (item.budgetTags.includes(filters.budget)) {
    score += 4;
  }
  if (item.vibeTags.includes(filters.vibe)) {
    score += 3;
  }
  if (item.timeTags.includes(filters.time)) {
    score += 2;
  }
  if (filters.season === "any" || item.seasonTags.includes(filters.season)) {
    score += 2;
  }
  if (filters.priceCap === "any" || item.priceCaps.includes(filters.priceCap)) {
    score += 2;
  }

  return score;
}

function labelForType(type: OutingItem["type"]): string {
  switch (type) {
    case "park":
      return "Park";
    case "day-trip":
      return "Day trip";
    case "garden":
      return "Garden / zoo";
    case "city-spot":
      return "City spot";
    case "museum":
    default:
      return "Museum / culture";
  }
}
