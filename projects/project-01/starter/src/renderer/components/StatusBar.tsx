import { AppStatus } from '../../shared/types';

export function StatusBar({ status }: { status: AppStatus }) {
  const labels = { idle: '等待索引', indexing: '正在索引', ready: '索引已就绪', error: '索引异常' };
  return <footer className="statusbar"><span><span className={`status-dot ${status.indexStatus}`} />{labels[status.indexStatus]}</span><span>{status.documentsLoaded} 份文档</span><span className="status-spacer" /><span>本地知识库</span></footer>;
}
