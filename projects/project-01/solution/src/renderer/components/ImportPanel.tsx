
interface Props {
  onImport: (file: File) => void;
}

export function ImportPanel({ onImport }: Props) {
  return (
    <div style={{
      padding: '20px',
      background: '#16213e',
      borderRadius: '6px',
      border: '1px dashed #0f3460',
      textAlign: 'center',
      color: '#888',
    }}>
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>导入文档</div>
      <div style={{ fontSize: '12px' }}>
        使用导入按钮，或将文件拖到这里。
        <br />
        支持 .txt、.md 文件
      </div>
      <input
        type="file"
        accept=".txt,.md"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onImport(file);
        }}
        style={{ marginTop: '10px' }}
      />
    </div>
  );
}
