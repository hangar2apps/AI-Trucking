"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, RefreshCw, ShieldAlert, Upload } from "lucide-react";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getInspections, isUsingMockData, uploadPhotos } from "@/lib/data-provider";
import type { InspectionItem } from "@/lib/api";

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type DamageItem = { type?: string; severity?: string; description?: string };

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [phase, setPhase] = useState<"pickup" | "delivery">("delivery");
  const [loadHint, setLoadHint] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setInspections(await getInspections(50));
    setMockMode(isUsingMockData());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const photos = await Promise.all(
        Array.from(files).map(async (file) => ({
          file_base64: await readAsBase64(file),
          name: file.name,
          media_type: file.type || undefined,
        }))
      );
      const result = await uploadPhotos({
        photos,
        phase,
        load_hint: loadHint.trim() || null,
      });
      const res = result.results[0]?.result as Record<string, unknown> | undefined;
      const damage = res?.damage_detected ? "DAMAGE flagged" : "no damage";
      setMessage(`Inspected ${photos.length} photo(s) — ${damage}.`);
      await refresh();
    } catch {
      setError(
        "Inspection failed. Make sure the backend is running and ANTHROPIC_API_KEY is set."
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="Image Inspection"
        description="Upload pickup and delivery photos. The agent detects visible damage, reads seal numbers, compares pickup vs delivery, and alerts dispatch + claims when something's wrong."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="border-[#0B5FFF]/20 bg-[#F8FBFF]">
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#374151]">Phase</label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value as "pickup" | "delivery")}
                    className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#0B5FFF]"
                  >
                    <option value="pickup">Pickup</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Load hint (optional)
                  </label>
                  <input
                    value={loadHint}
                    onChange={(e) => setLoadHint(e.target.value)}
                    placeholder="LD-1042"
                    className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#0B5FFF]"
                  />
                </div>
                <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Inspecting..." : "Upload photos"}
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) void onUpload(e.target.files);
                  }}
                />
              </div>
              <p className="text-xs text-[#9CA3AF]">
                For a delivery inspection, the agent automatically compares against the most recent
                pickup photos for the same load.
              </p>
              {message && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              )}
            </CardBody>
          </Card>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-[#0B5FFF]" />
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Inspections</h2>
            </div>
            {inspections.length === 0 ? (
              <Card>
                <CardBody>
                  <p className="text-sm text-[#6B7280]">No inspections yet.</p>
                </CardBody>
              </Card>
            ) : (
              <ul className="space-y-3">
                {inspections.map((insp) => {
                  const damageItems = (insp.findings?.damage_items as DamageItem[] | undefined) ?? [];
                  return (
                    <li key={insp.id}>
                      <Card className={insp.damage_detected ? "border-red-300" : undefined}>
                        <CardHeader className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold capitalize text-[#1A2B4A]">
                            {insp.phase} inspection
                          </span>
                          {insp.load_id && (
                            <span className="text-xs text-[#9CA3AF]">load #{insp.load_id}</span>
                          )}
                          <span
                            className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              insp.damage_detected
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {insp.damage_detected && <ShieldAlert className="h-3 w-3" />}
                            {insp.damage_detected ? "Damage detected" : "Clean"}
                          </span>
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-[#9CA3AF]">Seal: </span>
                              <span className="text-[#1A2B4A]">{insp.seal_number || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[#9CA3AF]">Photos: </span>
                              <span className="text-[#1A2B4A]">
                                {insp.file_paths?.length ?? 0}
                              </span>
                            </div>
                          </div>
                          {insp.condition_report && (
                            <p className="text-sm text-[#4B5563]">{insp.condition_report}</p>
                          )}
                          {damageItems.length > 0 && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                              <p className="text-xs font-medium text-red-800">Damage</p>
                              <ul className="mt-1 list-inside list-disc text-sm text-red-800">
                                {damageItems.map((d, i) => (
                                  <li key={i}>
                                    [{d.severity}] {d.type}: {d.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="text-xs text-[#9CA3AF]">
                            {new Date(insp.created_at).toLocaleString()}
                          </p>
                        </CardBody>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
