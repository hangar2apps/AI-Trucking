const elements = {
  runDemo: document.getElementById("runDemo"),
  resetView: document.getElementById("resetView"),
  zoomIn: document.getElementById("zoomIn"),
  zoomOut: document.getElementById("zoomOut"),
  pitchToggle: document.getElementById("pitchToggle"),
  weatherToggle: document.getElementById("weatherToggle"),
  wxFollow: document.getElementById("wxFollow"),
  trackAll: document.getElementById("trackAll"),
  streetZoom: document.getElementById("streetZoom"),
  trackerList: document.getElementById("trackerList"),
  threePanel: document.querySelector(".three-panel"),
  truck3d: document.getElementById("truck3d"),
  truckInspector: document.getElementById("truckInspector"),
  threeTitle: document.getElementById("threeTitle"),
  chaseToggle: document.getElementById("chaseToggle"),
  threeFullscreen: document.getElementById("threeFullscreen"),
  threeMode: document.getElementById("threeMode"),
  detailTruckId: document.getElementById("detailTruckId"),
  detailStatus: document.getElementById("detailStatus"),
  detailGrid: document.getElementById("detailGrid"),
  map: document.getElementById("liveMap"),
  phaseTitle: document.getElementById("phaseTitle"),
  phaseCopy: document.getElementById("phaseCopy"),
  agentState: document.getElementById("agentState"),
  riskPill: document.getElementById("riskPill"),
  toolLog: document.getElementById("toolLog"),
  emailPanel: document.getElementById("emailPanel"),
  mailStatus: document.getElementById("mailStatus"),
  mailTime: document.getElementById("mailTime"),
  mailSubject: document.getElementById("mailSubject"),
  mailBody: document.getElementById("mailBody"),
  efficiency: document.getElementById("efficiency"),
  savedSla: document.getElementById("savedSla"),
  loadsBody: document.getElementById("loadsBody"),
  timeline: document.getElementById("timeline"),
  timestamp: document.getElementById("timestamp"),
  weatherCard: document.getElementById("weatherCard"),
  weatherTitle: document.getElementById("weatherTitle"),
  weatherCopy: document.getElementById("weatherCopy"),
};

const colors = {
  blue: "#2f87ff",
  green: "#55dc7a",
  rose: "#ff718b",
  amber: "#f6b64a",
  silver: "#d9dee4",
};

const cities = {
  houston: [-95.3698, 29.7604],
  oklahomaCity: [-97.5164, 35.4676],
  tulsa: [-95.9928, 36.154],
  springfield: [-93.2923, 37.2089],
  saintLouis: [-90.1994, 38.627],
  chicago: [-87.6298, 41.8781],
};

const routeFeeder = [
  cities.houston,
  [-95.807, 30.28],
  [-96.334, 30.63],
  [-97.146, 31.55],
  [-96.802, 32.7767],
  [-97.33, 33.25],
  [-97.14, 34.17],
  cities.oklahomaCity,
];

const routeOriginal = [
  cities.oklahomaCity,
  [-97.08, 35.64],
  [-96.66, 35.83],
  cities.tulsa,
  [-95.36, 36.2],
  [-94.55, 37.07],
  cities.springfield,
  [-92.33, 37.83],
  [-91.77, 38.13],
  cities.saintLouis,
  [-89.84, 39.12],
  [-88.64, 40.12],
  cities.chicago,
];

const routeRescue = [
  cities.oklahomaCity,
  [-97.08, 35.64],
  [-96.66, 35.83],
  cities.tulsa,
  [-95.36, 36.2],
  [-94.55, 37.07],
  cities.springfield,
  [-92.33, 37.83],
  [-91.77, 38.13],
  cities.saintLouis,
];

const routeFinalLeg = [
  cities.saintLouis,
  [-89.84, 39.12],
  [-89.3985, 40.6331],
  [-88.2434, 40.1164],
  [-87.94, 41.25],
  cities.chicago,
];

const routeCatalog = {
  feeder: routeFeeder,
  original: routeOriginal,
  rescue: routeRescue,
  finalLeg: routeFinalLeg,
};

const roadRoutes = {
  feeder: routeFeeder.slice(),
  original: routeOriginal.slice(),
  rescue: routeRescue.slice(),
  finalLeg: routeFinalLeg.slice(),
};

const trucks = {
  "L-9402": {
    id: "L-9402",
    name: "Auto Parts",
    routeKey: "rescue",
    tone: "blue",
    origin: "Oklahoma City",
    destination: "Chicago",
    driver: "Marcus Vance",
    tractor: "TR-218",
    trailer: "53 ft dry van",
    eta: "2:52 PM CT",
    hosBase: 3.1,
    fuel: 68,
    temp: "67 F",
    nextStop: "Springfield handoff",
    loadValue: "$184K",
  },
  "L-9448": {
    id: "L-9448",
    name: "Rescue Trailer",
    routeKey: "finalLeg",
    tone: "silver",
    origin: "St. Louis",
    destination: "Chicago",
    driver: "Priya Shah",
    tractor: "TR-407",
    trailer: "53 ft dry van",
    eta: "2:52 PM CT",
    hosBase: 4.2,
    fuel: 74,
    temp: "66 F",
    nextStop: "Chicago consignee",
    loadValue: "$184K",
  },
  "L-9403": {
    id: "L-9403",
    name: "Electronics",
    routeKey: "feeder",
    tone: "silver",
    origin: "Houston Port",
    destination: "Oklahoma City",
    driver: "Unassigned",
    tractor: "TR-099",
    trailer: "53 ft dry van",
    eta: "4:10 PM CT",
    hosBase: 0,
    fuel: 51,
    temp: "69 F",
    nextStop: "Awaiting dispatch",
    loadValue: "$91K",
  },
  "L-9399": {
    id: "L-9399",
    name: "Aerospace",
    routeKey: "finalLeg",
    tone: "green",
    origin: "St. Louis",
    destination: "Chicago",
    driver: "Samuel Jennings",
    tractor: "TR-512",
    trailer: "53 ft dry van",
    eta: "Delivered",
    hosBase: 5.6,
    fuel: 43,
    temp: "65 F",
    nextStop: "Complete",
    loadValue: "$311K",
  },
};

const truckOrder = ["L-9402", "L-9448", "L-9403", "L-9399"];

const phasePlan = [
  {
    key: "monitor",
    at: 0,
    title: "Watching every load",
    copy: "The operations brain is reading routes, ETAs, customer commitments, driver hours, and fleet availability.",
    state: "Live",
    risk: "No risk",
    weatherTitle: "Route clear",
    weatherCopy: "Monitoring I-44 and I-55 corridors",
    mailStatus: "Queued",
    mailSubject: "Status update pending",
    mailBody: "The agent will notify the customer before the delivery risk becomes visible on their side.",
    tools: [
      ["get_loads", "4 active", "complete"],
      ["compute_eta", "On time", "complete"],
      ["check_weather_route", "Ready", ""],
    ],
    loads: "normal",
    saved: "0",
    efficiency: "92%",
  },
  {
    key: "weather",
    at: 7,
    title: "Weather event detected",
    copy: "The route engine flags a severe cell crossing I-44 near Springfield. Truck A's projected ETA starts drifting outside the customer window.",
    state: "Investigating",
    risk: "Delay risk",
    weatherTitle: "I-44 storm band",
    weatherCopy: "ETA impact: +47 min near Springfield",
    mailStatus: "Queued",
    mailSubject: "Status update pending",
    mailBody: "The agent will notify the customer before the delivery risk becomes visible on their side.",
    tools: [
      ["check_weather_route", "Severe", "warning"],
      ["compute_eta", "15:45 late", "warning"],
      ["get_driver_hours", "3.1h left", "complete"],
    ],
    loads: "risk",
    saved: "0",
    efficiency: "86%",
  },
  {
    key: "email",
    at: 15,
    title: "Customer notified first",
    copy: "Claude drafts and sends the update through Resend with the new ETA and recovery plan before the customer asks for status.",
    state: "Email sent",
    risk: "Customer covered",
    weatherTitle: "Customer notice sent",
    weatherCopy: "Northstar Auto received proactive ETA",
    mailStatus: "Sent",
    mailSubject: "Updated ETA for load L-9402",
    mailBody: "We detected weather on the Oklahoma City to Chicago lane and are already executing a handoff plan. Current recovered ETA is 2:52 PM CT.",
    tools: [
      ["send_customer_email", "Delivered", "complete"],
      ["compute_eta", "2:52 PM", "complete"],
      ["get_trucks", "18 nearby", "complete"],
    ],
    loads: "covered",
    saved: "0",
    efficiency: "88%",
  },
  {
    key: "handoff",
    at: 24,
    title: "Truck B selected",
    copy: "The agent finds L-9448 near St. Louis with hours-of-service capacity, assigns the final leg, and schedules the load handoff.",
    state: "Reassigning",
    risk: "Handoff ready",
    weatherTitle: "Fleet option found",
    weatherCopy: "L-9448 has 4.2h capacity for final leg",
    mailStatus: "Sent",
    mailSubject: "Updated ETA for load L-9402",
    mailBody: "We detected weather on the Oklahoma City to Chicago lane and are already executing a handoff plan. Current recovered ETA is 2:52 PM CT.",
    tools: [
      ["get_driver_hours", "4.2h open", "complete"],
      ["reassign_load", "L-9448", "complete"],
      ["compute_eta", "SLA saved", "complete"],
    ],
    loads: "handoff",
    saved: "1",
    efficiency: "91%",
  },
  {
    key: "reroute",
    at: 34,
    title: "Delivery saved autonomously",
    copy: "The map reroutes the final leg, Truck B takes the load, and the delivery window is preserved without a dispatcher touching the board.",
    state: "Resolved",
    risk: "SLA saved",
    weatherTitle: "Route recovered",
    weatherCopy: "Chicago ETA: 2:52 PM CT",
    mailStatus: "Sent",
    mailSubject: "Updated ETA for load L-9402",
    mailBody: "We detected weather on the Oklahoma City to Chicago lane and are already executing a handoff plan. Current recovered ETA is 2:52 PM CT.",
    tools: [
      ["reassign_load", "Executed", "complete"],
      ["send_customer_email", "Delivered", "complete"],
      ["compute_eta", "On time", "complete"],
    ],
    loads: "saved",
    saved: "1",
    efficiency: "94%",
  },
];

const loadStates = {
  normal: [
    ["L-9402", "Auto Parts", "Chicago, IL", "In transit", "Marcus Vance", "2:58 PM", "blue"],
    ["L-9448", "Rescue trailer", "St. Louis, MO", "Available", "Priya Shah", "Standby", "pending"],
    ["L-9403", "Electronics", "Houston Port, TX", "Pending", "Unassigned", "4:10 PM", "pending"],
    ["L-9399", "Aerospace", "Chicago, IL", "Delivered", "Samuel Jennings", "10:40 AM", "delivered"],
  ],
  risk: [
    ["L-9402", "Auto Parts", "Chicago, IL", "Delay risk", "Marcus Vance", "3:45 PM", "delay"],
    ["L-9448", "Rescue trailer", "St. Louis, MO", "Available", "Priya Shah", "Standby", "pending"],
    ["L-9403", "Electronics", "Houston Port, TX", "Pending", "Unassigned", "4:10 PM", "pending"],
    ["L-9399", "Aerospace", "Chicago, IL", "Delivered", "Samuel Jennings", "10:40 AM", "delivered"],
  ],
  covered: [
    ["L-9402", "Auto Parts", "Chicago, IL", "Customer covered", "Marcus Vance", "3:45 PM", "delay"],
    ["L-9448", "Rescue trailer", "St. Louis, MO", "Available", "Priya Shah", "Standby", "pending"],
    ["L-9403", "Electronics", "Houston Port, TX", "Pending", "Unassigned", "4:10 PM", "pending"],
    ["L-9399", "Aerospace", "Chicago, IL", "Delivered", "Samuel Jennings", "10:40 AM", "delivered"],
  ],
  handoff: [
    ["L-9402", "Auto Parts", "Springfield, MO", "Transfer", "Marcus Vance", "1:18 PM", "saved"],
    ["L-9448", "Auto Parts", "Chicago, IL", "Final leg", "Priya Shah", "2:52 PM", "blue"],
    ["L-9403", "Electronics", "Houston Port, TX", "Pending", "Unassigned", "4:10 PM", "pending"],
    ["L-9399", "Aerospace", "Chicago, IL", "Delivered", "Samuel Jennings", "10:40 AM", "delivered"],
  ],
  saved: [
    ["L-9402", "Auto Parts", "Springfield, MO", "Handed off", "Marcus Vance", "Complete", "delivered"],
    ["L-9448", "Auto Parts", "Chicago, IL", "SLA saved", "Priya Shah", "2:52 PM", "saved"],
    ["L-9403", "Electronics", "Houston Port, TX", "Pending", "Unassigned", "4:10 PM", "pending"],
    ["L-9399", "Aerospace", "Chicago, IL", "Delivered", "Samuel Jennings", "10:40 AM", "delivered"],
  ],
};

const state = {
  demoStart: 0,
  demoRunning: false,
  currentPhaseIndex: -1,
  idleStart: performance.now(),
  mapReady: false,
  satelliteMode: true,
  selectedTruckId: "L-9402",
  visibleTrucks: new Set(truckOrder),
  followTruck: false,
  lastFollowAt: 0,
  roadRoutesReady: false,
  routeSource: "fallback",
  phase: "monitor",
};

const mapObjects = {
  map: null,
  satellite: null,
  labels: null,
  streets: null,
  feederShadow: null,
  feeder: null,
  originalShadow: null,
  original: null,
  rescueShadow: null,
  rescue: null,
  finalShadow: null,
  final: null,
  weatherCircle: null,
  truckA: null,
  truckB: null,
  pending: null,
  delivered: null,
  incident: null,
  handoff: null,
  trackLines: {},
  truckMarkers: {},
};

const threeState = {
  THREE: null,
  scene: null,
  camera: null,
  renderer: null,
  truckGroup: null,
  environmentGroup: null,
  roadGroup: null,
  progressRouteGroup: null,
  fleetGroup: null,
  raycaster: null,
  pointer: null,
  clickable: [],
  routeSignature: "",
  routeProjection: null,
  routeCurve: null,
  routeSamples: [],
  routeDistance: 0,
  progressSegments: [],
  progressMaterial: null,
  progressMaterials: [],
  progressSpecs: [],
  progressMeshes: [],
  progressCumulative: null,
  progressCursor: 0,
  lastRouteTruckId: null,
  fleetMeshes: {},
  smoothPosition: null,
  smoothDirection: null,
  chaseMode: true,
  fullscreen: false,
  cameraSnapped: false,
  ready: false,
  detailsOpen: true,
  lastDetailUpdate: -1,
};

function initMap() {
  if (!window.L) {
    elements.map.innerHTML = '<div class="map-fallback">Map tiles are unavailable. Check the network connection, then refresh the demo.</div>';
    return;
  }

  mapObjects.map = L.map("liveMap", {
    zoomControl: false,
    attributionControl: true,
    preferCanvas: true,
    scrollWheelZoom: true,
  }).setView([37.2, -93.8], 5);

  mapObjects.satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
  ).addTo(mapObjects.map);

  mapObjects.labels = L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Labels &copy; Esri",
    },
  ).addTo(mapObjects.map);

  mapObjects.streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  });

  addMapLayers();
  createMapMarkers();
  state.mapReady = true;
  window.demoMapState = state;
  window.demoLeafletMap = mapObjects.map;
  setTimeout(() => mapObjects.map.invalidateSize(), 120);
  focusCamera(0, true);
  renderTrackerPanel();
  loadRoadRoutes();
  setupWeatherRouting();
}

async function initThreeView() {
  if (!elements.truck3d) return;

  try {
    const THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
    threeState.THREE = THREE;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x05070a, 34, 120);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 140);
    camera.position.set(0, 24, 42);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    elements.truck3d.appendChild(renderer.domElement);

    threeState.scene = scene;
    threeState.camera = camera;
    threeState.renderer = renderer;
    threeState.raycaster = new THREE.Raycaster();
    threeState.pointer = new THREE.Vector2();
    threeState.environmentGroup = new THREE.Group();
    threeState.roadGroup = new THREE.Group();
    threeState.progressRouteGroup = new THREE.Group();
    threeState.fleetGroup = new THREE.Group();
    threeState.environmentGroup.name = "geoContext";
    threeState.roadGroup.name = "geoRoute";
    threeState.progressRouteGroup.name = "progressRoute";
    threeState.fleetGroup.name = "fleetTraffic";
    scene.add(threeState.environmentGroup);
    scene.add(threeState.roadGroup);
    scene.add(threeState.progressRouteGroup);
    scene.add(threeState.fleetGroup);

    buildThreeScene();
    resizeThreeView();

    elements.truck3d.addEventListener("pointermove", handleThreePointerMove);
    elements.truck3d.addEventListener("click", handleThreeClick);
    threeState.ready = true;
    updateThreeControls();
    updateTruckDetails(0);
  } catch (error) {
    elements.truck3d.innerHTML = '<div class="map-fallback">3D view unavailable. Check the network connection, then refresh the demo.</div>';
  }
}

function buildThreeScene() {
  const THREE = threeState.THREE;
  const scene = threeState.scene;

  scene.add(new THREE.AmbientLight(0xcdd7e4, 1.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(7, 12, 9);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38d3dc, 1.1);
  fillLight.position.set(-9, 5, -4);
  scene.add(fillLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(118, 86),
    new THREE.MeshStandardMaterial({ color: 0x14201d, roughness: 0.96, metalness: 0.02 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.11;
  threeState.scene.add(ground);

  const grid = new THREE.GridHelper(118, 44, 0x24454a, 0x162b2f);
  grid.position.y = 0.01;
  scene.add(grid);

  const weather = new THREE.Mesh(
    new THREE.CylinderGeometry(3.8, 3.8, 0.04, 56),
    new THREE.MeshStandardMaterial({
      color: 0xff718b,
      transparent: true,
      opacity: 0.18,
      roughness: 0.4,
      depthWrite: false,
    }),
  );
  weather.name = "weatherDisc";
  weather.position.set(2.5, 0.14, 0.05);
  weather.visible = false;
  scene.add(weather);

  threeState.truckGroup = buildTruckMesh();
  scene.add(threeState.truckGroup);
  buildFleetMeshes();
}

function buildTruckMesh() {
  const THREE = threeState.THREE;
  const group = new THREE.Group();
  group.name = "clickableTruck";

  const trailerMaterial = new THREE.MeshStandardMaterial({ color: 0xdbe7ef, roughness: 0.36, metalness: 0.2 });
  const trailerEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x8ea0aa, roughness: 0.45, metalness: 0.18 });
  const cabMaterial = new THREE.MeshStandardMaterial({ color: 0x2f87ff, roughness: 0.32, metalness: 0.16 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x182d3a, roughness: 0.18, metalness: 0.05 });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x07090b, roughness: 0.68 });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xbac5ce, roughness: 0.3, metalness: 0.4 });
  const darkMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x11171c, roughness: 0.55, metalness: 0.24 });
  const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xfff2c7, emissive: 0x33240a, roughness: 0.25 });

  const box = (size, position, material, userData = {}) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.userData = { ...mesh.userData, ...userData };
    group.add(mesh);
    return mesh;
  };

  // 53-foot trailer proportions with rails, rear doors, and landing gear.
  box([7.9, 1.78, 1.86], [-2.25, 1.22, 0], trailerMaterial);
  box([8.05, 0.06, 1.98], [-2.25, 2.14, 0], trailerEdgeMaterial);
  box([8.05, 0.08, 0.06], [-2.25, 0.31, 0.99], trailerEdgeMaterial);
  box([8.05, 0.08, 0.06], [-2.25, 0.31, -0.99], trailerEdgeMaterial);
  box([0.08, 1.66, 1.82], [-6.3, 1.22, 0], trailerEdgeMaterial);
  box([0.04, 1.52, 0.04], [-6.25, 1.2, 0], darkMetalMaterial);
  [-5.3, -4.2, -3.1, -2.0, -0.9, 0.2, 1.0].forEach((x) => {
    box([0.035, 1.54, 0.045], [x, 1.22, 0.97], trailerEdgeMaterial);
    box([0.035, 1.54, 0.045], [x, 1.22, -0.97], trailerEdgeMaterial);
  });
  box([7.6, 0.12, 0.12], [-2.3, 0.42, 0.78], darkMetalMaterial);
  box([7.6, 0.12, 0.12], [-2.3, 0.42, -0.78], darkMetalMaterial);
  box([0.08, 0.9, 0.08], [-0.05, 0.48, 0.62], darkMetalMaterial);
  box([0.08, 0.9, 0.08], [-0.05, 0.48, -0.62], darkMetalMaterial);

  // Tractor: hood, sleeper cab, grille, bumper, stacks, mirrors, and fifth wheel.
  box([1.18, 1.45, 1.82], [2.25, 1.18, 0], cabMaterial, { paint: "cab" });
  box([1.34, 1.42, 1.82], [1.28, 1.14, 0], cabMaterial, { paint: "cab" });
  box([1.52, 0.82, 1.64], [3.38, 0.78, 0], cabMaterial, { paint: "cab" });
  box([0.12, 0.82, 1.24], [4.2, 0.82, 0], darkMetalMaterial);
  [-0.36, 0, 0.36].forEach((z) => box([0.04, 0.72, 0.035], [4.27, 0.84, z], trailerEdgeMaterial));
  box([0.24, 0.2, 1.9], [4.38, 0.34, 0], darkMetalMaterial);
  box([0.08, 0.54, 1.18], [3.08, 1.43, 0], glassMaterial);
  box([0.42, 0.38, 0.08], [2.34, 1.37, 0.96], glassMaterial);
  box([0.42, 0.38, 0.08], [2.34, 1.37, -0.96], glassMaterial);
  box([1.12, 0.34, 1.58], [2.02, 2.02, 0], cabMaterial, { paint: "cab" });
  box([0.54, 0.09, 0.08], [3.08, 1.31, 1.12], darkMetalMaterial);
  box([0.54, 0.09, 0.08], [3.08, 1.31, -1.12], darkMetalMaterial);
  box([0.18, 0.12, 0.14], [4.52, 0.66, 0.48], lightMaterial);
  box([0.18, 0.12, 0.14], [4.52, 0.66, -0.48], lightMaterial);
  box([0.95, 0.12, 1.3], [0.52, 0.62, 0], darkMetalMaterial);
  box([2.4, 0.12, 0.16], [2.46, 0.46, 0.82], darkMetalMaterial);
  box([2.4, 0.12, 0.16], [2.46, 0.46, -0.82], darkMetalMaterial);

  [-0.04, 0.04].forEach((zSign) => {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.18, 18), darkMetalMaterial);
    stack.position.set(1.7, 1.62, zSign > 0 ? 1.05 : -1.05);
    group.add(stack);
  });

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0x38d3dc, emissive: 0x1c7a82, roughness: 0.25 }),
  );
  beacon.position.set(2.25, 2.28, 0);
  group.add(beacon);

  const tireGeometry = new THREE.CylinderGeometry(0.31, 0.31, 0.18, 32);
  tireGeometry.rotateX(Math.PI / 2);
  const rimGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.2, 24);
  rimGeometry.rotateX(Math.PI / 2);
  const addWheel = (x, z, radius = 0.31) => {
    const tire = new THREE.Mesh(tireGeometry, tireMaterial);
    tire.scale.set(radius / 0.31, radius / 0.31, 1);
    tire.position.set(x, radius, z);
    tire.userData.wheel = true;
    tire.userData.wheelOffset = 0;
    group.add(tire);

    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.scale.set(radius / 0.31, radius / 0.31, 1);
    rim.position.copy(tire.position);
    rim.userData.wheel = true;
    rim.userData.wheelOffset = 0;
    group.add(rim);

    const spokeA = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.05, 0.045, 0.035), rimMaterial);
    spokeA.position.copy(tire.position);
    spokeA.userData.wheel = true;
    spokeA.userData.wheelOffset = 0;
    group.add(spokeA);

    const spokeB = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.05, 0.045, 0.035), rimMaterial);
    spokeB.position.copy(tire.position);
    spokeB.userData.wheel = true;
    spokeB.userData.wheelOffset = Math.PI / 2;
    group.add(spokeB);
  };
  const addDuals = (x) => {
    [-1.15, -0.94, 0.94, 1.15].forEach((z) => addWheel(x, z));
  };

  // 18-wheeler axle layout: 2 steer wheels, 8 tractor drive wheels, 8 trailer wheels.
  [-1.04, 1.04].forEach((z) => addWheel(4.02, z, 0.3));
  [1.68, 2.35].forEach(addDuals);
  [-4.95, -5.62].forEach(addDuals);

  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(11.2, 2.7, 2.7),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }),
  );
  hitbox.position.set(-0.78, 1.15, 0);
  hitbox.name = "truckHitbox";
  group.add(hitbox);
  threeState.clickable = [hitbox, ...group.children];

  group.rotation.y = -0.18;
  group.scale.setScalar(0.72);
  return group;
}

function buildFleetMeshes() {
  const THREE = threeState.THREE;

  truckOrder.forEach((id) => {
    const group = new THREE.Group();
    group.name = `fleet-${id}`;

    const trailerMaterial = new THREE.MeshStandardMaterial({ color: 0xd9dee4, roughness: 0.44, metalness: 0.12 });
    const cabMaterial = new THREE.MeshStandardMaterial({ color: colorForTone(trucks[id].tone), roughness: 0.34, metalness: 0.12 });
    const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x07090b, roughness: 0.68 });

    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.56), trailerMaterial);
    trailer.position.set(-0.55, 0.34, 0);
    group.add(trailer);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.48, 0.58), cabMaterial);
    cab.position.set(0.95, 0.36, 0);
    cab.userData.paint = "cab";
    group.add(cab);

    [-1.2, -0.3, 0.78].forEach((x) => {
      [-0.36, 0.36].forEach((z) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 18), tireMaterial);
        wheel.geometry.rotateX(Math.PI / 2);
        wheel.position.set(x, 0.13, z);
        group.add(wheel);
      });
    });

    group.scale.setScalar(0.72);
    threeState.fleetMeshes[id] = group;
    threeState.fleetGroup.add(group);
  });
}

function rebuildThreeRoute(truck) {
  if (!truck.route || truck.route.length < 2) return;

  const first = truck.route[0];
  const last = truck.route[truck.route.length - 1];
  const signature = `${truck.id}:${truck.routeKey}:${state.routeSource}:${truck.route.length}:${first[0].toFixed(3)},${first[1].toFixed(3)}:${last[0].toFixed(3)},${last[1].toFixed(3)}`;
  if (signature === threeState.routeSignature) return;

  clearGroup(threeState.roadGroup);
  clearGroup(threeState.progressRouteGroup, true);
  clearGroup(threeState.environmentGroup);
  threeState.progressSegments = [];
  threeState.progressMaterials = [];
  threeState.progressSpecs = [];
  threeState.progressMeshes = [];
  threeState.progressCumulative = null;
  threeState.progressCursor = 0;
  threeState.routeSignature = signature;

  // Only hard-cut the camera/truck when switching to a *different* vehicle. When the same
  // truck's route is rebuilt (e.g. the async road-snapped data arriving ~1s after load, or
  // a demo reroute), keep the smoothed pose so the camera and truck glide onto the new road
  // instead of snapping/popping — that pop is what read as the road "breaking".
  if (threeState.lastRouteTruckId !== truck.id) {
    threeState.cameraSnapped = false;
    threeState.smoothPosition = null;
    threeState.smoothDirection = null;
  }
  threeState.lastRouteTruckId = truck.id;

  threeState.routeProjection = createRouteProjection(simplifyRoute(truck.route, 170));
  const projectedPoints = threeState.routeProjection.points;

  const THREE = threeState.THREE;
  // The raw road-snapped polyline (decimated from thousands of GPS points) zig-zags and can
  // contain near-duplicate points that make the spline spike. Clean + smooth the control
  // points first so the rendered road is actually straight instead of wobbly.
  const curvePoints = smoothRoutePoints(projectedPoints, 3, 0.16);
  threeState.routeCurve = new THREE.CatmullRomCurve3(curvePoints, false, "centripetal");
  threeState.routeCurve.arcLengthDivisions = 1200;
  threeState.routeSamples = threeState.routeCurve.getSpacedPoints(Math.max(180, Math.min(420, curvePoints.length * 2)));
  const points = threeState.routeSamples;

  rebuildThreeEnvironment(truck, points);

  const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0x070b0f, roughness: 0.78, metalness: 0.03 });
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x20282c, roughness: 0.68, metalness: 0.04 });
  const laneMaterial = new THREE.MeshStandardMaterial({ color: 0xdfe6ec, emissive: 0x252b30, roughness: 0.42 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f0d7, emissive: 0x1d1909, roughness: 0.4 });
  const gpsGlowMaterial = new THREE.MeshStandardMaterial({
    color: colorForTone(truck.tone),
    emissive: colorForTone(truck.tone),
    emissiveIntensity: 0.62,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    roughness: 0.28,
  });
  threeState.progressMaterial = new THREE.MeshStandardMaterial({
    color: colorForTone(truck.tone),
    emissive: colorForTone(truck.tone),
    emissiveIntensity: 0.76,
    roughness: 0.32,
  });
  threeState.progressMaterials = [gpsGlowMaterial, threeState.progressMaterial];

  buildRouteRibbon(points, threeState.roadGroup, {
    width: 5.25,
    height: 0.045,
    y: 0.035,
    material: shoulderMaterial,
  });
  buildRouteRibbon(points, threeState.roadGroup, {
    width: 3.75,
    height: 0.055,
    y: 0.075,
    material: roadMaterial,
  });
  buildRouteRibbon(offsetRoutePoints(points, -1.55), threeState.roadGroup, {
    width: 0.075,
    height: 0.036,
    y: 0.13,
    material: edgeMaterial,
  });
  buildRouteRibbon(offsetRoutePoints(points, 1.55), threeState.roadGroup, {
    width: 0.075,
    height: 0.036,
    y: 0.13,
    material: edgeMaterial,
  });
  buildLaneDashes(points, laneMaterial);
  buildRouteChevrons(points);
  threeState.progressSpecs = [
    { width: 1.45, height: 0.055, y: 0.155, material: gpsGlowMaterial },
    { width: 0.62, height: 0.075, y: 0.19, material: threeState.progressMaterial },
  ];
  // Build the progress ribbon geometry once; it is revealed per-frame via setDrawRange
  // (no per-frame geometry allocation, which is what caused the choppy/laggy road).
  threeState.progressMeshes = [];
  threeState.progressCumulative = computeCumulativeDistances(points);
  threeState.progressCursor = 0;
  threeState.progressSpecs.forEach((spec) => {
    const mesh = buildContinuousRibbonMesh(points, spec);
    if (!mesh) return;
    mesh.geometry.setDrawRange(0, 0);
    threeState.progressRouteGroup.add(mesh);
    threeState.progressMeshes.push(mesh);
  });
  threeState.routeDistance = routePointDistance(points);
  buildRouteBeacons(truck.route);

  const weather = threeState.scene.getObjectByName("weatherDisc");
  if (weather) {
    const weatherPosition = projectGeoPoint(cities.springfield, 0.16);
    weather.position.set(weatherPosition.x, weatherPosition.y, weatherPosition.z);
  }
}

function createRouteProjection(route) {
  const centerLng = route.reduce((sum, point) => sum + point[0], 0) / route.length;
  const centerLat = route.reduce((sum, point) => sum + point[1], 0) / route.length;
  const lngMeters = 111320 * Math.cos(toRad(centerLat));
  const latMeters = 111320;

  const meterPoints = route.map(([lng, lat]) => ({
    x: (lng - centerLng) * lngMeters,
    z: -(lat - centerLat) * latMeters,
  }));
  const xs = meterPoints.map((point) => point.x);
  const zs = meterPoints.map((point) => point.z);
  const width = Math.max(...xs) - Math.min(...xs);
  const depth = Math.max(...zs) - Math.min(...zs);
  const scale = 58 / Math.max(width, depth, 1);

  const project = ([lng, lat], y = 0.1) =>
    new threeState.THREE.Vector3((lng - centerLng) * lngMeters * scale, y, -(lat - centerLat) * latMeters * scale);

  return {
    centerLng,
    centerLat,
    scale,
    points: route.map((point) => project(point, 0.1)),
    project,
  };
}

function rebuildThreeEnvironment(truck, points) {
  const THREE = threeState.THREE;
  const texture = createAerialTexture(truck);
  const mapPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(118, 86),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: texture, roughness: 0.98, metalness: 0.02 }),
  );
  mapPlane.rotation.x = -Math.PI / 2;
  mapPlane.position.y = -0.095;
  threeState.environmentGroup.add(mapPlane);

  buildOpenHighwayParcels(points);
  buildCityContext();
}

function createAerialTexture(truck) {
  const THREE = threeState.THREE;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  const base = truck.routeKey === "feeder" ? "#26352a" : truck.routeKey === "finalLeg" ? "#22312f" : "#1d3028";
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const fieldPalette = ["#263f31", "#37452d", "#4a4730", "#2d4638", "#1f3b35", "#3d3929"];
  for (let i = 0; i < 95; i += 1) {
    const x = seededUnit(i + 11) * canvas.width;
    const y = seededUnit(i + 37) * canvas.height;
    const width = 60 + seededUnit(i + 83) * 180;
    const height = 38 + seededUnit(i + 131) * 130;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((seededUnit(i + 211) - 0.5) * 0.22);
    ctx.fillStyle = fieldPalette[i % fieldPalette.length];
    ctx.globalAlpha = 0.34 + seededUnit(i + 17) * 0.28;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.strokeStyle = "rgba(225, 220, 178, 0.08)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    ctx.restore();
  }

  ctx.globalAlpha = 0.38;
  ctx.strokeStyle = "#49545a";
  ctx.lineWidth = 7;
  for (let i = 0; i < 16; i += 1) {
    ctx.beginPath();
    const y = seededUnit(i + 401) * canvas.height;
    ctx.moveTo(-80, y);
    ctx.bezierCurveTo(
      260 + seededUnit(i + 402) * 120,
      y + (seededUnit(i + 403) - 0.5) * 170,
      610 + seededUnit(i + 404) * 130,
      y + (seededUnit(i + 405) - 0.5) * 190,
      canvas.width + 80,
      y + (seededUnit(i + 406) - 0.5) * 90,
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#183c48";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(0, 580);
  ctx.bezierCurveTo(260, 510, 470, 650, 760, 560);
  ctx.bezierCurveTo(880, 520, 950, 530, 1024, 500);
  ctx.stroke();

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const noise = Math.floor((seededUnit(i * 0.01 + 7) - 0.5) * 18);
    image.data[i] = Math.max(0, Math.min(255, image.data[i] + noise));
    image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + noise));
    image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + noise));
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function buildOpenHighwayParcels(points) {
  const THREE = threeState.THREE;
  const materials = [0x263f31, 0x3c432d, 0x2c4238, 0x4a4430, 0x1f3532].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.96, metalness: 0.01 }),
  );

  for (let i = 10; i < points.length - 10; i += 18) {
    const direction = points[i + 1].clone().sub(points[i - 1]).setY(0).normalize();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);

    [-1, 1].forEach((side, sideIndex) => {
      const seed = i * 7 + sideIndex * 41;
      const distance = 7.8 + seededUnit(seed) * 14;
      const width = 5.4 + seededUnit(seed + 1) * 7.5;
      const depth = 3.8 + seededUnit(seed + 2) * 6.4;
      const position = points[i].clone().add(perpendicular.clone().multiplyScalar(side * distance));
      if (Math.abs(position.x) > 56 || Math.abs(position.z) > 40) return;

      const parcel = new THREE.Mesh(new THREE.BoxGeometry(width, 0.035, depth), materials[(i + sideIndex) % materials.length]);
      parcel.position.set(position.x, -0.035, position.z);
      parcel.rotation.y = Math.atan2(-direction.z, direction.x) + (seededUnit(seed + 3) - 0.5) * 0.44;
      threeState.environmentGroup.add(parcel);
    });
  }
}

function buildCityContext() {
  const cityProfiles = [
    { name: "Houston", coords: cities.houston, count: 22, spread: 8.4, height: 3.6, color: 0x6f7f82 },
    { name: "Oklahoma City", coords: cities.oklahomaCity, count: 18, spread: 7.2, height: 2.7, color: 0x78836f },
    { name: "Tulsa", coords: cities.tulsa, count: 14, spread: 5.2, height: 2.1, color: 0x6c7a72 },
    { name: "Springfield", coords: cities.springfield, count: 16, spread: 5.5, height: 2.2, color: 0x747b79 },
    { name: "St. Louis", coords: cities.saintLouis, count: 30, spread: 8.8, height: 4.2, color: 0x7f8589 },
    { name: "Chicago", coords: cities.chicago, count: 42, spread: 10.4, height: 6.2, color: 0x858d96 },
  ];

  cityProfiles.forEach((profile, profileIndex) => {
    const center = projectGeoPoint(profile.coords, 0);
    if (Math.abs(center.x) > 58 || Math.abs(center.z) > 42) return;
    if (distanceToRouteSamples(center) > 18) return;

    addCityRoadGrid(center, profile.spread, profileIndex);
    addBuildingCluster(center, profile, profileIndex);
  });
}

function addCityRoadGrid(center, spread, seedBase) {
  const THREE = threeState.THREE;
  const material = new THREE.MeshStandardMaterial({ color: 0x343c40, roughness: 0.78, metalness: 0.02 });

  for (let i = -2; i <= 2; i += 1) {
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(spread * 2.25, 0.04, 0.26), material);
    horizontal.position.set(center.x, -0.01, center.z + i * (spread / 2.6));
    horizontal.rotation.y = (seededUnit(seedBase + 20) - 0.5) * 0.3;
    threeState.environmentGroup.add(horizontal);

    const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, spread * 2.25), material);
    vertical.position.set(center.x + i * (spread / 2.7), -0.009, center.z);
    vertical.rotation.y = (seededUnit(seedBase + 30) - 0.5) * 0.3;
    threeState.environmentGroup.add(vertical);
  }
}

function addBuildingCluster(center, profile, seedBase) {
  const THREE = threeState.THREE;
  const baseColor = new THREE.Color(profile.color);

  for (let i = 0; i < profile.count; i += 1) {
    const angle = seededUnit(seedBase * 100 + i) * Math.PI * 2;
    const radius = 1.2 + seededUnit(seedBase * 100 + i + 19) * profile.spread;
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius * 0.72;
    if (Math.abs(x) > 57 || Math.abs(z) > 41) continue;
    if (distanceToRouteSamples(new THREE.Vector3(x, 0, z)) < 2.9) continue;

    const width = 0.5 + seededUnit(seedBase * 100 + i + 41) * 1.25;
    const depth = 0.5 + seededUnit(seedBase * 100 + i + 43) * 1.35;
    const height = 0.42 + seededUnit(seedBase * 100 + i + 47) * profile.height;
    const color = baseColor.clone().offsetHSL(0, -0.04, (seededUnit(seedBase * 100 + i + 53) - 0.5) * 0.18);
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.08 }),
    );
    building.position.set(x, height / 2, z);
    building.rotation.y = seededUnit(seedBase * 100 + i + 61) * Math.PI;
    threeState.environmentGroup.add(building);
  }
}

function distanceToRouteSamples(position) {
  if (!threeState.routeSamples.length) return Infinity;

  let closest = Infinity;
  for (let i = 0; i < threeState.routeSamples.length; i += 5) {
    const sample = threeState.routeSamples[i];
    const distance = Math.hypot(position.x - sample.x, position.z - sample.z);
    if (distance < closest) closest = distance;
  }
  return closest;
}

function simplifyRoute(route, maxPoints) {
  if (route.length <= maxPoints) return route.slice();

  const simplified = [];
  const step = (route.length - 1) / (maxPoints - 1);
  let previousIndex = -1;

  for (let i = 0; i < maxPoints; i += 1) {
    const index = Math.min(route.length - 1, Math.round(i * step));
    if (index !== previousIndex) simplified.push(route[index]);
    previousIndex = index;
  }

  return simplified;
}

function smoothRoutePoints(points, passes = 3, minGap = 0.16) {
  const THREE = threeState.THREE;
  if (points.length < 3) return points.map((point) => point.clone());

  // Drop near-duplicate consecutive points — these are what make the spline overshoot
  // into hairpin spikes.
  const cleaned = [];
  points.forEach((point) => {
    const last = cleaned[cleaned.length - 1];
    if (!last || last.distanceTo(point) >= minGap) cleaned.push(point.clone());
  });
  if (cleaned.length < 3) return cleaned;

  // Weighted moving-average smoothing with endpoints pinned, removing the zig-zag while
  // keeping the road anchored to its real start/end.
  let current = cleaned;
  for (let pass = 0; pass < passes; pass += 1) {
    const next = current.map((point) => point.clone());
    for (let i = 1; i < current.length - 1; i += 1) {
      next[i].set(
        (current[i - 1].x + current[i].x * 2 + current[i + 1].x) / 4,
        current[i].y,
        (current[i - 1].z + current[i].z * 2 + current[i + 1].z) / 4,
      );
    }
    current = next;
  }
  return current;
}

function offsetRoutePoints(points, offset) {
  const THREE = threeState.THREE;

  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const direction = next.clone().sub(previous).setY(0);
    if (direction.lengthSq() < 0.0001) return point.clone();
    direction.normalize();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
    return point.clone().add(perpendicular.multiplyScalar(offset));
  });
}

function buildRouteChevrons(points) {
  const THREE = threeState.THREE;
  const material = new THREE.MeshStandardMaterial({
    color: 0x38d3dc,
    emissive: 0x124d54,
    emissiveIntensity: 0.56,
    roughness: 0.32,
  });
  const armGeometry = new THREE.BoxGeometry(0.72, 0.04, 0.08);

  for (let i = 18; i < points.length - 18; i += 28) {
    const previous = points[i - 1];
    const next = points[i + 1];
    const direction = next.clone().sub(previous).setY(0);
    if (direction.lengthSq() < 0.0001) continue;

    const group = new THREE.Group();
    group.position.set(points[i].x, 0.225, points[i].z);
    group.rotation.y = Math.atan2(-direction.z, direction.x);

    const left = new THREE.Mesh(armGeometry, material);
    left.position.set(0, 0, 0.18);
    left.rotation.y = 0.62;
    group.add(left);

    const right = new THREE.Mesh(armGeometry, material);
    right.position.set(0, 0, -0.18);
    right.rotation.y = -0.62;
    group.add(right);

    threeState.roadGroup.add(group);
  }
}

function buildRouteRibbon(points, group, options) {
  const THREE = threeState.THREE;
  if (!options.trackProgress) {
    const mesh = buildContinuousRibbonMesh(points, options);
    if (mesh) group.add(mesh);
    return { segments: [], total: routePointDistance(points) };
  }

  const geometry = new THREE.BoxGeometry(1, options.height, options.width);
  const segments = [];
  let walked = 0;

  for (let i = 1; i < points.length; i += 1) {
    const start = points[i - 1];
    const end = points[i];
    const delta = end.clone().sub(start);
    const length = Math.sqrt(delta.x * delta.x + delta.z * delta.z);
    if (length < 0.06) continue;

    const heading = Math.atan2(-delta.z, delta.x);
    const mesh = new THREE.Mesh(geometry, options.material);
    mesh.position.set((start.x + end.x) / 2, options.y, (start.z + end.z) / 2);
    mesh.rotation.y = heading;
    mesh.scale.x = length;
    group.add(mesh);

    if (options.trackProgress) {
      mesh.visible = false;
      segments.push({
        mesh,
        startDistance: walked,
        endDistance: walked + length,
        length,
        start: start.clone(),
        end: end.clone(),
        direction: delta.setY(0).normalize(),
        y: options.y,
      });
    }

    walked += length;
  }

  return { segments, total: walked };
}

function buildContinuousRibbonMesh(points, options) {
  if (points.length < 2) return null;

  const THREE = threeState.THREE;
  const vertices = [];
  const indices = [];
  const halfWidth = options.width / 2;

  points.forEach((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const direction = next.clone().sub(previous).setY(0);
    if (direction.lengthSq() < 0.0001) direction.set(1, 0, 0);
    direction.normalize();

    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
    const left = point.clone().add(perpendicular.clone().multiplyScalar(halfWidth));
    const right = point.clone().add(perpendicular.multiplyScalar(-halfWidth));
    vertices.push(left.x, options.y, left.z, right.x, options.y, right.z);

    if (index < points.length - 1) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, options.material);
  mesh.name = options.name || "continuousRouteRibbon";
  return mesh;
}

function routePointDistance(points) {
  let distance = 0;
  for (let i = 1; i < points.length; i += 1) {
    distance += points[i].distanceTo(points[i - 1]);
  }
  return distance;
}

function partialSceneRoute(points, progress) {
  if (progress <= 0 || points.length < 2) return [];
  if (progress >= 1) return points.slice();

  const target = routePointDistance(points) * progress;
  const result = [points[0].clone()];
  let walked = 0;

  for (let i = 1; i < points.length; i += 1) {
    const start = points[i - 1];
    const end = points[i];
    const segment = end.distanceTo(start);
    if (walked + segment < target) {
      result.push(end.clone());
      walked += segment;
      continue;
    }

    const local = segment <= 0 ? 0 : (target - walked) / segment;
    result.push(start.clone().lerp(end, local));
    break;
  }

  return result;
}

function buildLaneDashes(points, material) {
  const THREE = threeState.THREE;
  const geometry = new THREE.BoxGeometry(0.92, 0.035, 0.085);

  for (let i = 1; i < points.length; i += 3) {
    const start = points[i - 1];
    const end = points[i];
    const delta = end.clone().sub(start);
    const length = Math.sqrt(delta.x * delta.x + delta.z * delta.z);
    if (length < 0.9) continue;

    const dash = new THREE.Mesh(geometry, material);
    dash.position.set((start.x + end.x) / 2, 0.13, (start.z + end.z) / 2);
    dash.rotation.y = Math.atan2(-delta.z, delta.x);
    threeState.roadGroup.add(dash);
  }
}

function buildRouteBeacons(route) {
  const THREE = threeState.THREE;
  const beaconMaterial = new THREE.MeshStandardMaterial({
    color: 0x38d3dc,
    emissive: 0x123f44,
    roughness: 0.42,
    transparent: true,
    opacity: 0.84,
  });
  const handoffMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6b64a,
    emissive: 0x4a2c06,
    roughness: 0.38,
    transparent: true,
    opacity: 0.9,
  });

  [route[0], route[route.length - 1]].forEach((coordinates) => {
    addRouteBeacon(projectGeoPoint(coordinates, 0.17), beaconMaterial, 0.46);
  });
  addRouteBeacon(projectGeoPoint(cities.saintLouis, 0.18), handoffMaterial, 0.56);
}

function addRouteBeacon(position, material, radius) {
  const THREE = threeState.THREE;
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.08, 36), material);
  beacon.position.copy(position);
  threeState.roadGroup.add(beacon);
}

function clearGroup(group, disposeGeometry = false) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    if (disposeGeometry) disposeGeometryOnly(child);
  }
}

function disposeGeometryOnly(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
  });
}

function projectGeoPoint(coordinates, y = 0.1) {
  if (!threeState.routeProjection) return new threeState.THREE.Vector3(0, y, 0);
  return threeState.routeProjection.project(coordinates, y);
}

function routeDirectionAt(route, progress) {
  const before = pointAlongRoute(route, Math.max(0, progress - 0.004));
  const after = pointAlongRoute(route, Math.min(1, progress + 0.004));
  const start = projectGeoPoint(before, 0.1);
  const end = projectGeoPoint(after, 0.1);
  const direction = end.sub(start);

  if (direction.lengthSq() < 0.0001) return new threeState.THREE.Vector3(1, 0, 0);
  return direction.setY(0).normalize();
}

function scenePoseAtProgress(progress) {
  const THREE = threeState.THREE;
  const clamped = Math.min(1, Math.max(0, progress));

  if (!threeState.routeCurve) {
    return {
      position: new THREE.Vector3(0, 0.14, 0),
      direction: new THREE.Vector3(1, 0, 0),
    };
  }

  const position = threeState.routeCurve.getPointAt(clamped);
  position.y = 0.2;

  // Aim down the road using a look-ahead chord rather than the instantaneous tangent, so the
  // truck/camera point where the road is heading instead of twitching at every small kink.
  const back = Math.max(0, clamped - 0.012);
  const ahead = Math.min(1, clamped + 0.04);
  const direction = threeState.routeCurve.getPointAt(ahead).sub(threeState.routeCurve.getPointAt(back)).setY(0);
  if (direction.lengthSq() < 0.0001) direction.copy(threeState.routeCurve.getTangentAt(clamped).setY(0));
  if (direction.lengthSq() < 0.0001) direction.set(1, 0, 0);
  direction.normalize();

  return { position, direction };
}

function smoothSelectedPose(targetPosition, targetDirection) {
  if (!threeState.smoothPosition || !threeState.smoothDirection) {
    threeState.smoothPosition = targetPosition.clone();
    threeState.smoothDirection = targetDirection.clone();
  } else {
    threeState.smoothPosition.lerp(targetPosition, 0.2);
    threeState.smoothDirection.lerp(targetDirection, 0.1);
    if (threeState.smoothDirection.lengthSq() < 0.0001) threeState.smoothDirection.copy(targetDirection);
    threeState.smoothDirection.normalize();
  }

  return {
    position: threeState.smoothPosition.clone(),
    direction: threeState.smoothDirection.clone(),
  };
}

function computeCumulativeDistances(points) {
  const cumulative = new Float64Array(points.length);
  for (let i = 1; i < points.length; i += 1) {
    cumulative[i] = cumulative[i - 1] + points[i].distanceTo(points[i - 1]);
  }
  return cumulative;
}

function updateProgressRibbon(truck) {
  if (!threeState.progressMeshes.length || !threeState.progressCumulative) return;

  const tone = colorForTone(truck.tone);
  threeState.progressMaterials.forEach((material) => {
    material.color.set(tone);
    material.emissive.set(tone);
  });

  const cumulative = threeState.progressCumulative;
  const total = cumulative[cumulative.length - 1];
  const progress = Math.min(1, Math.max(0, truck.progress));

  if (total <= 0 || progress <= 0) {
    threeState.progressMeshes.forEach((mesh) => mesh.geometry.setDrawRange(0, 0));
    return;
  }

  const target = total * progress;
  let cursor = threeState.progressCursor;
  if (cumulative[cursor] > target) cursor = 0; // progress moved backwards (idle oscillation)
  while (cursor < cumulative.length - 1 && cumulative[cursor + 1] < target) cursor += 1;
  threeState.progressCursor = cursor;

  // Each route segment contributes 6 indices (two triangles) in the ribbon geometry.
  const segments = Math.min(cumulative.length - 1, cursor + 1);
  const indexCount = segments * 6;
  threeState.progressMeshes.forEach((mesh) => mesh.geometry.setDrawRange(0, indexCount));
}

function updateFleetMarkers(elapsed) {
  if (!threeState.routeProjection) return;

  allTruckSnapshots(elapsed).forEach((truck) => {
    const mesh = threeState.fleetMeshes[truck.id];
    if (!mesh) return;

    const position = projectGeoPoint(truck.position, 0.13);
    const inScene = Math.abs(position.x) < 48 && Math.abs(position.z) < 36;
    mesh.visible = truck.id !== state.selectedTruckId && state.visibleTrucks.has(truck.id) && inScene;
    if (!mesh.visible) return;

    mesh.position.copy(position);
    const direction = routeDirectionAt(truck.route, truck.progress);
    mesh.rotation.y = Math.atan2(-direction.z, direction.x);
    mesh.traverse((child) => {
      if (child.userData.paint === "cab") child.material.color.set(colorForTone(truck.tone));
    });
  });
}

function updateThreeCamera(position, direction) {
  const THREE = threeState.THREE;
  const camera = threeState.camera;

  if (threeState.chaseMode) {
    const side = new THREE.Vector3(direction.z, 0, -direction.x).multiplyScalar(threeState.fullscreen ? 4.2 : 3.2);
    const desired = position
      .clone()
      .add(direction.clone().multiplyScalar(threeState.fullscreen ? -17 : -14))
      .add(side)
      .add(new THREE.Vector3(0, threeState.fullscreen ? 6.4 : 5.6, 0));
    const target = position.clone().add(direction.clone().multiplyScalar(3.4)).add(new THREE.Vector3(0, 1.2, 0));

    if (!threeState.cameraSnapped) {
      camera.position.copy(desired);
      threeState.cameraSnapped = true;
    } else {
      camera.position.lerp(desired, 0.12);
    }
    camera.lookAt(target);
    return;
  }

  const desired = new THREE.Vector3(0, threeState.fullscreen ? 34 : 28, threeState.fullscreen ? 58 : 48);
  if (!threeState.cameraSnapped) {
    camera.position.copy(desired);
    threeState.cameraSnapped = true;
  } else {
    camera.position.lerp(desired, 0.08);
  }
  camera.lookAt(0, 0, 0);
}

function updateThreeControls() {
  if (!elements.chaseToggle || !elements.threeFullscreen) return;

  elements.chaseToggle.textContent = threeState.chaseMode ? "Chase on" : "Overview";
  elements.chaseToggle.classList.toggle("active", threeState.chaseMode);
  elements.threeFullscreen.textContent = threeState.fullscreen ? "Exit full" : "Fullscreen";
  elements.threePanel.classList.toggle("fullscreen", threeState.fullscreen);
  document.body.classList.toggle("three-fullscreen", threeState.fullscreen);
}

async function loadRoadRoutes() {
  const results = await Promise.allSettled(
    Object.entries(routeCatalog).map(async ([key, waypoints]) => {
      const route = await fetchRoadRoute(waypoints);
      if (route.length > 2) roadRoutes[key] = route;
    }),
  );

  const loaded = results.some((result) => result.status === "fulfilled");
  state.roadRoutesReady = loaded;
  state.routeSource = loaded ? "road" : "fallback";
  window.demoMapState = state;

  refreshRouteGeometry();
  threeState.routeSignature = "";
  updateMap((performance.now() - (state.demoRunning ? state.demoStart : state.idleStart)) / 1000);
  renderTrackerPanel();
}

async function fetchRoadRoute(waypoints) {
  const coordinates = waypoints.map((point) => `${point[0]},${point[1]}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`Routing failed: ${response.status}`);

  const data = await response.json();
  const route = data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates;
  if (!Array.isArray(route)) throw new Error("Routing response did not include geometry");

  return route;
}

function refreshRouteGeometry() {
  if (!state.mapReady) return;

  mapObjects.feeder.setLatLngs(toLatLngs(routeForKey("feeder")));
  mapObjects.feederShadow.setLatLngs(toLatLngs(routeForKey("feeder")));
  mapObjects.original.setLatLngs(toLatLngs(routeForKey("original")));
  mapObjects.originalShadow.setLatLngs(toLatLngs(routeForKey("original")));

  truckOrder.forEach((id) => {
    const lines = mapObjects.trackLines[id];
    if (!lines) return;
    lines.full.setLatLngs(toLatLngs(routeForTruck(id)));
  });
}

function addMapLayers() {
  mapObjects.feederShadow = routeLine(routeFeeder, "#020406", 10, 0.48, "7 12");
  mapObjects.feeder = routeLine(routeFeeder, colors.silver, 3, 0.9, "7 12");

  mapObjects.originalShadow = routeLine(routeOriginal, "#020406", 11, 0.52, "9 10");
  mapObjects.original = routeLine(routeOriginal, colors.blue, 4, 0.92, "9 10");

  mapObjects.rescueShadow = routeLine([], "#020406", 12, 0.48, "8 8");
  mapObjects.rescue = routeLine([], colors.amber, 5, 0.96, "8 8");

  mapObjects.finalShadow = routeLine([], "#020406", 13, 0.5, "9 8");
  mapObjects.final = routeLine([], colors.green, 5, 1, "9 8");

  truckOrder.forEach((id) => {
    const toneColor = colorForTone(trucks[id].tone);
    mapObjects.trackLines[id] = {
      full: routeLine(routeForTruck(id), toneColor, 3, 0.22, "4 10"),
      progress: routeLine([], toneColor, 5, 0.96, ""),
      progressShadow: routeLine([], "#020406", 12, 0.36, ""),
    };
  });

  mapObjects.weatherCircle = L.circle(latLng(cities.springfield), {
    radius: 0,
    color: colors.rose,
    weight: 2,
    dashArray: "8 8",
    opacity: 0,
    fillColor: colors.rose,
    fillOpacity: 0,
  }).addTo(mapObjects.map);
}

function routeLine(route, color, weight, opacity, dashArray) {
  return L.polyline(toLatLngs(route), {
    color,
    weight,
    opacity,
    dashArray,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(mapObjects.map);
}

function routeForKey(key) {
  return roadRoutes[key] || routeCatalog[key] || [];
}

function routeForTruck(id) {
  return routeForKey(trucks[id].routeKey);
}

function colorForTone(tone) {
  return colors[tone] || colors.blue;
}

function createMapMarkers() {
  mapObjects.truckA = createTruckMarker("L-9402", cities.oklahomaCity, "Auto parts", "blue");
  mapObjects.truckB = createTruckMarker("L-9448", cities.saintLouis, "St. Louis", "silver");
  mapObjects.pending = createTruckMarker("L-9403", cities.houston, "Houston Port", "silver");
  mapObjects.delivered = createTruckMarker("L-9399", cities.chicago, "Delivered", "green");

  mapObjects.incident = L.marker([37.58, -92.82], {
    icon: labelIcon("incident-marker", "I-44 storm band", "Severe cell crossing route"),
    interactive: false,
  }).addTo(mapObjects.map);
  mapObjects.incident.setOpacity(0);

  mapObjects.handoff = L.marker(latLng(cities.saintLouis), {
    icon: labelIcon("handoff-marker", "Load handoff", "L-9448 has 4.2h HOS"),
    interactive: false,
  }).addTo(mapObjects.map);
  mapObjects.handoff.setOpacity(0);
}

function createTruckMarker(id, coordinates, subtitle, tone) {
  const marker = L.marker(latLng(coordinates), {
    icon: truckIcon(id, subtitle, tone),
    keyboard: true,
    title: id,
  }).addTo(mapObjects.map);

  marker.on("click", () => focusTruck(id, true));
  mapObjects.truckMarkers[id] = marker;
  return marker;
}

function truckIcon(id, subtitle, tone) {
  const selected = id === state.selectedTruckId ? " selected" : "";
  return L.divIcon({
    className: "leaflet-truck-icon",
    html: `<div class="truck-marker ${tone}${selected}"><span class="truck-pin"></span><span class="truck-label"><strong>${id}</strong><em>${subtitle}</em></span></div>`,
    iconSize: [160, 48],
    iconAnchor: [14, 24],
  });
}

function labelIcon(className, title, subtitle) {
  return L.divIcon({
    className: "leaflet-label-icon",
    html: `<div class="${className}"><strong>${title}</strong><span>${subtitle}</span></div>`,
    iconSize: [190, 56],
    iconAnchor: [-8, 28],
  });
}

function setTruck(marker, coordinates, id, subtitle, tone) {
  marker.setLatLng(latLng(coordinates));
  marker.setIcon(truckIcon(id, subtitle, tone));
  marker.setOpacity(state.visibleTrucks.has(id) ? 1 : 0);
}

function setPhase(index) {
  if (index === state.currentPhaseIndex) return;

  state.currentPhaseIndex = index;
  const phase = phasePlan[index];
  state.phase = phase.key;

  elements.phaseTitle.textContent = phase.title;
  elements.phaseCopy.textContent = phase.copy;
  elements.agentState.textContent = phase.state;
  elements.riskPill.textContent = phase.risk;
  elements.mailStatus.textContent = phase.mailStatus;
  elements.mailSubject.textContent = phase.mailSubject;
  elements.mailBody.textContent = phase.mailBody;
  elements.savedSla.textContent = phase.saved;
  elements.efficiency.textContent = phase.efficiency;
  elements.weatherTitle.textContent = phase.weatherTitle;
  elements.weatherCopy.textContent = phase.weatherCopy;

  elements.mailStatus.classList.toggle("sent", phase.mailStatus === "Sent");
  elements.emailPanel.classList.toggle("sent", phase.mailStatus === "Sent");
  elements.weatherCard.classList.toggle("alert", index >= 1 && index < 4);
  elements.weatherCard.classList.toggle("visible", index >= 1);

  renderTools(phase.tools);
  renderLoads(phase.loads);
  renderTimeline(index);
  if (!state.followTruck) focusCamera(index);
}

function focusCamera(index, immediate = false) {
  if (!state.mapReady) return;

  const compact = elements.map.clientWidth < 650;
  const camera = [
    { center: [37.05, -93.85], zoom: compact ? 4 : 5 },
    { center: [37.45, -93.35], zoom: compact ? 5 : 6 },
    { center: [38.75, -91.7], zoom: compact ? 5 : 6 },
    { center: [38.9, -91.0], zoom: compact ? 5 : 6 },
    { center: [40.05, -89.25], zoom: compact ? 5 : 6 },
  ][index];

  if (immediate) {
    mapObjects.map.setView(camera.center, camera.zoom, { animate: false });
  } else {
    mapObjects.map.flyTo(camera.center, camera.zoom, { duration: 1.2, easeLinearity: 0.25 });
  }
}

function renderTools(tools) {
  elements.toolLog.innerHTML = tools
    .map(([name, value, tone]) => {
      const className = tone ? ` ${tone}` : "";
      return `<div class="tool-call${className}"><span>${name}</span><strong>${value}</strong></div>`;
    })
    .join("");
}

function renderTimeline(index) {
  const steps = Array.from(elements.timeline.querySelectorAll(".timeline-step"));
  steps.forEach((step, stepIndex) => {
    step.classList.toggle("done", stepIndex < index);
    step.classList.toggle("active", stepIndex === index);
  });
}

function renderLoads(key) {
  const rows = loadStates[key];
  elements.loadsBody.innerHTML = rows
    .map(([id, payload, destination, status, operator, eta, tone]) => {
      const dotClass = tone === "blue" ? "" : ` ${tone}`;
      return `
        <tr>
          <td><span class="load-id"><span class="status-dot${dotClass}"></span>${id}</span></td>
          <td>${payload}</td>
          <td>${destination}</td>
          <td><span class="status-pill${dotClass}">${status}</span></td>
          <td>${operator}</td>
          <td>${eta}</td>
        </tr>
      `;
    })
    .join("");
}

function renderTrackerPanel() {
  elements.trackerList.innerHTML = truckOrder
    .map((id) => {
      const truck = trucks[id];
      const selected = id === state.selectedTruckId ? " selected" : "";
      const muted = state.visibleTrucks.has(id) ? "" : " muted";
      return `
        <article class="tracker-card${selected}${muted}" data-truck="${id}" data-tone="${truck.tone}">
          <div class="tracker-card-head">
            <div class="tracker-id">
              <span class="${truck.tone}"></span>
              <div>
                <strong>${id}</strong>
                <em>${truck.origin} to ${truck.destination}</em>
              </div>
            </div>
            <button type="button" data-action="focus" data-truck="${id}">Focus</button>
          </div>
          <div class="tracker-progress">
            <div class="progress-meta">
              <span data-role="status">Loading GPS</span>
              <span data-role="percent">0%</span>
            </div>
            <div class="progress-track"><span class="progress-fill" data-role="bar"></span></div>
          </div>
        </article>
      `;
    })
    .join("");

  elements.trackerList.querySelectorAll(".tracker-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      const truckId = card.dataset.truck;
      if (event.target instanceof HTMLButtonElement) {
        focusTruck(truckId, false);
        return;
      }
      toggleTruck(truckId);
    });
  });

  updateTrackerProgress((performance.now() - (state.demoRunning ? state.demoStart : state.idleStart)) / 1000);
}

function updateTrackerProgress(elapsed) {
  if (!elements.trackerList.children.length) return;

  allTruckSnapshots(elapsed).forEach((truck) => {
    const card = elements.trackerList.querySelector(`[data-truck="${truck.id}"]`);
    if (!card) return;

    const percent = Math.round(truck.progress * 100);
    const status = card.querySelector('[data-role="status"]');
    const percentLabel = card.querySelector('[data-role="percent"]');
    const bar = card.querySelector('[data-role="bar"]');
    const dot = card.querySelector(".tracker-id span");

    card.dataset.tone = truck.tone;
    card.classList.toggle("selected", truck.id === state.selectedTruckId);
    card.classList.toggle("muted", !state.visibleTrucks.has(truck.id));
    if (status) status.textContent = `${truck.status} (${state.routeSource})`;
    if (percentLabel) percentLabel.textContent = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
    if (dot) dot.className = truck.tone;
  });
}

function toggleTruck(truckId) {
  if (state.visibleTrucks.has(truckId)) {
    state.visibleTrucks.delete(truckId);
  } else {
    state.visibleTrucks.add(truckId);
  }

  if (state.visibleTrucks.size === 0) state.visibleTrucks.add(truckId);
  state.selectedTruckId = truckId;
  renderTrackerPanel();
}

function focusTruck(truckId, streetLevel = false) {
  state.selectedTruckId = truckId;
  state.visibleTrucks.add(truckId);
  state.followTruck = streetLevel;
  renderTrackerPanel();
  updateTruckDetails((performance.now() - (state.demoRunning ? state.demoStart : state.idleStart)) / 1000);

  if (!state.mapReady) return;

  const marker = mapObjects.truckMarkers[truckId];
  if (!marker) return;

  const target = marker.getLatLng();
  const zoom = streetLevel ? 13 : Math.max(8, mapObjects.map.getZoom());
  if (streetLevel) {
    mapObjects.map.setView(target, zoom, { animate: true });
  } else {
    mapObjects.map.flyTo(target, zoom, { duration: 1.1, easeLinearity: 0.25 });
  }
}

function fitTrackedTrucks() {
  if (!state.mapReady) return;

  state.followTruck = false;

  const points = truckOrder
    .filter((id) => state.visibleTrucks.has(id))
    .map((id) => mapObjects.truckMarkers[id] && mapObjects.truckMarkers[id].getLatLng())
    .filter(Boolean);

  if (!points.length) return;

  mapObjects.map.fitBounds(L.latLngBounds(points), {
    padding: [60, 60],
    maxZoom: 8,
  });
}

function resizeThreeView() {
  if (!threeState.ready && !threeState.renderer) return;

  const width = elements.truck3d.clientWidth || 1;
  const height = elements.truck3d.clientHeight || 1;
  threeState.camera.aspect = width / height;
  threeState.camera.updateProjectionMatrix();
  threeState.renderer.setSize(width, height, false);
}

function handleThreePointerMove(event) {
  if (!threeState.ready) return;

  const hit = pickTruck(event);
  elements.truck3d.style.cursor = hit ? "pointer" : "grab";
  elements.threeMode.textContent = hit ? "Open unit details" : "Click truck for details";
}

function handleThreeClick(event) {
  if (!threeState.ready || !elements.truck3d.contains(event.target)) return;

  threeState.detailsOpen = true;
  state.visibleTrucks.add(state.selectedTruckId);
  updateTruckDetails((performance.now() - (state.demoRunning ? state.demoStart : state.idleStart)) / 1000);
  elements.threeMode.textContent = "Details live";
}

function pickTruck(event) {
  const rect = elements.truck3d.getBoundingClientRect();
  threeState.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  threeState.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  threeState.raycaster.setFromCamera(threeState.pointer, threeState.camera);
  return threeState.raycaster.intersectObjects(threeState.clickable, true).length > 0;
}

function updateThreeView(elapsed) {
  if (!threeState.ready) return;

  const THREE = threeState.THREE;
  const truck = truckSnapshot(state.selectedTruckId, elapsed);
  rebuildThreeRoute(truck);

  const targetPose = scenePoseAtProgress(truck.progress);
  const { position, direction } = smoothSelectedPose(targetPose.position, targetPose.direction);
  threeState.truckGroup.position.copy(position);
  threeState.truckGroup.rotation.y = Math.atan2(-direction.z, direction.x);

  const wheelSpin = -threeState.routeDistance * truck.progress * 2.2;
  threeState.truckGroup.children.forEach((child) => {
    if (child.userData.wheel) child.rotation.z = wheelSpin + (child.userData.wheelOffset || 0);
  });

  updateProgressRibbon(truck);
  updateFleetMarkers(elapsed);

  const weather = threeState.scene.getObjectByName("weatherDisc");
  if (weather) weather.visible = truck.tone === "rose";

  const cabColor = new THREE.Color(colorForTone(truck.tone));
  threeState.truckGroup.children.forEach((child) => {
    if (child.userData.paint === "cab") child.material.color.copy(cabColor);
  });

  updateThreeCamera(position, direction);
  threeState.renderer.render(threeState.scene, threeState.camera);

  // The detail panel rewrites its innerHTML (forcing a layout reflow), so refresh it a
  // few times per second instead of every frame — the values change slowly anyway.
  if (Math.abs(elapsed - threeState.lastDetailUpdate) > 0.2) {
    threeState.lastDetailUpdate = elapsed;
    updateTruckDetails(elapsed);
  }
}

function updateTruckDetails(elapsed) {
  const truck = truckSnapshot(state.selectedTruckId, elapsed);
  const percent = Math.round(truck.progress * 100);
  const speed = speedForTruck(truck);
  const hos = Math.max(0, truck.hosBase - truck.progress * 1.1).toFixed(1);
  const fuel = Math.max(8, Math.round(truck.fuel - truck.progress * 9));
  const alert = truck.tone === "rose" ? "Weather risk" : truck.status === "Delivered" ? "Closed" : "On route";

  elements.threeTitle.textContent = `${truck.id} live vehicle view`;
  elements.detailTruckId.textContent = truck.id;
  elements.detailStatus.textContent = truck.status;
  elements.detailGrid.innerHTML = [
    ["Driver", truck.driver],
    ["Tractor", truck.tractor],
    ["Trailer", truck.trailer],
    ["Load", truck.name],
    ["Progress", `${percent}%`],
    ["Speed", `${speed} mph`],
    ["ETA", truck.eta],
    ["HOS left", `${hos} hr`],
    ["Fuel", `${fuel}%`],
    ["Cargo temp", truck.temp],
    ["Next stop", truck.nextStop],
    ["Alert", alert],
    ["Value", truck.loadValue],
    ["GPS", `${state.routeSource} route, ping 4 sec ago`],
  ]
    .map(([label, value], index) => {
      const wide = index === 13 ? " wide" : "";
      return `<div class="detail-item${wide}"><span>${label}</span><strong>${value}</strong></div>`;
    })
    .join("");
}

function speedForTruck(truck) {
  if (truck.status === "Delivered" || truck.status === "Standby" || truck.status === "Pending dispatch") return 0;
  if (truck.status === "Delay risk") return 43;
  if (truck.status === "Transfer") return 12;
  if (truck.status === "Final leg") return 62;
  return 58;
}

function updateClock(elapsed) {
  const seconds = Math.floor(elapsed);
  const minutes = Math.floor(seconds / 60);
  const remaining = `${seconds % 60}`.padStart(2, "0");
  const time = `12:${`${2 + minutes}`.padStart(2, "0")}:${remaining} CT`;
  elements.timestamp.textContent = time;
  elements.mailTime.textContent = state.currentPhaseIndex >= 2 ? time : "--:--";
}

function truckSnapshot(id, elapsed) {
  const phaseIndex = Math.max(0, state.currentPhaseIndex);
  const risk = phaseIndex >= 1 && phaseIndex < 4;
  const handoffProgress = smoothstep(24, 31, elapsed);
  const rerouteProgress = smoothstep(34, 42, elapsed);
  const riskProgress = smoothstep(7, 12, elapsed);
  const config = trucks[id];
  let progress = 0;
  let tone = config.tone;
  let status = "Tracking";
  let route = routeForTruck(id);

  if (id === "L-9402") {
    progress = phaseIndex < 1 ? 0.18 + Math.sin(elapsed * 0.22) * 0.03 : phaseIndex < 3 ? 0.28 + riskProgress * 0.25 : 0.55 + handoffProgress * 0.35;
    progress = phaseIndex >= 4 ? 0.94 : Math.min(0.94, progress);
    tone = risk ? "rose" : phaseIndex >= 4 ? "green" : "blue";
    status = risk ? "Delay risk" : phaseIndex >= 3 ? "Transfer" : "Auto parts";
  }

  if (id === "L-9448") {
    route = routeForKey("finalLeg");
    progress = phaseIndex >= 4 ? Math.min(0.92, rerouteProgress * 0.84) : 0;
    tone = phaseIndex >= 3 ? "green" : "silver";
    status = phaseIndex >= 4 ? "Final leg" : phaseIndex >= 3 ? "Assigned" : "Standby";
  }

  if (id === "L-9403") {
    route = routeForKey("feeder");
    progress = 0.1 + Math.sin(elapsed * 0.16) * 0.015;
    tone = "silver";
    status = "Pending dispatch";
  }

  if (id === "L-9399") {
    route = routeForKey("finalLeg");
    progress = 1;
    tone = "green";
    status = "Delivered";
  }

  progress = Math.min(1, Math.max(0, progress));

  return {
    id,
    ...config,
    route,
    progress,
    tone,
    status,
    position: pointAlongRoute(route, progress),
  };
}

function allTruckSnapshots(elapsed) {
  return truckOrder.map((id) => truckSnapshot(id, elapsed));
}

function runHeroMoment() {
  state.demoStart = performance.now();
  state.demoRunning = true;
  state.currentPhaseIndex = -1;
  state.selectedTruckId = "L-9402";
  state.visibleTrucks = new Set(["L-9402", "L-9448"]);
  state.followTruck = false;
  threeState.chaseMode = true;
  threeState.cameraSnapped = false;
  updateThreeControls();
  renderTrackerPanel();
  elements.runDemo.querySelector("span:last-child").textContent = "Replay hero moment";
}

window.startHeroMoment = runHeroMoment;
window.replayHeroMoment = runHeroMoment;

function updateMap(elapsed) {
  if (!state.mapReady) return;

  // While the hero demo is idle, the weather-routing system owns the map: hide the scripted
  // routes/markers so the radar and storm-avoidance corridors read cleanly.
  if (weatherRoutingShowing()) {
    hideScriptedMapLayers();
    return;
  }

  const phaseIndex = Math.max(0, state.currentPhaseIndex);
  const risk = phaseIndex >= 1 && phaseIndex < 4;
  const recovered = phaseIndex >= 4;
  const weatherIntensity = smoothstep(6.5, 10.5, elapsed) * (recovered ? 0.25 : risk ? 1 : 0);
  const handoffProgress = smoothstep(24, 31, elapsed);
  const rerouteProgress = smoothstep(34, 42, elapsed);

  mapObjects.weatherCircle.setRadius(weatherIntensity > 0 ? (78 + weatherIntensity * 22) * 1000 : 0);
  mapObjects.weatherCircle.setStyle({
    opacity: weatherIntensity * (state.followTruck ? 0.34 : 0.78),
    fillOpacity: weatherIntensity * (state.followTruck ? 0.045 : 0.2),
  });

  mapObjects.original.setStyle({
    color: risk ? colors.rose : colors.blue,
    opacity: recovered ? 0.22 : 0.94,
  });
  mapObjects.originalShadow.setStyle({ opacity: recovered ? 0.15 : 0.52 });

  const rescueProgress = phaseIndex >= 3 ? Math.max(0.12, handoffProgress) : 0;
  const finalProgress = phaseIndex >= 4 ? Math.max(0.12, rerouteProgress) : 0;
  mapObjects.rescue.setLatLngs(toLatLngs(partialRoute(routeForKey("rescue"), rescueProgress)));
  mapObjects.rescueShadow.setLatLngs(toLatLngs(partialRoute(routeForKey("rescue"), rescueProgress)));
  mapObjects.final.setLatLngs(toLatLngs(partialRoute(routeForKey("finalLeg"), finalProgress)));
  mapObjects.finalShadow.setLatLngs(toLatLngs(partialRoute(routeForKey("finalLeg"), finalProgress)));

  allTruckSnapshots(elapsed).forEach((truck) => {
    const visible = state.visibleTrucks.has(truck.id);
    const marker = mapObjects.truckMarkers[truck.id];
    const lines = mapObjects.trackLines[truck.id];
    const progressRoute = partialRoute(truck.route, truck.progress);

    if (marker) setTruck(marker, truck.position, truck.id, truck.status, truck.tone);

    if (lines) {
      lines.full.setStyle({ opacity: visible ? 0.2 : 0 });
      lines.progress.setStyle({ color: colorForTone(truck.tone), opacity: visible ? 0.96 : 0 });
      lines.progressShadow.setStyle({ opacity: visible ? 0.34 : 0 });
      lines.progress.setLatLngs(toLatLngs(progressRoute));
      lines.progressShadow.setLatLngs(toLatLngs(progressRoute));
    }
  });

  mapObjects.incident.setOpacity(weatherIntensity > 0 ? 1 : 0);
  mapObjects.handoff.setOpacity(phaseIndex >= 3 ? 1 : 0);
  updateTrackerProgress(elapsed);

  if (state.followTruck && elapsed - state.lastFollowAt > 0.8) {
    const marker = mapObjects.truckMarkers[state.selectedTruckId];
    if (marker) {
      mapObjects.map.panTo(marker.getLatLng(), { animate: true, duration: 0.45 });
      state.lastFollowAt = elapsed;
    }
  }
}

function frame(now) {
  let elapsed = (now - state.idleStart) / 1000;

  if (state.demoRunning) {
    elapsed = (now - state.demoStart) / 1000;
    const { index } = phaseFromElapsed(elapsed);
    setPhase(index);

    if (elapsed > 48) {
      state.demoRunning = false;
      state.idleStart = now - 42000;
    }
  } else if (state.currentPhaseIndex < 0) {
    setPhase(0);
  }

  updateClock(elapsed);
  updateMap(elapsed);
  updateWeatherRouting(now);
  requestAnimationFrame(frame);
}

function phaseFromElapsed(elapsed) {
  let index = 0;
  for (let i = 0; i < phasePlan.length; i += 1) {
    if (elapsed >= phasePlan[i].at) index = i;
  }
  return { phase: phasePlan[index], index };
}

function setMapMode(satelliteMode) {
  state.satelliteMode = satelliteMode;
  elements.pitchToggle.textContent = satelliteMode ? "SAT" : "MAP";
  elements.pitchToggle.classList.toggle("active", satelliteMode);

  if (!state.mapReady) return;

  if (satelliteMode) {
    if (mapObjects.map.hasLayer(mapObjects.streets)) mapObjects.map.removeLayer(mapObjects.streets);
    mapObjects.satellite.addTo(mapObjects.map);
    mapObjects.labels.addTo(mapObjects.map);
  } else {
    if (mapObjects.map.hasLayer(mapObjects.satellite)) mapObjects.map.removeLayer(mapObjects.satellite);
    if (mapObjects.map.hasLayer(mapObjects.labels)) mapObjects.map.removeLayer(mapObjects.labels);
    mapObjects.streets.addTo(mapObjects.map);
  }
}

function latLng(coordinates) {
  return [coordinates[1], coordinates[0]];
}

function toLatLngs(route) {
  return route.map(latLng);
}

function pointAlongRoute(route, progress) {
  const partial = partialRoute(route, progress);
  return partial[partial.length - 1] || route[0];
}

function partialRoute(route, progress) {
  if (progress <= 0 || route.length < 2) return [];
  if (progress >= 1) return route.slice();

  const distances = routeDistances(route);
  const target = distances.total * progress;
  const result = [route[0]];
  let walked = 0;

  for (let i = 1; i < route.length; i += 1) {
    const segment = distances.segments[i - 1];
    if (walked + segment < target) {
      result.push(route[i]);
      walked += segment;
      continue;
    }

    const local = (target - walked) / segment;
    result.push(interpolateLngLat(route[i - 1], route[i], local));
    break;
  }

  return result;
}

function routeDistances(route) {
  const segments = [];
  let total = 0;
  for (let i = 1; i < route.length; i += 1) {
    const distance = haversineKm(route[i - 1], route[i]);
    segments.push(distance);
    total += distance;
  }
  return { segments, total };
}

function interpolateLngLat(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function haversineKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function smoothstep(edge0, edge1, value) {
  const x = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

function seededUnit(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/* ---------------------------------------------------------------------------
 * Weather radar + dynamic storm-avoidance routing (Leaflet map).
 * Owns the map while the scripted hero demo is idle: it renders an animated
 * precipitation radar, scores several corridors against the live weather, and
 * reroutes the truck in real time onto the clearest lane.
 * ------------------------------------------------------------------------- */
const weatherRouting = {
  enabled: true,
  ready: false,
  cells: [],
  hazards: [],
  hazardLabels: [],
  lanes: [],
  activeKey: null,
  baselineMiles: 0,
  radarLayer: null,
  truckMarker: null,
  truckSeverity: null,
  truckProgress: 0.04,
  lastTruckPos: null,
  avoided: 0,
  lastTick: 0,
  clock: 0,
  lastReroute: -999,
  rerouteFlashUntil: 0,
  lastRadarDraw: 0,
  wasShowing: null,
  follow: false,
  followZoom: 8,
  lastFollowAt: 0,
  followHoldUntil: 0,
  dom: null,
};

const weatherBounds = { minLng: -100, maxLng: -85, minLat: 32, maxLat: 44 };

const weatherLaneDefs = [
  {
    key: "central",
    label: "I-44 / I-55 Central",
    via: [cities.oklahomaCity, cities.tulsa, cities.springfield, cities.saintLouis, [-89.2, 40.2], cities.chicago],
  },
  {
    key: "north",
    label: "I-35 / I-80 North",
    via: [cities.oklahomaCity, [-96.6, 37.1], [-94.58, 39.1], [-93.6, 41.6], [-90.2, 41.85], cities.chicago],
  },
  {
    key: "south",
    label: "I-40 / I-57 South",
    via: [cities.oklahomaCity, [-95.0, 35.2], [-92.29, 34.75], [-90.05, 35.15], [-89.0, 38.0], [-88.2, 40.3], cities.chicago],
  },
];

function createWeatherCells() {
  return [
    { lng: -93.3, lat: 37.21, vlng: 0.05, vlat: 0.018, radiusKm: 175, base: 0.97, name: "the Springfield supercell" },
    { lng: -96.1, lat: 36.0, vlng: 0.062, vlat: -0.012, radiusKm: 130, base: 0.76, name: "the Tulsa squall line" },
    { lng: -90.3, lat: 38.7, vlng: 0.04, vlat: 0.03, radiusKm: 125, base: 0.68, name: "the St. Louis cells" },
    { lng: -94.7, lat: 39.2, vlng: -0.03, vlat: 0.022, radiusKm: 110, base: 0.58, name: "the Kansas City band" },
    { lng: -89.1, lat: 40.3, vlng: 0.033, vlat: -0.02, radiusKm: 105, base: 0.62, name: "the Central Illinois storms" },
    { lng: -92.1, lat: 34.7, vlng: 0.045, vlat: 0.04, radiusKm: 115, base: 0.64, name: "the Arkansas line" },
  ].map((cell, index) => ({ ...cell, intensity: cell.base, lobes: buildStormLobes(index) }));
}

// Each storm is rendered as a cluster of drifting "lobes" so it reads as an organic,
// animated radar blob instead of a flat circle.
function buildStormLobes(seed) {
  const count = 5 + Math.floor(seededUnit(seed + 3) * 4);
  const lobes = [];
  for (let i = 0; i < count; i += 1) {
    lobes.push({
      angle: seededUnit(seed * 11 + i) * Math.PI * 2,
      dist: 0.12 + seededUnit(seed * 17 + i) * 0.55,
      size: 0.32 + seededUnit(seed * 23 + i) * 0.46,
      phase: seededUnit(seed * 29 + i) * Math.PI * 2,
      spin: (seededUnit(seed * 31 + i) - 0.5) * 0.5,
      breathe: 0.8 + seededUnit(seed * 37 + i) * 0.5,
    });
  }
  return lobes;
}

function createHazards() {
  // Geologically/geographically plausible natural-disaster zones across the corridor.
  return [
    { type: "quake", name: "New Madrid seismic zone", lng: -89.6, lat: 36.55, radiusKm: 150, severity: 0.84 },
    { type: "flood", name: "Mississippi River flooding", lng: -90.7, lat: 39.55, radiusKm: 120, severity: 0.74 },
    { type: "wildfire", name: "Cross Timbers wildfire", lng: -97.9, lat: 34.45, radiusKm: 100, severity: 0.8, vlng: 0.02, vlat: 0.012 },
    { type: "ice", name: "Northern Plains ice storm", lng: -93.7, lat: 42.6, radiusKm: 125, severity: 0.62 },
  ].map((hazard) => ({ vlng: 0, vlat: 0, ...hazard }));
}

const hazardPalette = {
  quake: { rgb: [200, 137, 59], glyph: "QUAKE" },
  flood: { rgb: [58, 142, 208], glyph: "FLOOD" },
  wildfire: { rgb: [239, 106, 58], glyph: "FIRE" },
  ice: { rgb: [159, 214, 230], glyph: "ICE" },
};

function advanceWeather(dt, elapsed) {
  weatherRouting.cells.forEach((cell, index) => {
    cell.lng += cell.vlng * dt;
    cell.lat += cell.vlat * dt;
    if (cell.lng < weatherBounds.minLng || cell.lng > weatherBounds.maxLng) cell.vlng *= -1;
    if (cell.lat < weatherBounds.minLat || cell.lat > weatherBounds.maxLat) cell.vlat *= -1;
    cell.lng = Math.min(weatherBounds.maxLng, Math.max(weatherBounds.minLng, cell.lng));
    cell.lat = Math.min(weatherBounds.maxLat, Math.max(weatherBounds.minLat, cell.lat));
    cell.intensity = Math.min(1, Math.max(0.16, cell.base * (0.78 + 0.22 * Math.sin(elapsed * 0.5 + index))));
  });
}

function advanceHazards(dt, elapsed) {
  weatherRouting.hazards.forEach((hazard, index) => {
    hazard.lng += (hazard.vlng || 0) * dt;
    hazard.lat += (hazard.vlat || 0) * dt;
    // Gentle pulsing so the disaster zones feel alive (quakes/fires flicker more).
    const wobble = hazard.type === "quake" || hazard.type === "wildfire" ? 0.14 : 0.07;
    hazard.intensity = Math.min(1, Math.max(0.2, hazard.severity * (1 - wobble + wobble * Math.sin(elapsed * 0.9 + index))));
  });
}

function weatherIntensityAt(point) {
  let max = 0;
  for (const cell of weatherRouting.cells) {
    const distance = haversineKm(point, [cell.lng, cell.lat]);
    if (distance >= cell.radiusKm) continue;
    const falloff = 1 - distance / cell.radiusKm;
    const value = cell.intensity * falloff * falloff * (3 - 2 * falloff);
    if (value > max) max = value;
  }
  return max;
}

function hazardIntensityAt(point) {
  let max = 0;
  for (const hazard of weatherRouting.hazards) {
    const distance = haversineKm(point, [hazard.lng, hazard.lat]);
    if (distance >= hazard.radiusKm) continue;
    const falloff = 1 - distance / hazard.radiusKm;
    const value = (hazard.intensity || hazard.severity) * falloff * falloff * (3 - 2 * falloff);
    if (value > max) max = value;
  }
  return max;
}

// Combined danger from live weather and geological/natural-disaster hazards.
function riskAt(point) {
  return Math.max(weatherIntensityAt(point), hazardIntensityAt(point));
}

function densifyLngLat(via, perSegment = 18) {
  const points = [];
  for (let i = 0; i < via.length - 1; i += 1) {
    for (let step = 0; step < perSegment; step += 1) {
      points.push(interpolateLngLat(via[i], via[i + 1], step / perSegment));
    }
  }
  points.push(via[via.length - 1]);
  return points;
}

function routeMiles(points) {
  let km = 0;
  for (let i = 1; i < points.length; i += 1) km += haversineKm(points[i - 1], points[i]);
  return km * 0.621371;
}

function scoreLane(points) {
  let sum = 0;
  let peak = 0;
  let count = 0;
  const step = Math.max(1, Math.floor(points.length / 50));
  for (let i = 0; i < points.length; i += step) {
    const value = riskAt(points[i]);
    sum += value;
    if (value > peak) peak = value;
    count += 1;
  }
  const average = count ? sum / count : 0;
  // Penalize the single worst exposure heavily so the router avoids driving through a core.
  return average + peak * 1.7;
}

function weatherTruckIcon(severity) {
  return L.divIcon({
    className: "leaflet-truck-icon",
    html: `<div class="wx-truck ${severity}"><span class="wx-truck-pin"></span><span class="wx-truck-label"><strong>WX-1</strong><em>Weather-optimized</em></span></div>`,
    iconSize: [176, 46],
    iconAnchor: [13, 23],
  });
}

function createRadarLayer() {
  const layer = new L.Layer();
  let canvas = null;
  let ctx = null;
  let map = null;

  function reposition() {
    if (!canvas || !map) return;
    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);
    const size = map.getSize();
    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x;
      canvas.height = size.y;
    }
    drawRadar();
  }

  function drawRadar() {
    if (!ctx || !map) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const clock = weatherRouting.clock;
    // Geological / natural-disaster hazard zones (the colored glows under ICE/FIRE/etc).
    weatherRouting.hazards.forEach((hazard) => drawHazardZone(ctx, map, canvas, hazard, clock));
    // Precipitation cells (green radar blobs) disabled for the embedded map.
    // weatherRouting.cells.forEach((cell) => drawStormCell(ctx, map, canvas, cell, clock));
    ctx.globalCompositeOperation = "source-over";
  }

  layer.onAdd = function onAdd(targetMap) {
    map = targetMap;
    canvas = L.DomUtil.create("canvas", "wx-radar-canvas");
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    ctx = canvas.getContext("2d");
    const pane = map.getPanes().overlayPane;
    pane.insertBefore(canvas, pane.firstChild); // sit beneath the route lines, above tiles
    map.on("move zoom moveend zoomend resize viewreset zoomanim", reposition);
    reposition();
    return this;
  };

  layer.onRemove = function onRemove(targetMap) {
    if (canvas) L.DomUtil.remove(canvas);
    targetMap.off("move zoom moveend zoomend resize viewreset zoomanim", reposition);
    canvas = null;
    ctx = null;
  };

  layer.redraw = drawRadar;
  return layer;
}

function radarColor(value, alpha) {
  value = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const stops = [
    [0.0, [46, 197, 107]],
    [0.35, [191, 233, 74]],
    [0.5, [244, 224, 77]],
    [0.68, [246, 164, 74]],
    [0.85, [239, 77, 82]],
    [1.0, [198, 77, 255]],
  ];
  let low = stops[0];
  let high = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (value >= stops[i][0] && value <= stops[i + 1][0]) {
      low = stops[i];
      high = stops[i + 1];
      break;
    }
  }
  const span = high[0] - low[0];
  const t = span <= 0 ? 0 : (value - low[0]) / span;
  const channel = (k) => Math.round(low[1][k] + (high[1][k] - low[1][k]) * t);
  return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${alpha})`;
}

function kmToPx(map, lat, km) {
  const lngPerKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));
  const a = map.latLngToContainerPoint([lat, 0]);
  const b = map.latLngToContainerPoint([lat, km * lngPerKm]);
  return Math.abs(b.x - a.x);
}

function offscreen(center, radius, canvas) {
  return center.x < -radius || center.x > canvas.width + radius || center.y < -radius || center.y > canvas.height + radius;
}

function drawStormCell(ctx, map, canvas, cell, clock) {
  const center = map.latLngToContainerPoint([cell.lat, cell.lng]);
  const radius = Math.max(12, kmToPx(map, cell.lat, cell.radiusKm));
  if (offscreen(center, radius, canvas)) return;

  ctx.globalCompositeOperation = "lighter";

  // Soft outer envelope.
  const envelope = ctx.createRadialGradient(center.x, center.y, radius * 0.1, center.x, center.y, radius);
  envelope.addColorStop(0, radarColor(cell.intensity * 0.5, 0.16));
  envelope.addColorStop(1, "rgba(46, 197, 107, 0)");
  ctx.fillStyle = envelope;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Drifting lobes give the storm an organic, animated structure.
  cell.lobes.forEach((lobe) => {
    const angle = lobe.angle + lobe.spin * clock;
    const breathe = 0.82 + 0.18 * Math.sin(clock * lobe.breathe + lobe.phase);
    const lx = center.x + Math.cos(angle) * lobe.dist * radius;
    const ly = center.y + Math.sin(angle) * lobe.dist * radius;
    const lr = Math.max(4, lobe.size * radius * breathe);
    const value = cell.intensity * (0.72 + 0.28 * Math.sin(clock * 0.8 + lobe.phase));
    const gradient = ctx.createRadialGradient(lx, ly, lr * 0.05, lx, ly, lr);
    gradient.addColorStop(0, radarColor(value, 0.82));
    gradient.addColorStop(0.45, radarColor(value * 0.7, 0.42));
    gradient.addColorStop(1, "rgba(46, 197, 107, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(lx, ly, lr, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalCompositeOperation = "source-over";
}

function drawHazardZone(ctx, map, canvas, hazard, clock) {
  const center = map.latLngToContainerPoint([hazard.lat, hazard.lng]);
  const radius = Math.max(12, kmToPx(map, hazard.lat, hazard.radiusKm));
  if (offscreen(center, radius, canvas)) return;

  const palette = hazardPalette[hazard.type] || hazardPalette.quake;
  const [r, g, b] = palette.rgb;
  ctx.globalCompositeOperation = "source-over";

  const zone = ctx.createRadialGradient(center.x, center.y, radius * 0.1, center.x, center.y, radius);
  zone.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
  zone.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.12)`);
  zone.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = zone;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.setLineDash([6, 7]);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.72)`;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 0.93, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (hazard.type === "quake") {
    for (let k = 0; k < 3; k += 1) {
      const t = (clock * 0.5 + k / 3) % 1;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.5 * (1 - t)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius * 0.18 + t * radius * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (hazard.type === "wildfire") {
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 5; k += 1) {
      const angle = (k / 5) * Math.PI * 2 + clock * 0.6;
      const fx = center.x + Math.cos(angle) * radius * 0.4;
      const fy = center.y + Math.sin(angle) * radius * 0.4;
      const fr = radius * 0.34 * (0.7 + 0.3 * Math.sin(clock * 3 + k));
      const fire = ctx.createRadialGradient(fx, fy, 1, fx, fy, fr);
      fire.addColorStop(0, "rgba(255, 184, 64, 0.55)");
      fire.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.32)`);
      fire.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = fire;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  } else if (hazard.type === "flood") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.42)`;
    ctx.lineWidth = 1.4;
    for (let yy = -radius; yy < radius; yy += 10) {
      ctx.beginPath();
      for (let xx = -radius; xx <= radius; xx += 8) {
        const y = center.y + yy + Math.sin(xx * 0.06 + clock * 2 + yy) * 2.4;
        if (xx === -radius) ctx.moveTo(center.x + xx, y);
        else ctx.lineTo(center.x + xx, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  } else if (hazard.type === "ice") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.32)`;
    ctx.lineWidth = 1;
    for (let o = -radius; o < radius; o += 13) {
      ctx.beginPath();
      ctx.moveTo(center.x - radius, center.y + o);
      ctx.lineTo(center.x + radius, center.y + o - radius);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(center.x - radius, center.y + o);
      ctx.lineTo(center.x + radius, center.y + o + radius);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function hazardLabelIcon(hazard) {
  const glyph = (hazardPalette[hazard.type] || {}).glyph || "HAZARD";
  return L.divIcon({
    className: "leaflet-label-icon",
    html: `<div class="hazard-label ${hazard.type}"><span class="hazard-tag">${glyph}</span><span class="hazard-text"><strong>${hazard.name}</strong><em>Avoid zone</em></span></div>`,
    iconSize: [210, 42],
    iconAnchor: [12, 21],
  });
}

function setupWeatherRouting() {
  if (!state.mapReady || !window.L || weatherRouting.ready) return;

  weatherRouting.cells = createWeatherCells();
  weatherRouting.hazards = createHazards();
  weatherRouting.hazards.forEach((hazard) => {
    hazard.intensity = hazard.severity;
    hazard.marker = L.marker(latLng([hazard.lng, hazard.lat]), {
      icon: hazardLabelIcon(hazard),
      interactive: false,
      opacity: 0,
      zIndexOffset: 500,
    }).addTo(mapObjects.map);
    weatherRouting.hazardLabels.push(hazard.marker);
  });

  weatherRouting.lanes = weatherLaneDefs.map((def) => {
    const points = densifyLngLat(def.via, 18);
    const line = L.polyline(toLatLngs(points), {
      color: "#7c8b97",
      weight: 3,
      opacity: 0,
      dashArray: "2 12",
      lineCap: "round",
      lineJoin: "round",
    }).addTo(mapObjects.map);
    return { ...def, points, line, miles: routeMiles(points), score: Infinity };
  });
  weatherRouting.baselineMiles = Math.min(...weatherRouting.lanes.map((lane) => lane.miles));
  weatherRouting.activeKey = "central";

  weatherRouting.truckMarker = L.marker(latLng(cities.oklahomaCity), {
    icon: weatherTruckIcon("clear"),
    interactive: true,
    zIndexOffset: 700,
    opacity: 0,
  }).addTo(mapObjects.map);
  weatherRouting.truckMarker.on("click", toggleWeatherFollow);
  weatherRouting.truckSeverity = "clear";

  weatherRouting.radarLayer = createRadarLayer();

  weatherRouting.dom = {
    hud: document.getElementById("wxHud"),
    status: document.getElementById("wxStatus"),
    detail: document.getElementById("wxDetail"),
    lane: document.getElementById("wxLane"),
    avoided: document.getElementById("wxAvoided"),
    added: document.getElementById("wxAdded"),
    legend: document.getElementById("radarLegend"),
    toggle: document.getElementById("weatherToggle"),
    follow: document.getElementById("wxFollow"),
  };

  weatherRouting.ready = true;
  applyWeatherVisibility();
}

function toggleWeatherFollow() {
  if (!weatherRouting.ready || !weatherRoutingShowing()) return;
  weatherRouting.follow = !weatherRouting.follow;
  if (weatherRouting.follow) {
    const target = weatherRouting.lastTruckPos || cities.oklahomaCity;
    mapObjects.map.flyTo(latLng(target), weatherRouting.followZoom, { duration: 1.0 });
    // Let the zoom-in fly finish before the gentle follow-pan takes over (otherwise the
    // pan, which keeps the current zoom, would cancel the fly before it reaches followZoom).
    weatherRouting.followHoldUntil = performance.now() + 1250;
  } else {
    focusCamera(0);
  }
  updateFollowButton();
}

function updateFollowButton() {
  const button = weatherRouting.dom && weatherRouting.dom.follow;
  if (!button) return;
  button.textContent = weatherRouting.follow ? "Exit follow" : "Zoom to truck";
  button.classList.toggle("active", weatherRouting.follow);
}

function weatherRoutingShowing() {
  return weatherRouting.ready && weatherRouting.enabled && !state.demoRunning;
}

function applyWeatherVisibility() {
  if (!weatherRouting.ready) return;
  const showing = weatherRoutingShowing();

  if (weatherRouting.radarLayer) {
    const hasRadar = mapObjects.map.hasLayer(weatherRouting.radarLayer);
    if (showing && !hasRadar) weatherRouting.radarLayer.addTo(mapObjects.map);
    else if (!showing && hasRadar) mapObjects.map.removeLayer(weatherRouting.radarLayer);
  }

  weatherRouting.lanes.forEach((lane) => {
    const isActive = lane.key === weatherRouting.activeKey;
    lane.line.setStyle({ opacity: showing ? (isActive ? 0.96 : 0.26) : 0 });
  });
  if (weatherRouting.truckMarker) weatherRouting.truckMarker.setOpacity(showing ? 1 : 0);
  weatherRouting.hazardLabels.forEach((marker) => marker.setOpacity(showing ? 1 : 0));

  if (!showing && weatherRouting.follow) {
    weatherRouting.follow = false;
    updateFollowButton();
  }

  const dom = weatherRouting.dom;
  if (dom) {
    if (dom.hud) dom.hud.classList.toggle("visible", showing);
    if (dom.legend) dom.legend.classList.toggle("visible", showing);
    if (dom.toggle) dom.toggle.classList.toggle("active", weatherRouting.enabled);
  }
}

function updateWeatherRouting(now) {
  if (!weatherRouting.ready) return;

  const showing = weatherRoutingShowing();
  if (showing !== weatherRouting.wasShowing) {
    applyWeatherVisibility();
    weatherRouting.wasShowing = showing;
  }
  if (!showing) return;

  const elapsed = now / 1000;
  const dt = weatherRouting.lastTick ? Math.min(0.05, (now - weatherRouting.lastTick) / 1000) : 0.016;
  weatherRouting.lastTick = now;
  weatherRouting.clock = elapsed;

  advanceWeather(dt, elapsed);
  advanceHazards(dt, elapsed);

  let best = weatherRouting.lanes[0];
  weatherRouting.lanes.forEach((lane) => {
    lane.score = scoreLane(lane.points);
    if (lane.score < best.score) best = lane;
  });

  const active = weatherRouting.lanes.find((lane) => lane.key === weatherRouting.activeKey) || best;
  // Hysteresis: only reroute when another lane is meaningfully clearer, and not too often.
  if (best.key !== active.key && best.score < active.score - 0.16 && elapsed - weatherRouting.lastReroute > 2.4) {
    weatherRouting.activeKey = best.key;
    weatherRouting.avoided += 1;
    weatherRouting.lastReroute = elapsed;
    weatherRouting.rerouteFlashUntil = elapsed + 3.4;
  }
  const activeLane = weatherRouting.lanes.find((lane) => lane.key === weatherRouting.activeKey);

  weatherRouting.truckProgress += dt * 0.02;
  if (weatherRouting.truckProgress >= 1) weatherRouting.truckProgress = 0.02;
  const position = pointAlongRoute(activeLane.points, weatherRouting.truckProgress);
  weatherRouting.lastTruckPos = position;
  const exposure = riskAt(position);
  weatherRouting.truckMarker.setLatLng(latLng(position));

  const severity = exposure > 0.6 ? "severe" : exposure > 0.32 ? "watch" : "clear";
  if (severity !== weatherRouting.truckSeverity) {
    weatherRouting.truckMarker.setIcon(weatherTruckIcon(severity));
    weatherRouting.truckSeverity = severity;
  }

  if (weatherRouting.follow && now > weatherRouting.followHoldUntil && now - weatherRouting.lastFollowAt > 360) {
    mapObjects.map.panTo(latLng(position), { animate: true, duration: 0.4 });
    weatherRouting.lastFollowAt = now;
  }

  weatherRouting.lanes.forEach((lane) => {
    const isActive = lane.key === weatherRouting.activeKey;
    lane.line.setStyle({
      color: isActive ? "#38d3dc" : "#7c8b97",
      weight: isActive ? 5 : 3,
      opacity: isActive ? 0.96 : 0.24,
      dashArray: isActive ? "1 13" : "2 13",
    });
    if (isActive) lane.line.bringToFront();
  });

  if (now - weatherRouting.lastRadarDraw > 40) {
    weatherRouting.lastRadarDraw = now;
    if (weatherRouting.radarLayer && weatherRouting.radarLayer.redraw) weatherRouting.radarLayer.redraw();
  }

  updateWeatherHud(activeLane, exposure, elapsed);
}

function updateWeatherHud(activeLane, exposure, elapsed) {
  const dom = weatherRouting.dom;
  if (!dom || !dom.hud) return;

  const rerouting = elapsed < weatherRouting.rerouteFlashUntil;

  // Name the single biggest threat right now, whether it's weather or a natural disaster.
  let worst = null;
  weatherRouting.cells.forEach((cell) => {
    if (!worst || cell.intensity > worst.weight) worst = { name: cell.name, weight: cell.intensity };
  });
  weatherRouting.hazards.forEach((hazard) => {
    const weight = (hazard.intensity || hazard.severity) * 1.05; // hazards are weighted as serious
    if (!worst || weight > worst.weight) worst = { name: hazard.name, weight };
  });

  const added = Math.max(0, Math.round(activeLane.miles - weatherRouting.baselineMiles));

  dom.hud.classList.toggle("rerouting", rerouting);
  dom.status.textContent = rerouting
    ? "Rerouting around a hazard"
    : exposure > 0.5
      ? "Elevated risk on active lane"
      : "Clearest lane locked in";
  dom.detail.textContent = worst
    ? `Steering clear of ${worst.name} — holding the ${activeLane.label} corridor.`
    : `Holding the ${activeLane.label} corridor.`;
  dom.lane.textContent = activeLane.label;
  dom.avoided.textContent = String(weatherRouting.avoided);
  dom.added.textContent = `${added} mi`;
}

function hideScriptedMapLayers() {
  mapObjects.original.setStyle({ opacity: 0 });
  mapObjects.originalShadow.setStyle({ opacity: 0 });
  mapObjects.feeder.setStyle({ opacity: 0 });
  mapObjects.feederShadow.setStyle({ opacity: 0 });
  mapObjects.rescue.setStyle({ opacity: 0 });
  mapObjects.rescueShadow.setStyle({ opacity: 0 });
  mapObjects.final.setStyle({ opacity: 0 });
  mapObjects.finalShadow.setStyle({ opacity: 0 });
  mapObjects.weatherCircle.setStyle({ opacity: 0, fillOpacity: 0 });
  mapObjects.incident.setOpacity(0);
  mapObjects.handoff.setOpacity(0);
  truckOrder.forEach((id) => {
    const marker = mapObjects.truckMarkers[id];
    if (marker) marker.setOpacity(0);
    const lines = mapObjects.trackLines[id];
    if (lines) {
      lines.full.setStyle({ opacity: 0 });
      lines.progress.setStyle({ opacity: 0 });
      lines.progressShadow.setStyle({ opacity: 0 });
    }
  });
}

elements.weatherToggle.addEventListener("click", () => {
  weatherRouting.enabled = !weatherRouting.enabled;
  applyWeatherVisibility();
  weatherRouting.wasShowing = weatherRoutingShowing();
});

if (elements.wxFollow) elements.wxFollow.addEventListener("click", toggleWeatherFollow);

elements.runDemo.addEventListener("click", runHeroMoment);
elements.resetView.addEventListener("click", () => {
  state.followTruck = false;
  focusCamera(Math.max(0, state.currentPhaseIndex));
});
elements.zoomIn.addEventListener("click", () => {
  if (state.mapReady) mapObjects.map.zoomIn();
});
elements.zoomOut.addEventListener("click", () => {
  if (state.mapReady) mapObjects.map.zoomOut();
});
elements.pitchToggle.addEventListener("click", () => setMapMode(!state.satelliteMode));
elements.trackAll.addEventListener("click", () => {
  state.visibleTrucks = new Set(truckOrder);
  renderTrackerPanel();
  fitTrackedTrucks();
});
elements.streetZoom.addEventListener("click", () => {
  setMapMode(true);
  focusTruck(state.selectedTruckId, true);
});
window.addEventListener("resize", () => {
  if (state.mapReady) {
    mapObjects.map.invalidateSize();
    if (!weatherRouting.follow) focusCamera(Math.max(0, state.currentPhaseIndex), true);
  }
});

renderLoads("normal");
renderTools(phasePlan[0].tools);
renderTimeline(0);
setPhase(0);
setMapMode(true);
initMap();
requestAnimationFrame(frame);
