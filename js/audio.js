/**
 * SARTHI Audio & Vernacular Voice Assistant Module
 * Provides sound effects and bilingual (Hindi/English) speech synthesizer
 */

const SarthiAudio = {
  // Beep SFX
  playBeep() {
    try {
      const audio = document.getElementById('audio-beep');
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.4;
        audio.play().catch(() => {});
      }
    } catch (e) {}
  },

  // Success / Payment Chime SFX
  playSuccess() {
    try {
      const audio = document.getElementById('audio-success');
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
    } catch (e) {}
  },

  // Synthesize Hindi / English voice for drivers & passengers
  speak(text, lang = 'hi-IN') {
    if (!('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.log('Voice synthesis error:', err);
    }
  }
};

window.SarthiAudio = SarthiAudio;
