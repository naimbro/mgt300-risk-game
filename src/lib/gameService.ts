import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, ensureAnon } from './firebase';
import type { Country } from '../types/game';
import { calculateInvestmentResult } from './riskEngine';
import countriesData from '../data/countries.json';

export interface GamePlayer {
  uid: string;
  name: string;
  capital: number;
  isAdmin: boolean;
  joinedAt: Timestamp;
  submissions: RoundSubmission[];
}

export interface RoundSubmission {
  round: number;
  allocation: { A: number; B: number };
  submittedAt: Timestamp;
  result?: {
    payout: number;
    netGain: number;
    newCapital: number;
  };
}

export interface GameRound {
  round: number;
  countries: { A: Country; B: Country };
  startTime: Timestamp;
  endTime: Timestamp;
  isActive: boolean;
}

export interface GameData {
  id: string;
  code: string;
  status: 'waiting' | 'active' | 'finished';
  currentRound: number;
  totalRounds: number;
  createdAt: Timestamp;
  createdBy: string;
  players: { [uid: string]: GamePlayer };
  rounds: { [roundNumber: string]: GameRound };
  settings: {
    roundDuration: number; // seconds
    initialCapital: number;
  };
}

class GameService {
  // Crear nueva partida (solo admin)
  async createGame(adminName: string): Promise<string> {
    const user = await ensureAnon();
    const gameCode = this.generateGameCode();
    const gameId = `game_${gameCode.toLowerCase()}`;
    
    const gameData: GameData = {
      id: gameId,
      code: gameCode,
      status: 'waiting',
      currentRound: 0,
      totalRounds: 5,
      createdAt: serverTimestamp() as Timestamp,
      createdBy: user.uid,
      players: {},
      rounds: {},
      settings: {
        roundDuration: 120, // 2 minutos por ronda
        initialCapital: 100000000
      }
    };

    // Agregar admin como primer jugador
    gameData.players[user.uid] = {
      uid: user.uid,
      name: adminName,
      capital: gameData.settings.initialCapital,
      isAdmin: true,
      joinedAt: serverTimestamp() as Timestamp,
      submissions: []
    };

    await setDoc(doc(db, 'games', gameId), gameData);
    console.log('🎮 Game created:', gameCode);
    return gameCode;
  }

  // Unirse a partida existente
  async joinGame(gameCode: string, playerName: string): Promise<string> {
    const user = await ensureAnon();
    const gameId = `game_${gameCode.toLowerCase()}`;
    const gameRef = doc(db, 'games', gameId);
    
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) {
      throw new Error('Partida no encontrada');
    }

    const gameData = gameSnap.data() as GameData;
    
    if (gameData.status !== 'waiting') {
      throw new Error('La partida ya comenzó');
    }

    // Agregar jugador
    const newPlayer: GamePlayer = {
      uid: user.uid,
      name: playerName,
      capital: gameData.settings.initialCapital,
      isAdmin: false,
      joinedAt: serverTimestamp() as Timestamp,
      submissions: []
    };

    await updateDoc(gameRef, {
      [`players.${user.uid}`]: newPlayer
    });

    console.log('👤 Player joined:', playerName);
    return gameId;
  }

  // Iniciar juego (solo admin)
  async startGame(gameId: string): Promise<void> {
    const user = await ensureAnon();
    const gameRef = doc(db, 'games', gameId);
    
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) {
      throw new Error('Partida no encontrada');
    }

    const gameData = gameSnap.data() as GameData;
    
    // Verificar que es admin
    if (!gameData.players[user.uid]?.isAdmin) {
      throw new Error('Solo el admin puede iniciar la partida');
    }

    // Crear primera ronda
    await this.startRound(gameId, 1);
    
    await updateDoc(gameRef, {
      status: 'active',
      currentRound: 1
    });

    console.log('🚀 Game started');
  }

  // Iniciar nueva ronda
  async startRound(gameId: string, roundNumber: number): Promise<void> {
    const gameRef = doc(db, 'games', gameId);
    
    // Seleccionar países aleatorios
    const shuffledCountries = [...countriesData].sort(() => Math.random() - 0.5);
    const countries = {
      A: shuffledCountries[0] as Country,
      B: shuffledCountries[1] as Country
    };

    const now = new Date();
    const endTime = new Date(now.getTime() + 120000); // 2 minutos

    const roundData: GameRound = {
      round: roundNumber,
      countries,
      startTime: Timestamp.fromDate(now),
      endTime: Timestamp.fromDate(endTime),
      isActive: true
    };

    await updateDoc(gameRef, {
      [`rounds.${roundNumber}`]: roundData,
      currentRound: roundNumber
    });

    console.log(`📊 Round ${roundNumber} started:`, countries.A.name, 'vs', countries.B.name);
  }

  // Enviar inversión
  async submitInvestment(
    gameId: string, 
    round: number, 
    allocation: { A: number; B: number }
  ): Promise<void> {
    const user = await ensureAnon();
    const gameRef = doc(db, 'games', gameId);
    
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) {
      throw new Error('Partida no encontrada');
    }

    const gameData = gameSnap.data() as GameData;
    const roundData = gameData.rounds[round];
    
    if (!roundData || !roundData.isActive) {
      throw new Error('Ronda no activa');
    }

    // Verificar que no haya enviado ya
    const player = gameData.players[user.uid];
    const hasSubmitted = player.submissions.some(sub => sub.round === round);
    
    if (hasSubmitted) {
      throw new Error('Ya enviaste tu inversión para esta ronda');
    }

    // Crear submission
    const submission: RoundSubmission = {
      round,
      allocation,
      submittedAt: serverTimestamp() as Timestamp
    };

    await updateDoc(gameRef, {
      [`players.${user.uid}.submissions`]: arrayUnion(submission)
    });

    console.log('💰 Investment submitted:', allocation);
  }

  // Procesar resultados de ronda (solo admin)
  async processRoundResults(gameId: string, round: number): Promise<void> {
    const user = await ensureAnon();
    const gameRef = doc(db, 'games', gameId);
    
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) {
      throw new Error('Partida no encontrada');
    }

    const gameData = gameSnap.data() as GameData;
    
    // Verificar que es admin
    if (!gameData.players[user.uid]?.isAdmin) {
      throw new Error('Solo el admin puede procesar resultados');
    }

    const roundData = gameData.rounds[round];
    const updates: any = {};

    // Procesar cada jugador
    for (const [uid, player] of Object.entries(gameData.players)) {
      const submission = player.submissions.find(sub => sub.round === round);
      
      if (submission && !submission.result) {
        // Calcular resultados
        const resultA = submission.allocation.A > 0 ? 
          calculateInvestmentResult(roundData.countries.A, submission.allocation.A, `${round}-${uid}-A`) :
          { finalAmount: 0, outcome: 'success' as const };
          
        const resultB = submission.allocation.B > 0 ? 
          calculateInvestmentResult(roundData.countries.B, submission.allocation.B, `${round}-${uid}-B`) :
          { finalAmount: 0, outcome: 'success' as const };

        const totalPayout = resultA.finalAmount + resultB.finalAmount;
        const totalInvestment = submission.allocation.A + submission.allocation.B;
        const netGain = totalPayout - totalInvestment;
        const newCapital = player.capital - totalInvestment + totalPayout;

        // Actualizar submission con resultado
        const submissionIndex = player.submissions.findIndex(sub => sub.round === round);
        updates[`players.${uid}.submissions.${submissionIndex}.result`] = {
          payout: totalPayout,
          netGain,
          newCapital
        };
        
        // Actualizar capital del jugador
        updates[`players.${uid}.capital`] = newCapital;
      }
    }

    // Marcar ronda como inactiva
    updates[`rounds.${round}.isActive`] = false;

    await updateDoc(gameRef, updates);
    console.log(`✅ Round ${round} results processed`);
  }

  // Escuchar cambios del juego
  subscribeToGame(gameId: string, callback: (gameData: GameData | null) => void) {
    const gameRef = doc(db, 'games', gameId);
    
    return onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as GameData);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to game:', error);
      callback(null);
    });
  }

  // Obtener partida
  async getGame(gameId: string): Promise<GameData | null> {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (gameSnap.exists()) {
      return gameSnap.data() as GameData;
    }
    
    return null;
  }

  // Generar código de partida
  private generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Obtener UID del usuario actual
  async getCurrentUID(): Promise<string | null> {
    try {
      const user = await ensureAnon();
      return user.uid;
    } catch {
      return null;
    }
  }
}

export const gameService = new GameService();