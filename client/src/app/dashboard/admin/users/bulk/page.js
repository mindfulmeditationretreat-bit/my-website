'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const TEMPLATE_HEADERS = [
  'Full Name', 'Address', 'Phone', 'Email',
  'Interested Program', 'Interested Country to Travel',
];
const TEMPLATE_SAMPLE = [
  'Andrew Scaltz', 'California, USA', '+1 9435679832',
  'andrew.sc@gmail.com', 'Meditation & Yoga', 'Nepal',
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, TEMPLATE_SAMPLE];
  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mindful_bulk_users_template.csv';
  a.click(); URL.revokeObjectURL(url);
}

function parseCSVPreview(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  function parseLine(line) {
    const fields = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (c === ',' && !inQ) { fields.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    fields.push(cur.trim()); return fields;
  }
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter(Boolean).map((l) => parseLine(l));
  return { headers, rows };
}

export default function BulkUploadPage() {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setResults(null); setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(parseCSVPreview(ev.target.result));
    reader.readAsText(f);
  }

  async function handleUpload() {
    if (!file) return;
    setBusy(true); setError(''); setResults(null);
    try {
      const fd = new FormData();
      fd.append('csv', file);
      const res = await api.upload('/admin/users/bulk', fd);
      setResults(res);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function reset() {
    setFile(null); setPreview(null); setResults(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <>
      <Link href="/dashboard/admin/users" className="text-cream/60 hover:text-gold text-sm">← Back to users</Link>
      <div className="mt-6 mb-8">
        <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Admin</p>
        <h1 className="heading text-4xl font-light mb-2">Bulk create users</h1>
        <p className="text-cream/60">Upload a CSV to create multiple users at once. Each user receives a welcome email with their login credentials.</p>
      </div>

      {/* Step 1 — Download template */}
      <div className="card mb-6">
        <h2 className="heading text-xl mb-1">Step 1 — Download the template</h2>
        <p className="text-cream/60 text-sm mb-4">Fill it in and save as CSV. Do not change the column headers.</p>
        <div className="overflow-x-auto mb-4">
          <table className="text-sm w-full">
            <thead>
              <tr>
                {TEMPLATE_HEADERS.map((h) => (
                  <th key={h} className="text-left py-1.5 pr-6 text-gold/80 text-xs uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {TEMPLATE_SAMPLE.map((v, i) => (
                  <td key={i} className="text-cream/60 text-xs pr-6 whitespace-nowrap">{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <button onClick={downloadTemplate} className="btn-outline text-sm">⬇ Download template CSV</button>
      </div>

      {/* Step 2 — Upload */}
      <div className="card mb-6">
        <h2 className="heading text-xl mb-1">Step 2 — Upload your CSV</h2>
        <p className="text-cream/60 text-sm mb-4">Maximum 5 MB. Rows with duplicate emails are skipped automatically.</p>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="input mb-0" />
      </div>

      {/* Preview */}
      {preview && preview.rows.length > 0 && !results && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading text-xl">Preview — {preview.rows.length} row{preview.rows.length !== 1 ? 's' : ''}</h2>
            <button onClick={reset} className="text-cream/50 hover:text-gold text-sm">Clear</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-cream/50 text-xs uppercase tracking-widest">
                <tr>{preview.headers.map((h) => <th key={h} className="text-left py-2 pr-4 whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody className="text-cream/80">
                {preview.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t border-gold/10">
                    {row.map((cell, j) => <td key={j} className="py-2 pr-4 whitespace-nowrap max-w-[180px] truncate">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 10 && (
              <p className="text-cream/40 text-xs mt-2">… and {preview.rows.length - 10} more rows</p>
            )}
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <button onClick={handleUpload} disabled={busy} className="btn-primary mt-5">
            {busy ? 'Creating users…' : `Create ${preview.rows.length} user${preview.rows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="heading text-2xl mb-1">Done</h2>
              <p className="text-cream/60 text-sm">
                <span className="text-green-400">{results.created} created</span>
                {results.skipped > 0 && <span className="text-yellow-400 ml-3">{results.skipped} skipped</span>}
                <span className="text-cream/40 ml-3">of {results.total} rows</span>
              </p>
            </div>
            <button onClick={reset} className="btn-outline text-sm">Upload another</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-cream/50 text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left">Name</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Program</th>
                  <th className="text-left">Email sent</th>
                  <th className="text-left">Temp password</th>
                </tr>
              </thead>
              <tbody className="text-cream/80">
                {results.results.map((r, i) => (
                  <tr key={i} className="border-t border-gold/10">
                    <td className="py-2 pr-4">{r.email}</td>
                    <td className="pr-4 text-cream/60">{r.fullName || '—'}</td>
                    <td className="pr-4">
                      {r.status === 'created'
                        ? <span className="text-green-400">✓ created</span>
                        : <span className="text-yellow-400" title={r.reason}>⚠ skipped</span>}
                    </td>
                    <td className="pr-4 text-cream/60">{r.enrolledProgram || '—'}</td>
                    <td className="pr-4">
                      {r.status === 'created'
                        ? (r.emailSent ? <span className="text-green-400">✓ sent</span> : <span className="text-yellow-400">⚠ not sent</span>)
                        : '—'}
                    </td>
                    <td className="pr-4">
                      {r.tempPassword
                        ? <code className="text-gold text-xs">{r.tempPassword}</code>
                        : <span className="text-cream/30">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
