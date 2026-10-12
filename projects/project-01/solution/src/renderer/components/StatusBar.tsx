import { AppStatus } from '../../shared/types';
interface Props { status: AppStatus }
export function StatusBar({ status }: Props) { const labels = { idle: '等待索引', indexing: '正在索引', ready: '索引已就绪', error: '索引异常' }; return <footer className="status-bar"><span><span className={`status-dot status-${status.indexStatus}`} />{labels[status.indexStatus]}</span><span>{status.documentsLoaded} 份文档</span><span className="status-spacer" /><span>仅保存在本地</span></footer>; }
