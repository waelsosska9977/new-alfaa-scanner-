/**
 * Synthesizes a clean quantitative alert chime using Web Audio API
 */
let audioCtx: AudioContext | null = null;

export function playSignalAlertSound(type: 'LONG' | 'SHORT' = 'LONG') {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // Primary Tone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();

    // Harmonics / Secondary Tone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();

    if (type === 'LONG') {
      // Ascending chime: 587.33 Hz (D5) -> 880 Hz (A5)
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.0, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3);
    } else {
      // Descending tone: 659.25 Hz (E5) -> 440 Hz (A4)
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(440.0, now + 0.15);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(554.37, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(329.63, now + 0.3);
    }

    // Envelope
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.debug('Audio alert playback not allowed before user interaction', err);
  }
}
