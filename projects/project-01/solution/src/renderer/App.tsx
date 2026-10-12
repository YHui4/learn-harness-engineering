import { useCallback, useEffect, useMemo, useState } from 'react';
import { DocumentList } from './components/DocumentList';
import { QuestionPanel } from './components/QuestionPanel';
import { DocumentDetail } from './components/DocumentDetail';
import { StatusBar } from './components/StatusBar';
import { AppStatus, Document, QAResponse } from '../shared/types';
import './styles.css';

const QUICK_PROMPTS = [
  'How is the system structured?',
  'What is the indexing approach?',
  'Summarize the latest meeting notes',
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
      setError('Could not load your local library.');
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
      setError('Import failed. Check that the file is a .txt or .md document.');
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
      setError('Could not remove this document.');
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
      setError('The question could not be answered. Try again.');
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
            <div className="brand-subtitle">A quiet place for your notes</div>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="workspace-label"><span className="status-dot" />Local workspace</div>
          <button className="button button-primary" onClick={handleImport} disabled={isImporting} title="Import a Markdown or text file">
            <span aria-hidden="true">+</span> {isImporting ? 'Importing' : 'Import document'}
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Document library">
          <div className="sidebar-heading">
            <div>
              <p className="eyebrow">Your library</p>
              <h1>Documents <span>{documents.length}</span></h1>
            </div>
            <button className="icon-button" onClick={() => void refreshDocuments()} title="Refresh documents" aria-label="Refresh documents">↻</button>
          </div>
          <DocumentList
            documents={documents}
            onSelect={setSelectedDoc}
            selectedId={selectedDoc?.id ?? null}
          />
          <div className="sidebar-footer">
            <div className="storage-icon" aria-hidden="true">⌂</div>
            <div>
              <strong>Stored locally</strong>
              <span>knowledge-base-data</span>
            </div>
            <span className="storage-count">{indexedCount}/{documents.length || 0}</span>
          </div>
        </aside>

        <main className="main-pane">
          <div className="main-header">
            <div>
              <p className="eyebrow">Library assistant</p>
              <h2>Ask your documents</h2>
            </div>
            <div className="index-summary"><span className={`status-dot status-${appStatus.indexStatus}`} />{appStatus.indexStatus === 'ready' ? 'Ready to search' : 'Index ' + appStatus.indexStatus}</div>
          </div>

          <div className="main-scroll">
            {error && <div className="inline-error" role="alert">{error}</div>}

            {selectedDoc ? (
              <DocumentDetail document={selectedDoc} onDelete={handleDelete} onIndexed={refreshDocuments} />
            ) : lastResponse ? (
              <section className="answer-view" aria-live="polite">
                <div className="answer-meta"><span className="answer-label">Answer</span><span>{new Date(lastResponse.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                <p className="answer-copy">{lastResponse.answer}</p>
                <div className="answer-footer">
                  <span className="confidence"><span className="confidence-bar"><span style={{ width: `${lastResponse.confidence * 100}%` }} /></span>{Math.round(lastResponse.confidence * 100)}% confidence</span>
                  <span>{lastResponse.citations.length} {lastResponse.citations.length === 1 ? 'source' : 'sources'}</span>
                </div>
                {lastResponse.citations.length > 0 && (
                  <div className="citation-list">
                    <p className="eyebrow">Sources</p>
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
                <div className="welcome-kicker"><span className="pulse-mark" />Your local knowledge base is ready</div>
                <h3>Find the thread<br /><em>inside your notes.</em></h3>
                <p>Ask a question, browse a document, or start by importing your first note. Answers stay grounded in the files you keep here.</p>
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
