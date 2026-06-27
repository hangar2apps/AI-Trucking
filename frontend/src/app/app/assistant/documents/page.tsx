"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, RefreshCw, Upload } from "lucide-react";
import { MockDataBanner } from "@/components/dashboard/MockDataBanner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getDocuments,
  getInvoices,
  isUsingMockData,
  uploadDocument,
} from "@/lib/data-provider";
import type { DocumentItem, InvoiceItem } from "@/lib/api";

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const FIELD_LABELS: Array<[string, string]> = [
  ["load_number", "Load #"],
  ["shipper", "Shipper"],
  ["receiver", "Receiver"],
  ["delivery_date", "Delivery date"],
  ["weight_lbs", "Weight (lbs)"],
  ["piece_count", "Pieces"],
  ["signed_by", "Signed by"],
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loadHint, setLoadHint] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const [docs, invs] = await Promise.all([getDocuments(50), getInvoices(50)]);
    setDocuments(docs);
    setInvoices(invs);
    setMockMode(isUsingMockData());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const dataUrl = await readAsBase64(file);
      const result = await uploadDocument({
        file_base64: dataUrl,
        original_name: file.name,
        media_type: file.type || undefined,
        load_hint: loadHint.trim() || null,
      });
      const docResult = result.results[0]?.result as Record<string, unknown> | undefined;
      const status = (docResult?.match_status as string) ?? "processed";
      setMessage(`Processed "${file.name}" — ${status}.`);
      await refresh();
    } catch {
      setError(
        "Document processing failed. Make sure the backend is running and ANTHROPIC_API_KEY is set."
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const invoiceFor = (docId: number) => invoices.find((i) => i.document_id === docId);

  return (
    <>
      {mockMode && <MockDataBanner />}
      <PageHeader
        title="Document Processing"
        description="Upload PODs, BOLs, and rate confirmations. The agent reads them, matches to a load, flags issues, and auto-generates an invoice from a clean POD."
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
                <div className="flex-1 min-w-[180px]">
                  <label className="mb-1 block text-xs font-medium text-[#374151]">
                    Load hint (optional, e.g. LD-1042)
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
                  {uploading ? "Processing..." : "Upload document"}
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUpload(file);
                  }}
                />
              </div>
              <p className="text-xs text-[#9CA3AF]">
                PDF or image. The agent extracts the load number, shipper, receiver, weight, piece
                count, and signature using Claude — no external OCR.
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
              <FileText className="h-5 w-5 text-[#0B5FFF]" />
              <h2 className="text-lg font-semibold text-[#1A2B4A]">Processed documents</h2>
            </div>
            {documents.length === 0 ? (
              <Card>
                <CardBody>
                  <p className="text-sm text-[#6B7280]">No documents processed yet.</p>
                </CardBody>
              </Card>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => {
                  const fields = doc.extracted_fields ?? {};
                  const invoice = invoiceFor(doc.id);
                  return (
                    <li key={doc.id}>
                      <Card>
                        <CardHeader className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold uppercase text-[#1A2B4A]">
                            {doc.doc_type}
                          </span>
                          {doc.original_name && (
                            <span className="text-xs text-[#9CA3AF]">{doc.original_name}</span>
                          )}
                          <StatusBadge status={doc.match_status} className="ml-auto" />
                        </CardHeader>
                        <CardBody className="space-y-3">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                            {FIELD_LABELS.map(([key, label]) => (
                              <div key={key} className="text-sm">
                                <span className="text-[#9CA3AF]">{label}: </span>
                                <span className="text-[#1A2B4A]">
                                  {fields[key] != null ? String(fields[key]) : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                          {doc.flags && doc.flags.length > 0 && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                              <p className="text-xs font-medium text-amber-800">Flags</p>
                              <ul className="mt-1 list-inside list-disc text-sm text-amber-800">
                                {doc.flags.map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {invoice && (
                            <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FBFF] px-3 py-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-[#1A2B4A]">
                                  Invoice {invoice.number}
                                </p>
                                <StatusBadge status={invoice.status} />
                              </div>
                              <p className="text-sm text-[#1A2B4A]">
                                ${invoice.amount.toLocaleString()}
                              </p>
                            </div>
                          )}
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
