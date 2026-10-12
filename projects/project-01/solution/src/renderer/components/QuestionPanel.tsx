interface Props { question: string; onQuestionChange: (value: string) => void; onAsk: (question: string) => void; isLoading: boolean }

export function QuestionPanel({ question, onQuestionChange, onAsk, isLoading }: Props) {
  const handleSubmit = (event: React.FormEvent) => { event.preventDefault(); onAsk(question); };
  return (
    <form className="question-panel" onSubmit={handleSubmit}>
      <div className="composer-shell"><textarea value={question} onChange={event => onQuestionChange(event.target.value)} placeholder="Ask anything about your library..." aria-label="Ask a question about your documents" rows={1} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onAsk(question); } }} /><button className="send-button" type="submit" disabled={isLoading || !question.trim()} title="Ask your library">{isLoading ? <span className="send-loader" aria-label="Loading" /> : <span aria-hidden="true">↗</span>}</button></div>
      <div className="composer-hint"><span>Enter to ask</span><span>Answers are generated locally from indexed documents</span></div>
    </form>
  );
}
