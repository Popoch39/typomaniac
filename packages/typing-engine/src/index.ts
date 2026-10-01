export {
  applyKeystroke,
  createRun,
  isFinished,
  keystrokesUpTo,
  replayRun,
  runAt,
  type Key,
  type Keystroke,
  type Letter,
  type LetterStatus,
  type RunConfig,
  type RunState,
  type RunWord,
} from "./run";

export {
  computeResult,
  computeTimeline,
  liveWpm,
  type CharCounts,
  type Result,
  type TimelineEntry,
} from "./result";

export {
  burstMargin,
  burstMinLetters,
  comboSteps,
  computeScore,
  defaultPace,
  maxMultiplier,
  type ScoreState,
} from "./score";

export { cuesOf, type Cue, type Moment } from "./cues";

export { paceDuels, paceOf } from "./pace";

export {
  averageResult,
  duelOutcome,
  isDuelDecided,
  maxRounds,
  roundOutcome,
  roundsWon,
  type Outcome,
  type RoundSide,
  type RoundSides,
} from "./outcome";

export {
  acceptKeystroke,
  startAcceptedRun,
  type Acceptance,
  type AcceptedRun,
  type ArrivalWindow,
  type RejectReason,
} from "./acceptance";

export { currentWordListVersion, generateText, wordList, type Language } from "./text";
