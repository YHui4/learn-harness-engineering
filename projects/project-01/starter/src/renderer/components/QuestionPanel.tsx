import React, { useState } from 'react';

interface Props { onAsk: (question: string) => void; isAsking: boolean; disabled: boolean; }
export function QuestionPanel({ onAsk, isAsking, disabled }: Props) {
  const [question, setQuestion] = useState('');
  const examples = ['系统采用了什么架构？', '索引如何处理文档？'];
  const handleSubmit = (event: React.FormEvent) => { event.preventDefault(); if (!question.trim() || isAsking || disabled) return; onAsk(question.trim()); setQuestion(''); };
  return <div className="question-area"><div className="example-questions">{examples.map(example => <button key={example} onClick={() => setQuestion(example)} disabled={disabled || isAsking}>{example}</button>)}</div><form className="question-form" onSubmit={handleSubmit}><input value={question} onChange={event => setQuestion(event.target.value)} disabled={disabled || isAsking} placeholder={disabled ? '先导入一份文档' : '询问你的文档...'} aria-label="输入问题" /><button className="ask-button" type="submit" disabled={!question.trim() || disabled || isAsking}>{isAsking ? '思考中' : '提问'}<span aria-hidden="true">↗</span></button></form><div className="question-hint">Enter 提交 · 回答只使用本地已索引内容</div></div>;
}
