import { useEffect, useState } from 'react';
import { Chunk, Document } from '../../shared/types';

interface Props { document: Document; onUpdated: () => void; }
export function DocumentDetail({ document, onUpdated }: Props) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [showChunks, setShowChunks] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  useEffect(() => { void window.knowledgeBase.indexing.chunks(document.id).then(setChunks); }, [document.id]);
  const handleIndex = async () => { setIsIndexing(true); await window.knowledgeBase.indexing.start(document.id); await window.knowledgeBase.indexing.chunks(document.id).then(setChunks); onUpdated(); setIsIndexing(false); };
  return <div className="document-context"><div className="context-icon" aria-hidden="true">{document.filename.toLowerCase().endsWith('.md') ? 'M' : 'T'}</div><div className="context-main"><div className="context-label">当前文档</div><h3>{document.title}</h3><div className="context-meta">{document.filename} · {chunks.length} 个片段 · {document.status === 'indexed' ? '已索引' : '待索引'}</div></div><div className="context-actions"><button onClick={() => setShowChunks(value => !value)}>{showChunks ? '收起片段' : '查看片段'}</button>{document.status !== 'indexed' && <button className="small-primary" onClick={() => void handleIndex()} disabled={isIndexing}>{isIndexing ? '处理中' : '建立索引'}</button>}</div>{showChunks && <div className="chunk-list">{chunks.length === 0 ? <span className="muted">暂无索引片段</span> : chunks.map(chunk => <div className="chunk" key={chunk.id}><div className="chunk-label">片段 {chunk.index + 1} · {chunk.metadata.charCount} 字符</div>{chunk.content}</div>)}</div>}</div>;
}
