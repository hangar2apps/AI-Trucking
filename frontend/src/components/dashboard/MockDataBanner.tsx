export function MockDataBanner() {
  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-900"
    >
      <strong>Offline demo mode</strong> — showing sample data. Start the backend at{" "}
      <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">localhost:8000</code>{" "}
      for live fleet, routes, and weather.
    </div>
  );
}
