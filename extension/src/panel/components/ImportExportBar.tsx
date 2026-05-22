import { useState } from "react";

type ImportExportBarProps = {
  disabled: boolean;
  onCopyPrompt(): void;
  onExportJson(): void;
  onImportJson(value: string): void;
};

export function ImportExportBar({ disabled, onCopyPrompt, onExportJson, onImportJson }: ImportExportBarProps) {
  const [importValue, setImportValue] = useState("");

  function handleImport(): void {
    const value = importValue.trim();

    if (!value) {
      return;
    }

    onImportJson(value);
    setImportValue("");
  }

  return (
    <footer className="wvaie-section">
      <h2>导入导出</h2>
      <div className="wvaie-footer">
        <button className="wvaie-button" disabled={disabled} onClick={onExportJson} type="button">
          导出 JSON
        </button>
        <button className="wvaie-button" disabled={disabled} onClick={onCopyPrompt} type="button">
          复制 Prompt
        </button>
      </div>
      <textarea
        className="wvaie-textarea"
        onChange={(event) => setImportValue(event.target.value)}
        placeholder="粘贴 Web Visual AI Editor JSON 后导入"
        rows={4}
        value={importValue}
      />
      <button className="wvaie-button" disabled={!importValue.trim()} onClick={handleImport} type="button">
        导入 JSON
      </button>
    </footer>
  );
}
