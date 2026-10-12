export const TEST_STATES = [
  "IDLE",
  "CONFIGURED",
  "RESOLVING_TASTE",
  "TASTE_READY",
  "RESOLVING_CANDIDATES",
  "EVALUATING",
  "EVALUATED",
  "INPUT_INVALID",
  "QLOO_UNAVAILABLE",
  "ENTITY_NOT_FOUND",
  "RATE_LIMITED",
  "PARTIAL_RESULT",
  "UNRESOLVED"
] as const;

export type TestState = (typeof TEST_STATES)[number];

export interface StateSnapshot {
  state: TestState;
  stateHistory: TestState[];
}

const TRANSITIONS: Record<TestState, readonly TestState[]> = {
  IDLE: ["CONFIGURED", "INPUT_INVALID"],
  CONFIGURED: ["RESOLVING_TASTE", "INPUT_INVALID"],
  RESOLVING_TASTE: ["TASTE_READY", "ENTITY_NOT_FOUND", "QLOO_UNAVAILABLE", "RATE_LIMITED"],
  TASTE_READY: ["RESOLVING_CANDIDATES", "INPUT_INVALID"],
  RESOLVING_CANDIDATES: ["EVALUATING", "QLOO_UNAVAILABLE", "RATE_LIMITED"],
  EVALUATING: ["EVALUATED", "PARTIAL_RESULT", "UNRESOLVED", "QLOO_UNAVAILABLE", "RATE_LIMITED"],
  EVALUATED: [],
  INPUT_INVALID: [],
  QLOO_UNAVAILABLE: [],
  ENTITY_NOT_FOUND: [],
  RATE_LIMITED: [],
  PARTIAL_RESULT: [],
  UNRESOLVED: []
};

export class TestStateMachine {
  private currentState: TestState = "IDLE";
  private history: TestState[] = ["IDLE"];

  get state(): TestState {
    return this.currentState;
  }

  transition(next: TestState): StateSnapshot {
    if (!TRANSITIONS[this.currentState].includes(next)) {
      throw new Error("Invalid TasteProof state transition: " + this.currentState + " -> " + next);
    }
    this.currentState = next;
    this.history.push(next);
    return this.snapshot();
  }

  snapshot(): StateSnapshot {
    return { state: this.currentState, stateHistory: [...this.history] };
  }
}
