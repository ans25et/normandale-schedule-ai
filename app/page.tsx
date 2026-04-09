"use client";

import { useMemo, useState } from "react";

import { NORMANDALE_PROGRAMS } from "@/lib/catalog/programs";
import type {
  CourseSearchParseResult,
  PathwayParseResult,
  PlanResult,
  StudentConstraintBlock,
  StudentConstraints,
  TranscriptParseResult
} from "@/lib/types";

const interestOptions = [
  { id: "arts-humanities", label: "Arts, Communication & Humanities" },
  { id: "business", label: "Business" },
  { id: "education", label: "Teaching & Education" },
  { id: "healthcare", label: "Healthcare & Wellness" },
  { id: "social-behavioral", label: "Social & Behavioral Sciences" },
  { id: "stem", label: "Science, Technology, Engineering & Math" },
  { id: "liberal-studies", label: "Liberal Education & Individualized Studies" }
];

const defaultConstraints: StudentConstraints = {
  latestClassTime: "05:00PM",
  maxCredits: 14,
  unavailableBlocks: [],
  interestTags: []
};

export default function HomePage() {
  const [programId] = useState("normandale-general-v1");
  const [schoolName, setSchoolName] = useState("");
  const [termLabel, setTermLabel] = useState("Fall 2026");
  const [constraints, setConstraints] = useState<StudentConstraints>(defaultConstraints);
  const [transcriptDocumentId, setTranscriptDocumentId] = useState<string>();
  const [transcriptPreview, setTranscriptPreview] = useState<TranscriptParseResult>();
  const [pathwayDocumentId, setPathwayDocumentId] = useState<string>();
  const [pathwayPreview, setPathwayPreview] = useState<PathwayParseResult>();
  const [selectedMajor, setSelectedMajor] = useState("");
  const [useBuiltInFallCatalog, setUseBuiltInFallCatalog] = useState(false);
  const [courseSearchDocumentIds, setCourseSearchDocumentIds] = useState<string[]>([]);
  const [courseSearchPayloads, setCourseSearchPayloads] = useState<CourseSearchParseResult[]>([]);
  const [plan, setPlan] = useState<PlanResult>();
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);

  const currentMajorLabel = useMemo(() => {
    if (selectedMajor.trim()) {
      return selectedMajor;
    }
    if (transcriptPreview?.majors.length) {
      return transcriptPreview.majors[0];
    }
    return "Choose your current degree";
  }, [selectedMajor, transcriptPreview]);

  const currentSchoolLabel = schoolName.trim() || "Your school";

  async function uploadSingleFile<T>(
    endpoint: string,
    file: File,
    onSuccess: (documentId: string | undefined, payload: T) => void
  ): Promise<void> {
    setError(undefined);
    setStatus(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData
    });

    const raw = await response.text();
    let data: { documentId?: string; payload?: T; error?: string };

    try {
      data = JSON.parse(raw) as { documentId?: string; payload?: T; error?: string };
    } catch {
      throw new Error(raw || "Upload failed.");
    }

    if (!response.ok) {
      throw new Error(data.error ?? "Upload failed.");
    }

    if (data.payload === undefined) {
      throw new Error("Upload returned no parsed data.");
    }

    onSuccess(data.documentId, data.payload);
    setStatus(`${file.name} is ready.`);
  }

  async function handleGeneratePlan(): Promise<void> {
    try {
      setIsGenerating(true);
      setError(undefined);
      setStatus("Building schedule options...");

      const response = await fetch("/api/plan/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          programId,
          termLabel,
          transcriptDocumentId,
          transcriptPayload: transcriptPreview,
          pathwayDocumentId,
          pathwayPayload: pathwayPreview,
          courseSearchDocumentIds,
          courseSearchPayloads,
          constraints,
          selectedMajor,
          useBuiltInFallCatalog
        })
      });

      const raw = await response.text();
      let data: any;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(raw || "Plan generation failed.");
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Plan generation failed.");
      }

      setPlan(data);
      setStatus(`Found ${data.options.length} schedule option${data.options.length === 1 ? "" : "s"}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate a plan.");
    } finally {
      setIsGenerating(false);
    }
  }

  function addUnavailableBlock(): void {
    setConstraints((current) => ({
      ...current,
      unavailableBlocks: [
        ...current.unavailableBlocks,
        {
          label: "Busy time",
          days: ["M"],
          startTime: "09:00AM",
          endTime: "11:00AM"
        }
      ]
    }));
  }

  function updateBlock(index: number, next: StudentConstraintBlock): void {
    setConstraints((current) => ({
      ...current,
      unavailableBlocks: current.unavailableBlocks.map((block, currentIndex) => (currentIndex === index ? next : block))
    }));
  }

  function removeBlock(index: number): void {
    setConstraints((current) => ({
      ...current,
      unavailableBlocks: current.unavailableBlocks.filter((_, currentIndex) => currentIndex !== index)
    }));
  }

  function toggleInterest(tag: string): void {
    setConstraints((current) => ({
      ...current,
      interestTags: current.interestTags?.includes(tag)
        ? current.interestTags.filter((value) => value !== tag)
        : [...(current.interestTags ?? []), tag]
    }));
  }

  function getFitTone(score: number): { label: string; tone: "best" | "good" | "possible" } {
    if (score >= 430) {
      return { label: "Best fit", tone: "best" };
    }
    if (score >= 300) {
      return { label: "Good fit", tone: "good" };
    }
    return { label: "Possible fit", tone: "possible" };
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">{termLabel} · bring your own files</span>
        <h1>Build a class schedule that actually fits your life.</h1>
        <p>
          Upload your transcript, upload your semester class files, block out work or life stuff, and get cleaner schedule options
          faster.
        </p>
        <div className="note-strip">
          <span>Any major</span>
          <span>Your school files</span>
          <span>ADHD-friendly</span>
          <span>Work-life aware</span>
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
            <h2 className="section-title">Setup</h2>
            <p className="section-copy">School, files, blocked time, done.</p>

            <div className="step-list">
              <div className="step-card">
                <h3>1. School + term</h3>
                <div className="mini-grid">
                  <div className="field">
                    <label htmlFor="school">School</label>
                    <input
                      id="school"
                      value={schoolName}
                      onChange={(event) => setSchoolName(event.target.value)}
                      placeholder="Example: Normandale, UMN, Metro State"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="term">Term</label>
                    <input
                      id="term"
                      value={termLabel}
                      onChange={(event) => setTermLabel(event.target.value)}
                      placeholder="Example: Fall 2026"
                    />
                  </div>
                </div>
              </div>

              <div className="step-card">
                <h3>2. Transcript</h3>
                <div className="upload-card">
                  <h4>Transcript or academic record PDF</h4>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        await uploadSingleFile<TranscriptParseResult>("/api/uploads/transcript", file, (documentId, payload) => {
                          if (documentId) {
                            setTranscriptDocumentId(documentId);
                          }
                          setTranscriptPreview(payload);
                          if (!selectedMajor && payload.majors.length > 0) {
                            setSelectedMajor(payload.majors[0]);
                          }
                        });
                      } catch (caught) {
                        setError(caught instanceof Error ? caught.message : "Transcript upload failed.");
                      }
                    }}
                  />
                  <div className="upload-status">{transcriptDocumentId ? "Transcript ready" : "Required"}</div>
                </div>
              </div>

              <div className="step-card">
                <h3>3. Current degree</h3>
                <p className="helper-copy">We do not lock you into the degree shown on your transcript. Change it anytime.</p>
                <div className="field">
                  <label htmlFor="major">Your degree now</label>
                  <input
                    id="major"
                    list="major-options"
                    value={selectedMajor}
                    onChange={(event) => setSelectedMajor(event.target.value)}
                    placeholder="Example: Psychology, Nursing, Computer Science"
                  />
                  <datalist id="major-options">
                    {(transcriptPreview?.majors ?? []).map((major) => (
                      <option key={major} value={major} />
                    ))}
                    {schoolName.trim().toLowerCase().includes("normandale")
                      ? NORMANDALE_PROGRAMS.map((program) => (
                      <option key={program} value={program} />
                        ))
                      : null}
                  </datalist>
                </div>
                <div className="upload-card" style={{ marginTop: "12px" }}>
                  <h4>Optional degree plan or pathway PDF</h4>
                  <p className="helper-copy">
                    Upload one if you have it. This helps the planner understand your degree rules better.
                  </p>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        await uploadSingleFile<PathwayParseResult>("/api/uploads/pathway", file, (documentId, payload) => {
                          if (documentId) {
                            setPathwayDocumentId(documentId);
                          }
                          setPathwayPreview(payload);
                        });
                      } catch (caught) {
                        setError(caught instanceof Error ? caught.message : "Pathway upload failed.");
                      }
                    }}
                  />
                  <div className="upload-status">{pathwayDocumentId ? "Optional pathway ready" : "Optional"}</div>
                </div>
              </div>

              <div className="step-card">
                <h3>4. Semester classes</h3>
                <div className="toggle-row">
                  <button
                    type="button"
                    className={useBuiltInFallCatalog ? "primary-btn" : "secondary-btn"}
                    onClick={() => setUseBuiltInFallCatalog(true)}
                  >
                    Use built-in catalog
                  </button>
                  <button
                    type="button"
                    className={!useBuiltInFallCatalog ? "primary-btn" : "secondary-btn"}
                    onClick={() => setUseBuiltInFallCatalog(false)}
                  >
                    Upload my own class PDFs
                  </button>
                </div>

                {useBuiltInFallCatalog ? (
                  <p className="helper-copy">
                    Best when you are using the built-in Normandale Fall 2026 catalog. For any other school, use your own class PDFs.
                  </p>
                ) : (
                  <div className="upload-card">
                    <h4>Semester class-search PDFs</h4>
                    <p className="helper-copy">Upload however many files you have. Overlapping files are okay.</p>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={async (event) => {
                        const files = Array.from(event.target.files ?? []);
                        if (files.length === 0) return;

                        try {
                          for (const file of files) {
                            await uploadSingleFile<CourseSearchParseResult>("/api/uploads/course-search", file, (documentId, payload) => {
                              if (documentId) {
                                setCourseSearchDocumentIds((current) => [...current, documentId]);
                              }
                              setCourseSearchPayloads((current) => [...current, payload]);
                            });
                          }
                        } catch (caught) {
                          setError(caught instanceof Error ? caught.message : "Course search upload failed.");
                        }
                      }}
                    />
                    <div className="upload-status">{courseSearchDocumentIds.length} subject PDF(s) ready</div>
                  </div>
                )}
              </div>

              <div className="step-card">
                <h3>5. Time limits</h3>
                <div className="mini-grid">
                  <div className="field">
                    <label htmlFor="credits">Max credits</label>
                    <input
                      id="credits"
                      type="number"
                      min={1}
                      max={20}
                      value={constraints.maxCredits}
                      onChange={(event) =>
                        setConstraints((current) => ({ ...current, maxCredits: Number(event.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="earliest">Earliest class time</label>
                    <input
                      id="earliest"
                      value={constraints.earliestClassTime ?? ""}
                      onChange={(event) => setConstraints((current) => ({ ...current, earliestClassTime: event.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="latest">Latest class time</label>
                    <input
                      id="latest"
                      value={constraints.latestClassTime ?? ""}
                      onChange={(event) => setConstraints((current) => ({ ...current, latestClassTime: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Things you like</label>
                  <div className="chip-grid">
                    {interestOptions.map((option) => {
                      const active = constraints.interestTags?.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={active ? "chip-btn active" : "chip-btn"}
                          onClick={() => toggleInterest(option.id)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="helper-copy">
                    This helps break ties when more than one elective-style schedule could work.
                  </p>
                </div>

                <div className="constraint-list">
                  {constraints.unavailableBlocks.map((block, index) => (
                    <div className="constraint-row" key={`${block.label}-${index}`}>
                      <div className="field">
                        <label>Label</label>
                        <input
                          value={block.label}
                          onChange={(event) => updateBlock(index, { ...block, label: event.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Days</label>
                        <select
                          value={block.days.join("")}
                          onChange={(event) => updateBlock(index, { ...block, days: event.target.value.split("") })}
                        >
                          <option value="M">Monday</option>
                          <option value="T">Tuesday</option>
                          <option value="W">Wednesday</option>
                          <option value="R">Thursday</option>
                          <option value="F">Friday</option>
                          <option value="MW">Mon + Wed</option>
                          <option value="TR">Tue + Thu</option>
                          <option value="MWF">Mon + Wed + Fri</option>
                        </select>
                      </div>
                      <div className="mini-grid">
                        <div className="field">
                          <label>Start</label>
                          <input
                            value={block.startTime}
                            onChange={(event) => updateBlock(index, { ...block, startTime: event.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>End</label>
                          <input
                            value={block.endTime}
                            onChange={(event) => updateBlock(index, { ...block, endTime: event.target.value })}
                          />
                        </div>
                      </div>
                      <button className="ghost-btn" type="button" onClick={() => removeBlock(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="actions actions-stack">
                  <button className="secondary-btn" type="button" onClick={addUnavailableBlock}>
                    Add blocked time
                  </button>
                  <button className="primary-btn" type="button" onClick={handleGeneratePlan} disabled={!transcriptPreview || isGenerating}>
                    {isGenerating ? "Building..." : "Show schedules"}
                  </button>
                </div>
              </div>
            </div>

            {status ? <div className="status-banner">{status}</div> : null}
            {error ? <div className="status-banner error">{error}</div> : null}
          </div>
        </section>

        <aside className="panel">
          <div className="panel-inner">
            <h2 className="section-title">{currentMajorLabel}</h2>
            <p className="section-copy">
              {currentSchoolLabel} · {termLabel}. Start here, then sanity-check with an advisor if you have one.
            </p>

            <article className="schedule-card" style={{ marginBottom: "16px" }}>
              <h3 style={{ marginTop: 0 }}>How this works</h3>
              <p className="muted">
                The app reads your transcript and class-list PDFs, filters around your blocked time, and tries to find schedule mixes
                that look realistic.
              </p>
              <p className="helper-copy" style={{ marginBottom: 0 }}>
                If your school files are incomplete or messy, the results can be incomplete too.
              </p>
            </article>

            {isGenerating ? (
              <article className="schedule-card loading-card">
                <div className="loading-badge">Building schedule</div>
                <div className="loading-mark" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <h3>Finding your best Fall 2026 options...</h3>
                <p>
                  Checking your transcript, matching classes, and sorting out the cleanest schedule fits.
                </p>
                <div className="loading-steps" aria-hidden="true">
                  <div />
                  <div />
                  <div />
                </div>
              </article>
            ) : null}

            {!plan ? (
              <div className="empty-state vibe-state">
                <span className="vibe-badge">Planner preview</span>
                <h3>No schedule cards yet</h3>
                <p>Your schedule options will show up here after you upload your files and run the planner.</p>
              </div>
            ) : (
              <div className="schedule-stack">
                {plan.parserWarnings.length > 0 ? (
                  <article className="schedule-card">
                    <h3 style={{ marginTop: 0 }}>Planning notes</h3>
                    <ul className="warning-list">
                      {plan.parserWarnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </article>
                ) : null}

                {plan.retakeSuggestions.length > 0 ? (
                  <article className="schedule-card">
                    <h3 style={{ marginTop: 0 }}>Possible GPA boost</h3>
                    <p className="muted" style={{ marginTop: 0 }}>
                      If raising your GPA matters this term, these are the classes that may be worth revisiting.
                    </p>
                    <div className="course-list">
                      {plan.retakeSuggestions.map((suggestion) => (
                        <div className="course-chip" key={`${suggestion.courseCode}-${suggestion.termLabel}`}>
                          <strong>{suggestion.courseCode}</strong>
                          <div>{suggestion.title}</div>
                          <div className="muted">
                            {suggestion.termLabel} · Grade {String(suggestion.grade)}
                            {suggestion.offeredThisTerm ? " · Offered this fall" : ""}
                          </div>
                          <div className="helper-copy">{suggestion.reason}</div>
                        </div>
                      ))}
                    </div>
                  </article>
                ) : null}

                {plan.options.length === 0 ? (
                  <div className="empty-state">
                    No valid combinations were found. Try a higher credit cap, fewer blocked times, or extra uploaded subject PDFs.
                  </div>
                ) : null}

                {plan.options.map((option) => (
                  <article className="schedule-card" key={option.id}>
                    <div className="schedule-header">
                      <div>
                        <h3>Option {option.rank}</h3>
                        <div className="muted">{option.credits} credits</div>
                      </div>
                      <span className={`fit-pill ${getFitTone(option.score).tone}`}>{getFitTone(option.score).label}</span>
                    </div>

                    <p>{option.explanation}</p>

                    <div className="course-list">
                      {option.sections.map((section) => (
                        <div className="course-chip" key={`${section.courseCode}-${section.section}`}>
                          <strong>
                            {section.courseCode} · Sec {section.section}
                          </strong>
                          <div>{section.title}</div>
                          <div className="muted">
                            {section.meetingText}
                            {section.modality ? ` · ${section.modality}` : ""}
                            {section.instructor ? ` · ${section.instructor}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>

                    {option.warnings.length > 0 ? (
                      <ul className="warning-list">
                        {option.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
