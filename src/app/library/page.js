"use client";

import { useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { DOCUMENT_CATEGORIES } from "@/lib/guidance";
import { indexDocument, mergeIndexedGuidance } from "@/lib/documentExtractor";

export default function LibraryPage() {
  const { data, setData } = useData();
  const [docForm, setDocForm] = useState({ title: "", category: DOCUMENT_CATEGORIES[0], file: null, pastedText: "" });
  const [indexMessage, setIndexMessage] = useState("");
  const [indexing, setIndexing] = useState(false);

  async function handleDocSubmit(e) {
    e.preventDefault();
    if (!docForm.title || (!docForm.file && !docForm.pastedText.trim())) return;

    let dataUrl = "";
    let fileName = "pasted-text.txt";
    if (docForm.file) {
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(docForm.file);
      });
      fileName = docForm.file.name;
    }

    const row = {
      id: crypto.randomUUID(),
      title: docForm.title,
      category: docForm.category,
      fileName,
      dataUrl,
      pastedText: docForm.pastedText.trim() || undefined,
      uploadedAt: new Date().toISOString(),
      indexed: false,
    };

    setData((prev) => ({ ...prev, docs: [row, ...prev.docs] }));
    setDocForm({ title: "", category: DOCUMENT_CATEGORIES[0], file: null, pastedText: "" });
    const fileInput = document.getElementById("doc-file");
    if (fileInput) fileInput.value = "";

    if (docForm.pastedText.trim() || fileName.endsWith(".txt")) {
      await handleIndex(row, data.interventionsMaster);
    }
  }

  async function handleIndex(doc, interventions = data.interventionsMaster) {
    setIndexing(true);
    setIndexMessage(`Indexing "${doc.title}"…`);
    try {
      const result = await indexDocument(doc, interventions);
      if (!result.ok) {
        setIndexMessage(result.message);
        return;
      }
      setData((prev) => {
        const merged = mergeIndexedGuidance(prev, result.technicalGuidance, result.interventionImplementationGuidance, doc.id);
        return {
          ...prev,
          ...merged,
          docs: prev.docs.map((d) => (d.id === doc.id ? { ...d, indexed: true, indexedAt: new Date().toISOString() } : d)),
        };
      });
      setIndexMessage(result.message);
    } catch (err) {
      setIndexMessage(`Indexing failed: ${err.message}`);
    } finally {
      setIndexing(false);
    }
  }

  return (
    <main className="container">
      <div className="card-header-row">
        <div>
          <h1>Guidelines / PFRMP Manual Library</h1>
          <p className="sub">
            Upload Implementation Guidelines and PFRMP Manual documents. Technical guidance is extracted and linked to interventions after indexing.
          </p>
        </div>
        <Link href="/library/guidance" className="btn-link">Review &amp; Approve Guidance →</Link>
      </div>

      <section className="grid">
        <div className="card col-6">
          <h3>Upload Document</h3>
          <form onSubmit={handleDocSubmit}>
            <label>Title</label>
            <input value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} required />
            <label>Category</label>
            <select value={docForm.category} onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label>File (PDF, DOCX, XLSX, images, .txt)</label>
            <input
              id="doc-file"
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.txt"
              onChange={(e) => setDocForm({ ...docForm, file: e.target.files?.[0] || null })}
            />
            <label>Or paste guideline text (for indexing)</label>
            <textarea
              rows={6}
              value={docForm.pastedText}
              onChange={(e) => setDocForm({ ...docForm, pastedText: e.target.value })}
              placeholder="Paste text from Implementation Guidelines for automatic intervention matching…"
            />
            <button type="submit">Upload</button>
          </form>
          <p className="small">
            For PDF/DOCX files, paste the relevant text above or use the Review page to manually link sections.
            Indexed guidance shows on intervention detail pages with source references.
          </p>
        </div>

        <div className="card col-6">
          <h3>Document Library ({data.docs.length})</h3>
          <div className="list">
            {data.docs.length === 0 && <p className="small">No documents uploaded.</p>}
            {data.docs.map((doc) => (
              <div key={doc.id} className="item">
                <strong>{doc.title}</strong>
                <div className="small">{doc.category} | {doc.fileName}</div>
                <div className="small">{doc.indexed ? "Indexed" : "Pending extraction"}</div>
                <div className="item-actions">
                  {doc.dataUrl && <a href={doc.dataUrl} download={doc.fileName}>Download</a>}
                  {!doc.indexed && (
                    <button type="button" className="btn-sm" disabled={indexing} onClick={() => handleIndex(doc, data.interventionsMaster)}>
                      Index Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {indexMessage && <p className="form-message">{indexMessage}</p>}
        </div>
      </section>
    </main>
  );
}
