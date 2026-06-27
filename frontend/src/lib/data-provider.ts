import {
  api,
  type AgentRunResult,
  type ComputeEtaResult,
  type EmailDraftResponse,
  type EmailDraftSendResponse,
  type FleetEvent,
  type InquiryReplyResponse,
  type InquiryRequestPayload,
  type InquirySendResponse,
  type InboundProcessResponse,
  type InboundSimulatePayload,
  type InboxItem,
  type InboxResponse,
  type Load,
  type LoadDetail,
  type SimStatus,
  type Truck,
  type WeatherRouteResult,
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

export async function getEvents(sinceId = 0): Promise<FleetEvent[]> {
  return api.getEvents(sinceId);
}

export async function getSimStatus(): Promise<SimStatus> {
  return api.getSimStatus();
}

export async function startSimulation(): Promise<SimStatus> {
  return api.startSim();
}

export async function stopSimulation(): Promise<SimStatus> {
  return api.stopSim();
}

export async function checkWeatherForLoad(load: Load): Promise<WeatherRouteResult> {
  return api.checkWeatherRoute({
    origin_lat: load.origin_lat,
    origin_lng: load.origin_lng,
    dest_lat: load.dest_lat,
    dest_lng: load.dest_lng,
  });
}

export async function computeEtaForLoad(
  load: Load,
  truckId: number
): Promise<ComputeEtaResult> {
  return api.computeEta({
    truck_id: truckId,
    dest_lat: load.dest_lat,
    dest_lng: load.dest_lng,
  });
}

export async function runAgentBrain(
  situation: string,
  dryRun = true
): Promise<AgentRunResult> {
  return api.runAgent(situation, dryRun);
}

export async function respondToInquiry(
  payload: InquiryRequestPayload
): Promise<InquiryReplyResponse> {
  return api.respondToInquiry(payload);
}

export async function sendInquiryReply(
  payload: InquiryRequestPayload
): Promise<InquirySendResponse> {
  return api.sendInquiryReply(payload);
}

export async function simulateInboundEmail(
  payload: InboundSimulatePayload
): Promise<InboundProcessResponse> {
  return api.simulateInboundEmail(payload);
}

export async function getAssistantInbox(limit = 40): Promise<InboxResponse> {
  return api.getAssistantInbox(limit);
}

export { DEMO_LOAD_REFERENCE };
