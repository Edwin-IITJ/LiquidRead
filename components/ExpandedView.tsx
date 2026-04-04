"use client";

import { useEffect, useRef, useState } from "react";
import { logEvent } from "@/utils/logEvent";
import { getSessionId } from "@/utils/sessionId";

import StatCallout from "@/components/visuals/StatCallout";
import ProportionStrip from "@/components/visuals/ProportionStrip";
import DumbbellStrip from "@/components/visuals/DumbbellStrip";
import ComparisonTable from "@/components/visuals/ComparisonTable";
import SlopeStrip from "@/components/visuals/SlopeStrip";
import StepDiagram from "@/components/visuals/StepDiagram";
import RankStrip from "@/components/visuals/RankStrip";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisualSpec {
  visualType:
    | "StatCallout"
    | "ProportionStrip"
    | "DumbbellStrip"
    | "ComparisonTable"
    | "SlopeStrip"
    | "StepDiagram"
    | "RankStrip";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  caption: string | null;
}

interface Section {
  label: string;
  text: string;
  visual: VisualSpec | null;
  visualPosition: "above" | "below" | null;
}

interface ExpandedData {
  hook: string;
  sectionOrder: string[];
  sections: Record<string, Section>;
}

export interface ExpandedViewProps {
  isOpen: boolean;
  onClose: () => void;
  paperTitle: string;
  paperAbstract: string;
  paperDoi?: string | null;
  cardVariant: "A" | "B" | "C";
  normalisedScore: number;
  readingGoal: string;
  timeAvailable: string;
  confusionResponse: string;
  trustAnchor: string;
  fieldGroup: string;
  onFeedbackSubmit: (suitability: number, calibration: 'too_basic' | 'just_right' | 'too_advanced', openFeedback: string) => void;
  comprehensionQuiz?: Array<{ question: string; options: string[]; correct: string; explanation: string }> | null;
  isGenericCard?: boolean;
  adjacentCards?: {
    too_basic: Array<{ label: string; headline: string | null; body: string }> | null;
    too_advanced: Array<{ label: string; headline: string | null; body: string }> | null;
  } | null;
}

// ─── Visual renderer ──────────────────────────────────────────────────────────

function renderVisual(visual: VisualSpec): React.ReactNode {
  switch (visual.visualType) {
    case "StatCallout":
      return <StatCallout data={visual.data} caption={visual.caption} />;
    case "ProportionStrip":
      return <ProportionStrip data={visual.data} caption={visual.caption} />;
    case "DumbbellStrip":
      return <DumbbellStrip data={visual.data} caption={visual.caption} />;
    case "ComparisonTable":
      return <ComparisonTable data={visual.data} caption={visual.caption} />;
    case "SlopeStrip":
      return <SlopeStrip data={visual.data} caption={visual.caption} />;
    case "StepDiagram":
      return <StepDiagram data={visual.data} caption={visual.caption} />;
    case "RankStrip":
      return <RankStrip data={visual.data} caption={visual.caption} />;
    default:
      return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExpandedView({
  isOpen,
  onClose,
  paperTitle,
  paperAbstract,
  paperDoi,
  cardVariant,
  normalisedScore,
  readingGoal,
  timeAvailable,
  confusionResponse,
  trustAnchor,
  fieldGroup,
  onFeedbackSubmit,
  comprehensionQuiz,
  isGenericCard = false,
  adjacentCards = null,
}: ExpandedViewProps) {
  const [data, setData] = useState<ExpandedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const [suitability, setSuitability] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [calibration, setCalibration] = useState<'too_basic' | 'just_right' | 'too_advanced' | null>(null);
  const [openFeedback, setOpenFeedback] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Recalibration layer reader state
  const [recalibrationDone, setRecalibrationDone] = useState(false);
  const [recalLayers, setRecalLayers] = useState<Array<{ label: string; headline: string | null; body: string }> | null>(null);
  const [recalLayerIdx, setRecalLayerIdx] = useState(0);
  // Second feedback form (shown after reading the adjusted card layers)
  const [recalSuitability, setRecalSuitability] = useState(0);
  const [recalHoveredStar, setRecalHoveredStar] = useState(0);
  const [recalCalibration, setRecalCalibration] = useState<'too_basic' | 'just_right' | 'too_advanced' | null>(null);
  const [recalOpenFeedback, setRecalOpenFeedback] = useState('');
  const [recalFeedbackSubmitted, setRecalFeedbackSubmitted] = useState(false);

  // Comprehension quiz state
  const [quizAnswers, setQuizAnswers] = useState<(string | null)[]>([null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSkipped, setQuizSkipped] = useState(false);

  // Track whether we've already fetched for the current open session
  const hasFetchedRef = useRef(false);

  // Hoisted so both the useEffect and the retry button can call it
  async function fetchExpanded() {
    setIsLoading(true);
    setHasFailed(false);

    try {
      const res = await fetch("/api/generate-expanded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperTitle,
          paperAbstract,
          cardVariant,
          normalisedScore,
          readingGoal,
          timeAvailable,
          confusionResponse,
          trustAnchor,
          fieldGroup,
        }),
      });

      if (!res.ok) {
        console.error("generate-expanded error:", res.status);
        setHasFailed(true);
        return;
      }

      const json: ExpandedData = await res.json();
      setData(json);

      logEvent({
        session_id: getSessionId(),
        event_type: "expanded_view_opened",
        component_type: null,
        card_variant: cardVariant,
        paper_title: paperTitle,
        paper_field: fieldGroup,
        normalised_score: normalisedScore,
        metadata: { sectionCount: json.sectionOrder.length },
      });
    } catch (err) {
      console.error("generate-expanded fetch failed:", err);
      setHasFailed(true);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch expanded content when the sheet opens for the first time; reset all state
  useEffect(() => {
    if (!isOpen) return;
    setSuitability(0);
    setHoveredStar(0);
    setCalibration(null);
    setOpenFeedback('');
    setFeedbackSubmitted(false);
    setRecalibrationDone(false);
    setRecalLayers(null);
    setRecalLayerIdx(0);
    setRecalSuitability(0);
    setRecalHoveredStar(0);
    setRecalCalibration(null);
    setRecalOpenFeedback('');
    setRecalFeedbackSubmitted(false);
    setQuizAnswers([null, null]);
    setQuizSubmitted(false);
    setQuizSkipped(false);
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchExpanded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Derived: which adjacent-variant layers to show when user requests recalibration
  const adjLayers =
    (calibration === 'too_basic' || calibration === 'too_advanced') && adjacentCards
      ? adjacentCards[calibration]
      : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 h-[95vh] bg-white rounded-t-2xl shadow-2xl
          overflow-hidden flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Expanded paper view"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <p className="text-base font-semibold text-slate-800 leading-snug flex-1 min-w-0 line-clamp-2 pr-2">
            {paperTitle}
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full
              bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700
              transition-colors text-lg leading-none"
            aria-label="Close expanded view"
          >
            ×
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">Preparing your reading experience...</p>
            </div>
          )}

          {/* Error state */}
          {!isLoading && hasFailed && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <p className="text-sm text-slate-500">
                Couldn&apos;t generate expanded view. Try again.
              </p>
              <button
                onClick={() => {
                  hasFetchedRef.current = false;
                  setData(null);
                  setHasFailed(false);
                  fetchExpanded();
                }}
                className="text-xs text-indigo-600 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* Sections */}
          {!isLoading && !hasFailed && data && (
            <>
              {/* Hook */}
              <div className="mt-5 mb-1 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-4">
                <p className="text-[10px] uppercase tracking-widest text-indigo-400 mb-1.5 font-semibold">
                  The key finding
                </p>
                <p className="text-base font-semibold text-slate-800 leading-snug font-serif">
                  {data.hook}
                </p>
              </div>

              {/* Ordered sections */}
              {data.sectionOrder.map((sectionId) => {
                const section = data.sections[sectionId];
                if (!section) return null;

                const hasVisualAbove =
                  !!section.visual && section.visualPosition === "above";
                const hasVisualBelow =
                  !!section.visual && section.visualPosition === "below";

                return (
                  <div key={sectionId}>
                    {/* Label */}
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-6 mb-2">
                      {section.label}
                    </p>

                    {/* Visual above */}
                    {hasVisualAbove && section.visual && (
                      <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-1">
                        {renderVisual(section.visual)}
                      </div>
                    )}

                    {/* Body text */}
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-serif">
                      {section.text}
                    </p>

                    {/* Visual below */}
                    {hasVisualBelow && section.visual && (
                      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-1">
                        {renderVisual(section.visual)}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* DOI link */}
              {paperDoi && (
                <a
                  href={`https://doi.org/${paperDoi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 transition-colors mt-6 mb-2"
                >
                  <span>📄</span>
                  <span>Read the original paper</span>
                </a>
              )}

              {/* Comprehension quiz — shown between content and feedback */}
              {comprehensionQuiz && comprehensionQuiz.length >= 2 && !quizSkipped && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <p className="text-sm font-semibold text-slate-700 mb-4">How well did you understand this?</p>

                  {comprehensionQuiz.slice(0, 2).map((q, qi) => (
                    <div key={qi} className="mb-5">
                      <p className="text-sm text-slate-700 mb-2 leading-snug">
                        {qi + 1}. {q.question}
                      </p>

                      {quizSubmitted ? (
                        // Revealed state
                        <div className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2.5 ${
                          quizAnswers[qi] === q.correct
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-red-50 text-red-800'
                        }`}>
                          <span className="font-bold flex-shrink-0 mt-px">
                            {quizAnswers[qi] === q.correct ? '✓' : '✗'}
                          </span>
                          <span>
                            <span className="font-medium">
                              {quizAnswers[qi] === q.correct
                                ? 'Correct. '
                                : `Correct answer: ${q.correct}. `}
                            </span>
                            {q.explanation}
                          </span>
                        </div>
                      ) : (
                        // Answer selection state
                        <div className="flex flex-col gap-1.5">
                          {q.options.map((opt, oi) => {
                            const letter = String.fromCharCode(65 + oi);
                            return (
                              <button
                                key={letter}
                                onClick={() => {
                                  const next = [...quizAnswers];
                                  next[qi] = letter;
                                  setQuizAnswers(next);
                                }}
                                className={`text-left text-sm rounded-lg px-3 py-2 transition-colors border ${
                                  quizAnswers[qi] === letter
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span className="font-medium mr-1.5">{letter}.</span>{opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {!quizSubmitted && (
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        disabled={quizAnswers.some(a => a === null)}
                        onClick={() => {
                          const score = comprehensionQuiz
                            .slice(0, 2)
                            .filter((q, i) => quizAnswers[i] === q.correct).length;
                          setQuizSubmitted(true);
                          logEvent({
                            session_id: getSessionId(),
                            event_type: 'quiz_score',
                            component_type: null,
                            card_variant: cardVariant,
                            paper_title: paperTitle,
                            paper_field: fieldGroup,
                            normalised_score: normalisedScore,
                            metadata: { score, total: 2, skipped: false, is_generic_card: isGenericCard },
                          });
                        }}
                        className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                          quizAnswers.some(a => a === null)
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        Check my answers
                      </button>
                      <button
                        onClick={() => {
                          setQuizSkipped(true);
                          logEvent({
                            session_id: getSessionId(),
                            event_type: 'quiz_score',
                            component_type: null,
                            card_variant: cardVariant,
                            paper_title: paperTitle,
                            paper_field: fieldGroup,
                            normalised_score: normalisedScore,
                            metadata: { score: 0, total: 2, skipped: true, is_generic_card: isGenericCard },
                          });
                        }}
                        className="text-xs text-slate-400 underline underline-offset-2"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback section */}
              <div className="mt-8">
                {feedbackSubmitted ? (
                  <div>
                    {!recalibrationDone ? (
                      // Thank-you + CTA to enter layer reader
                      <div className="flex flex-col items-center py-6 gap-3">
                        <span className="text-emerald-500 text-2xl">✓</span>
                        <p className="text-sm text-slate-500">Thanks for your feedback</p>
                        {adjLayers && (
                          <button
                            onClick={() => {
                              setRecalLayers(adjLayers);
                              setRecalLayerIdx(0);
                              setRecalibrationDone(true);
                              logEvent({
                                session_id: getSessionId(),
                                event_type: 'recalibration_requested',
                                component_type: null,
                                card_variant: cardVariant,
                                paper_title: paperTitle,
                                paper_field: fieldGroup,
                                normalised_score: normalisedScore,
                                metadata: { calibrationSignal: calibration },
                              });
                            }}
                            className="text-sm text-indigo-600 font-medium underline underline-offset-2 mt-1"
                          >
                            See it adjusted for you &rarr;
                          </button>
                        )}
                      </div>
                    ) : (
                      // Layer reader — shows adjacent-variant card layers one at a time
                      <div className="mt-2">
                        <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold mb-4">
                          Adjusted version
                        </p>

                        {recalLayers && recalLayers.slice(0, recalLayerIdx + 1).map((layer, idx) => (
                          <div key={idx} className={idx > 0 ? 'mt-5 pt-5 border-t border-slate-100' : ''}>
                            {layer.headline && (
                              <p className="text-base font-semibold text-slate-800 leading-snug mb-2">
                                {layer.headline}
                              </p>
                            )}
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {layer.body}
                            </p>
                          </div>
                        ))}

                        {/* Advance to next layer */}
                        {recalLayers && recalLayerIdx < recalLayers.length - 1 && (
                          <button
                            onClick={() => setRecalLayerIdx(i => i + 1)}
                            className="text-xs text-indigo-600 font-medium mt-4"
                          >
                            Continue reading &rarr;
                          </button>
                        )}

                        {/* Second feedback form — shown after last layer */}
                        {recalLayers && recalLayerIdx >= recalLayers.length - 1 && (
                          <div className="mt-6 border-t border-slate-100 pt-5">
                            {recalFeedbackSubmitted ? (
                              <div className="flex flex-col items-center py-4 gap-1">
                                <span className="text-emerald-500 text-xl">✓</span>
                                <p className="text-xs text-slate-400">Thanks</p>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-slate-700 mb-3">How did this feel?</p>
                                <div className="flex gap-1 mb-4">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                      key={star}
                                      onMouseEnter={() => setRecalHoveredStar(star)}
                                      onMouseLeave={() => setRecalHoveredStar(0)}
                                      onClick={() => setRecalSuitability(star)}
                                      className="text-2xl leading-none transition-colors"
                                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                    >
                                      <span className={star <= (recalHoveredStar || recalSuitability) ? 'text-amber-400' : 'text-slate-300'}>★</span>
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {(['too_basic', 'just_right', 'too_advanced'] as const).map(val => (
                                    <button
                                      key={val}
                                      onClick={() => setRecalCalibration(val)}
                                      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                                        recalCalibration === val ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {val === 'too_basic' ? 'Too basic' : val === 'just_right' ? 'Just right' : 'Too advanced'}
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  placeholder="Anything to add? (optional)"
                                  value={recalOpenFeedback}
                                  onChange={e => setRecalOpenFeedback(e.target.value)}
                                  rows={3}
                                  className="w-full text-sm border border-slate-200 rounded-xl p-3 mt-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                />
                                <button
                                  disabled={recalSuitability === 0 || recalCalibration === null}
                                  onClick={() => {
                                    onFeedbackSubmit(recalSuitability, recalCalibration!, recalOpenFeedback);
                                    setRecalFeedbackSubmitted(true);
                                  }}
                                  className={`w-full py-2.5 rounded-xl text-sm font-medium mt-4 transition-colors ${
                                    recalSuitability === 0 || recalCalibration === null
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-indigo-600 text-white'
                                  }`}
                                >
                                  Submit
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="border-t border-slate-100 mb-6" />
                    <p className="text-sm font-semibold text-slate-700 mb-3">Was this useful?</p>

                    {/* Star rating */}
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => setSuitability(star)}
                          className="text-2xl leading-none transition-colors"
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <span className={star <= (hoveredStar || suitability) ? 'text-amber-400' : 'text-slate-300'}>
                            ★
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Calibration toggles */}
                    <div className="flex gap-2 flex-wrap">
                      {(['too_basic', 'just_right', 'too_advanced'] as const).map((val) => (
                        <button
                          key={val}
                          onClick={() => setCalibration(val)}
                          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                            calibration === val
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {val === 'too_basic' ? 'Too basic' : val === 'just_right' ? 'Just right' : 'Too advanced'}
                        </button>
                      ))}
                    </div>

                    {/* Open feedback */}
                    <textarea
                      placeholder="Anything to add? (optional)"
                      value={openFeedback}
                      onChange={(e) => setOpenFeedback(e.target.value)}
                      rows={3}
                      className="w-full text-sm border border-slate-200 rounded-xl p-3 mt-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />

                    {/* Submit */}
                    <button
                      disabled={suitability === 0 || calibration === null}
                      onClick={() => {
                        // For just_right, OR if edge case where no simpler/harder card exists: navigate immediately.
                        // For too_basic / too_advanced (when available): show the adjusted card first;
                        // onFeedbackSubmit is called after the second rating.
                        const hasAdjacentCard = 
                          (calibration === 'too_basic' && adjacentCards?.too_basic) || 
                          (calibration === 'too_advanced' && adjacentCards?.too_advanced);

                        if (calibration === 'just_right' || !hasAdjacentCard) {
                          onFeedbackSubmit(suitability, calibration!, openFeedback);
                        }
                        setFeedbackSubmitted(true);
                      }}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium mt-4 transition-colors ${
                        suitability === 0 || calibration === null
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      Submit
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
