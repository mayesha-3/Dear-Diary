import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

export default function ScanDiaryPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [outputText, setOutputText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setErrorMsg("");
    setSuccessMsg("");
    setSelectedFileName(file.name);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await api.post("/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const cleanedText = normalizeText(res.data.extractedText || "");
      setOutputText(cleanedText);
      setSuccessMsg("Scan complete. Your extracted text is shown below.");
    } catch (err) {
      console.error(err);
      setOutputText("");
      setErrorMsg(err.response?.data?.error || "Failed to scan the PDF.");
    } finally {
      setScanning(false);
    }
  };

  const handleCreateEntry = () => {
    if (!outputText) return;
    // Navigate to /new passing the scanned text in location state
    navigate("/new", { state: { scannedContent: outputText } });
  };

  return (
    <main
      className="min-h-screen px-4 py-8 md:px-8 transition-colors duration-300"
      style={{ color: "var(--text)" }}>
      <div
        className="mx-auto max-w-4xl rounded-[32px] border p-6 md:p-8 shadow-2xl backdrop-blur transition-colors"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}>
        <div className="mb-6">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-h)" }}>
            Scan Diary
          </h1>
          <p
            className="mt-2 text-sm leading-6"
            style={{ color: "var(--text-muted)" }}>
            Upload a PDF document to extract text via the AI pipeline.
          </p>
        </div>

        {/* Upload Dropzone */}
        <label
          className="flex cursor-pointer flex-col items-start gap-2 rounded-2xl border-2 border-dashed px-5 py-6 transition-all hover:opacity-90"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
          }}>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-h)" }}>
            📄 Choose PDF file
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {selectedFileName || "No file selected yet"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleScan}
            className="hidden"
          />
        </label>

        {scanning && (
          <p
            className="mt-4 text-sm font-medium animate-pulse"
            style={{ color: "var(--accent-2, #5b7cff)" }}>
            Scanning your PDF... extracting text...
          </p>
        )}

        {successMsg && (
          <p
            className="mt-4 text-sm font-medium"
            style={{ color: "var(--accent-strong, #10b981)" }}>
            {successMsg}
          </p>
        )}

        {errorMsg && (
          <p className="mt-4 text-sm font-medium text-red-500">{errorMsg}</p>
        )}

        {/* Extracted Output Container */}
        <div
          className="mt-6 rounded-2xl border p-4 transition-colors"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
          }}>
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-h)" }}>
              Extracted Output
            </span>
            {outputText && (
              <button
                type="button"
                onClick={handleCreateEntry}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: "var(--accent-strong)",
                  color: "#ffffff",
                }}>
                Create Entry with Text →
              </button>
            )}
          </div>

          <div
            className="min-h-[220px] max-h-[420px] overflow-auto rounded-xl border p-4 text-sm leading-relaxed transition-colors font-mono"
            style={{
              background: "var(--surface-3)",
              borderColor: "var(--border)",
              color: "var(--text)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
            {outputText ||
              "Your scanned text will appear here in a clean, formatted block."}
          </div>
        </div>
      </div>
    </main>
  );
}
