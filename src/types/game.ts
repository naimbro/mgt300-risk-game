export interface Country {
  iso2: string;
  name: string;
  risk: number; // 0..1 (higher = more political risk)
  growth: number; // -0.1..0.15 (GDP growth rate)
  baseReturn: number; // 0..0.15 (base annual return)
  sources?: {
    riskUrl?: string;
    growthUrl?: string;
  };
  sectorBonuses?: Record<string, number>;
}

export interface Game {
  id: string;
  code: string; // Short code like "MGT300-0511"
  status: 'draft' | 'running' | 'finished';
  roundCount: number;
  roundDurationSec: number;
  createdAt: Date;
  currentRound: number; // 1..N
}

export interface Round {
  index: number; // 1..N
  startsAt: Date;
  endsAt: Date;
  options: Array<{
    countryIdA: string;
    countryIdB: string;
  }>;
  mode: 'sync' | 'perUser';
  eventModifiers?: EventModifier[];
}

export interface EventModifier {
  filter: {
    iso?: string;
    region?: string;
  };
  effect: {
    p_success_delta?: number;
    return_success_delta?: number;
  };
  message: string;
}

export interface GameUser {
  id: string;
  displayName: string;
  capital: number; // Current capital (starts at 100M)
  joinedAt: Date;
}

export interface Submission {
  userId: string;
  roundIndex: number;
  allocation: {
    A: number;
    B: number;
  };
  selected: 'A' | 'B' | 'split';
  submittedAt: Date;
}

export interface Result {
  userId: string;
  roundIndex: number;
  payout: number; // Can be negative
  finalCapital: number;
  outcome: 'success' | 'fail' | 'partial';
  message: string;
  seed: string;
}