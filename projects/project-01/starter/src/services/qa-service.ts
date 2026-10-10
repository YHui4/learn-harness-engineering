import { QAResponse, QAHistory, Citation } from '../shared/types';
import { PersistenceService } from './persistence-service';
import { IndexingService } from './indexing-service';

const QA_HISTORY_FILE = 'qa-history.json';

export class QaService {
  private persistence: PersistenceService;
  private indexingService: IndexingService;

  constructor(persistence: PersistenceService, indexingService?: IndexingService) {
    this.persistence = persistence;
    this.indexingService = indexingService ?? new IndexingService(persistence);
  }

  /** Ask a question and get a grounded answer with citations. */
  async ask(question: string): Promise<QAResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

    const chunks = this.indexingService.getAllChunks();
    const citations: Citation[] = [];

    if (chunks.length > 0) {
      // Find relevant chunks using keyword matching
      const questionWords = this.tokenize(question);
      const scored = chunks.map(chunk => {
        const contentLower = chunk.content.toLowerCase();
        const score = questionWords.reduce(
          (acc, word) => acc + (contentLower.includes(word) ? 1 : 0),
          0
        );
        return { chunk, score };
      });

      // Take top 2 relevant chunks as citations
      const relevant = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      // Get document metadata for citations
      const docs = this.persistence.readJson<Array<{ id: string; title: string }>>('documents-meta.json') ?? [];

      for (const { chunk } of relevant) {
        const doc = docs.find(d => d.id === chunk.documentId);
        citations.push({
          documentId: chunk.documentId,
          documentTitle: doc?.title ?? 'Unknown Document',
          chunkIndex: chunk.index,
          excerpt: chunk.content.substring(0, 200),
        });
      }
    }

    // Generate answer from mock patterns or use fallback
    const answer = this.generateAnswer(citations);

    const response: QAResponse = {
      answer,
      citations,
      confidence: citations.length > 0 ? 0.85 : 0.3,
      timestamp: new Date().toISOString(),
    };

    // Save to history
    this.saveToHistory(question, response);

    return response;
  }

  /** Get the Q&A history. */
  getHistory(): QAHistory[] {
    return this.persistence.readJson<QAHistory[]>(QA_HISTORY_FILE) ?? [];
  }

  private generateAnswer(citations: Citation[]): string {
    if (citations.length > 0) {
      return citations.map(citation => citation.excerpt).join('\n\n');
    }

    return 'No relevant documents have been indexed yet. Please import and index documents before asking questions.';
  }

  private tokenize(text: string): string[] {
    const normalized = text.toLowerCase();
    const latinWords = normalized.match(/[a-z0-9]{3,}/g) ?? [];
    const cjkRuns = normalized.match(/[\u3400-\u9fff]+/g) ?? [];
    const cjkTerms = cjkRuns.flatMap(run => {
      if (run.length < 2) return [run];
      return Array.from({ length: run.length - 1 }, (_, index) => run.slice(index, index + 2));
    });
    return [...new Set([...latinWords, ...cjkTerms])];
  }

  private saveToHistory(question: string, response: QAResponse): void {
    const history = this.getHistory();
    history.push({ question, response });
    this.persistence.writeJson(QA_HISTORY_FILE, history);
  }
}
