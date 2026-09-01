/**
 * SARTHI Real-Time Cross-Dashboard Dispatch Bus
 * Enables instant live communication between Rider and Driver dashboards
 * Supports single-window and multi-tab synchronization via BroadcastChannel & LocalStorage events
 */

const SarthiDispatchBus = {
  channel: null,
  activeRequests: [],
  currentTrip: null,
  subscribers: [],

  // Preset Demo Accounts
  accounts: {
    rider: {
      id: "RIDER-8924",
      name: "Aarav Sharma",
      phone: "+91 98765 43210",
      pin: "1234",
      role: "rider",
      savedPickup: "Vishwavidyalaya Metro Gate 2",
      savedDrop: "Hansraj College Gate 1",
      walletBalance: 150.00
    },
    driver: {
      id: "DRV-104",
      name: "Ramesh Kumar",
      phone: "+91 91234 56789",
      pin: "1234",
      role: "driver",
      vehicleNo: "DL 1ER 4921",
      rating: 4.9,
      totalSeats: 6,
      seatsFree: 4,
      todayEarnings: 520.00,
      isOnline: true
    }
  },

  currentUser: null,

  init() {
    // Setup BroadcastChannel for multi-tab sync
    if ('BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('sarthi_dispatch_channel');
        this.channel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (e) {
        console.log('BroadcastChannel fallback enabled');
      }
    }

    // Fallback sync using storage event
    window.addEventListener('storage', (event) => {
      if (event.key === 'sarthi_active_dispatch_event') {
        try {
          const data = JSON.parse(event.newValue);
          if (data) this.handleIncomingMessage(data);
        } catch (err) {}
      }
    });

    // Load initial state from localStorage if available
    const savedReqs = localStorage.getItem('sarthi_active_requests');
    if (savedReqs) {
      try { this.activeRequests = JSON.parse(savedReqs); } catch (e) {}
    }

    const savedTrip = localStorage.getItem('sarthi_current_trip');
    if (savedTrip) {
      try { this.currentTrip = JSON.parse(savedTrip); } catch (e) {}
    }

    // Default auto-login user if none stored
    const savedUser = localStorage.getItem('sarthi_auth_user');
    if (savedUser) {
      try { this.currentUser = JSON.parse(savedUser); } catch (e) {}
    } else {
      this.currentUser = this.accounts.rider; // Default initial view
    }
  },

  login(role, phoneOrId, pin) {
    if (role === 'rider') {
      this.currentUser = { ...this.accounts.rider };
    } else {
      this.currentUser = { ...this.accounts.driver };
    }
    localStorage.setItem('sarthi_auth_user', JSON.stringify(this.currentUser));
    this.notify('AUTH_CHANGED', this.currentUser);
    return this.currentUser;
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('sarthi_auth_user');
    this.notify('AUTH_CHANGED', null);
  },

  // 1. Rider requests a ride
  requestRide(requestData) {
    const newRequest = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      riderId: this.currentUser ? this.currentUser.id : "RIDER-8924",
      riderName: this.currentUser ? this.currentUser.name : "Aarav Sharma",
      riderPhone: this.currentUser ? this.currentUser.phone : "+91 98765 43210",
      pickup: requestData.pickup || "Vishwavidyalaya Metro Gate 2",
      dropoff: requestData.dropoff || "Hansraj College Gate 1",
      seats: parseInt(requestData.seats) || 1,
      fare: requestData.fare || 11.00,
      status: 'PENDING', // PENDING -> ACCEPTED -> IN_TRANSIT -> COMPLETED
      timestamp: Date.now(),
      distanceMeters: requestData.distanceMeters || 650,
      etaMins: requestData.etaMins || 3
    };

    this.activeRequests.push(newRequest);
    localStorage.setItem('sarthi_active_requests', JSON.stringify(this.activeRequests));

    this.broadcastMessage({
      type: 'RIDE_REQUESTED',
      payload: newRequest
    });

    return newRequest;
  },

  // 2. Driver accepts a ride
  acceptRide(requestId, driverInfo) {
    const reqIndex = this.activeRequests.findIndex(r => r.id === requestId);
    let req = null;
    
    if (reqIndex !== -1) {
      req = this.activeRequests[reqIndex];
      req.status = 'ACCEPTED';
      req.acceptedBy = driverInfo || this.accounts.driver;
      req.acceptedAt = Date.now();
      this.currentTrip = req;
    } else {
      // Mock acceptance for demo request
      req = {
        id: requestId,
        status: 'ACCEPTED',
        acceptedBy: driverInfo || this.accounts.driver,
        acceptedAt: Date.now(),
        riderName: "Aarav Sharma",
        pickup: "Vishwavidyalaya Metro Gate 2",
        dropoff: "Hansraj College Gate 1",
        fare: 11.00,
        seats: 1
      };
      this.currentTrip = req;
    }

    localStorage.setItem('sarthi_current_trip', JSON.stringify(this.currentTrip));
    localStorage.setItem('sarthi_active_requests', JSON.stringify(this.activeRequests));

    this.broadcastMessage({
      type: 'RIDE_ACCEPTED',
      payload: req
    });

    return req;
  },

  // 3. Driver completes ride / collects fare
  completeTrip(tripId) {
    if (this.currentTrip) {
      this.currentTrip.status = 'COMPLETED';
      this.currentTrip.completedAt = Date.now();
    }
    
    // Remove from active requests
    this.activeRequests = this.activeRequests.filter(r => r.id !== tripId);
    localStorage.setItem('sarthi_active_requests', JSON.stringify(this.activeRequests));
    localStorage.removeItem('sarthi_current_trip');

    const completed = this.currentTrip;
    this.currentTrip = null;

    this.broadcastMessage({
      type: 'RIDE_COMPLETED',
      payload: completed
    });

    return completed;
  },

  // Cancel ride request
  cancelRide(requestId) {
    this.activeRequests = this.activeRequests.filter(r => r.id !== requestId);
    localStorage.setItem('sarthi_active_requests', JSON.stringify(this.activeRequests));

    if (this.currentTrip && this.currentTrip.id === requestId) {
      this.currentTrip = null;
      localStorage.removeItem('sarthi_current_trip');
    }

    this.broadcastMessage({
      type: 'RIDE_CANCELLED',
      payload: { id: requestId }
    });
  },

  // Broadcast out to other tabs and local listeners
  broadcastMessage(message) {
    // Local memory notify
    this.handleIncomingMessage(message);

    // BroadcastChannel
    if (this.channel) {
      try { this.channel.postMessage(message); } catch (e) {}
    }

    // LocalStorage trigger
    try {
      localStorage.setItem('sarthi_active_dispatch_event', JSON.stringify({
        ...message,
        _nonce: Date.now()
      }));
    } catch (e) {}
  },

  handleIncomingMessage(message) {
    if (!message || !message.type) return;

    if (message.type === 'RIDE_REQUESTED') {
      const exists = this.activeRequests.some(r => r.id === message.payload.id);
      if (!exists) this.activeRequests.push(message.payload);
    } else if (message.type === 'RIDE_ACCEPTED') {
      this.currentTrip = message.payload;
      const r = this.activeRequests.find(x => x.id === message.payload.id);
      if (r) r.status = 'ACCEPTED';
    } else if (message.type === 'RIDE_COMPLETED') {
      this.currentTrip = null;
      this.activeRequests = this.activeRequests.filter(x => x.id !== message.payload?.id);
    } else if (message.type === 'RIDE_CANCELLED') {
      this.activeRequests = this.activeRequests.filter(x => x.id !== message.payload?.id);
      if (this.currentTrip && this.currentTrip.id === message.payload?.id) {
        this.currentTrip = null;
      }
    }

    this.notify(message.type, message.payload);
  },

  subscribe(callback) {
    this.subscribers.push(callback);
  },

  notify(eventType, payload) {
    this.subscribers.forEach(cb => {
      try { cb(eventType, payload); } catch (err) { console.error(err); }
    });
  }
};

window.SarthiDispatchBus = SarthiDispatchBus;
SarthiDispatchBus.init();
