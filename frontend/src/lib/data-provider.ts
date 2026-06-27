import {
  api,
  type EmailDraftResponse,
  type EmailDraftSendResponse,
  type FleetEvent,
  type Load,
  type LoadDetail,
  type Truck,
} from "./api";
import {
  DEMO_LOAD_REFERENCE,
  MOCK_LOAD_DETAIL,
  MOCK_LOADS,
  MOCK_TRUCKS,
} from "./mock-data";

let usingMockData = false;

export function isUsingMockData() {
  return usingMockData;
}

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const result = await fn();
    usingMockData = false;
    return result;
  } catch {
    usingMockData = true;
    return fallback;
  }
}

export async function getTrucks(): Promise<Truck[]> {
  return withFallback(() => api.getTrucks(), MOCK_TRUCKS);
}

export async function getLoads(): Promise<Load[]> {
  return withFallback(() => api.getLoads(), MOCK_LOADS);
}

export async function getEvents(sinceId = 0): Promise<FleetEvent[]> {
  return withFallback(() => api.getEvents(sinceId), []);
}

export async function getLoad(id: number): Promise<LoadDetail> {
  return withFallback(() => api.getLoad(id), {
    ...MOCK_LOAD_DETAIL,
    ...(MOCK_LOADS.find((l) => l.id === id) ?? MOCK_LOADS[0]),
    id,
    customer: MOCK_LOAD_DETAIL.customer,
    truck:
      MOCK_TRUCKS.find(
        (t) => t.id === (MOCK_LOADS.find((l) => l.id === id) ?? MOCK_LOADS[0]).assigned_truck_id
      ) ?? MOCK_LOAD_DETAIL.truck,
  });
}

export async function draftEmail(loadId: number): Promise<EmailDraftResponse> {
  return api.draftEmail(loadId);
}

export async function sendCustomerEmail(
  loadId: number
): Promise<EmailDraftSendResponse> {
  return api.sendCustomerEmail(loadId);
}

export async function findDemoLoad(): Promise<Load | undefined> {
  const loads = await getLoads();
  return loads.find((l) => l.reference === DEMO_LOAD_REFERENCE) ?? loads[0];
}

export async function findBackupTruck(): Promise<Truck | undefined> {
  const trucks = await getTrucks();
  return (
    trucks.find((t) => t.name === "Truck 23") ??
    trucks.find((t) => t.status === "available") ??
    undefined
  );
}

export { DEMO_LOAD_REFERENCE };
