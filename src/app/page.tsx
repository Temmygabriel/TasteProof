"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AnchorType, TasteTestRun, Verdict } from "../lib/types";
import { compareAnchorChanges } from "../lib/anchor-change";

type QlooEntityOption = { entityId: string; name: string; subtype: string | null };
type AnchorDraft = { name: string; type: AnchorType; entityId?: string };
type EntitySearchState = {
  query: string;
  type?: AnchorType;
  loading: boolean;
  matches: QlooEntityOption[];
  error?: string;
};

const initialAnchors: AnchorDraft[] = [
  { name: "Tyler, the Creator", type: "artist" },
  { name: "Aesop", type: "brand" },
  { name: "Spirited Away", type: "movie" }
];

// These are example inputs used by the live browser verification workflow.
// They are not stored results: every verdict below comes from a new Qloo request.
const initialCandidates = ["One Times Square", "Brooklyn Bridge", "Mood Fabrics"];
const initialTask = "Check an agent's place recommendations for New York City.";
const initialLocation = "New York City";

const anchorTypeOptions: Array<{ value: AnchorType; label: string }> = [
  { value: "artist", label: "Artist" },
  { value: "brand", label: "Brand" },
  { value: "movie", label: "Film" },
  { value: "tv_show", label: "TV series" },
  { value: "book", label: "Book" },
  { value: "place", label: "Place" },
  { value: "podcast", label: "Podcast" },
  { value: "videogame", label: "Video game" }
];

const verdictLabel: Record<Verdict, string> = {
  PASS: "Strong match",
  REVIEW: "Take a closer look",
  FAIL: "Weak match",
  UNRESOLVED: "Not enough evidence"
};

const editorialImages = [
  "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=640&q=82",
  "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=640&q=82",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=640&q=82"
];

function compareRuns(previous: TasteTestRun, current: TasteTestRun) {
  return current.candidates.map((candidate) => {
    const old = previous.candidates.find((item) =>
      item.inputName.toLowerCase() === candidate.inputName.toLowerCase()
    );
    return {
      candidate: candidate.inputName,
      previousRank: old?.qlooRank ?? null,
      currentRank: candidate.qlooRank,
      previousVerdict: old?.verdict ?? null,
      currentVerdict: candidate.verdict,
      changed: Boolean(old && (
        old.qlooRank !== candidate.qlooRank || old.verdict !== candidate.verdict
      ))
    };
  });
}

function verdictCount(run: TasteTestRun, verdict: Verdict) {
  return run.candidates.filter((candidate) => candidate.verdict === verdict).length;
}

function scrollToTest() {
  document.getElementById("test-lab")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HomePage() {
  const [anchors, setAnchors] = useState<AnchorDraft[]>(initialAnchors);
  const [task, setTask] = useState(initialTask);
  const [location, setLocation] = useState(initialLocation);
  const [candidates, setCandidates] = useState<string[]>(initialCandidates);
  const [candidateEntityIds, setCandidateEntityIds] = useState<Array<string | null>>(
    initialCandidates.map(() => null)
  );
  const [anchorSearch, setAnchorSearch] = useState<Record<number, EntitySearchState>>({});
  const [candidateSearch, setCandidateSearch] = useState<Record<number, EntitySearchState>>({});
  const [result, setResult] = useState<TasteTestRun | null>(null);
  const [previousRun, setPreviousRun] = useState<TasteTestRun | null>(null);
  const [error, setError] = useState("");
  const [errorState, setErrorState] = useState("");
  const [busy, setBusy] = useState(false);
  const [qlooConfigured, setQlooConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/health", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { qlooKeyConfigured?: boolean }) => {
        if (active) setQlooConfigured(Boolean(data.qlooKeyConfigured));
      })
      .catch(() => {
        if (active) setQlooConfigured(false);
      });
    return () => { active = false; };
  }, []);

  function clearAnchorSearch(index: number) {
    setAnchorSearch((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  }

  function clearCandidateSearch(index: number) {
    setCandidateSearch((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  }

  function setAnchor(index: number, key: "name" | "type", value: string) {
    setAnchors((current) => current.map((anchor, i) => {
      if (i !== index) return anchor;
      // A typed name/category change invalidates any previously selected entity ID.
      return key === "type"
        ? { name: anchor.name, type: value as AnchorType }
        : { name: value, type: anchor.type };
    }));
    clearAnchorSearch(index);
  }

  async function requestEntityMatches(query: string, type: AnchorType): Promise<QlooEntityOption[]> {
    const response = await fetch("/api/qloo/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ query, type })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(typeof payload.error === "string" ? payload.error : "Qloo entity search failed.");
    }
    return Array.isArray(payload.entities) ? payload.entities as QlooEntityOption[] : [];
  }

  async function searchAnchor(index: number) {
    const anchor = anchors[index];
    const query = anchor?.name.trim();
    if (!anchor || !query || busy) return;
    setAnchorSearch((current) => ({
      ...current,
      [index]: { query, type: anchor.type, loading: true, matches: [] }
    }));
    try {
      const matches = await requestEntityMatches(query, anchor.type);
      setAnchorSearch((current) => ({
        ...current,
        [index]: { query, type: anchor.type, loading: false, matches }
      }));
    } catch (caught) {
      setAnchorSearch((current) => ({
        ...current,
        [index]: {
          query, type: anchor.type, loading: false, matches: [],
          error: caught instanceof Error ? caught.message : "Qloo entity search failed."
        }
      }));
    }
  }

  function selectAnchorMatch(index: number, match: QlooEntityOption) {
    setAnchors((current) => current.map((anchor, i) => i === index
      ? { name: match.name, type: anchor.type, entityId: match.entityId }
      : anchor
    ));
    clearAnchorSearch(index);
  }

  async function searchCandidate(index: number) {
    const query = candidates[index]?.trim();
    if (!query || busy) return;
    setCandidateSearch((current) => ({
      ...current,
      [index]: { query, loading: true, matches: [] }
    }));
    try {
      const matches = await requestEntityMatches(query, "place");
      setCandidateSearch((current) => ({
        ...current,
        [index]: { query, loading: false, matches }
      }));
    } catch (caught) {
      setCandidateSearch((current) => ({
        ...current,
        [index]: {
          query, loading: false, matches: [],
          error: caught instanceof Error ? caught.message : "Qloo entity search failed."
        }
      }));
    }
  }

  function setCandidateName(index: number, value: string) {
    setCandidates((current) => current.map((item, i) => i === index ? value : item));
    setCandidateEntityIds((current) => current.map((id, i) => i === index ? null : id));
    clearCandidateSearch(index);
  }

  function selectCandidateMatch(index: number, match: QlooEntityOption) {
    setCandidates((current) => current.map((name, i) => i === index ? match.name : name));
    setCandidateEntityIds((current) => current.map((id, i) => i === index ? match.entityId : id));
    clearCandidateSearch(index);
  }

  function addAnchor() {
    setAnchors((current) => current.length >= 5
      ? current
      : [...current, { name: "", type: "artist" }]);
    setAnchorSearch({});
  }

  function removeAnchor(index: number) {
    setAnchors((current) => current.length <= 1
      ? current
      : current.filter((_, i) => i !== index));
    setAnchorSearch({});
  }

  function addCandidate() {
    setCandidates((current) => current.length >= 10 ? current : [...current, ""]);
    setCandidateEntityIds((current) => current.length >= 10 ? current : [...current, null]);
    setCandidateSearch({});
  }

  function removeCandidate(index: number) {
    setCandidates((current) => current.length <= 1
      ? current
      : current.filter((_, i) => i !== index));
    setCandidateEntityIds((current) => current.length <= 1
      ? current
      : current.filter((_, i) => i !== index));
    setCandidateSearch({});
  }

  function restoreVerifiedExample() {
    setAnchors(initialAnchors.map((anchor) => ({ ...anchor })));
    setTask(initialTask);
    setLocation(initialLocation);
    setCandidates([...initialCandidates]);
    setCandidateEntityIds(initialCandidates.map(() => null));
    setAnchorSearch({});
    setCandidateSearch({});
    setResult(null);
    setPreviousRun(null);
    setError("");
    setErrorState("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setErrorState("");
    setBusy(true);
    try {
      const candidateRows = candidates.map((candidate, index) => ({
        name: candidate.trim(),
        entityId: candidateEntityIds[index] ?? null
      })).filter((candidate) => candidate.name);
      const submittedCandidates = candidateRows.map((candidate) => candidate.name);
      if (!submittedCandidates.length) {
        throw new Error("Add at least one recommendation from the AI agent before running the test.");
      }
      const submittedAnchors = anchors.map((anchor) => ({
        name: anchor.name.trim(),
        type: anchor.type,
        ...(anchor.entityId ? { entityId: anchor.entityId } : {})
      }));
      const candidateSelections = candidateRows
        .filter((candidate): candidate is { name: string; entityId: string } => Boolean(candidate.entityId))
        .map(({ name, entityId }) => ({ name, entityId }));
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anchors: submittedAnchors,
          task,
          location,
          candidates: submittedCandidates,
          candidateSelections
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setErrorState(typeof payload.state === "string" ? payload.state : "");
        const unresolved = Array.isArray(payload.unresolvedAnchors) ? payload.unresolvedAnchors as Array<{
          name: string; type?: AnchorType; matches?: QlooEntityOption[];
        }> : [];
        if (unresolved.length) {
          const firstUnresolvedIndex = anchors.findIndex((anchor) =>
            unresolved.some((item) => item.name.trim().toLocaleLowerCase() === anchor.name.trim().toLocaleLowerCase() && item.type === anchor.type)
          );
          setAnchorSearch((current) => {
            const next = { ...current };
            unresolved.forEach((item) => {
              const index = anchors.findIndex((anchor) =>
                anchor.name.trim().toLocaleLowerCase() === item.name.trim().toLocaleLowerCase() && anchor.type === item.type
              );
              if (index >= 0) {
                next[index] = {
                  query: anchors[index].name.trim(),
                  type: anchors[index].type,
                  loading: false,
                  matches: Array.isArray(item.matches) ? item.matches : []
                };
              }
            });
            return next;
          });
          if (firstUnresolvedIndex >= 0) {
            window.setTimeout(() => {
              document.getElementById("anchor-row-" + firstUnresolvedIndex)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 60);
          }
        }
        const missing = unresolved.length
          ? " Could not uniquely resolve: " + unresolved.map((item) =>
              item.name + (item.type ? " (" + item.type.replaceAll("_", " ") + ")" : "")
            ).join(", ") + ". Choose the matching Qloo entity shown below an anchor. If no match is shown, change the category or use a more specific name."
          : "";
        throw new Error((payload.error || "The test could not be completed.") + missing);
      }
      const next = payload as TasteTestRun;
      if (result) setPreviousRun(result);
      setResult(next);
      window.setTimeout(() => {
        document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The test could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const comparison = previousRun && result ? compareRuns(previousRun, result) : [];
  const changed = comparison.some((item) => item.changed);
  const anchorChanges = previousRun && result
    ? compareAnchorChanges(previousRun.anchors, result.anchors)
    : [];
  const sameCandidateInputs = Boolean(previousRun && result &&
    previousRun.candidates.map((item) => item.inputName).join("\u0000") ===
    result.candidates.map((item) => item.inputName).join("\u0000"));
  const sameNonAnchorInputs = Boolean(previousRun && result &&
    previousRun.task === result.task &&
    previousRun.location === result.location &&
    sameCandidateInputs);
  const controlledSwap = Boolean(previousRun && result &&
    anchorChanges.length === 1 &&
    previousRun.anchors.length === result.anchors.length &&
    sameNonAnchorInputs);
  const sortedCandidates = result
    ? [...result.candidates].sort((a, b) => (a.qlooRank ?? Number.MAX_SAFE_INTEGER) - (b.qlooRank ?? Number.MAX_SAFE_INTEGER))
    : [];
  const rankedCount = result ? result.candidates.filter((candidate) => candidate.qlooRank !== null).length : 0;

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="TasteProof home">
          <img className="logo-lockup" src="/logo.svg" alt="TasteProof" />
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#evidence">Evidence</a>
          <a href="#anchor-swap">Anchor Swap</a>
        </nav>
        <div className="header-actions">
          <span className="connection" title="A configured key is checked separately from a successful live request.">
            <span className={"connection-dot " + (qlooConfigured ? "ready" : "")} />
            {qlooConfigured === null ? "Checking Qloo" : qlooConfigured ? "Qloo connected" : "Setup needed"}
          </span>
          <button className="topbar-cta" type="button" onClick={scrollToTest}>Try a taste test <span aria-hidden="true">↗</span></button>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy-block">
            <div className="eyebrow"><span className="eyebrow-mark">✳</span> CULTURAL INTELLIGENCE, MADE USEFUL</div>
            <h1 id="hero-title">Real recommendations.<br /><em>Backed by taste.</em></h1>
            <p className="hero-copy">
              Your AI can sound convincing. TasteProof checks whether its recommendations actually fit the taste context you gave it — using Qloo’s cultural intelligence, not another AI’s opinion.
            </p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={scrollToTest}>Start a real taste test <span aria-hidden="true">→</span></button>
              <a className="text-link" href="#how-it-works"><span className="play-mark" aria-hidden="true">▶</span> See how it works</a>
            </div>
            <div className="hero-proofline">
              <span><i className="proof-check">✓</i> Live Qloo evidence</span>
              <span><i className="proof-check">✓</i> No made-up scores</span>
            </div>
          </div>

          <div className="hero-art" aria-label="Editorial city imagery representing recommendations">
            <div className="hero-photo-frame">
              <img
                className="hero-photo"
                src="https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=1200&q=88"
                alt="A city bridge and skyline, used as editorial imagery"
                fetchPriority="high"
              />
              <div className="photo-scrim" />
              <div className="photo-caption"><span>THE TASTE TEST</span><strong>Would this fit your world?</strong></div>
              <div className="photo-index">TP / 001</div>
            </div>
            <div className="floating-question"><span className="question-icon">✳</span><span><strong>Would you really love this?</strong><small>A question worth testing.</small></span></div>
            <div className="floating-categories" aria-label="Taste categories">
              <span>♫ <b>Music</b></span>
              <span>◉ <b>Film & TV</b></span>
              <span>⌂ <b>Places</b></span>
            </div>
            <div className="hero-handnote">Better taste starts<br />with better evidence <span>↙</span></div>
            <div className="leaf-decoration" aria-hidden="true">
              <svg viewBox="0 0 120 150" role="img"><path d="M18 145C29 99 47 55 92 14M35 105C13 91 5 69 8 50c24 8 39 25 27 55M51 77C46 51 58 31 79 17c8 24-1 45-28 60M28 124C51 120 68 130 76 147c-24 7-41-1-48-23M66 47c-5-24 5-39 20-45 10 19 4 34-20 45" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </div>
          </div>
        </section>

        <section className="promise-strip" aria-label="What makes TasteProof different">
          <div className="promise-item"><span className="promise-icon">◉</span><div><strong>Powered by Qloo</strong><small>Real cultural-intelligence data</small></div></div>
          <div className="promise-item"><span className="promise-icon">⌕</span><div><strong>Evidence, not vibes</strong><small>See why each verdict was reached</small></div></div>
          <div className="promise-item"><span className="promise-icon">⇄</span><div><strong>Change one thing</strong><small>Run it again with Anchor Swap</small></div></div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-kicker">THREE STEPS / ONE CLEAR ANSWER</div>
          <div className="how-grid">
            <article className="how-step"><span className="step-number">01</span><div><h3>Bring the AI’s answer</h3><p>Paste the recommendations you already received. TasteProof doesn’t generate a second list.</p></div></article>
            <article className="how-step"><span className="step-number">02</span><div><h3>Check it against taste</h3><p>Qloo resolves your taste anchors and returns an affinity-ranked baseline for the chosen place context.</p></div></article>
            <article className="how-step"><span className="step-number">03</span><div><h3>See the evidence</h3><p>Every verdict follows the same visible ranking rule. Missing evidence stays unresolved.</p></div></article>
          </div>
        </section>

        <section className="test-section" id="test-lab">
          <div className="section-heading">
            <div>
              <span className="section-kicker">YOUR TURN / 01</span>
              <h2>Let’s test the taste.</h2>
              <p>Enter your own taste context and recommendations. When Qloo returns ambiguous matches, choose the exact entities instead of retrying blindly.</p>
            </div>
            <div className="live-label"><span className={"connection-dot " + (qlooConfigured ? "ready" : "")} /> {qlooConfigured ? "LIVE REQUEST READY" : "LIVE QLOO TEST"}<small>Results are fetched when you run the test.</small></div>
          </div>

          <div className="workbench">
            <form className="test-card" onSubmit={submit}>
              <div className="form-topline">
                <div className="form-brand"><span className="mini-mark">✳</span><div><small>THE TASTE TEST CARD</small><strong>Set the context</strong></div></div>
                <button className="example-badge reset-example" type="button" onClick={restoreVerifiedExample}>Reset to working example ↺</button>
              </div>

              <section className="form-section">
                <div className="form-heading">
                  <span className="form-step">01</span>
                  <div><h3>What does the person like?</h3><p>Enter any anchor, choose its category, and match it to Qloo when needed.</p></div>
                </div>
                <div className="anchor-list">
                  {anchors.map((anchor, index) => {
                    const search = anchorSearch[index];
                    const activeSearch = Boolean(search && search.query === anchor.name.trim() && search.type === anchor.type);
                    return (
                      <div className="anchor-item" key={index}>
                        <div className="anchor-row" id={"anchor-row-" + index}>
                          <span className="row-count">0{index + 1}</span>
                          <input aria-label={"Taste anchor " + (index + 1)} value={anchor.name} maxLength={120} required placeholder="e.g. Tyler, the Creator" onChange={(event) => setAnchor(index, "name", event.target.value)} />
                          <select aria-label={"Category for taste anchor " + (index + 1)} value={anchor.type} onChange={(event) => setAnchor(index, "type", event.target.value)}>
                            {anchorTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                          <button className="resolve-row" type="button" aria-label={"Find Qloo matches for taste anchor " + (index + 1)} disabled={busy || !anchor.name.trim() || Boolean(search?.loading)} onClick={() => void searchAnchor(index)}>
                            {search?.loading ? "Searching…" : anchor.entityId ? "Change match" : "Find Qloo match"}
                          </button>
                          <button className="row-remove anchor-remove" type="button" aria-label={"Remove taste anchor " + (index + 1)} disabled={anchors.length <= 1 || busy} onClick={() => removeAnchor(index)}>×</button>
                        </div>
                        {anchor.entityId ? <p className="selected-entity-note"><span>✓</span> Using the selected Qloo entity <strong>{anchor.name}</strong>. Editing its name or category clears this selection.</p> : null}
                        {activeSearch && search ? (
                          <div className="entity-match-panel" role="group" aria-label={"Qloo matches for taste anchor " + (index + 1)}>
                            <p className="entity-match-intro">
                              {search.loading ? "Searching Qloo’s entity catalogue…" : search.error ? "Search could not finish: " + search.error : search.matches.length ? "Choose the exact entity you mean. The selected Qloo ID will be used for this test." : "Qloo returned no matches for this name and category. Try a more specific name or change the category."}
                            </p>
                            {search.matches.length ? <div className="entity-match-options">
                              {search.matches.map((match) => (
                                <button className="entity-match-option" type="button" key={match.entityId} onClick={() => selectAnchorMatch(index, match)} disabled={busy}>
                                  <span><strong>{match.name}</strong><small>{match.subtype && !match.subtype.startsWith("urn:") ? match.subtype : anchorTypeOptions.find((option) => option.value === anchor.type)?.label || "Qloo entity"}</small></span>
                                  <span className="match-use">Use this ↗</span>
                                </button>
                              ))}
                            </div> : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <button className="add-row" type="button" disabled={anchors.length >= 5 || busy} onClick={addAnchor}>＋ Add another taste anchor <span>{anchors.length} / 5</span></button>
              </section>

              <section className="form-section agent-section">
                <div className="form-heading">
                  <span className="form-step">02</span>
                  <div><h3>What did the AI recommend?</h3><p>Enter any place recommendations from the agent you want to evaluate.</p></div>
                </div>
                <label htmlFor="task">The task you gave the AI</label>
                <input className="text-field" id="task" value={task} maxLength={180} required onChange={(event) => setTask(event.target.value)} />
                <div className="field-pair">
                  <div><label htmlFor="location">Where?</label><input className="text-field" id="location" value={location} maxLength={100} required onChange={(event) => setLocation(event.target.value)} /></div>
                  <div className="field-hint"><span className="tiny-pin">⌖</span><p>Qloo uses this location to shape the place baseline.</p></div>
                </div>
                <div className="candidate-head"><label>Recommendations to check</label><small>{candidates.filter((candidate) => candidate.trim()).length} OF 10 ITEMS</small></div>
                <div className="candidate-list">
                  {candidates.map((candidate, index) => {
                    const search = candidateSearch[index];
                    const activeSearch = Boolean(search && search.query === candidate.trim());
                    const selectedEntityId = candidateEntityIds[index];
                    return (
                      <div className="candidate-item" key={index}>
                        <div className="candidate-row">
                          <span className="candidate-number">{String(index + 1).padStart(2, "0")}</span>
                          <input aria-label={"Recommendation candidate " + (index + 1)} value={candidate} maxLength={160}
                            placeholder={index === 0 ? "First recommendation" : index === 1 ? "Second recommendation" : index === 2 ? "Third recommendation" : "Another recommendation"}
                            onChange={(event) => setCandidateName(index, event.target.value)} />
                          <button className="resolve-row" type="button" aria-label={"Find Qloo matches for recommendation candidate " + (index + 1)} disabled={busy || !candidate.trim() || Boolean(search?.loading)} onClick={() => void searchCandidate(index)}>
                            {search?.loading ? "Searching…" : selectedEntityId ? "Change match" : "Find match"}
                          </button>
                          <button className="row-remove" type="button" aria-label={"Remove recommendation candidate " + (index + 1)} disabled={candidates.length <= 1 || busy} onClick={() => removeCandidate(index)}>×</button>
                        </div>
                        {selectedEntityId ? <p className="selected-entity-note"><span>✓</span> Matched to the selected Qloo place <strong>{candidate}</strong>.</p> : null}
                        {activeSearch && search ? (
                          <div className="entity-match-panel" role="group" aria-label={"Qloo matches for recommendation candidate " + (index + 1)}>
                            <p className="entity-match-intro">
                              {search.loading ? "Searching Qloo’s place catalogue…" : search.error ? "Search could not finish: " + search.error : search.matches.length ? "Choose the exact place or business the agent recommended." : "Qloo returned no place matches. Try a more specific name or check that this recommendation is a place."}
                            </p>
                            {search.matches.length ? <div className="entity-match-options">
                              {search.matches.map((match) => (
                                <button className="entity-match-option" type="button" key={match.entityId} onClick={() => selectCandidateMatch(index, match)} disabled={busy}>
                                  <span><strong>{match.name}</strong><small>{match.subtype && !match.subtype.startsWith("urn:") ? match.subtype : "Qloo place entity"}</small></span>
                                  <span className="match-use">Use this ↗</span>
                                </button>
                              ))}
                            </div> : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <button className="add-row" type="button" disabled={candidates.length >= 10 || busy} onClick={addCandidate}>＋ Add a recommendation <span>{candidates.filter((candidate) => candidate.trim()).length} / 10</span></button>
                <p className="microcopy">Paste your agent’s own recommendations. Use Find match when Qloo needs help identifying the exact place; no suggestions or verdicts are invented.</p>
              </section>

              {error ? <div className="error-box" role="alert"><strong>We couldn’t finish this taste test{errorState ? " · " + errorState.replaceAll("_", " ") : ""}</strong><p>{error}</p><span>Check the highlighted context, then run the test again. No result has been fabricated.</span></div> : null}

              <div className="submit-row">
                <div className="submit-note"><span className="live-dot" /><div><strong>{busy ? "Asking Qloo to evaluate…" : "Your results come from a live request"}</strong><small>{busy ? "Waiting for the actual response. This may take a few seconds." : "No cached score. No invented match percentage."}</small></div></div>
                <button className="primary-button run-button" type="submit" disabled={busy}>{busy ? "Testing…" : result ? "Rerun taste test" : "Run taste test"} <span aria-hidden="true">→</span></button>
              </div>
              <div className="form-footnote"><span>🔒</span> Your Qloo API key stays on the server. The test receipt shows the returned evidence and the rule used.</div>
            </form>

            <aside className="context-aside">
              <div className="aside-photo-card">
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=82" alt="Warm restaurant interior, an example of a place recommendation context" loading="lazy" />
                <div><small>THE QUESTION</small><strong>Does the recommendation fit the taste?</strong></div>
              </div>
              <div className="aside-note">
                <span className="note-flower">✳</span><div><strong>Why these anchors?</strong><p>Tyler, the Creator. Aesop. Spirited Away. Different cultural signals create the context that Qloo will test against.</p></div>
              </div>
              <div className="aside-rule">
                <div className="aside-rule-heading"><span>THE VERDICT GUIDE</span><small>READ THIS FIRST</small></div>
                <div className="verdict-guide-row"><i className="guide-dot pass" /><span><strong>Strong match</strong><small>Top third of the returned baseline</small></span></div>
                <div className="verdict-guide-row"><i className="guide-dot review" /><span><strong>Take a closer look</strong><small>Middle third of the returned baseline</small></span></div>
                <div className="verdict-guide-row"><i className="guide-dot fail" /><span><strong>Weak match</strong><small>Bottom third of the returned baseline</small></span></div>
                <div className="verdict-guide-row"><i className="guide-dot unresolved" /><span><strong>Not enough evidence</strong><small>Missing or insufficient Qloo evidence</small></span></div>
                <p className="aside-disclaimer">These are relative ranks, not a probability that you will like a place.</p>
              </div>
              <div className="aside-source"><span className="qloo-seal">q</span><p><strong>Powered by Qloo</strong><small>Cultural intelligence for a more personal world.</small></p></div>
            </aside>
          </div>
        </section>

        <section className="results-section" id="evidence">
          <div className="section-heading results-heading">
            <div>
              <span className="section-kicker">THE RESULT / 02</span>
              <h2>Your evidence, laid out.</h2>
              <p>See where each candidate landed in Qloo’s live affinity ranking and why it received its verdict.</p>
            </div>
            <div className={"result-state-pill " + (result ? "has-result" : "")}><span />{result ? "LIVE RECEIPT" : "READY FOR YOUR TEST"}<small>{result ? new Date(result.createdAt).toLocaleString() : "Run the test above to populate the evidence."}</small></div>
          </div>

          {!result ? (
            <div className="empty-receipt">
              <div className="empty-receipt-art">
                <div className="empty-paper"><span className="empty-stamp">TP / 001</span><div className="empty-lines"><i /><i /><i /><i /></div><div className="empty-bars"><b /><b /><b /><b /><b /></div><span className="empty-question">?</span></div>
              </div>
              <div className="empty-receipt-copy"><span className="section-kicker">YOUR FIRST RECEIPT</span><h3>Real results, not a staged demo.</h3><p>Run the test to fill this report with resolved entities, Qloo’s returned baseline, candidate ranks and evidence-backed verdicts. The layout is ready; the evidence is not invented.</p><button type="button" className="text-button" onClick={scrollToTest}>Go to the test card <span aria-hidden="true">↑</span></button></div>
            </div>
          ) : (
            <div className="receipt">
              <div className="receipt-title">
                <div><small>YOUR TASTE TEST / QLOO LIVE</small><h3>{result.rankedCandidateCount} submitted candidates matched the Qloo baseline</h3><p>We checked the recommendations you provided against the cultural-intelligence signal returned for {result.location}.</p></div>
                <span className="run-id">RUN {result.testId.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="result-overview">
                <div className="result-overview-image">
                  <img src="https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=1000&q=82" alt="Editorial city scene representing the test location" loading="lazy" />
                  <span className="image-label">EDITORIAL CITY REFERENCE</span>
                </div>
                <div className="result-overview-content">
                  <small className="overline">THE RESULT AT A GLANCE</small>
                  <h4>{result.rankedCandidateCount === 0 ? "Not enough evidence to rank these recommendations." : result.candidates.every((candidate) => candidate.verdict === "PASS") ? "These recommendations align with the returned taste signal." : "Here’s how the recommendations stack up."}</h4>
                  <p>{result.rankedCandidateCount} of {result.candidates.length} candidates received a rank from the {result.baselineResultCount}-entity Qloo baseline. Each verdict below follows the same documented rule.</p>
                  <div className="summary-stats">
                    <div><strong>{verdictCount(result, "PASS")}</strong><span>Strong match</span></div>
                    <div><strong>{verdictCount(result, "REVIEW")}</strong><span>Take a closer look</span></div>
                    <div><strong>{verdictCount(result, "FAIL")}</strong><span>Weak match</span></div>
                    <div><strong>{verdictCount(result, "UNRESOLVED")}</strong><span>Unresolved</span></div>
                  </div>
                </div>
              </div>

              <div className="run-context">
                <div><small>THE TASK</small><strong>{result.task}</strong></div>
                <div><small>LOCATION</small><strong>{result.location}</strong></div>
                <div><small>RUN DATE</small><strong>{new Date(result.createdAt).toLocaleString()}</strong></div>
              </div>

              <div className="anchor-receipt">
                <div className="receipt-subhead"><div><span className="mini-mark">✳</span><div><small>THE TASTE CONTEXT</small><strong>What the AI was told to understand</strong></div></div><span>{result.anchors.length} resolved anchors</span></div>
                <div className="resolved-anchors">
                  {result.anchors.map((anchor, index) => <div className="resolved-anchor" key={anchor.entityId}>
                    <span className="anchor-number">0{index + 1}</span><div><small>{anchor.type.replace("_", " ")}</small><strong>{anchor.resolvedName}</strong><code className="entity-id">{anchor.entityId}</code></div>
                  </div>)}
                </div>
              </div>

              <div className="leaderboard-header">
                <div><span className="section-kicker">CANDIDATE LEADERBOARD</span><h3>Ranked against the real signal.</h3></div>
                <p>Rank is Qloo’s returned position, not a made-up affinity score.</p>
              </div>
              <div className="leaderboard">
                <div className="leaderboard-columns"><span>RECOMMENDATION</span><span>QLOO RANK</span><span>VERDICT</span></div>
                {sortedCandidates.map((candidate) => {
                  const originalIndex = result.candidates.findIndex((item) => item.inputName === candidate.inputName);
                  const imageUrl = editorialImages[Math.max(0, originalIndex) % editorialImages.length];
                  return <article className="result-row leaderboard-row" key={candidate.inputName}>
                    <div className="result-name">
                      <div className="candidate-thumb"><img src={imageUrl} alt="Illustrative city photography, not a photo of the named recommendation" loading="lazy" /></div>
                      <div><strong>{candidate.resolvedName || candidate.inputName}</strong><p>{candidate.resolvedName ? "Resolved by Qloo" : candidate.resolution === "ambiguous" ? "Several possible entities" : "Could not resolve this name"}{candidate.entityId ? " · " + candidate.entityId : ""}</p></div>
                    </div>
                    <div className="rank">{candidate.qlooRank !== null ? <><strong>#{candidate.qlooRank}</strong><span>of {result.baselineResultCount}</span></> : <span className="no-rank">No rank</span>}</div>
                    <div><span className={"verdict verdict-" + candidate.verdict.toLowerCase()}><i />{verdictLabel[candidate.verdict]}</span></div>
                    <p className="evidence-copy">{candidate.evidence}</p>
                  </article>;
                })}
              </div>
              <p className="imagery-note">Editorial city photographs are visual context only; they are not presented as photos of the named businesses or attractions.</p>

              <details className="baseline-disclosure">
                <summary><span><strong>Inspect the full Qloo evidence list</strong><small>Every entity returned for this run, in the order used by the verdict rule</small></span><b>{result.baseline.length} entities <span aria-hidden="true">＋</span></b></summary>
                <p className="baseline-explainer">This is the actual ordered Qloo Insights baseline used to assign candidate ranks. Rank 1 is first in the returned affinity order. TasteProof does not invent a numeric affinity score.</p>
                <div className="baseline-list">
                  <div className="baseline-row baseline-head"><span>RANK</span><span>QLOO ENTITY</span><span>ENTITY ID</span></div>
                  {result.baseline.map((entity) => <div className="baseline-row" key={entity.entityId}>
                    <strong>#{entity.rank}</strong><span>{entity.name}<small>{entity.subtype || "Qloo place entity"}</small></span><code>{entity.entityId}</code>
                  </div>)}
                </div>
              </details>

              <details className="technical-details">
                <summary>Show the technical receipt <span aria-hidden="true">＋</span></summary>
                <div className="technical-grid">
                  <div><small>EXECUTION STATE</small><strong>{result.state.replaceAll("_", " ")}</strong><p>The state reached by the real request.</p></div>
                  <div><small>STATE TRACE</small><p>{result.stateHistory.map((state) => state.replaceAll("_", " ")).join(" → ")}</p></div>
                  <div><small>DETERMINISTIC RULE</small><p>{result.evaluationRule}</p></div>
                  <div><small>PROVIDER</small><p>{result.providerNote}</p></div>
                  <div><small>TEST ID</small><code>{result.testId}</code></div>
                  <div><small>MODE</small><strong>Qloo live</strong><p>Fetched {new Date(result.createdAt).toISOString()}</p></div>
                </div>
              </details>
            </div>
          )}
        </section>

        {previousRun && result ? <section className="comparison-section" id="anchor-swap">
          <div className="section-heading">
            <div><span className="section-kicker">THE SIGNATURE MOVE / 03</span><h2>One small change. A new test.</h2><p>Change one taste anchor in the test card above and run it again. This compares the two actual responses.</p></div>
            <span className={"swap-status " + (controlledSwap ? "controlled" : "")}>{controlledSwap ? "CONTROLLED SWAP" : anchorChanges.length === 0 ? "SAME CONTEXT" : "CONTEXT CHANGED"}</span>
          </div>
          <div className={"swap-showcase anchor-change-report" + (controlledSwap ? " controlled" : "")}>
            <div className="swap-run-card">
              <div className="swap-card-top"><small>BEFORE / RUN {previousRun.testId.slice(0, 6).toUpperCase()}</small><span>01</span></div>
              <h3>Original taste</h3>
              <div className="swap-anchor-list">{previousRun.anchors.map((anchor) => <span key={anchor.entityId}><i />{anchor.resolvedName}</span>)}</div>
              <div className="swap-card-foot"><span>{previousRun.rankedCandidateCount} candidates ranked</span><span>{previousRun.location}</span></div>
            </div>
            <div className="swap-arrow" aria-hidden="true">⇄</div>
            <div className="swap-run-card after">
              <div className="swap-card-top"><small>AFTER / RUN {result.testId.slice(0, 6).toUpperCase()}</small><span>02</span></div>
              <h3>New taste context</h3>
              <div className="swap-anchor-list">{result.anchors.map((anchor) => {
                const changedAnchor = anchorChanges.some((change) => change.current?.entityId === anchor.entityId);
                return <span key={anchor.entityId} className={changedAnchor ? "anchor-swapped" : ""}><i />{anchor.resolvedName}{changedAnchor ? <b>NEW</b> : null}</span>;
              })}</div>
              <div className="swap-card-foot"><span>{result.rankedCandidateCount} candidates ranked</span><span>{result.location}</span></div>
            </div>
            <aside className="swap-observation"><span className="note-flower">✳</span><small>WHAT CHANGED?</small><h3>{controlledSwap ? "One taste variable changed." : anchorChanges.length === 0 ? "No resolved anchor changed." : anchorChanges.length + " anchor changes detected."}</h3>
              {anchorChanges.length ? anchorChanges.map((change) => <p key={change.index}><strong>{change.previous?.resolvedName || "Anchor removed"}</strong><span>→</span><strong>{change.current?.resolvedName || "Anchor removed"}</strong></p>) : <p>The resolved taste-anchor set is the same in both runs.</p>}
              <div className="swap-observation-rule">{changed ? "The candidate comparison below highlights observed changes only." : "No observed change in this run. TasteProof never forces a dramatic result."}</div>
            </aside>
          </div>
          {!controlledSwap ? <p className="swap-integrity-note">{anchorChanges.length === 0
            ? "This is a rerun comparison rather than a controlled Anchor Swap because no resolved anchor changed."
            : "For a controlled experiment, change exactly one resolved anchor and keep the task, location, candidate list and anchor count unchanged."}
          </p> : <p className="swap-integrity-note">The resolved entity changed at one anchor; the task, location, candidate list and remaining anchor IDs stayed the same.</p>}
          <div className="comparison-table">
            <div className="comparison-head"><span>RECOMMENDATION</span><span>BEFORE</span><span>AFTER</span><span>OBSERVATION</span></div>
            {comparison.map((item) => <div className="comparison-row" key={item.candidate}>
              <strong>{item.candidate}</strong>
              <span>{item.previousRank ? "#" + item.previousRank + " · " + item.previousVerdict : "No prior matched result"}</span>
              <span>{item.currentRank ? "#" + item.currentRank + " · " + item.currentVerdict : "No usable rank"}</span>
              <span className={item.changed ? "change" : ""}>{item.changed ? "Changed" : "No observed change"}</span>
            </div>)}
          </div>
          {!changed ? <p className="no-change-note">No observed change in this run. That is a valid result; the comparison does not manufacture a difference.</p> : null}
        </section> : null}
      </main>

      <footer className="footer">
        <div className="footer-brand"><img className="logo-lockup" src="/logo.svg" alt="TasteProof" /><small>A taste QA layer for AI recommendations.</small></div>
        <p>Better recommendations start with better evidence.</p>
        <nav><a href="https://qloo.devpost.com/" target="_blank" rel="noreferrer">Qloo Agentic Hackathon ↗</a><a href="https://docs.qloo.com/reference/api-overview" target="_blank" rel="noreferrer">Qloo API docs ↗</a></nav>
      </footer>
    </div>
  );
}
