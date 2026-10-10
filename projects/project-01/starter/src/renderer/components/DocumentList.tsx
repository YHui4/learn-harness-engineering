import { Document } from '../../shared/types';

interface Props { documents: Document[]; onSelect: (doc: Document) => void; selectedId: string | null; }
function formatSize(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

export function DocumentList({ documents, onSelect, selectedId }: Props) {
  if (documents.length === 0) return <div className="document-empty"><div className="empty-file-icon" aria-hidden="true">□</div><strong>还没有文档</strong><span>导入 Markdown 或文本文件开始建立你的知识库。</span></div>;
  return <div className="document-list">{documents.map(doc => <button className={`document-row ${selectedId === doc.id ? 'selected' : ''}`} key={doc.id} onClick={() => onSelect(doc)}><span className="document-type" aria-hidden="true">{doc.filename.toLowerCase().endsWith('.md') ? 'M' : 'T'}</span><span className="document-copy"><strong>{doc.title}</strong><small>{formatSize(doc.size)} · {doc.status === 'indexed' ? '已索引' : '待处理'}</small></span><span className={`row-status ${doc.status}`} title={doc.status === 'indexed' ? '已索引' : '待索引'} /></button>)}</div>;
}
