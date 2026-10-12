import { useEffect, useState } from 'react';
import { Chunk, Document } from '../../shared/types';

interface Props { document: Document; onDelete: (documentId: string) => void; onIndexed: () => void }

export function DocumentDetail({ document, onDelete, onIndexed }: Props) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [showChunks, setShowChunks] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  useEffect(() => { void window.knowledgeBase.indexing.chunks(document.id).then(setChunks); }, [document.id]);
  const handleIndex = async () => { setIsIndexing(true); try { await window.knowledgeBase.indexing.start(document.id); await window.knowledgeBase.indexing.chunks(document.id).then(setChunks); onIndexed(); } finally { setIsIndexing(false); } };
  return (
    <article className="document-detail">
      <div className="detail-topline"><span className="eyebrow">Document</span><button className="quiet-button danger" onClick={() => onDelete(document.id)}>Remove</button></div>
      <div className="detail-heading"><div className="detail-file-icon">{document.filename.toLowerCase().endsWith('.md') ? 'M' : 'T'}</div><div><h3>{document.title}</h3><p>{document.filename}</p></div></div>
      <div className="metadata-grid"><div><span>Added</span><strong>{new Date(document.importedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong></div><div><span>Size</span><strong>{(document.size / 1024).toFixed(1)} KB</strong></div><div><span>Chunks</span><strong>{document.chunks ?? (chunks.length || 'Not indexed')}</strong></div><div><span>State</span><strong className={`text-${document.status}`}>{document.status === 'indexed' ? 'Indexed' : 'Needs index'}</strong></div></div>
      <div className="detail-actions"><button className="button button-primary" onClick={() => void handleIndex()} disabled={isIndexing}>{isIndexing ? 'Indexing...' : document.status === 'indexed' ? 'Re-index document' : 'Index document'} <span aria-hidden="true">↗</span></button><button className="button button-secondary" onClick={() => setShowChunks(value => !value)}>{showChunks ? 'Hide chunks' : 'View chunks'} <span aria-hidden="true">{showChunks ? '↑' : '↓'}</span></button></div>
      {showChunks && <div className="chunk-list">{chunks.length === 0 ? <div className="chunk-empty">No chunks yet. Index this document to make it searchable.</div> : chunks.map(chunk => <div className="chunk-row" key={chunk.id}><div className="chunk-label">CHUNK {String(chunk.index + 1).padStart(2, '0')} <span>{chunk.metadata.charCount} chars</span></div><p>{chunk.content}</p></div>)}</div>}
    </article>
  );
}
