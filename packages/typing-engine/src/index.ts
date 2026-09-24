export {
  applyKeystroke,
  createRun,
  isFinished,
  replayRun,
  type Key,
  type Keystroke,
  type Letter,
  type LetterStatus,
  type RunConfig,
  type RunState,
  type RunWord,
} from "./run";

export { computeResult, liveWpm, type CharCounts, type Result } from "./result";

export {
  burstMargin,
  burstMinLetters,
  comboSteps,
  computeScore,
  defaultPace,
  maxMultiplier,
  type ScoreState,
} from "./score";

export { duelOutcome, type Outcome } from "./outcome";

export {
  acceptKeystroke,
  startReplay,
  type Acceptance,
  type ArrivalWindow,
  type RejectReason,
  type Replay,
} from "./acceptance";

export { currentWordListVersion, generateText, wordList, type Language } from "./text";
