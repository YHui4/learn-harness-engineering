import { useCallback, useEffect, useMemo, useState } from 'react';
import { DocumentList } from './components/DocumentList';
import { QuestionPanel } from './components/QuestionPanel';
import { DocumentDetail } from './components/DocumentDetail';
import { StatusBar } from './components/StatusBar';
import { AppStatus, Document, QAResponse } from '../shared/types';
import './styles.css';

const initialStatus: AppStatus = { documentsLoaded: 0, indexStatus: 'idle', lastActivity: '' };
export function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [appStatus, setAppStatus] = useState<AppStatus>(initialStatus);
  const [lastResponse, setLastResponse] = useState<QAResponse | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState('');

  const refreshDocuments = useCallback(async () => {
    try {
      const [docs, status] = await Promise.all([window.knowledgeBase.documents.list(), window.knowledgeBase.indexing.status()]);
      setDocuments(docs);
      setAppStatus(status);
      setSelectedDoc(current => current ? docs.find(doc => doc.id === current.id) ?? null : current);
    } catch (err) {
      console.error('Failed to refresh documents:', err);
      setError('无法读取本地知识库。请重试。');
    }
  }, []);

  useEffect(() => { void refreshDocuments(); }, [refreshDocuments]);

  const handleImport = useCallback(async () => {
    setError('');
    setIsImporting(true);
    try {
      const document = await window.knowledgeBase.documents.chooseAndImport();
      if (document) {
        await window.knowledgeBase.indexing.start(document.id);
        await refreshDocuments();
        setSelectedDoc(await window.knowledgeBase.documents.get(document.id));
      }
    } catch (err) {
      console.error('Import failed:', err);
      setError('导入失败，请确认文件仍然存在且格式可读。');
    } finally {
      setIsImporting(false);
    }
  }, [refreshDocuments]);

  const handleAskQuestion = useCallback(async (question: string) => {
    setError('');
    setIsAsking(true);
    try {
      setLastResponse(await window.knowledgeBase.qa.ask(question));
    } catch (err) {
      console.error('Q&A failed:', err);
      setError('回答生成失败，请稍后再试。');
    } finally {
      setIsAsking(false);
    }
  }, []);

  const indexedCount = useMemo(() => documents.filter(doc => doc.status === 'indexed').length, [documents]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true">K</div><div><div className="brand-name">Knowledge Base</div><div className="brand-caption">Local workspace</div></div></div>
        <div className="topbar-actions"><span className="storage-note">数据仅保存在本机</span><button className="icon-button" onClick={() => void refreshDocuments()} title="刷新文档列表" aria-label="刷新文档列表">↻</button></div>
      </header>
      <main className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading"><div><span className="eyebrow">Library</span><h1>文档库</h1></div><span className="count-badge">{documents.length}</span></div>
          <button className="primary-button import-button" onClick={() => void handleImport()} disabled={isImporting}><span className="button-symbol" aria-hidden="true">+</span>{isImporting ? '正在导入...' : '导入文档'}</button>
          <DocumentList documents={documents} onSelect={setSelectedDoc} selectedId={selectedDoc?.id ?? null} />
          <div className="sidebar-summary"><div className="summary-row"><span>已建立索引</span><strong>{indexedCount} / {documents.length}</strong></div><div className="summary-track"><span style={{ width: `${documents.length ? (indexedCount / documents.length) * 100 : 0}%` }} /></div><div className="summary-path">本地数据目录由 Electron 自动创建</div></div>
        </aside>
        <section className="qa-workspace" aria-label="问答面板">
          <div className="qa-header"><div><span className="eyebrow">Ask your library</span><h2>从文档中找到答案</h2><p>回答基于已导入并建立索引的内容，并附带原文引用。</p></div><div className="index-status-chip"><span className={`status-dot ${appStatus.indexStatus}`} />{appStatus.indexStatus === 'ready' ? '索引已就绪' : '等待索引'}</div></div>
          {error && <div className="error-banner" role="alert">{error}</div>}
          <div className="qa-content">
            {selectedDoc && <DocumentDetail document={selectedDoc} onUpdated={() => void refreshDocuments()} />}
            {lastResponse ? <article className="answer-card"><div className="answer-meta"><span className="answer-label">回答</span><span>{new Date(lastResponse.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><p className="answer-text">{lastResponse.answer}</p><div className="confidence-line"><span>回答置信度</span><strong>{Math.round(lastResponse.confidence * 100)}%</strong></div>{lastResponse.citations.length > 0 && <div className="citation-list"><div className="citation-heading">来源引用</div>{lastResponse.citations.map((citation, index) => <div className="citation" key={`${citation.documentId}-${citation.chunkIndex}-${index}`}><div className="citation-title"><span className="citation-index">0{index + 1}</span>{citation.documentTitle}<span className="citation-chunk">片段 {citation.chunkIndex + 1}</span></div><p>{citation.excerpt}</p></div>)}</div>}</article> : <div className="empty-answer"><div className="empty-icon" aria-hidden="true">⌁</div><h3>准备好回答问题</h3><p>试着询问文档中的设计决策、会议结论或检索流程。</p></div>}
          </div>
          <QuestionPanel onAsk={handleAskQuestion} isAsking={isAsking} disabled={documents.length === 0} />
        </section>
      </main>
      <StatusBar status={appStatus} />
    </div>
  );
}
