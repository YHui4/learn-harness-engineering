import { AppStatus } from '../../shared/types';
interface Props { status: AppStatus }
export function StatusBar({ status }: Props) { return <footer className="status-bar"><span><span className={`status-dot status-${status.indexStatus}`} />Index {status.indexStatus}</span><span>{status.documentsLoaded} {status.documentsLoaded === 1 ? 'document' : 'documents'}</span><span className="status-spacer" /><span>Local only</span></footer>; }
