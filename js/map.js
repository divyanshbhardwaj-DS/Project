/**
 * SARTHI Geospatial & Route Map Engine
 * Manages Leaflet maps for Passenger Phone View, Driver Cockpit, and City Command Center
 */

const SarthiMapEngine = {
  passengerMap: null,
  driverMap: null,
  cityMap: null,
  
  // Real coordinates along Delhi University North Campus Corridor
  routeWaypoints: [
    { name: "Vishwavidyalaya Metro Gate 2", lat: 28.6946, lng: 77.2167, isStop: true },
    { name: "Chhatra Marg Turn", lat: 28.6918, lng: 77.2135, isStop: false },
    { name: "Arts Faculty Circle", lat: 28.6895, lng: 77.2105, isStop: true },
    { name: "Patel Chest Institute", lat: 28.6845, lng: 77.2102, isStop: true },
    { name: "Hansraj College Gate 1", lat: 28.6812, lng: 77.2091, isStop: true },
    { name: "Malka Ganj Chowk", lat: 28.6804, lng: 77.2058, isStop: true },
    { name: "Kamla Nagar Clock Tower", lat: 28.6798, lng: 77.2024, isStop: true }
  ],

  // Active Simulated E-Rickshaws
  rickshaws: [
    {
      id: "R-104",
      driverName: "Ramesh Kumar",
      vehicleNo: "DL 1ER 4921",
      seatsFree: 4,
      totalSeats: 6,
      currentWpIndex: 0,
      progress: 0.2, // 0 to 1 between waypoints
      speed: 0.04,
      direction: 1, // 1 forward, -1 backward
      lat: 28.6930,
      lng: 77.2150,
      marker: null,
      cityMarker: null,
      route: "Metro ⇄ Kamla Nagar",
      rating: "4.9 ★"
    },
    {
      id: "R-108",
      driverName: "Suresh Sharma",
      vehicleNo: "DL 1ER 8312",
      seatsFree: 1,
      totalSeats: 6,
      currentWpIndex: 2,
      progress: 0.6,
      speed: 0.035,
      direction: 1,
      lat: 28.6870,
      lng: 77.2104,
      marker: null,
      cityMarker: null,
      route: "Arts Faculty ⇄ Metro",
      rating: "4.8 ★"
    },
    {
      id: "R-112",
      driverName: "Vinod Pal",
      vehicleNo: "DL 1ER 2901",
      seatsFree: 0, // Full
      totalSeats: 6,
      currentWpIndex: 4,
      progress: 0.1,
      speed: 0.05,
      direction: -1,
      lat: 28.6815,
      lng: 77.2088,
      marker: null,
      cityMarker: null,
      route: "Kamla Nagar ⇄ Metro",
      rating: "4.7 ★"
    },
    {
      id: "R-119",
      driverName: "Manoj Singh",
      vehicleNo: "DL 1ER 6640",
      seatsFree: 5,
      totalSeats: 6,
      currentWpIndex: 5,
      progress: 0.8,
      speed: 0.045,
      direction: -1,
      lat: 28.6800,
      lng: 77.2035,
      marker: null,
      cityMarker: null,
      route: "Metro Loop Express",
      rating: "4.9 ★"
    }
  ],

  // Passenger Simulated Position (near Hansraj Gate)
  userLocation: { lat: 28.6820, lng: 77.2096, name: "Your Current Location (Near Hansraj)" },
  passengerMarker: null,
  demandMarker: null,
  routePolyline: null,
  cityRoutePolyline: null,

  initPassengerMap() {
    const container = document.getElementById('passenger-map');
    if (!container || this.passengerMap) return;

    this.passengerMap = L.map('passenger-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([this.userLocation.lat, this.userLocation.lng], 15);

    // OpenStreetMap Carto tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.passengerMap);

    // Render Passenger Pin
    const userIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="sarthi-passenger-pin" title="You are here"><i data-lucide="user"></i></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    this.passengerMarker = L.marker([this.userLocation.lat, this.userLocation.lng], { icon: userIcon }).addTo(this.passengerMap);

    // Render Learned Route Line
    const routeCoords = this.routeWaypoints.map(wp => [wp.lat, wp.lng]);
    this.routePolyline = L.polyline(routeCoords, {
      color: '#1B3A63',
      weight: 4,
      dashArray: '6, 6',
      opacity: 0.7
    }).addTo(this.passengerMap);

    // Add Stop Icons
    this.routeWaypoints.forEach(wp => {
      if (wp.isStop) {
        L.circleMarker([wp.lat, wp.lng], {
          radius: 5,
          fillColor: '#FFB347',
          color: '#1B3A63',
          weight: 2,
          fillOpacity: 1
        }).bindPopup(`<b>${wp.name}</b><br>Shared E-Rickshaw Stop`).addTo(this.passengerMap);
      }
    });

    // Initialize Rickshaw Markers
    this.rickshaws.forEach(r => {
      const rickshawIcon = this.createRickshawDivIcon(r);
      r.marker = L.marker([r.lat, r.lng], { icon: rickshawIcon }).addTo(this.passengerMap);
      
      r.marker.on('click', () => {
        if (window.SarthiPassenger) {
          window.SarthiPassenger.showLiveTracking(r);
        }
      });
    });

    setTimeout(() => this.passengerMap.invalidateSize(), 300);
  },

  initDriverMap() {
    const container = document.getElementById('driver-heatmap');
    if (!container || this.driverMap) return;

    this.driverMap = L.map('driver-heatmap', {
      zoomControl: true,
      attributionControl: false
    }).setView([28.6880, 77.2110], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.driverMap);

    // High Demand Circles (Simulating AI Heatmap)
    L.circle([28.6946, 77.2167], {
      radius: 180,
      color: '#EF4444',
      fillColor: '#EF4444',
      fillOpacity: 0.45
    }).bindPopup("<b>High Demand Hotspot</b><br>18 passengers waiting near Vishwavidyalaya Metro").addTo(this.driverMap);

    L.circle([28.6812, 77.2091], {
      radius: 110,
      color: '#FFB347',
      fillColor: '#FFB347',
      fillOpacity: 0.35
    }).bindPopup("<b>Moderate Hotspot</b><br>6 passengers near Hansraj Gate").addTo(this.driverMap);

    // Driver's own vehicle pin (R-104)
    const driverIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="sarthi-marker-wrap"><div class="sarthi-marker-pulse"></div><div class="sarthi-marker-icon" style="background:#2ECC71">🛺</div></div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
    this.driverVehicleMarker = L.marker([this.rickshaws[0].lat, this.rickshaws[0].lng], { icon: driverIcon }).addTo(this.driverMap);

    setTimeout(() => this.driverMap.invalidateSize(), 300);
  },

  initCityMap() {
    const container = document.getElementById('city-fleet-map');
    if (!container || this.cityMap) return;

    this.cityMap = L.map('city-fleet-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([28.6870, 77.2100], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.cityMap);

    // Route Clustering Polyline
    const routeCoords = this.routeWaypoints.map(wp => [wp.lat, wp.lng]);
    this.cityRoutePolyline = L.polyline(routeCoords, {
      color: '#0B4F4A',
      weight: 6,
      opacity: 0.85
    }).bindPopup("<b>Auto-Discovered Corridor A</b><br>Unsupervised GPS clustering from 48 active driver trails").addTo(this.cityMap);

    // Add city markers for each vehicle
    this.rickshaws.forEach(r => {
      const cityIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="sarthi-marker-icon" style="background:#1B3A63">🛺</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      r.cityMarker = L.marker([r.lat, r.lng], { icon: cityIcon })
        .bindPopup(`<b>${r.driverName} (${r.vehicleNo})</b><br>Seats: ${r.seatsFree}/${r.totalSeats}<br>Route: ${r.route}`)
        .addTo(this.cityMap);
    });

    setTimeout(() => this.cityMap.invalidateSize(), 300);
  },

  createRickshawDivIcon(r) {
    const isPrimaryDriver = (r.id === "R-104");
    const seatColor = r.seatsFree > 2 ? '#2ECC71' : (r.seatsFree > 0 ? '#FFB347' : '#EF4444');
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="sarthi-marker-wrap" id="marker-wrap-${r.id}">
          <div class="sarthi-marker-pulse"></div>
          <div class="sarthi-marker-icon" style="border-color:${seatColor};">
            🛺
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
  },

  // Telemetry Simulation Tick: Move rickshaws along waypoints
  tickSimulation() {
    const waypoints = this.routeWaypoints;
    
    this.rickshaws.forEach(r => {
      r.progress += r.speed * r.direction;
      
      if (r.progress >= 1.0) {
        r.progress = 0;
        r.currentWpIndex += r.direction;
        if (r.currentWpIndex >= waypoints.length - 1) {
          r.currentWpIndex = waypoints.length - 2;
          r.direction = -1; // reverse route
        }
      } else if (r.progress <= 0) {
        r.progress = 0.99;
        r.currentWpIndex += r.direction;
        if (r.currentWpIndex < 0) {
          r.currentWpIndex = 0;
          r.direction = 1; // forward route
        }
      }

      // Linear interpolation between waypoints
      const p1 = waypoints[r.currentWpIndex];
      const nextIdx = (r.direction === 1) ? r.currentWpIndex + 1 : r.currentWpIndex - 1;
      const p2 = waypoints[Math.max(0, Math.min(waypoints.length - 1, nextIdx))];

      if (p1 && p2) {
        r.lat = p1.lat + (p2.lat - p1.lat) * r.progress;
        r.lng = p1.lng + (p2.lng - p1.lng) * r.progress;

        // Update Passenger Map Marker
        if (r.marker) {
          r.marker.setLatLng([r.lat, r.lng]);
        }

        // Update Driver Map
        if (r.id === "R-104" && this.driverVehicleMarker) {
          this.driverVehicleMarker.setLatLng([r.lat, r.lng]);
        }

        // Update City Map
        if (r.cityMarker) {
          r.cityMarker.setLatLng([r.lat, r.lng]);
        }
      }
    });

    // Update ETA readouts & Distance to Passenger
    this.updateETAs();
  },

  updateETAs() {
    const userLat = this.userLocation.lat;
    const userLng = this.userLocation.lng;

    this.rickshaws.forEach(r => {
      // Calculate rough distance in km
      const dLat = (r.lat - userLat) * 111;
      const dLng = (r.lng - userLng) * 111 * Math.cos(userLat * Math.PI / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      
      // Speed avg 15 km/h -> mins = (distKm / 15) * 60
      const etaMins = Math.max(1, Math.round((distKm / 15) * 60));
      r.calculatedETA = etaMins;
      r.distanceMeters = Math.round(distKm * 1000);
    });

    // Notify Passenger Controller to refresh list
    if (window.SarthiPassenger) {
      window.SarthiPassenger.renderNearbyList();
    }
  },

  setDemandBeaconActive(isActive) {
    if (isActive) {
      if (!this.demandMarker && this.passengerMap) {
        const demandIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="sarthi-demand-beacon"></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        this.demandMarker = L.marker([this.userLocation.lat, this.userLocation.lng], { icon: demandIcon }).addTo(this.passengerMap);
      }
    } else {
      if (this.demandMarker && this.passengerMap) {
        this.passengerMap.removeLayer(this.demandMarker);
        this.demandMarker = null;
      }
    }
  }
};

window.SarthiMapEngine = SarthiMapEngine;
