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
      <div className="detail-topline"><span className="eyebrow">文档详情</span><button className="quiet-button danger" onClick={() => onDelete(document.id)}>删除</button></div>
      <div className="detail-heading"><div className="detail-file-icon">{document.filename.toLowerCase().endsWith('.md') ? 'M' : 'T'}</div><div><h3>{document.title}</h3><p>{document.filename}</p></div></div>
      <div className="metadata-grid"><div><span>导入时间</span><strong>{new Date(document.importedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></div><div><span>大小</span><strong>{(document.size / 1024).toFixed(1)} KB</strong></div><div><span>片段</span><strong>{document.chunks ?? (chunks.length || '未索引')}</strong></div><div><span>状态</span><strong className={`text-${document.status}`}>{document.status === 'indexed' ? '已索引' : document.status === 'error' ? '索引异常' : '待索引'}</strong></div></div>
      <div className="detail-actions"><button className="button button-primary" onClick={() => void handleIndex()} disabled={isIndexing}>{isIndexing ? '正在索引……' : document.status === 'indexed' ? '重新索引' : '建立索引'} <span aria-hidden="true">↗</span></button><button className="button button-secondary" onClick={() => setShowChunks(value => !value)}>{showChunks ? '收起片段' : '查看片段'} <span aria-hidden="true">{showChunks ? '↑' : '↓'}</span></button></div>
      {showChunks && <div className="chunk-list">{chunks.length === 0 ? <div className="chunk-empty">还没有片段，请先建立索引。</div> : chunks.map(chunk => <div className="chunk-row" key={chunk.id}><div className="chunk-label">片段 {String(chunk.index + 1).padStart(2, '0')} <span>{chunk.metadata.charCount} 字符</span></div><p>{chunk.content}</p></div>)}</div>}
    </article>
  );
}
