interface Props { question: string; onQuestionChange: (value: string) => void; onAsk: (question: string) => void; isLoading: boolean }

export function QuestionPanel({ question, onQuestionChange, onAsk, isLoading }: Props) {
  const handleSubmit = (event: React.FormEvent) => { event.preventDefault(); onAsk(question); };
  return (
    <form className="question-panel" onSubmit={handleSubmit}>
      <div className="composer-shell"><textarea value={question} onChange={event => onQuestionChange(event.target.value)} placeholder="询问你的文档……" aria-label="向文档提问" rows={1} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onAsk(question); } }} /><button className="send-button" type="submit" disabled={isLoading || !question.trim()} title="向知识库提问">{isLoading ? <span className="send-loader" aria-label="正在加载" /> : <span aria-hidden="true">↗</span>}</button></div>
      <div className="composer-hint"><span>按 Enter 提问</span><span>回答由本地已索引的文档生成</span></div>
    </form>
  );
}
