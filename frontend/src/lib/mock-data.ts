import type { Load, LoadDetail, Truck } from "./api";

/** Mirrors backend seed data — used only when API is offline. */
export const MOCK_TRUCKS: Truck[] = [
  {
    id: 1,
    name: "Truck 17",
    driver_name: "Sam Whitfield",
    status: "en_route",
    current_lat: 31.55,
    current_lng: -96.2,
    capacity_lbs: 44000,
  },
  {
    id: 2,
    name: "Truck 23",
    driver_name: "Lena Ortiz",
    status: "available",
    current_lat: 31.1,
    current_lng: -95.95,
    capacity_lbs: 44000,
  },
  {
    id: 3,
    name: "Truck 08",
    driver_name: "Marcus Bell",
    status: "en_route",
    current_lat: 30.27,
    current_lng: -97.74,
    capacity_lbs: 42000,
  },
  {
    id: 4,
    name: "Truck 31",
    driver_name: "Aisha Karim",
    status: "maintenance",
    current_lat: 32.78,
    current_lng: -96.8,
    capacity_lbs: 48000,
  },
];

const now = new Date();
const in90 = new Date(now.getTime() + 90 * 60 * 1000);
const in195 = new Date(now.getTime() + 195 * 60 * 1000);
const in120 = new Date(now.getTime() + 120 * 60 * 1000);
const in80 = new Date(now.getTime() + 80 * 60 * 1000);

export const MOCK_LOADS: Load[] = [
  {
    id: 1,
    reference: "LD-1042",
    status: "delayed",
    customer_id: 1,
    assigned_truck_id: 1,
    origin_name: "Dallas, TX",
    origin_lat: 32.7767,
    origin_lng: -96.797,
    dest_name: "Houston, TX",
    dest_lat: 29.7604,
    dest_lng: -95.3698,
    pickup_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    deliver_by: in90.toISOString(),
    eta: in195.toISOString(),
    commodity: "Electronic components",
    weight_lbs: 18500,
    notes: "Truck 17 lost ~2h to an I-45 closure near Corsicana.",
  },
  {
    id: 2,
    reference: "LD-1043",
    status: "in_transit",
    customer_id: 2,
    assigned_truck_id: 3,
    origin_name: "San Antonio, TX",
    origin_lat: 29.4241,
    origin_lng: -98.4936,
    dest_name: "Austin, TX",
    dest_lat: 30.2672,
    dest_lng: -97.7431,
    pickup_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    deliver_by: in120.toISOString(),
    eta: in80.toISOString(),
    commodity: "Packaged foods",
    weight_lbs: 26000,
    notes: null,
  },
  {
    id: 3,
    reference: "LD-1044",
    status: "pending",
    customer_id: 3,
    assigned_truck_id: null,
    origin_name: "Houston, TX",
    origin_lat: 29.7604,
    origin_lng: -95.3698,
    dest_name: "New Orleans, LA",
    dest_lat: 29.9511,
    dest_lng: -90.0715,
    pickup_at: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    deliver_by: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
    eta: null,
    commodity: "Medical supplies",
    weight_lbs: 9200,
    notes: "Awaiting truck assignment.",
  },
];

export const MOCK_LOAD_DETAIL: LoadDetail = {
  ...MOCK_LOADS[0],
  customer: {
    id: 1,
    name: "Maria Chen",
    company: "Lone Star Components",
    email: "maria.chen@lonestarcomponents.example",
    phone: "+1-214-555-0182",
  },
  truck: MOCK_TRUCKS[0],
};

/** Demo route for LD-1042 / Truck 17 (Dallas → Houston corridor) */
export const DEMO_ROUTE = [
  { lat: 32.7767, lng: -96.797 },
  { lat: 32.4, lng: -96.5 },
  { lat: 31.55, lng: -96.2 },
  { lat: 30.8, lng: -96.0 },
  { lat: 29.7604, lng: -95.3698 },
];

export const DEMO_LOAD_REFERENCE = "LD-1042";
