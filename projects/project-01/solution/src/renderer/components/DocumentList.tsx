import { useMemo, useState } from 'react';
import { Document } from '../../shared/types';

interface Props { documents: Document[]; onSelect: (doc: Document) => void; selectedId: string | null }

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes > 10240 ? 0 : 1)} KB`;
}

export function DocumentList({ documents, onSelect, selectedId }: Props) {
  const [search, setSearch] = useState('');
  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? documents.filter(doc => `${doc.title} ${doc.filename}`.toLowerCase().includes(query)) : documents;
  }, [documents, search]);

  return (
    <div className="document-list-wrap">
      <label className="search-box"><span aria-hidden="true">⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="筛选文档" aria-label="筛选文档" />{search && <button type="button" onClick={() => setSearch('')} aria-label="清除搜索">×</button>}</label>
      <div className="document-list">
        {filteredDocuments.length === 0 ? (
          <div className="empty-library"><div className="empty-glyph" aria-hidden="true">＋</div><strong>{documents.length === 0 ? '知识库还是空的' : '没有匹配的文档'}</strong><span>{documents.length === 0 ? '导入 .md 或 .txt 文件开始使用。' : '试试其他标题或文件名。'}</span></div>
        ) : filteredDocuments.map(doc => (
          <button className={`document-row ${selectedId === doc.id ? 'is-selected' : ''}`} key={doc.id} onClick={() => onSelect(doc)}>
            <span className="document-icon" aria-hidden="true">{doc.filename.toLowerCase().endsWith('.md') ? 'M' : 'T'}</span>
            <span className="document-row-copy"><strong>{doc.title}</strong><span>{formatSize(doc.size)} <span className="separator">·</span> {doc.status === 'indexed' ? '已索引' : doc.status === 'error' ? '索引异常' : '待索引'}</span></span>
            <span className={`document-state state-${doc.status}`} aria-label={doc.status === 'indexed' ? '已索引' : '待索引'} />
          </button>
        ))}
      </div>
    </div>
  );
}
