import React, { useState } from 'react';
import api from '../api/api';

function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export default function ScanDiaryPage() {
  const [scanning, setScanning] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [outputText, setOutputText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setErrorMsg('');
    setSuccessMsg('');
    setSelectedFileName(file.name);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await api.post('/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const cleanedText = normalizeText(res.data.extractedText || '');
      setOutputText(cleanedText);
      setSuccessMsg('Scan complete. Your extracted text is shown below.');
    } catch (err) {
      console.error(err);
      setOutputText('');
      setErrorMsg(err.response?.data?.error || 'Failed to scan the PDF.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:px-8" style={{ color: 'var(--text)' }}>
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-h)' }}>
            Scan Diary
          </h1>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
            Upload a PDF and see the extracted diary text appear in a clean box below.
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-start gap-2 rounded-2xl border border-dashed border-slate-600 bg-slate-800/70 px-4 py-5 transition hover:border-sky-400">
          <span className="text-sm font-medium" style={{ color: 'var(--text-h)' }}>
            Choose PDF file
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {selectedFileName || 'No file selected yet'}
          </span>
          <input type="file" accept="application/pdf" onChange={handleScan} className="hidden" />
        </label>

        {scanning && (
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            Scanning your PDF...
          </p>
        )}

        {successMsg && (
          <p className="mt-4 text-sm" style={{ color: '#8be5ff' }}>
            {successMsg}
          </p>
        )}

        {errorMsg && (
          <p className="mt-4 text-sm text-red-300">
            {errorMsg}
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-h)' }}>
            Extracted output
          </div>
          <div
            className="min-h-[220px] max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-6"
            style={{ color: 'var(--text)', whiteSpace: 'normal' }}
          >
            {outputText ? outputText : 'Your scanned text will appear here in a compact single-spaced format.'}
          </div>
        </div>
      </div>
    </main>
  );
}
