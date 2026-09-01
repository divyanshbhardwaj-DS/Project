/**
 * SARTHI Smart City & Fleet Analytics Controller
 * Handles Chart.js visualization for passenger demand vs fleet supply, route clustering, and environmental stats
 */

const SarthiAnalytics = {
  demandChart: null,

  init() {
    this.initChart();
    this.bindEvents();
  },

  bindEvents() {
    // Map layer checkboxes
    const chkClusters = document.getElementById('chk-show-clusters');
    if (chkClusters) {
      chkClusters.addEventListener('change', (e) => {
        if (window.SarthiMapEngine && window.SarthiMapEngine.cityRoutePolyline) {
          if (e.target.checked) {
            window.SarthiMapEngine.cityRoutePolyline.addTo(window.SarthiMapEngine.cityMap);
          } else {
            window.SarthiMapEngine.cityMap.removeLayer(window.SarthiMapEngine.cityRoutePolyline);
          }
        }
      });
    }

    const chkRickshaws = document.getElementById('chk-show-rickshaws');
    if (chkRickshaws) {
      chkRickshaws.addEventListener('change', (e) => {
        if (window.SarthiMapEngine) {
          window.SarthiMapEngine.rickshaws.forEach(r => {
            if (r.cityMarker) {
              if (e.target.checked) {
                r.cityMarker.addTo(window.SarthiMapEngine.cityMap);
              } else {
                window.SarthiMapEngine.cityMap.removeLayer(r.cityMarker);
              }
            }
          });
        }
      });
    }
  },

  initChart() {
    const canvas = document.getElementById('cityDemandChart');
    if (!canvas || this.demandChart) return;

    const ctx = canvas.getContext('2d');
    const hours = ['7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'];
    
    // Hourly passenger demand vs deployed shared rickshaw capacity
    const demandData = [45, 120, 240, 180, 95, 80, 110, 140, 130, 190, 260, 210, 110];
    const supplyData = [40, 100, 220, 190, 110, 90, 100, 130, 140, 200, 250, 220, 120];

    this.demandChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          {
            label: 'Passenger Demand (Pings/hr)',
            data: demandData,
            borderColor: '#FFB347',
            backgroundColor: 'rgba(255, 179, 71, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.35
          },
          {
            label: 'Active Shared Seat Capacity',
            data: supplyData,
            borderColor: '#1B3A63',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            borderDash: [5, 5],
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { family: 'Inter', size: 11 }
            }
          },
          tooltip: {
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 10 } }
          },
          y: {
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { font: { family: 'Inter', size: 10 } }
          }
        }
      }
    });
  }
};

window.SarthiAnalytics = SarthiAnalytics;
