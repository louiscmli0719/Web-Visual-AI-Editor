import type { EditRecord, StyleChange, RecordStatus, RecordCategory, RecordRangeFilter } from "../../shared/types";
import {
  formatRecordCategory,
  formatRecordPriority,
  formatInteractionState,
} from "../../shared/record-metadata";
import { RecordFilters } from "./RecordFilters";
import { InspectorSection } from "./InspectorSection";
import { StatusBadge, type StatusBadgeProps } from "./StatusBadge";

type RecordListProps = {
  records: EditRecord[];
  unmatchedRecordIds: Set<string>;
  filterCategory: RecordCategory | "all";
  filterStatus: RecordStatus | "all";
  filterRange: RecordRangeFilter;
  onLocate(record: EditRecord): void;
  onEdit(record: EditRecord): void;
  onDelete(record: EditRecord): void;
  onStatusChange(recordId: string, status: RecordStatus): void;
  onFilterCategoryChange(category: RecordCategory | "all"): void;
  onFilterStatusChange(status: RecordStatus | "all"): void;
  onFilterRangeChange(range: RecordRangeFilter): void;
  onHighlightSharedGroup(record: EditRecord): void;
};

export function RecordList({
  records,
  unmatchedRecordIds,
  filterCategory,
  filterStatus,
  filterRange,
  onLocate,
  onEdit,
  onDelete,
  onStatusChange,
  onFilterCategoryChange,
  onFilterStatusChange,
  onFilterRangeChange,
  onHighlightSharedGroup,
}: RecordListProps) {
  const filteredRecords = records.filter((record) => {
    if (filterCategory !== "all" && record.category !== filterCategory) return false;
    if (filterStatus !== "all" && record.status !== filterStatus) return false;
    if (filterRange === "single" && record.sharedGroup) return false;
    if (filterRange === "shared" && !record.sharedGroup) return false;
    return true;
  });

  return (
    <section className="wvaie-record-list-view">
      <div className="wvaie-record-heading">
        <h2>修改记录</h2>
        <span>{filteredRecords.length} / {records.length}</span>
      </div>
      {records.length > 0 && (
        <RecordFilters
          onCategoryChange={onFilterCategoryChange}
          onStatusChange={onFilterStatusChange}
          onRangeChange={onFilterRangeChange}
          selectedCategory={filterCategory}
          selectedStatus={filterStatus}
          selectedRange={filterRange}
        />
      )}
      {records.length === 0 ? (
        <InspectorSection className="wvaie-empty-state">
          <p>还没有修改记录。</p>
        </InspectorSection>
      ) : filteredRecords.length === 0 ? (
        <p className="wvaie-inline-empty">没有符合当前筛选条件的记录。</p>
      ) : (
        <div className="wvaie-record-list">
          {filteredRecords.map((record) => (
            <InspectorSection as="article" className="wvaie-record" hover key={record.id}>
              <div className="wvaie-record-topline">
                <StatusBadge variant="info">{formatRecordCategory(record.category)}</StatusBadge>
                <StatusBadge variant={priorityBadgeVariant(record.priority)}>
                  {formatRecordPriority(record.priority)}
                </StatusBadge>
                {record.interactionState && <StatusBadge variant="info">{formatInteractionState(record.interactionState)}</StatusBadge>}
                {record.sharedGroup && (
                  <StatusBadge
                    ariaLabel={`高亮批量范围，共 ${record.sharedGroup.totalMatched} 个元素`}
                    onClick={() => onHighlightSharedGroup(record)}
                    variant="warning"
                  >
                    批量 × {record.sharedGroup.totalMatched}
                  </StatusBadge>
                )}
              {record.sharedGroup?.truncated && <StatusBadge variant="warning">已截断</StatusBadge>}
              </div>
              {record.comment && <p className="wvaie-record-comment">{record.comment}</p>}
              <p className="wvaie-record-selector">{record.element ? record.element.selector : "页面评论"}</p>
              {record.styleChanges.length > 0 && <StyleChangeSummary changes={record.styleChanges} />}
              {unmatchedRecordIds.has(record.id) && <p className="wvaie-record-warning">当前页面未匹配到元素</p>}
              <div className="wvaie-record-control-row">
                <select
                  aria-label="修改记录状态"
                  className="wvaie-record-status-select"
                  onChange={(event) => onStatusChange(record.id, event.target.value as RecordStatus)}
                  value={record.status}
                >
                  <option value="open">待处理</option>
                  <option value="resolved">已处理</option>
                  <option value="deferred">暂缓</option>
                </select>
                <button className="wvaie-button" onClick={() => onLocate(record)} type="button">{record.element ? "定位" : "查看"}</button>
                <button className="wvaie-button" onClick={() => onEdit(record)} type="button">编辑</button>
                <button className="wvaie-button wvaie-button-danger" onClick={() => onDelete(record)} type="button">删除</button>
              </div>
            </InspectorSection>
          ))}
        </div>
      )}
    </section>
  );
}

function priorityBadgeVariant(priority: EditRecord["priority"]): StatusBadgeProps["variant"] {
  if (priority === "high") return "error";
  if (priority === "medium") return "warning";
  return "success";
}

function StyleChangeSummary({ changes }: { changes: StyleChange[] }) {
  return (
    <ul className="wvaie-record-style-list" aria-label="样式修改">
      {changes.map((change) => (
        <li key={change.property}>
          <span>{change.label}</span>
          <code>{change.oldValue || "空"} -&gt; {change.newValue || "空"}</code>
        </li>
      ))}
    </ul>
  );
}
