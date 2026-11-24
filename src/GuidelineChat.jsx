import { useState } from "react";
import { guidelines, planSections } from "../knowledge/hypertension-guidelines.js";

export default function GuidelineChat({ active }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(event) {
    event.preventDefault();
    const query = question.trim();
    if (!query || busy) return;

    setBusy(true);
    setError("");
    setAnswer(null);
    try {
      const response = await fetch("/api/guideline-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
        signal: AbortSignal.timeout(32000),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Claude is unavailable. Please try again.");
        return;
      }
      setAnswer({ question: query, plan: payload.plan });
    } catch {
      setError("Claude is unavailable. Use the BP assessment and guideline links in the meantime.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section hidden={!active} aria-labelledby="ask-claude-heading" className="space-y-5">
      <div className="space-y-2">
        <h2 id="ask-claude-heading" className="text-xl font-semibold">Ask Claude about hypertension</h2>
        <p className="text-sm text-slate-300">Ask a guideline question or describe a de-identified adult case. Your question is sent to Claude for clinical decision support.</p>
        <p className="text-sm text-amber-200">If acute organ injury is suspected, arrange emergency assessment immediately.</p>
      </div>
      <form onSubmit={ask} className="space-y-3 rounded-lg border border-slate-700 bg-slate-900 p-4 sm:p-5">
        <label htmlFor="hypertension-question" className="block font-medium">Clinical question</label>
        <textarea id="hypertension-question" required rows={5} maxLength={3000} value={question}
          onChange={event => setQuestion(event.target.value)}
          placeholder="Example: What investigations, treatment and lifestyle changes should I consider for a 52-year-old with average home BP 148/92 and type 2 diabetes?"
          className="w-full rounded-md border border-slate-600 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-400" />
        <button type="submit" disabled={busy || !question.trim()}
          className="rounded-lg bg-rose-900 px-4 py-2 text-white hover:bg-rose-800 disabled:opacity-60">
          Ask Claude
        </button>
        <p role="status" className="text-sm text-slate-300">{busy ? "Preparing guideline-based response…" : error}</p>
      </form>
      {answer && (
        <section aria-label="Claude response" aria-live="polite" className="space-y-3">
          <h3 className="text-lg font-semibold">Claude response</h3>
          <p className="whitespace-pre-wrap break-words text-sm text-slate-300">{answer.question}</p>
          {Object.entries(planSections).map(([key, title]) => {
            const section = answer.plan[key];
            return (
              <article key={key} className="space-y-2 rounded-lg border border-slate-700 bg-slate-900 p-4">
                <h4 className="font-semibold">{title}</h4>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{section.text}</p>
                <div className="flex flex-wrap gap-3">
                  {guidelines.filter(source => section.sources.includes(source.id)).map(source => (
                    <a key={source.id} href={source.url} target="_blank" rel="noreferrer"
                      className="text-sm text-teal-300 underline">{source.id}</a>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      )}
      <div className="space-y-1 text-sm">
        <h3 className="font-medium">Guideline references</h3>
        <ul className="space-y-1">
          {guidelines.map(source => (
            <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer" className="text-teal-300 underline">{source.title}</a></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
