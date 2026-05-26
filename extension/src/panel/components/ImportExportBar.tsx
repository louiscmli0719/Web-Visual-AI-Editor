import { useState } from "react";
import { InspectorSection } from "./InspectorSection";

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
    <InspectorSection as="footer" className="wvaie-import-export">
      <h2>交付与恢复</h2>
      <textarea
        className="wvaie-textarea"
        onChange={(event) => setImportValue(event.target.value)}
        placeholder="粘贴 Web Visual AI Editor JSON 后导入"
        rows={4}
        value={importValue}
      />
      <div className="wvaie-footer">
        <button className="wvaie-button" disabled={!importValue.trim()} onClick={handleImport} type="button">
          导入 JSON
        </button>
        <button className="wvaie-button" disabled={disabled} onClick={onCopyPrompt} type="button">
          复制 Prompt
        </button>
        <button className="wvaie-button wvaie-button-primary" disabled={disabled} onClick={onExportJson} type="button">
          导出 JSON
        </button>
      </div>
      <p className="wvaie-privacy-note">导出内容可能包含页面 URL 与选中文本，请在分享前检查敏感信息。</p>
    </InspectorSection>
  );
}
