import type { RecordCategory, RecordStatus, RecordRangeFilter } from "../../shared/types";
import {
  RECORD_CATEGORY_OPTIONS,
  RECORD_STATUS_OPTIONS,
} from "../../shared/record-metadata";

type RecordFiltersProps = {
  selectedCategory: RecordCategory | "all";
  selectedStatus: RecordStatus | "all";
  selectedRange: RecordRangeFilter;
  onCategoryChange(category: RecordCategory | "all"): void;
  onStatusChange(status: RecordStatus | "all"): void;
  onRangeChange(range: RecordRangeFilter): void;
};

export function RecordFilters({
  selectedCategory,
  selectedStatus,
  selectedRange,
  onCategoryChange,
  onStatusChange,
  onRangeChange,
}: RecordFiltersProps) {
  return (
    <div className="wvaie-record-filters">
      <div className="wvaie-filter-group">
        <label className="wvaie-filter-label" htmlFor="wvaie-filter-category">类型</label>
        <select
          id="wvaie-filter-category"
          className="wvaie-filter-select"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value as RecordCategory | "all")}
        >
          <option value="all">全部</option>
          {RECORD_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="wvaie-filter-group">
        <label className="wvaie-filter-label" htmlFor="wvaie-filter-status">状态</label>
        <select
          id="wvaie-filter-status"
          className="wvaie-filter-select"
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as RecordStatus | "all")}
        >
          <option value="all">全部</option>
          {RECORD_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="wvaie-filter-group">
        <label className="wvaie-filter-label" htmlFor="wvaie-filter-range">范围</label>
        <select
          id="wvaie-filter-range"
          className="wvaie-filter-select"
          value={selectedRange}
          onChange={(e) => onRangeChange(e.target.value as RecordRangeFilter)}
        >
          <option value="all">全部</option>
          <option value="single">单元素</option>
          <option value="shared">批量</option>
        </select>
      </div>
    </div>
  );
}
