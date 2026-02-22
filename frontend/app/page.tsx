'use client';

import { useMemo, useState } from 'react';

type Row = {
  account_number: string | null;
  account_name: string;
  y2022: number | null;
  y2023: number | null;
  y2024: number | null;
  ttm: number | null;
  mapped_coa_code: string | null;
  mapped_coa_name: string | null;
  mapping_confidence: number | null;
  confidence: number | null;
  notes: string | null;
};

type ConsolidatedResult = {
  meta: { units: string | null; ttm_present: boolean; warnings: string[] };
  rows: Row[];
};

const numFields: (keyof Row)[] = ['y2022', 'y2023', 'y2024', 'ttm', 'mapping_confidence', 'confidence'];

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [coaText, setCoaText] = useState('');
  const [result, setResult] = useState<ConsolidatedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRows = useMemo(() => (result?.rows?.length ?? 0) > 0, [result]);

  const onRun = async () => {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('pdfs', f));
      form.append('coa_csv', coaText);

      const res = await fetch('/api/consolidate', { method: 'POST', body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to consolidate');
      }
      const data = (await res.json()) as ConsolidatedResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const onCoaUpload = async (file: File) => {
    const txt = await file.text();
    setCoaText(txt);
  };

  const onDownload = async () => {
    if (!result) return;
    const res = await fetch('/api/export-xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    if (!res.ok) {
      setError('Export failed');
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consolidated.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const updateRow = (index: number, key: keyof Row, value: string) => {
    setResult((prev) => {
      if (!prev) return prev;
      const rows = [...prev.rows];
      const row = { ...rows[index] };
      if (numFields.includes(key)) {
        row[key] = value === '' ? null : Number(value);
      } else {
        row[key] = value === '' ? null : value;
      }
      rows[index] = row;
      return { ...prev, rows };
    });
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Financial Statement Consolidator</h1>

      <section className="rounded bg-white p-4 shadow space-y-4">
        <div>
          <label className="block font-medium mb-2">Upload PDFs</label>
          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="block w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">COA CSV (paste)</label>
          <textarea
            value={coaText}
            onChange={(e) => setCoaText(e.target.value)}
            className="h-36 w-full rounded border p-2"
            placeholder="code,name\n1000,Cash"
          />
          <div className="mt-2">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => e.target.files?.[0] && onCoaUpload(e.target.files[0])}
            />
          </div>
        </div>

        <button
          onClick={onRun}
          disabled={loading || files.length === 0}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run'}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </section>

      {result && (
        <section className="rounded bg-white p-4 shadow space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Units: {result.meta.units || 'Unknown'}</p>
              <p className="text-sm text-slate-600">TTM present: {String(result.meta.ttm_present)}</p>
            </div>
            <button onClick={onDownload} className="rounded bg-emerald-600 px-4 py-2 font-medium text-white">
              Download Excel
            </button>
          </div>

          {result.meta.warnings.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-amber-700">
              {result.meta.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}

          {hasRows && (
            <div className="overflow-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    {[
                      'Account #','Account Name','2022','2023','2024','TTM','Mapped COA Code','Mapped COA Name','Mapping Confidence','Confidence','Notes'
                    ].map((h) => (
                      <th key={h} className="border px-2 py-1 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr key={i}>
                      {Object.entries(r).map(([k, v]) => (
                        <td key={k} className="border p-1">
                          <input
                            className="w-full p-1"
                            value={v ?? ''}
                            onChange={(e) => updateRow(i, k as keyof Row, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
