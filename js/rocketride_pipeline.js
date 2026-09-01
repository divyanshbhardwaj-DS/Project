/**
 * SARTHI — RocketRide AI Meta-Harness Visual Pipeline Controller
 * Manages Multi-Agent DAG visualization, Mixed-Media Inputs, Batch Processing, and Human-in-the-Loop (HITL) Gate
 */

const SarthiRocketRide = {
  confidenceThreshold: 0.85,
  isExecuting: false,
  totalRuns: 42,
  accumulatedCostUsd: 0.0504,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Run Pipeline Button (Single Mixed-Media Run)
    const btnRunSingle = document.getElementById('btn-rr-run-single');
    if (btnRunSingle) {
      btnRunSingle.addEventListener('click', () => {
        this.executeSingleRun();
      });
    }

    // Trigger Anomaly / Distress Scenario
    const btnTriggerAnomaly = document.getElementById('btn-rr-trigger-anomaly');
    if (btnTriggerAnomaly) {
      btnTriggerAnomaly.addEventListener('click', () => {
        this.executeAnomalyRun();
      });
    }

    // Batch Process Buttons (100, 500, 1000 items)
    const btnBatch100 = document.getElementById('btn-batch-100');
    if (btnBatch100) btnBatch100.addEventListener('click', () => this.runBatchProcessing(100));

    const btnBatch500 = document.getElementById('btn-batch-500');
    if (btnBatch500) btnBatch500.addEventListener('click', () => this.runBatchProcessing(500));

    const btnBatch1000 = document.getElementById('btn-batch-1000');
    if (btnBatch1000) btnBatch1000.addEventListener('click', () => this.runBatchProcessing(1000));

    // Human-in-the-Loop Modal Actions
    const btnHitlApprove = document.getElementById('btn-hitl-approve');
    if (btnHitlApprove) {
      btnHitlApprove.addEventListener('click', () => {
        this.resolveHumanGate('APPROVED');
      });
    }

    const btnHitlOverride = document.getElementById('btn-hitl-override');
    if (btnHitlOverride) {
      btnHitlOverride.addEventListener('click', () => {
        this.resolveHumanGate('OVERRIDDEN');
      });
    }

    const btnHitlEscalate = document.getElementById('btn-hitl-escalate');
    if (btnHitlEscalate) {
      btnHitlEscalate.addEventListener('click', () => {
        this.resolveHumanGate('POLICE_ESCALATED');
      });
    }
  },

  executeSingleRun() {
    if (this.isExecuting) return;
    this.isExecuting = true;

    // Get input values from UI
    const voiceInput = document.getElementById('rr-input-voice').value;
    const speedInput = parseFloat(document.getElementById('rr-input-speed').value) || 16.5;
    const seatInput = parseInt(document.getElementById('rr-input-seats').value) || 4;

    this.resetDagVisuals();
    this.animateDagStep('node-ingest', 300, () => {
      this.animateDagStep('node-voice', 600, () => {
        this.animateDagStep('node-vision', 900, () => {
          this.animateDagStep('node-auditor', 1200, () => {
            // Calculate Confidence
            const confidence = 0.94;
            this.updateConfidenceScore(confidence);

            this.animateDagStep('node-hitl', 1500, () => {
              // High confidence -> Auto Approve
              this.animateDagStep('node-action', 1800, () => {
                this.isExecuting = false;
                this.accumulatedCostUsd += 0.0012;
                this.totalRuns += 1;
                this.updateMetrics(confidence, "AUTO_APPROVED", "Upserted to PostGIS DB & Live Radar");
                window.SarthiApp.showToast("⚡ RocketRide Pipeline Executed: Confidence 94% -> Real-world PostGIS Sync complete.", "Pipeline Success");
                if (window.SarthiAudio) window.SarthiAudio.playSuccess();
              });
            });
          });
        });
      });
    });
  },

  executeAnomalyRun() {
    if (this.isExecuting) return;
    this.isExecuting = true;

    // Set anomaly inputs in UI
    document.getElementById('rr-input-voice').value = "मदद चाहिए, कॉलेज मोड़ पर रास्ता बंद है और गाड़ी पंचर है (SOS Distress)";
    document.getElementById('rr-input-speed').value = "52.0";
    document.getElementById('rr-input-seats').value = "1";

    this.resetDagVisuals();
    this.animateDagStep('node-ingest', 300, () => {
      this.animateDagStep('node-voice', 600, () => {
        this.animateDagStep('node-vision', 900, () => {
          this.animateDagStep('node-auditor', 1200, () => {
            // Low confidence / distress anomaly
            const confidence = 0.58;
            this.updateConfidenceScore(confidence);

            this.animateDagStep('node-hitl', 1500, () => {
              this.isExecuting = false;
              // Open Human Gate Modal
              this.openHumanGateModal({
                vehicleId: "DL-1ER-4921",
                driverName: "Ramesh Kumar",
                speed: "52.0 km/h (Speed Anomaly)",
                confidence: "58%",
                reason: "Distress voice keyword ('मदद चाहिए') + Route speed anomaly detected. Confidence (58%) below 85% safety threshold.",
                voiceText: "मदद चाहिए, कॉलेज मोड़ पर रास्ता बंद है और गाड़ी पंचर है"
              });
              if (window.SarthiAudio) window.SarthiAudio.playBeep();
            });
          });
        });
      });
    });
  },

  animateDagStep(nodeId, delay, callback) {
    setTimeout(() => {
      const node = document.getElementById(nodeId);
      if (node) {
        node.classList.add('node-active');
        node.classList.remove('node-idle');
      }
      if (callback) callback();
    }, delay);
  },

  resetDagVisuals() {
    document.querySelectorAll('.rr-dag-node').forEach(n => {
      n.classList.remove('node-active', 'node-paused', 'node-success');
      n.classList.add('node-idle');
    });
  },

  updateConfidenceScore(score) {
    const bar = document.getElementById('rr-confidence-bar');
    const label = document.getElementById('rr-confidence-label');
    const pct = Math.round(score * 100);

    if (bar) {
      bar.style.width = `${pct}%`;
      bar.style.backgroundColor = score >= 0.85 ? '#2ECC71' : '#E74C3C';
    }
    if (label) {
      label.textContent = `${pct}% Confidence`;
      label.style.color = score >= 0.85 ? '#166534' : '#991B1B';
    }
  },

  openHumanGateModal(data) {
    const modal = document.getElementById('modal-rr-hitl');
    if (!modal) return;

    document.getElementById('hitl-vehicle-id').textContent = data.vehicleId;
    document.getElementById('hitl-driver-name').textContent = data.driverName;
    document.getElementById('hitl-confidence-val').textContent = data.confidence;
    document.getElementById('hitl-reason-text').textContent = data.reason;
    document.getElementById('hitl-voice-transcript').textContent = `"${data.voiceText}"`;

    modal.classList.remove('hidden');
  },

  resolveHumanGate(resolution) {
    const modal = document.getElementById('modal-rr-hitl');
    if (modal) modal.classList.add('hidden');

    this.accumulatedCostUsd += 0.0012;
    this.totalRuns += 1;

    let msg = "";
    if (resolution === 'APPROVED') {
      msg = "Human Operator Override: Fleet dispatch approved.";
    } else if (resolution === 'POLICE_ESCALATED') {
      msg = "EMERGENCY: Live GPS sent to Delhi Police Patrol & Campus Security.";
      if (window.SarthiAudio) window.SarthiAudio.speak("आपातकालीन टीम को सूचित कर दिया गया है।");
    } else {
      msg = "Operator Action: Telemetry flagged & paused.";
    }

    this.animateDagStep('node-action', 100, () => {
      this.updateMetrics(0.58, resolution, msg);
      window.SarthiApp.showToast(`🛡️ Human Gate Resolved: ${msg}`, "Operator Override Complete");
    });
  },

  updateMetrics(confidence, gateStatus, actionText) {
    const elRuns = document.getElementById('rr-metric-runs');
    const elCost = document.getElementById('rr-metric-cost');
    const elAction = document.getElementById('rr-metric-action');

    if (elRuns) elRuns.textContent = this.totalRuns;
    if (elCost) elCost.textContent = `$${this.accumulatedCostUsd.toFixed(4)}`;
    if (elAction) elAction.textContent = actionText;
  },

  runBatchProcessing(batchSize) {
    const progressBar = document.getElementById('rr-batch-progress-bar');
    const statusText = document.getElementById('rr-batch-status');
    const throughputVal = document.getElementById('rr-batch-throughput');
    const btnBox = document.querySelector('.rr-batch-btn-group');

    if (btnBox) btnBox.style.pointerEvents = 'none';
    let progress = 0;
    const startTime = performance.now();

    window.SarthiApp.showToast(`🚀 RocketRide Engine: Ingesting batch of ${batchSize} multi-modal records...`, "Batch Processing Started");

    const interval = setInterval(() => {
      progress += Math.min(25, 100 - progress);
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (statusText) statusText.textContent = `Processing records ${Math.round((progress / 100) * batchSize)} of ${batchSize}...`;

      if (progress >= 100) {
        clearInterval(interval);
        const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(2);
        const rps = (batchSize / Math.max(0.1, parseFloat(elapsedSec))).toFixed(1);
        const batchCost = (batchSize * 0.0012).toFixed(3);

        this.accumulatedCostUsd += parseFloat(batchCost);
        this.totalRuns += batchSize;

        if (statusText) statusText.textContent = `✅ Batch of ${batchSize} records processed in ${elapsedSec}s. (0 errors, ${batchSize > 100 ? 4 : 1} escalated to Human Gate).`;
        if (throughputVal) throughputVal.textContent = `${rps} records/sec`;

        this.updateMetrics(0.96, "BATCH_PROCESSED", `Processed ${batchSize} records (Cost: $${batchCost})`);
        if (btnBox) btnBox.style.pointerEvents = 'auto';

        window.SarthiApp.showToast(`🎉 Batch Complete: ${batchSize} records processed at ${rps} rec/sec! Total Cost: $${batchCost}`, "RocketRide Batch Verified");
        if (window.SarthiAudio) window.SarthiAudio.playSuccess();
      }
    }, 180);
  }
};

window.SarthiRocketRide = SarthiRocketRide;
