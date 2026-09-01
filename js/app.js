/**
 * SARTHI Main Orchestrator & Prototype Application Controller
 * Handles global view switching, live GPS simulation loop, USSD modal, and pitch deck tabs
 */

const SarthiApp = {
  activeView: 'passenger',
  isSimRunning: true,
  simInterval: null,

  init() {
    this.bindGlobalNavigation();
    this.bindSimulationControls();
    this.bindUSSDModal();
    this.bindPitchDeckTabs();
    this.bindLanguageSwitcher();

    // Initialize Submodules
    if (window.SarthiMapEngine) {
      window.SarthiMapEngine.initPassengerMap();
    }
    if (window.SarthiPassenger) {
      window.SarthiPassenger.init();
    }
    if (window.SarthiDriver) {
      window.SarthiDriver.init();
    }
    if (window.SarthiAnalytics) {
      window.SarthiAnalytics.init();
    }
    if (window.SarthiRocketRide) {
      window.SarthiRocketRide.init();
    }

    // Start Simulation Loop (updates every 800ms)
    this.startSimulationLoop();

    // Initial Welcome Toast
    setTimeout(() => {
      this.showToast("🛺 Sarthi Prototype Live: North Campus DU Corridor active with real-time GPS radar.", "Welcome to SARTHI");
    }, 800);
  },

  bindGlobalNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });
  },

  switchView(viewName) {
    this.activeView = viewName;

    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update Panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`view-${viewName}`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    // Map Resize triggers
    if (viewName === 'passenger' && window.SarthiMapEngine && window.SarthiMapEngine.passengerMap) {
      setTimeout(() => window.SarthiMapEngine.passengerMap.invalidateSize(), 200);
    } else if (viewName === 'driver' && window.SarthiMapEngine) {
      if (!window.SarthiMapEngine.driverMap) {
        window.SarthiMapEngine.initDriverMap();
      } else {
        setTimeout(() => window.SarthiMapEngine.driverMap.invalidateSize(), 200);
      }
    } else if (viewName === 'city' && window.SarthiMapEngine) {
      if (!window.SarthiMapEngine.cityMap) {
        window.SarthiMapEngine.initCityMap();
      } else {
        setTimeout(() => window.SarthiMapEngine.cityMap.invalidateSize(), 200);
      }
    }

    lucide.createIcons();
  },

  bindSimulationControls() {
    const btnPlay = document.getElementById('btn-sim-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.isSimRunning = !this.isSimRunning;
        btnPlay.innerHTML = `<i data-lucide="${this.isSimRunning ? 'pause' : 'play'}"></i>`;
        this.showToast(this.isSimRunning ? "▶️ GPS Telemetry Loop Resumed" : "⏸️ Telemetry Paused", "Simulation Control");
        lucide.createIcons();
      });
    }

    const btnRush = document.getElementById('btn-sim-rush');
    if (btnRush) {
      btnRush.addEventListener('click', () => {
        // Simulates rush hour burst: fills seats, updates heatmaps
        if (window.SarthiMapEngine) {
          window.SarthiMapEngine.rickshaws.forEach(r => {
            if (r.seatsFree > 1) r.seatsFree -= 1;
          });
          if (window.SarthiDriver) {
            window.SarthiDriver.updateSeatDisplay(window.SarthiMapEngine.rickshaws[0].seatsFree);
          }
        }
        this.showToast("🔥 Morning Rush Hour Triggered! High demand detected at Vishwavidyalaya Metro.", "Rush Hour Surge");
        if (window.SarthiAudio) {
          window.SarthiAudio.playBeep();
          window.SarthiAudio.speak("पीक ऑवर शुरू। मेट्रो स्टेशन पर अधिक सवारियां हैं।");
        }
      });
    }
  },

  startSimulationLoop() {
    if (this.simInterval) clearInterval(this.simInterval);

    this.simInterval = setInterval(() => {
      if (this.isSimRunning && window.SarthiMapEngine) {
        window.SarthiMapEngine.tickSimulation();
      }
    }, 800);
  },

  bindUSSDModal() {
    const btnOpenUSSD = document.getElementById('btn-sim-ussd');
    const modal = document.getElementById('modal-ussd');
    const btnClose = document.getElementById('btn-close-ussd');
    const btnDial = document.getElementById('btn-ussd-dial');
    const dialerView = document.getElementById('ussd-dialer-view');
    const dialogView = document.getElementById('ussd-dialog-view');
    const btnSend = document.getElementById('btn-ussd-send');
    const btnCancel = document.getElementById('btn-ussd-cancel');
    const inputReply = document.getElementById('ussd-user-reply');

    if (btnOpenUSSD && modal) {
      btnOpenUSSD.addEventListener('click', () => {
        modal.classList.remove('hidden');
        dialerView.classList.remove('hidden');
        dialogView.classList.add('hidden');
      });
    }

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (btnDial) {
      btnDial.addEventListener('click', () => {
        dialerView.classList.add('hidden');
        dialogView.classList.remove('hidden');
        if (window.SarthiAudio) window.SarthiAudio.playBeep();
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    if (btnSend) {
      btnSend.addEventListener('click', () => {
        const val = (inputReply.value || '').trim();
        if (val === '1') {
          dialogView.innerHTML = `
            <div class="ussd-text">
              <strong>SARTHI CONFIRMATION</strong><br>
              Seat 1 locked with Driver Ramesh (DL 1ER 4921).<br>
              ETA: 2 mins at Metro Gate 2.<br>
              Fare: ₹10 (Pay Cash on arrival).
            </div>
            <div class="ussd-actions" style="margin-top:10px;">
              <button class="ussd-btn" id="btn-ussd-done">OK</button>
            </div>
          `;
          document.getElementById('btn-ussd-done').addEventListener('click', () => modal.classList.add('hidden'));
          if (window.SarthiAudio) window.SarthiAudio.playSuccess();
        } else if (val === '9') {
          dialogView.innerHTML = `
            <div class="ussd-text" style="color:#991B1B;">
              <strong>EMERGENCY SOS SENT</strong><br>
              Cell tower location broadcast to Local Police & emergency contacts.
            </div>
            <div class="ussd-actions" style="margin-top:10px;">
              <button class="ussd-btn" id="btn-ussd-done">OK</button>
            </div>
          `;
          document.getElementById('btn-ussd-done').addEventListener('click', () => modal.classList.add('hidden'));
        } else {
          dialogView.innerHTML = `
            <div class="ussd-text">
              Invalid selection. Session ended.
            </div>
            <div class="ussd-actions" style="margin-top:10px;">
              <button class="ussd-btn" id="btn-ussd-done">OK</button>
            </div>
          `;
          document.getElementById('btn-ussd-done').addEventListener('click', () => modal.classList.add('hidden'));
        }
      });
    }
  },

  bindPitchDeckTabs() {
    const tabs = document.querySelectorAll('.p-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const targetId = tab.dataset.pitchTarget;
        document.querySelectorAll('.pitch-section').forEach(sec => {
          sec.classList.add('hidden');
          sec.classList.remove('active');
        });

        const targetSec = document.getElementById(targetId);
        if (targetSec) {
          targetSec.classList.remove('hidden');
          targetSec.classList.add('active');
        }
        lucide.createIcons();
      });
    });
  },

  bindLanguageSwitcher() {
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        if (window.SarthiPassenger) {
          window.SarthiPassenger.isHindi = (lang === 'hi' || lang === 'hinglish');
          window.SarthiPassenger.applyLanguage();
        }
        this.showToast(`🌐 Language set to ${lang.toUpperCase()}`, "Language Changed");
      });
    }
  },

  showToast(message, title = "SARTHI Alert") {
    const toast = document.getElementById('toast-notification');
    const toastTitle = document.getElementById('toast-title');
    const toastDesc = document.getElementById('toast-desc');

    if (!toast) return;

    toastTitle.textContent = title;
    toastDesc.textContent = message;
    toast.classList.remove('hidden');

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 4500);
  }
};

window.SarthiApp = SarthiApp;

// Auto-boot on DOM Content Loaded
window.addEventListener('DOMContentLoaded', () => {
  SarthiApp.init();
});
