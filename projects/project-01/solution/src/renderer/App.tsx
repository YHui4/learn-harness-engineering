import { useCallback, useEffect, useMemo, useState } from 'react';
import { DocumentList } from './components/DocumentList';
import { QuestionPanel } from './components/QuestionPanel';
import { DocumentDetail } from './components/DocumentDetail';
import { StatusBar } from './components/StatusBar';
import { AppStatus, Document, QAResponse } from '../shared/types';
import './styles.css';

const QUICK_PROMPTS = [
  '系统采用了什么架构？',
  '索引如何处理文档？',
  '总结最近的会议记录',
];

export function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [appStatus, setAppStatus] = useState<AppStatus>({
    documentsLoaded: 0,
    indexStatus: 'idle',
    lastActivity: '',
  });
  const [lastResponse, setLastResponse] = useState<QAResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');

  const refreshDocuments = useCallback(async () => {
    try {
      const [docs, status] = await Promise.all([
        window.knowledgeBase.documents.list(),
        window.knowledgeBase.indexing.status(),
      ]);
      setDocuments(docs);
      setAppStatus({
        documentsLoaded: docs.length,
        indexStatus: status.status,
        lastActivity: status.lastIndexed ?? '',
      });
      setSelectedDoc(current => current ? docs.find(doc => doc.id === current.id) ?? null : null);
    } catch (err) {
      console.error('Failed to refresh documents:', err);
      setError('无法读取本地知识库，请重试。');
    }
  }, []);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setError('');
    try {
      const document = await window.knowledgeBase.documents.importFromDialog();
      if (document) {
        await refreshDocuments();
        setSelectedDoc(document);
      }
    } catch (err) {
      console.error('Import failed:', err);
      setError('导入失败，请确认文件是 .txt 或 .md 格式。');
    } finally {
      setIsImporting(false);
    }
  }, [refreshDocuments]);

  const handleDelete = useCallback(async (documentId: string) => {
    try {
      await window.knowledgeBase.documents.delete(documentId);
      setSelectedDoc(null);
      await refreshDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      setError('无法删除这份文档。');
    }
  }, [refreshDocuments]);

  const handleAskQuestion = useCallback(async (nextQuestion: string) => {
    const trimmed = nextQuestion.trim();
    if (!trimmed || isAsking) return;
    setQuestion(trimmed);
    setIsAsking(true);
    setError('');
    try {
      const response = await window.knowledgeBase.qa.ask(trimmed);
      setLastResponse(response);
    } catch (err) {
      console.error('Q&A failed:', err);
      setError('暂时无法回答这个问题，请重试。');
    } finally {
      setIsAsking(false);
    }
  }, [isAsking]);

  const indexedCount = useMemo(
    () => documents.filter(document => document.status === 'indexed').length,
    [documents],
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">K</div>
          <div>
            <div className="brand-name">Knowledge base</div>
            <div className="brand-subtitle">安静整理你的知识</div>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="workspace-label"><span className="status-dot" />本地工作区</div>
          <button className="button button-primary" onClick={handleImport} disabled={isImporting} title="导入 Markdown 或文本文件">
            <span aria-hidden="true">+</span> {isImporting ? '正在导入' : '导入文档'}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="文档库">
          <div className="sidebar-heading">
            <div>
              <p className="eyebrow">我的知识库</p>
              <h1>文档 <span>{documents.length}</span></h1>
            </div>
            <button className="icon-button" onClick={() => void refreshDocuments()} title="刷新文档" aria-label="刷新文档">↻</button>
          </div>
          <DocumentList
            documents={documents}
            onSelect={setSelectedDoc}
            selectedId={selectedDoc?.id ?? null}
          />
          <div className="sidebar-footer">
            <div className="storage-icon" aria-hidden="true">⌂</div>
            <div>
              <strong>本地存储</strong>
              <span>knowledge-base-data</span>
            </div>
            <span className="storage-count">{indexedCount}/{documents.length || 0}</span>
          </div>
        </aside>

        <main className="main-pane">
          <div className="main-header">
            <div>
              <p className="eyebrow">知识库助手</p>
              <h2>向你的文档提问</h2>
            </div>
            <div className="index-summary"><span className={`status-dot status-${appStatus.indexStatus}`} />{appStatus.indexStatus === 'ready' ? '索引已就绪' : appStatus.indexStatus === 'indexing' ? '正在建立索引' : appStatus.indexStatus === 'error' ? '索引异常' : '等待索引'}</div>
          </div>

          <div className="main-scroll">
            {error && <div className="inline-error" role="alert">{error}</div>}

            {selectedDoc ? (
              <DocumentDetail document={selectedDoc} onDelete={handleDelete} onIndexed={refreshDocuments} />
            ) : lastResponse ? (
              <section className="answer-view" aria-live="polite">
                <div className="answer-meta"><span className="answer-label">回答</span><span>{new Date(lastResponse.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <p className="answer-copy">{lastResponse.answer}</p>
                <div className="answer-footer">
                  <span className="confidence"><span className="confidence-bar"><span style={{ width: `${lastResponse.confidence * 100}%` }} /></span>置信度 {Math.round(lastResponse.confidence * 100)}%</span>
                  <span>{lastResponse.citations.length} 个来源</span>
                </div>
                {lastResponse.citations.length > 0 && (
                  <div className="citation-list">
                    <p className="eyebrow">来源引用</p>
                    {lastResponse.citations.map(citation => (
                      <button className="citation" key={`${citation.documentId}-${citation.chunkIndex}`} onClick={() => {
                        const doc = documents.find(item => item.id === citation.documentId);
                        if (doc) setSelectedDoc(doc);
                      }}>
                        <span className="citation-index">{String(citation.chunkIndex + 1).padStart(2, '0')}</span>
                        <span className="citation-body"><strong>{citation.documentTitle}</strong><span>{citation.excerpt}</span></span>
                        <span className="citation-arrow" aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <section className="welcome-view">
                <div className="welcome-kicker"><span className="pulse-mark" />你的本地知识库已准备就绪</div>
                <h3>从笔记中<br /><em>找到答案。</em></h3>
                <p>你可以提问、浏览文档，或导入第一份笔记。所有回答都基于你保存在本地的文件。</p>
                <div className="quick-prompts">
                  {QUICK_PROMPTS.map(prompt => <button key={prompt} onClick={() => { setQuestion(prompt); void handleAskQuestion(prompt); }}>{prompt}<span aria-hidden="true">↗</span></button>)}
                </div>
              </section>
            )}
          </div>

          <QuestionPanel question={question} onQuestionChange={setQuestion} onAsk={handleAskQuestion} isLoading={isAsking} />
        </main>
      </div>

      <StatusBar status={appStatus} />
    </div>
  );
}
