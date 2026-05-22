import type { EditRecord, StyleChange } from "../../shared/types";

type RecordListProps = {
  onLocate(record: EditRecord): void;
  records: EditRecord[];
  unmatchedRecordIds: Set<string>;
};

export function RecordList({ onLocate, records, unmatchedRecordIds }: RecordListProps) {
  if (records.length === 0) {
    return (
      <section className="wvaie-section">
        <h2>修改记录</h2>
        <p className="wvaie-empty">还没有记录。选择元素并保存评论或样式修改后会出现在这里。</p>
      </section>
    );
  }

  return (
    <section className="wvaie-section">
      <h2>修改记录</h2>
      <ol className="wvaie-record-list">
        {records.map((record) => (
          <li className="wvaie-record" key={record.id}>
            <strong>{record.element.selector}</strong>
            {record.comment ? <p>{record.comment}</p> : null}
            {record.styleChanges.length > 0 ? <StyleChangeSummary changes={record.styleChanges} /> : null}
            {unmatchedRecordIds.has(record.id) ? <p>当前页面未匹配到元素</p> : null}
            <div className="wvaie-actions">
              <button className="wvaie-button" onClick={() => onLocate(record)} type="button">
                定位元素
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StyleChangeSummary({ changes }: { changes: StyleChange[] }) {
  return (
    <div className="wvaie-record-style">
      <h3>样式修改</h3>
      <ul>
        {changes.map((change) => (
          <li key={change.property}>
            {change.property}: {change.oldValue || "空"} → {change.newValue || "空"}
          </li>
        ))}
      </ul>
    </div>
  );
}
