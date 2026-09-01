/**
 * SARTHI Driver Cockpit Controller
 * Manages tactile seat availability updater, duty state, earnings telemetry, voice cues, and AI loop nudges
 */

const SarthiDriver = {
  driverRickshaw: null,
  isOnDuty: true,

  init() {
    if (window.SarthiMapEngine && window.SarthiMapEngine.rickshaws.length > 0) {
      this.driverRickshaw = window.SarthiMapEngine.rickshaws[0]; // R-104 Ramesh Kumar
    }

    this.bindEvents();
    this.updateSeatDisplay(this.driverRickshaw ? this.driverRickshaw.seatsFree : 4);
  },

  bindEvents() {
    // Minus Seat Button (1 passenger boarded)
    const btnMinus = document.getElementById('btn-seat-minus');
    if (btnMinus) {
      btnMinus.addEventListener('click', () => {
        this.adjustSeats(-1);
      });
    }

    // Plus Seat Button (1 passenger deboarded)
    const btnPlus = document.getElementById('btn-seat-plus');
    if (btnPlus) {
      btnPlus.addEventListener('click', () => {
        this.adjustSeats(1);
      });
    }

    // Master Duty Toggle
    const dutyToggle = document.getElementById('driver-duty-toggle');
    if (dutyToggle) {
      dutyToggle.addEventListener('change', (e) => {
        this.isOnDuty = e.target.checked;
        const statusText = document.getElementById('driver-duty-status-text');
        
        if (this.isOnDuty) {
          statusText.textContent = "ON ROUTE / BROADCASTING";
          statusText.style.color = "#166534";
          window.SarthiApp.showToast("🟢 Live GPS broadcasting resumed. Nearby passengers can now see your rickshaw.", "Duty: Online");
          if (window.SarthiAudio) window.SarthiAudio.speak("ड्यूटी शुरू। जीपीएस ब्रॉडकास्ट चालू है।");
        } else {
          statusText.textContent = "OFFLINE / HIDDEN";
          statusText.style.color = "#991B1B";
          window.SarthiApp.showToast("⚪ You are now offline. Location hidden from passenger radar.", "Duty: Offline");
          if (window.SarthiAudio) window.SarthiAudio.speak("ड्यूटी बंद।");
        }
      });
    }

    // Voice quick pills
    const btnVoiceEmpty = document.getElementById('btn-voice-empty');
    if (btnVoiceEmpty) {
      btnVoiceEmpty.addEventListener('click', () => {
        this.setSeats(6, "सभी 6 सीटें खाली हैं।");
      });
    }

    const btnVoiceHalf = document.getElementById('btn-voice-half');
    if (btnVoiceHalf) {
      btnVoiceHalf.addEventListener('click', () => {
        this.setSeats(3, "3 सीटें खाली हैं।");
      });
    }

    const btnVoiceFull = document.getElementById('btn-voice-full');
    if (btnVoiceFull) {
      btnVoiceFull.addEventListener('click', () => {
        this.setSeats(0, "गाड़ी फुल है। अब कोई सीट नहीं है।");
      });
    }

    // Accept AI Loop Nudge
    const btnNudge = document.getElementById('btn-accept-nudge');
    if (btnNudge) {
      btnNudge.addEventListener('click', () => {
        window.SarthiApp.showToast("📍 Route adjusted toward Vishwavidyalaya Metro Gate 2. Estimated fill time: < 3 mins.", "AI Loop Activated");
        if (window.SarthiAudio) {
          window.SarthiAudio.playSuccess();
          window.SarthiAudio.speak("मेट्रो गेट 2 की तरफ जाएं। 14 सवारियां इंतज़ार में हैं।");
        }
      });
    }

    // Driver SOS Hotline
    const btnDriverSos = document.getElementById('btn-driver-sos');
    if (btnDriverSos) {
      btnDriverSos.addEventListener('click', () => {
        window.SarthiApp.showToast("🚨 Calling Sarthi 24/7 Driver Support & Highway Patrol...", "Driver Hotline");
        if (window.SarthiAudio) window.SarthiAudio.playBeep();
      });
    }
  },

  adjustSeats(delta) {
    if (!this.driverRickshaw) return;
    let newSeats = this.driverRickshaw.seatsFree + delta;
    newSeats = Math.max(0, Math.min(this.driverRickshaw.totalSeats, newSeats));
    
    this.driverRickshaw.seatsFree = newSeats;
    this.updateSeatDisplay(newSeats);

    if (window.SarthiAudio) {
      window.SarthiAudio.playBeep();
      const hindiMsg = newSeats === 0 ? "गाड़ी फुल" : `${newSeats} सीट खाली`;
      window.SarthiAudio.speak(hindiMsg);
    }

    window.SarthiApp.showToast(`🛺 Broadcast Updated: ${newSeats}/6 seats free`, "Live Seat Sync");
  },

  setSeats(count, voiceMsg) {
    if (!this.driverRickshaw) return;
    this.driverRickshaw.seatsFree = count;
    this.updateSeatDisplay(count);

    if (window.SarthiAudio) {
      window.SarthiAudio.playBeep();
      window.SarthiAudio.speak(voiceMsg);
    }
    window.SarthiApp.showToast(`🎙️ Voice Command Processed: ${count}/6 seats free`, "Voice Broadcast");
  },

  updateSeatDisplay(seatsFree) {
    const numDisplay = document.getElementById('driver-free-seat-count');
    if (numDisplay) numDisplay.textContent = seatsFree;

    const globalBadge = document.getElementById('global-seat-badge');
    if (globalBadge) globalBadge.textContent = `${seatsFree}/6 Seats`;

    // Update the visual 6-seat grid
    const visualGrid = document.getElementById('seat-visual-grid');
    if (visualGrid) {
      visualGrid.innerHTML = '';
      const total = 6;
      const occupied = total - seatsFree;

      for (let i = 0; i < total; i++) {
        const isOccupied = (i < occupied);
        const seatBox = document.createElement('div');
        seatBox.className = `seat-icon-box ${isOccupied ? 'occupied' : 'free'}`;
        seatBox.innerHTML = `
          <i data-lucide="${isOccupied ? 'user' : 'user-check'}"></i>
          <span>${isOccupied ? 'Occ' : 'Free'}</span>
        `;
        visualGrid.appendChild(seatBox);
      }
      lucide.createIcons();
    }

    // Refresh passenger list in sync
    if (window.SarthiPassenger) {
      window.SarthiPassenger.renderNearbyList();
    }
  }
};

window.SarthiDriver = SarthiDriver;
