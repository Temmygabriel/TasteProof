"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AnchorType, TasteTestRun, Verdict } from "../lib/types";

type AnchorDraft = { name: string; type: AnchorType };
const initialAnchors: AnchorDraft[] = [
  { name: "Tyler, the Creator", type: "artist" },
  { name: "Aesop", type: "brand" },
  { name: "Dune", type: "movie" }
];
const anchorTypeOptions: Array<{ value: AnchorType; label: string }> = [
  { value: "artist", label: "Artist" }, { value: "brand", label: "Brand" },
  { value: "movie", label: "Film" }, { value: "tv_show", label: "TV series" },
  { value: "book", label: "Book" }, { value: "place", label: "Place" },
  { value: "podcast", label: "Podcast" }, { value: "videogame", label: "Video game" }
];
const verdictLabel: Record<Verdict, string> = {
  PASS: "Pass", REVIEW: "Review", FAIL: "Fail", UNRESOLVED: "Unresolved"
};

function compareRuns(previous: TasteTestRun, current: TasteTestRun) {
  return current.candidates.map((candidate) => {
    const old = previous.candidates.find((item) => item.inputName.toLowerCase() === candidate.inputName.toLowerCase());
    return {
      candidate: candidate.inputName,
      previousRank: old?.qlooRank ?? null,
      currentRank: candidate.qlooRank,
      previousVerdict: old?.verdict ?? null,
      currentVerdict: candidate.verdict,
      changed: Boolean(old && (old.qlooRank !== candidate.qlooRank || old.verdict !== candidate.verdict))
    };
  });
}

export default function HomePage() {
  const [anchors, setAnchors] = useState<AnchorDraft[]>(initialAnchors);
  const [task, setTask] = useState("Check an agent's hotel recommendations.");
  const [location, setLocation] = useState("Copenhagen");
  const [candidates, setCandidates] = useState(["", "", ""]);
  const [result, setResult] = useState<TasteTestRun | null>(null);
  const [previousRun, setPreviousRun] = useState<TasteTestRun | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qlooConfigured, setQlooConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/health", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { qlooKeyConfigured?: boolean }) => { if (active) setQlooConfigured(Boolean(data.qlooKeyConfigured)); })
      .catch(() => { if (active) setQlooConfigured(false); });
    return () => { active = false; };
  }, []);

  function setAnchor(index: number, key: keyof AnchorDraft, value: string) {
    setAnchors((current) => current.map((anchor, i) => {
      if (i !== index) return anchor;
      return key === "type" ? { ...anchor, type: value as AnchorType } : { ...anchor, name: value };
    }));
  }

  function addAnchor() {
    setAnchors((current) => current.length >= 5 ? current : [...current, { name: "", type: "artist" }]);
  }

  function removeAnchor(index: number) {
    setAnchors((current) => current.length <= 1 ? current : current.filter((_, i) => i !== index));
  }

  function addCandidate() {
    setCandidates((current) => current.length >= 10 ? current : [...current, ""]);
  }

  function removeCandidate(index: number) {
    setCandidates((current) => current.length <= 1 ? current : current.filter((_, i) => i !== index));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anchors, task, location, candidates })
      });
      const payload = await response.json();
      if (!response.ok) {
        const missing = Array.isArray(payload.unresolvedAnchors)
          ? " Could not resolve: " + payload.unresolvedAnchors.map((item: { name: string }) => item.name).join(", ") + "."
          : "";
        throw new Error((payload.error || "The test could not be completed.") + missing);
      }
      const next = payload as TasteTestRun;
      if (result) setPreviousRun(result);
      setResult(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The test could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const comparison = previousRun && result ? compareRuns(previousRun, result) : [];
  const changed = comparison.some((item) => item.changed);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="TasteProof home"><span className="brand-mark"><span /></span><span>TasteProof</span></a>
        <div className="topbar-center"><span>TP / 01</span><span>RECOMMENDATION QA</span></div>
        <div className="connection"><span className={"connection-dot " + (qlooConfigured ? "ready" : "")} />{qlooConfigured === null ? "CHECKING QLOO" : qlooConfigured ? "KEY CONFIGURED" : "QLOO NOT CONFIGURED"}</div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><span />A CULTURAL INTELLIGENCE TEST LAB</div>
          <div className="hero-grid">
            <div>
              <h1>Recommendations<br /><em>deserve evidence.</em></h1>
              <p className="hero-copy">TasteProof tests whether an AI agent’s recommendations fit the taste context it was given. It uses Qloo to ground the review in cultural-intelligence data — not a chatbot’s opinion.</p>
            </div>
            <div className="stamp"><small>INSTRUMENT</small><strong>TP—001</strong><hr /><span>INPUT → SIGNAL → VERDICT</span><span>EVIDENCE FIRST / NO GUESSES</span></div>
          </div>
        </section>

        <div className="section-head">
          <div><small>01 / CONFIGURE</small><h2>The taste test</h2></div>
          <div className="section-meta"><span className="meta-chip">LIVE QLOO</span><small>No sample results preloaded</small></div>
        </div>

        <div className="workbench">
          <form className="test-card" onSubmit={submit}>
            <div className="panel-head"><div><small>TASTE TEST CARD</small><strong>Configure a test</strong></div><span>EDITION 01 / LIVE</span></div>
            <section className="form-section">
              <div className="form-heading"><div><small>01</small><h3>Taste context</h3></div><p>What the agent was told to understand</p></div>
              <div className="anchor-list">
                {anchors.map((anchor, index) => (
                  <div className="anchor-row" key={index}>
                    <span>A{String(index + 1).padStart(2, "0")}</span>
                    <input aria-label={"Taste anchor " + (index + 1)} value={anchor.name} maxLength={120} required placeholder="Enter a taste anchor" onChange={(event) => setAnchor(index, "name", event.target.value)} />
                    <select aria-label={"Category for taste anchor " + (index + 1)} value={anchor.type} onChange={(event) => setAnchor(index, "type", event.target.value)}>
                      {anchorTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <button className="row-remove anchor-remove" type="button" aria-label={"Remove taste anchor " + (index + 1)} disabled={anchors.length <= 1} onClick={() => removeAnchor(index)}>×</button>
                  </div>
                ))}
              </div>
              <button className="add-row" type="button" disabled={anchors.length >= 5} onClick={addAnchor}>+ Add taste anchor <span>{anchors.length}/5</span></button>
              <p className="microcopy">Use one to five taste anchors. Names must resolve to an exact Qloo entity match.</p>
            </section>

            <section className="form-section">
              <div className="form-heading"><div><small>02</small><h3>Agent output</h3></div><p>Test recommendations, don’t generate them</p></div>
              <label htmlFor="task">What was the agent asked to do?</label>
              <input className="text-field" id="task" value={task} maxLength={180} required onChange={(event) => setTask(event.target.value)} />
              <label htmlFor="location">Location context</label>
              <input className="text-field" id="location" value={location} maxLength={100} required onChange={(event) => setLocation(event.target.value)} />
              <div className="candidate-head"><label>Recommendations from the agent</label><small>UP TO 10 ITEMS</small></div>
              <div className="candidate-list">
                {candidates.map((candidate, index) => (
                  <div className="candidate-row" key={index}><span>{String(index + 1).padStart(2, "0")}</span>
                    <input aria-label={"Recommendation candidate " + (index + 1)} value={candidate} maxLength={160}
                      placeholder={index === 0 ? "First hotel or place" : index === 1 ? "Second hotel or place" : index === 2 ? "Third hotel or place" : "Additional place"}
                      onChange={(event) => setCandidates((current) => current.map((item, i) => i === index ? event.target.value : item))} />
                    <button className="row-remove" type="button" aria-label={"Remove recommendation candidate " + (index + 1)} disabled={candidates.length <= 1} onClick={() => removeCandidate(index)}>×</button>
                  </div>
                ))}
              </div>
              <button className="add-row" type="button" disabled={candidates.length >= 10} onClick={addCandidate}>+ Add candidate <span>{candidates.length}/10</span></button>
              <p className="microcopy">Paste candidate names returned by your agent. TasteProof does not invent a candidate list or a Qloo result.</p>
            </section>

            {error ? <div className="error-box" role="alert"><strong>Test not completed</strong><p>{error}</p></div> : null}
            <div className="submit-row"><p><span className="live-dot" /> LIVE API REQUEST · NO SYNTHETIC EVIDENCE</p>
              <button type="submit" disabled={busy}>{busy ? "Running Qloo test…" : result ? "Rerun taste test" : "Run taste test"} <span>↗</span></button>
            </div>
            <div className="swap-hint"><span>↔</span><p><strong>Anchor Swap</strong> — change one taste anchor, rerun, and compare observed results. The change is never forced.</p></div>
          </form>

          <aside className="side-rail">
            <section className="rail-panel"><div className="rail-head"><span>THE PROTOCOL</span><span>04 STEPS</span></div>
              {[
                ["01", "Resolve taste", "Map each anchor to a Qloo entity."],
                ["02", "Resolve candidates", "Check names submitted by the agent."],
                ["03", "Evaluate ranking", "Ask Qloo for a constrained result."],
                ["04", "Show evidence", "Apply a fixed, documented rule."]
              ].map((step) => <div className="protocol-step" key={step[0]}><small>{step[0]}</small><div><strong>{step[1]}</strong><p>{step[2]}</p></div></div>)}
            </section>
            <section className="rail-panel status-panel"><div className="rail-head"><span>CONNECTION</span><span>SERVER SIDE</span></div>
              <div className="status-line"><span>API credential</span><strong className={qlooConfigured ? "good" : "warning"}>{qlooConfigured === null ? "Checking…" : qlooConfigured ? "Configured" : "Required"}</strong></div>
              <div className="status-line"><span>Evidence mode</span><strong>Live Qloo only</strong></div>
              <div className="status-line"><span>Numeric taste score</span><strong>Not invented</strong></div>
              <p className="rail-note">A configured key is not proof the API accepts it. A live request is the real check.</p>
            </section>
            <section className="rail-panel"><div className="rail-head"><span>VERDICT RULE</span><span>REV. 01</span></div>
              <div className="rule-row"><i className="pass" /><span>Top third</span><strong>PASS</strong></div>
              <div className="rule-row"><i className="review" /><span>Middle third</span><strong>REVIEW</strong></div>
              <div className="rule-row"><i className="fail" /><span>Bottom third</span><strong>FAIL</strong></div>
              <div className="rule-row"><i className="unresolved" /><span>Missing evidence</span><strong>UNRESOLVED</strong></div>
              <p className="rail-note">Relative ranks are not probabilities or guarantees that someone will like a place.</p>
            </section>
          </aside>
        </div>

        <section className="results-section">
          <div className="section-head"><div><small>02 / INSPECT</small><h2>Evidence receipt</h2></div>
            <div className="section-meta"><span className="meta-chip">{result ? "LIVE RESULT" : "AWAITING RUN"}</span><small>{result ? result.rankedCandidateCount + " candidates matched · baseline " + result.baselineResultCount : "No test run yet"}</small></div>
          </div>
          {!result ? <div className="empty-receipt"><span>＋</span><div><strong>Your receipt will appear here.</strong><p>Run a test to inspect resolved entities, the Qloo ordering, the rule, and evidence. Nothing is pre-scored.</p></div></div> : (
            <div className="receipt">
              <div className="receipt-title"><div><small>TEST RECEIPT / QLOO LIVE</small><h3>{result.rankedCandidateCount} submitted candidates matched the Qloo baseline</h3></div><span>RUN {result.testId.slice(0, 8).toUpperCase()}</span></div>
              <div className="receipt-meta"><div><small>TASK</small><strong>{result.task}</strong></div><div><small>LOCATION</small><strong>{result.location}</strong></div><div><small>CREATED</small><strong>{new Date(result.createdAt).toLocaleString()}</strong></div></div>
              <div className="resolved-anchors"><small>RESOLVED TASTE ANCHORS</small><div>{result.anchors.map((anchor) => <span key={anchor.entityId}><small>{anchor.type.replace("_", " ").toUpperCase()}</small><strong>{anchor.resolvedName}</strong><code className="entity-id">{anchor.entityId}</code></span>)}</div></div>
              <div className="result-columns"><span>AGENT CANDIDATE</span><span>QLOO RANK</span><span>VERDICT</span></div>
              {result.candidates.map((candidate, index) => <article className="result-row" key={candidate.inputName + "-" + index}>
                <div className="result-name"><small>0{index + 1}</small><div><strong>{candidate.resolvedName || candidate.inputName}</strong><p>{candidate.resolvedName ? "Resolved by Qloo · " + candidate.entityId : candidate.resolution === "ambiguous" ? "Multiple possible matches" : "Not resolved"}</p></div></div>
                <div className="rank">{candidate.qlooRank ? <><strong>#{candidate.qlooRank}</strong><span>of {result.baselineResultCount}</span></> : <span>No rank</span>}</div>
                <div><span className={"verdict verdict-" + candidate.verdict.toLowerCase()}>{verdictLabel[candidate.verdict]}</span></div>
                <p className="evidence-copy">{candidate.evidence}</p>
              </article>)}
              <div className="rule-receipt"><div><small>DETERMINISTIC RULE</small><p>{result.evaluationRule}</p></div><div><small>PROVIDER</small><p>{result.providerNote}</p></div></div>
              <div className="receipt-foot"><span>RUN DATE {new Date(result.createdAt).toISOString().slice(0, 10)}</span><span>TRACE ID {result.testId}</span></div>
            </div>
          )}
        </section>

        {previousRun && result ? <section className="comparison-section">
          <div className="section-head"><div><small>03 / EXPERIMENT</small><h2>Anchor Swap comparison</h2></div><span className="meta-chip">{changed ? "CHANGE OBSERVED" : "NO CHANGE OBSERVED"}</span></div>
          <p className="comparison-intro">Previous run {previousRun.testId.slice(0, 8).toUpperCase()} compared with the new live run {result.testId.slice(0, 8).toUpperCase()}. Only changes in the two actual results are shown.</p>
          <div className="comparison-table"><div className="comparison-head"><span>CANDIDATE</span><span>PREVIOUS</span><span>CURRENT</span><span>OBSERVATION</span></div>
            {comparison.map((item) => <div className="comparison-row" key={item.candidate}><strong>{item.candidate}</strong><span>{item.previousRank ? "#" + item.previousRank + " · " + item.previousVerdict : "No prior matched result"}</span><span>{item.currentRank ? "#" + item.currentRank + " · " + item.currentVerdict : "No usable rank"}</span><span className={item.changed ? "change" : ""}>{item.changed ? "Changed" : "No observed change"}</span></div>)}
          </div>
          {!changed ? <p className="rail-note">No observed change in this run. TasteProof does not force a dramatic result.</p> : null}
        </section> : null}
      </main>
      <footer className="footer"><div><span className="brand-mark"><span /></span><strong>TasteProof</strong></div><p>A taste QA layer for AI agents.</p><nav><a href="https://qloo.devpost.com/" target="_blank" rel="noreferrer">Qloo Agentic Hackathon ↗</a><a href="https://docs.qloo.com/reference/api-overview" target="_blank" rel="noreferrer">Qloo API docs ↗</a></nav></footer>
    </div>
  );
}
