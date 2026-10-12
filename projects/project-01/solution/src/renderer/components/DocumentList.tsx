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
      <label className="search-box"><span aria-hidden="true">⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Filter documents" aria-label="Filter documents" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}</label>
      <div className="document-list">
        {filteredDocuments.length === 0 ? (
          <div className="empty-library"><div className="empty-glyph" aria-hidden="true">＋</div><strong>{documents.length === 0 ? 'Your library is empty' : 'No matching documents'}</strong><span>{documents.length === 0 ? 'Import a .md or .txt file to begin.' : 'Try a different title or filename.'}</span></div>
        ) : filteredDocuments.map(doc => (
          <button className={`document-row ${selectedId === doc.id ? 'is-selected' : ''}`} key={doc.id} onClick={() => onSelect(doc)}>
            <span className="document-icon" aria-hidden="true">{doc.filename.toLowerCase().endsWith('.md') ? 'M' : 'T'}</span>
            <span className="document-row-copy"><strong>{doc.title}</strong><span>{formatSize(doc.size)} <span className="separator">·</span> {doc.status === 'indexed' ? 'Indexed' : 'Needs index'}</span></span>
            <span className={`document-state state-${doc.status}`} aria-label={doc.status} />
          </button>
        ))}
      </div>
    </div>
  );
}
