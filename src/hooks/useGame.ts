import { useState, useEffect, useCallback } from 'react';
import { gameService, type GameData, type GamePlayer } from '../lib/gameService';
import { auth } from '../lib/firebase';

export const useGame = (gameId?: string) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<GamePlayer | null>(null);

  // Escuchar cambios del juego
  useEffect(() => {
    if (!gameId) return;

    console.log('🎮 Subscribing to game:', gameId);
    setLoading(true);
    
    const unsubscribe = gameService.subscribeToGame(gameId, (data) => {
      setGameData(data);
      setLoading(false);
      
      // Actualizar usuario actual
      if (data && auth.currentUser) {
        const player = data.players[auth.currentUser.uid];
        setCurrentUser(player || null);
      }
    });

    return unsubscribe;
  }, [gameId]);

  // Crear nueva partida
  const createGame = useCallback(async (adminName: string) => {
    try {
      setLoading(true);
      setError(null);
      const gameCode = await gameService.createGame(adminName);
      return gameCode;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creando partida';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Unirse a partida
  const joinGame = useCallback(async (gameCode: string, playerName: string) => {
    try {
      setLoading(true);
      setError(null);
      const gameId = await gameService.joinGame(gameCode, playerName);
      return gameId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error uniéndose a la partida';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar juego (solo admin)
  const startGame = useCallback(async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      setError(null);
      await gameService.startGame(gameId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error iniciando partida';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Enviar inversión
  const submitInvestment = useCallback(async (allocation: { A: number; B: number }) => {
    if (!gameId || !gameData) return;
    
    try {
      setLoading(true);
      setError(null);
      await gameService.submitInvestment(gameId, gameData.currentRound, allocation);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error enviando inversión';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [gameId, gameData]);

  // Procesar resultados (solo admin)
  const processRoundResults = useCallback(async () => {
    if (!gameId || !gameData) return;
    
    try {
      setLoading(true);
      setError(null);
      await gameService.processRoundResults(gameId, gameData.currentRound);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error procesando resultados';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [gameId, gameData]);

  // Iniciar nueva ronda (solo admin)
  const startNextRound = useCallback(async () => {
    if (!gameId || !gameData) return;
    
    try {
      setLoading(true);
      setError(null);
      const nextRound = gameData.currentRound + 1;
      await gameService.startRound(gameId, nextRound);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error iniciando nueva ronda';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [gameId, gameData]);

  // Datos derivados
  const isAdmin = currentUser?.isAdmin || false;
  const playerCount = gameData ? Object.keys(gameData.players).length : 0;
  const currentRound = gameData?.rounds[gameData.currentRound];
  const hasSubmitted = currentUser?.submissions.some(sub => sub.round === gameData?.currentRound) || false;
  
  // Ranking de jugadores
  const playersRanking = gameData ? 
    Object.values(gameData.players)
      .sort((a, b) => b.capital - a.capital)
      .map((player, index) => ({ ...player, position: index + 1 }))
    : [];

  return {
    // Estado
    gameData,
    currentUser,
    loading,
    error,
    
    // Acciones
    createGame,
    joinGame,
    startGame,
    submitInvestment,
    processRoundResults,
    startNextRound,
    
    // Datos derivados
    isAdmin,
    playerCount,
    currentRound,
    hasSubmitted,
    playersRanking,
    
    // Helpers
    clearError: () => setError(null)
  };
};