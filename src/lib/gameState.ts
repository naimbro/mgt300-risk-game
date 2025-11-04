// Game state management using localStorage
interface GameState {
  currentRound: number;
  totalRounds: number;
  capital: number;
  roundHistory: RoundResult[];
}

interface RoundResult {
  round: number;
  investment: { A: number; B: number };
  countries: { A: string; B: string };
  payout: number;
  netGain: number;
  finalCapital: number;
}

const STORAGE_KEY = 'mgt300_game_state';

export const getGameState = (): GameState => {
  const defaultState = {
    currentRound: 1,
    totalRounds: 5,
    capital: 100000000,
    roundHistory: []
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('📊 Loaded game state:', parsed);
      
      // Validar que los campos críticos no sean null/undefined
      const validatedState = {
        currentRound: parsed.currentRound || defaultState.currentRound,
        totalRounds: parsed.totalRounds || defaultState.totalRounds,
        capital: parsed.capital ?? defaultState.capital, // usa ?? para detectar null/undefined
        roundHistory: Array.isArray(parsed.roundHistory) ? parsed.roundHistory : defaultState.roundHistory
      };
      
      console.log('✅ Validated game state:', validatedState);
      return validatedState;
    }
    
    console.log('📊 Using default game state:', defaultState);
    return defaultState;
  } catch (error) {
    console.error('❌ Error loading game state:', error);
    console.log('📊 Using default game state due to error:', defaultState);
    return defaultState;
  }
};

export const saveGameState = (state: GameState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const resetGameState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const addRoundResult = (result: Omit<RoundResult, 'round'>): GameState => {
  const state = getGameState();
  const roundResult: RoundResult = {
    ...result,
    round: state.currentRound
  };
  
  const newState: GameState = {
    ...state,
    currentRound: state.currentRound + 1,
    capital: result.finalCapital,
    roundHistory: [...state.roundHistory, roundResult]
  };
  
  saveGameState(newState);
  return newState;
};

export const isGameFinished = (): boolean => {
  const state = getGameState();
  return state.currentRound > state.totalRounds;
};