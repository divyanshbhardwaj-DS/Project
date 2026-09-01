/**
 * SARTHI Passenger Experience Controller
 * Handles mobile PWA state transitions, bottom sheet, boarding flow, SOS, and live tracking
 */

const SarthiPassenger = {
  currentScreen: 'screen-home',
  selectedRickshaw: null,
  isDemandBeaconOn: false,
  isHindi: false,

  translations: {
    en: {
      radarTitle: "Nearby Rickshaws",
      radarSub: "Live updates via Driver GPS",
      boardQR: "Board / QR",
      seatsFree: "seats free",
      full: "Full",
      optimalChoice: "OPTIMAL CHOICE",
      eta: "ETA",
      min: "min",
      waitingHere: 'Signal "I\'m Waiting Here"',
      beaconActive: "Demand beacon active (Broadcasting to 4 drivers)",
      boardConfirmed: "Boarding Confirmed!",
      sosAlert: "One-Tap SOS Alert"
    },
    hi: {
      radarTitle: "नज़दीकी ई-रिक्शा",
      radarSub: "चालक जीपीएस द्वारा लाइव अपडेट",
      boardQR: "बैठें / क्यूआर",
      seatsFree: "सीट खाली",
      full: "फुल",
      optimalChoice: "बेस्ट विकल्प",
      eta: "समय",
      min: "मिनट",
      waitingHere: 'सिग्नल भेजें "मैं यहाँ खड़ा हूँ"',
      beaconActive: "डिमांड बीकन सक्रिय (4 चालकों को दिख रहा है)",
      boardConfirmed: "सवारी कन्फ़र्म हुई!",
      sosAlert: "आपातकालीन एसओएस अलर्ट"
    }
  },

  init() {
    this.bindEvents();
    this.renderNearbyList();
  },

  bindEvents() {
    // Phone Nav items
    document.querySelectorAll('.p-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.dataset.target;
        document.querySelectorAll('.p-nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (target === 'home') this.showScreen('screen-home');
        else if (target === 'history') this.showScreen('screen-history');
        else if (target === 'login') this.showScreen('screen-login');
        else if (target === 'sos') this.triggerSOS();
      });
    });

    // Language Toggle inside phone
    const langBtn = document.getElementById('phone-btn-lang');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        this.toggleLanguage();
      });
    }

    // Phone SOS mini button
    const phoneSosBtn = document.getElementById('phone-btn-sos');
    if (phoneSosBtn) {
      phoneSosBtn.addEventListener('click', () => this.triggerSOS());
    }

    // Sidebar SOS and Demand Buttons
    const btnTriggerSos = document.getElementById('btn-trigger-sos');
    if (btnTriggerSos) btnTriggerSos.addEventListener('click', () => this.triggerSOS());

    const btnShareTrip = document.getElementById('btn-share-trip');
    if (btnShareTrip) btnShareTrip.addEventListener('click', () => this.shareLiveTripLink());

    const btnSignalDemand = document.getElementById('btn-signal-demand');
    if (btnSignalDemand) {
      btnSignalDemand.addEventListener('click', () => this.toggleDemandBeacon());
    }

    const btnGuideWalk = document.getElementById('btn-guide-walk');
    if (btnGuideWalk) {
      btnGuideWalk.addEventListener('click', () => {
        window.SarthiApp.showToast("🚶 Walk 65m along Chhatra Marg to Metro Gate 2", "Optimal Stop Selected");
        if (window.SarthiAudio) window.SarthiAudio.playBeep();
      });
    }

    // QR Scan / Boarding Trigger
    const btnScanQrOpen = document.getElementById('btn-scan-qr-open');
    if (btnScanQrOpen) {
      btnScanQrOpen.addEventListener('click', () => {
        this.showScreen('screen-boarding');
      });
    }

    const btnCloseBoarding = document.getElementById('btn-close-boarding');
    if (btnCloseBoarding) {
      btnCloseBoarding.addEventListener('click', () => {
        this.showScreen('screen-home');
      });
    }

    // Confirm Payment / Boarding
    const btnConfirmPayment = document.getElementById('btn-confirm-payment');
    if (btnConfirmPayment) {
      btnConfirmPayment.addEventListener('click', () => {
        this.confirmBoarding();
      });
    }

    // Back to Home from Live Tracking
    const btnBackHome = document.getElementById('btn-back-to-home');
    if (btnBackHome) {
      btnBackHome.addEventListener('click', () => {
        this.showScreen('screen-home');
      });
    }

    // Board from tracking detail
    const btnBoardTracking = document.getElementById('btn-board-from-tracking');
    if (btnBoardTracking) {
      btnBoardTracking.addEventListener('click', () => {
        this.showScreen('screen-boarding');
      });
    }

    // Tracking share button
    const btnTrackingShare = document.getElementById('btn-tracking-share');
    if (btnTrackingShare) {
      btnTrackingShare.addEventListener('click', () => this.shareLiveTripLink());
    }

    // Notify toggle
    const btnNotify = document.getElementById('btn-notify-toggle');
    if (btnNotify) {
      btnNotify.addEventListener('click', () => {
        btnNotify.classList.toggle('active');
        const isActive = btnNotify.classList.contains('active');
        window.SarthiApp.showToast(isActive ? "🔔 Notification Set for 2 min ETA" : "🔕 Notification Cleared", "ETA Alert");
      });
    }

    // History Back
    const btnHistBack = document.getElementById('btn-history-back');
    if (btnHistBack) {
      btnHistBack.addEventListener('click', () => this.showScreen('screen-home'));
    }

    // End Trip Demo
    const btnEndTrip = document.getElementById('btn-end-trip-demo');
    if (btnEndTrip) {
      btnEndTrip.addEventListener('click', () => {
        window.SarthiApp.showToast("✅ Trip Ended. ₹11 credited to driver Ramesh Kumar.", "Trip Complete");
        this.showScreen('screen-history');
      });
    }

    // Send OTP login button
    const btnSendOtp = document.getElementById('btn-send-otp');
    if (btnSendOtp) {
      btnSendOtp.addEventListener('click', () => {
        window.SarthiApp.showToast("🔓 Logged in successfully as +91 98765 43210", "OTP Verified");
        this.showScreen('screen-home');
      });
    }

    // Recenter User Map button
    const btnRecenter = document.getElementById('btn-recenter-user');
    if (btnRecenter) {
      btnRecenter.addEventListener('click', () => {
        if (window.SarthiMapEngine && window.SarthiMapEngine.passengerMap) {
          const u = window.SarthiMapEngine.userLocation;
          window.SarthiMapEngine.passengerMap.setView([u.lat, u.lng], 16);
          window.SarthiApp.showToast("📍 Map centered on your pick-up spot", "GPS Location");
        }
      });
    }
  },

  showScreen(screenId) {
    document.querySelectorAll('.phone-view').forEach(view => {
      view.classList.add('hidden');
      view.classList.remove('active');
    });

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
      this.currentScreen = screenId;
    }

    // If returning to home map, invalidate size
    if (screenId === 'screen-home' && window.SarthiMapEngine && window.SarthiMapEngine.passengerMap) {
      setTimeout(() => window.SarthiMapEngine.passengerMap.invalidateSize(), 150);
    }
  },

  renderNearbyList() {
    const listContainer = document.getElementById('nearby-rickshaws-list');
    if (!listContainer || !window.SarthiMapEngine) return;

    const rickshaws = window.SarthiMapEngine.rickshaws;
    const t = this.isHindi ? this.translations.hi : this.translations.en;

    listContainer.innerHTML = '';

    rickshaws.forEach((r, idx) => {
      let seatChipClass = 'seats-green';
      let seatText = `${r.seatsFree} ${t.seatsFree}`;

      if (r.seatsFree === 0) {
        seatChipClass = 'seats-red';
        seatText = t.full;
      } else if (r.seatsFree <= 2) {
        seatChipClass = 'seats-amber';
      }

      const card = document.createElement('div');
      card.className = 'rickshaw-item-card';
      card.innerHTML = `
        <div class="r-card-left">
          <div class="r-rickshaw-icon">🛺</div>
          <div class="r-info">
            <strong>${r.driverName} <span style="font-size:0.65rem; color:#6B7280;">(${r.vehicleNo})</span></strong>
            <span class="r-route">${r.route}</span>
          </div>
        </div>
        <div class="r-card-right">
          <span class="chip-seats ${seatChipClass}">${seatText}</span>
          <span class="r-eta-text">${t.eta} ${r.calculatedETA || (idx * 2 + 2)} ${t.min}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.showLiveTracking(r);
      });

      listContainer.appendChild(card);
    });
  },

  showLiveTracking(rickshaw) {
    this.selectedRickshaw = rickshaw;
    
    // Update live tracking card elements
    document.getElementById('track-driver-name').textContent = rickshaw.driverName;
    document.getElementById('track-vehicle-no').textContent = `${rickshaw.vehicleNo} • Sarthi Verified`;
    
    const seatBadge = document.getElementById('track-seats-badge');
    if (seatBadge) {
      seatBadge.querySelector('.seat-num').textContent = rickshaw.seatsFree;
    }

    const etaTimer = document.getElementById('track-eta-timer');
    if (etaTimer) {
      etaTimer.innerHTML = `0${rickshaw.calculatedETA || 2}:30 <span class="mins">min</span>`;
    }

    this.showScreen('screen-tracking');
    if (window.SarthiAudio) window.SarthiAudio.playBeep();
  },

  confirmBoarding() {
    if (window.SarthiAudio) {
      window.SarthiAudio.playSuccess();
      window.SarthiAudio.speak(this.isHindi ? "सवारी कन्फ़र्म हुई। सारथी में आपका स्वागत है।" : "Boarding confirmed. Welcome to Sarthi.");
    }

    // Decrement seat on selected rickshaw (or primary driver R-104)
    const primary = window.SarthiMapEngine.rickshaws[0];
    if (primary.seatsFree > 0) {
      primary.seatsFree -= 1;
      // Sync driver cockpit view if loaded
      if (window.SarthiDriver) {
        window.SarthiDriver.updateSeatDisplay(primary.seatsFree);
      }
    }

    this.showScreen('screen-success');
    window.SarthiApp.showToast("🎉 Seat locked! QR scan verified with driver.", "Boarding Confirmed");
  },

  triggerSOS() {
    if (window.SarthiAudio) {
      window.SarthiAudio.playBeep();
      window.SarthiAudio.speak(this.isHindi ? "एसओएस अलर्ट भेजा गया। आपातकालीन नंबर को लाइव लोकेशन भेजी जा रही है।" : "SOS Alert triggered. Live location shared with emergency contacts.");
    }
    window.SarthiApp.showToast("🚨 Emergency SOS Triggered! Live GPS coordinates transmitted to Delhi Police & Family contacts.", "EMERGENCY ALERT");
  },

  shareLiveTripLink() {
    const link = `https://sarthi.city/track/live?trip=SARTHI-DU-8924&token=sec_9918`;
    navigator.clipboard?.writeText(link).catch(() => {});
    window.SarthiApp.showToast(`🔗 Live Ride Tracker Link copied to clipboard! Shared via SMS/WhatsApp`, "Trip Link Shared");
    if (window.SarthiAudio) window.SarthiAudio.playSuccess();
  },

  toggleDemandBeacon() {
    this.isDemandBeaconOn = !this.isDemandBeaconOn;
    const statusEl = document.getElementById('demand-signal-status');
    const btn = document.getElementById('btn-signal-demand');

    if (this.isDemandBeaconOn) {
      statusEl.classList.remove('hidden');
      btn.classList.add('active');
      btn.innerHTML = `<i data-lucide="radio"></i> <span>Beacon Active (Broadcasting)</span>`;
      window.SarthiMapEngine.setDemandBeaconActive(true);
      window.SarthiApp.showToast("📡 Demand beacon active: Nearby drivers now see your pickup beacon on their heatmap!", "Demand Signaled");
      if (window.SarthiAudio) window.SarthiAudio.speak(this.isHindi ? "आपकी डिमांड चालकों को भेज दी गई है।" : "Demand signal broadcast to nearby drivers.");
    } else {
      statusEl.classList.add('hidden');
      btn.classList.remove('active');
      btn.innerHTML = `<i data-lucide="map-pin"></i> <span>Signal "I'm Waiting Here"</span>`;
      window.SarthiMapEngine.setDemandBeaconActive(false);
    }
    lucide.createIcons();
  },

  toggleLanguage() {
    this.isHindi = !this.isHindi;
    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = this.isHindi ? 'hi' : 'en';
    
    this.applyLanguage();
  },

  applyLanguage() {
    const t = this.isHindi ? this.translations.hi : this.translations.en;
    
    const sheetSub = document.getElementById('sheet-sub-text');
    if (sheetSub) sheetSub.textContent = t.radarSub;

    const btnScan = document.getElementById('btn-scan-qr-open');
    if (btnScan) btnScan.innerHTML = `<i data-lucide="qr-code"></i> ${t.boardQR}`;

    this.renderNearbyList();
    lucide.createIcons();
  }
};

window.SarthiPassenger = SarthiPassenger;
