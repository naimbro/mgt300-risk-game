// Sistema de audio para efectos de sonido
class AudioManager {
  private context: AudioContext | null = null;
  
  constructor() {
    // Inicializar AudioContext solo cuando se necesite (para evitar problemas de autoplay)
    this.initAudio();
  }
  
  private initAudio() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API no está disponible');
    }
  }
  
  private async createTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.context) return;
    
    try {
      // Reanudar el contexto si está suspendido
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
    } catch (e) {
      // Si falla, simplemente no reproducir sonido
      console.log('Audio context not ready yet');
      return;
    }
    
    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
      oscillator.type = type;
      
      // Envelope para evitar clicks
      gainNode.gain.setValueAtTime(0, this.context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(this.context.currentTime + duration);
    } catch (e) {
      console.log('Failed to play audio tone');
    }
  }
  
  // Sonido de confirmación de inversión (like cash register)
  async playInvestmentConfirm() {
    console.log('🔊 Investment confirmed!');
    await this.createTone(800, 0.1);
    setTimeout(() => this.createTone(1000, 0.15), 100);
    setTimeout(() => this.createTone(1200, 0.2), 200);
  }
  
  // Sonido de éxito (resultado positivo)
  async playSuccess() {
    console.log('🔊 Success sound!');
    await this.createTone(523, 0.15); // C5
    setTimeout(() => this.createTone(659, 0.15), 150); // E5
    setTimeout(() => this.createTone(784, 0.3), 300); // G5
  }
  
  // Sonido de fallo (resultado negativo)
  async playFailure() {
    console.log('🔊 Failure sound!');
    await this.createTone(220, 0.4, 'sawtooth'); // A3 con sonido más áspero
    setTimeout(() => this.createTone(196, 0.4, 'sawtooth'), 200); // G3
  }
  
  // Sonido de expropiación (muy negativo)
  async playExpropriation() {
    console.log('🔊 Expropriation sound!');
    await this.createTone(100, 0.2, 'sawtooth');
    setTimeout(() => this.createTone(80, 0.2, 'sawtooth'), 100);
    setTimeout(() => this.createTone(60, 0.4, 'sawtooth'), 200);
  }
  
  // Sonido de countdown urgente
  async playUrgentTick() {
    console.log('🔊 Urgent tick!');
    await this.createTone(1500, 0.05);
  }
  
  // Sonido de nueva ronda
  async playNewRound() {
    console.log('🔊 New round sound!');
    await this.createTone(440, 0.1); // A4
    setTimeout(() => this.createTone(554, 0.1), 100); // C#5
    setTimeout(() => this.createTone(659, 0.2), 200); // E5
  }
  
  // Sonido de fin de juego
  async playGameEnd() {
    console.log('🔊 Game end sound!');
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((note, index) => {
      setTimeout(() => this.createTone(note, 0.3), index * 200);
    });
  }
}

// Instancia singleton
export const audioManager = new AudioManager();

// Hook para usar el audio manager
export const useAudio = () => {
  return audioManager;
};