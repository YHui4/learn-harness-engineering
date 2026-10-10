import { v4 as uuidv4 } from 'uuid';
import { AppStatus, Chunk, Document } from '../shared/types';
import { PersistenceService } from './persistence-service';

const INDEX_META = 'index-meta.json';
const CHUNKS_DIR = 'chunks';

export class IndexingService {
  private persistence: PersistenceService;

  constructor(persistence: PersistenceService) {
    this.persistence = persistence;
  }

  /** Start indexing documents. If documentId is provided, index only that document. */
  async startIndexing(documentId?: string): Promise<AppStatus> {
    const status = this.getStatus();

    if (documentId) {
      // Index a single document
      const content = this.persistence.readText(`content/${documentId}.txt`);
      if (!content) {
        return { ...status, indexStatus: 'error' };
      }
      const chunks = this.chunkDocument(documentId, content);
      this.persistence.writeJson(`${CHUNKS_DIR}/${documentId}.json`, chunks);
      this.updateDocumentStatus(documentId, 'indexed', chunks.length);
      const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
      chunksMeta[documentId] = chunks.map(c => c.id);
      this.persistence.writeJson(INDEX_META, chunksMeta);
      return this.getStatus();
    }

    // Index all documents that haven't been indexed yet
    const docsMeta = this.persistence.readJson<Document[]>('documents-meta.json') ?? [];
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};

    for (const doc of docsMeta) {
      if (chunksMeta[doc.id]) continue;

      const content = this.persistence.readText(`content/${doc.id}.txt`);
      if (!content) continue;

      const chunks = this.chunkDocument(doc.id, content);
      this.persistence.writeJson(`${CHUNKS_DIR}/${doc.id}.json`, chunks);
      chunksMeta[doc.id] = chunks.map(c => c.id);
      this.updateDocumentStatus(doc.id, 'indexed', chunks.length);
    }

    this.persistence.writeJson(INDEX_META, chunksMeta);
    return this.getStatus();
  }

  /** Get current indexing status. */
  getStatus(): AppStatus {
    const docs = this.persistence.readJson<Document[]>('documents-meta.json') ?? [];
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};

    const currentIndexed = docs.filter(doc => chunksMeta[doc.id]).length;
    const isReady = currentIndexed === docs.length && docs.length > 0;

    return {
      documentsLoaded: docs.length,
      indexStatus: isReady ? 'ready' : 'idle',
      lastActivity: new Date().toISOString(),
    };
  }

  /** Get all chunks for a document. */
  getChunksForDocument(documentId: string): Chunk[] {
    return this.persistence.readJson<Chunk[]>(`${CHUNKS_DIR}/${documentId}.json`) ?? [];
  }

  /** Get all chunks across all documents. */
  getAllChunks(): Chunk[] {
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
    const allChunks: Chunk[] = [];

    for (const docId of Object.keys(chunksMeta)) {
      const chunks = this.getChunksForDocument(docId);
      allChunks.push(...chunks);
    }

    return allChunks;
  }

  /** Split a document into chunks of ~500 characters at paragraph boundaries. */
  private chunkDocument(documentId: string, content: string): Chunk[] {
    const CHUNK_SIZE = 500;
    const chunks: Chunk[] = [];

    // Split on double newlines (paragraphs)
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    let buffer = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      if (buffer.length + para.length > CHUNK_SIZE && buffer.length > 0) {
        chunks.push(this.createChunk(documentId, chunkIndex++, buffer.trim()));
        buffer = para;
      } else {
        buffer += (buffer ? '\n\n' : '') + para;
      }
    }

    if (buffer.trim()) {
      chunks.push(this.createChunk(documentId, chunkIndex, buffer.trim()));
    }

    return chunks;
  }

  private createChunk(documentId: string, index: number, content: string): Chunk {
    return {
      id: uuidv4(),
      documentId,
      content,
      index,
      metadata: {
        charCount: String(content.length),
        wordCount: String(content.split(/\s+/).length),
      },
    };
  }

  private updateDocumentStatus(documentId: string, status: Document['status'], chunks: number) {
    const docs = this.persistence.readJson<Document[]>('documents-meta.json') ?? [];
    const doc = docs.find(item => item.id === documentId);
    if (!doc) return;
    doc.status = status;
    doc.chunks = chunks;
    this.persistence.writeJson('documents-meta.json', docs);
  }
}
