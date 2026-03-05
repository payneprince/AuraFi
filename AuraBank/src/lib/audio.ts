let audioContext: AudioContext | null = null;

export const playNotificationSound = () => {
  if (typeof window === 'undefined') return;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported or blocked.');
      return;
    }
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.value = 0.1;

  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
  oscillator.stop(audioContext.currentTime + 0.3);

  // ✅ Vibrate for mobile
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
};