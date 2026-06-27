"use client";

export function MockDataBanner() {
  return (
    <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
      Demo mode — using offline sample data. Start the backend for live fleet data:{" "}
      <code className="rounded bg-amber-100 px-1">uv run uvicorn app.main:app --reload</code>
    </div>
  );
}
