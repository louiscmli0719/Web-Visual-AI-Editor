import { useEffect, useState } from "react";
import type { ElementSnapshot, MatchLevel } from "../../shared/types";
import { InspectorSection } from "./InspectorSection";
import { StatusBadge } from "./StatusBadge";

type SimilarElementsPanelProps = {
  matchLevel: MatchLevel | null;
  primaryFeature: string;
  totalMatched: number;
  truncated: boolean;
  similar: ElementSnapshot[];
  applyToSimilar: boolean;
  onHoverSimilar(index: number | null): void;
  onHighlightAll(): void;
  onToggleApplyToSimilar(next: boolean): void;
};

const MATCH_LEVEL_LABELS: Record<MatchLevel, string> = {
  exact: "精确",
  "class-primary": "主类",
  "tag-only": "结构"
};

export function SimilarElementsPanel({
  matchLevel,
  primaryFeature,
  totalMatched,
  truncated,
  similar,
  applyToSimilar,
  onHoverSimilar,
  onHighlightAll,
  onToggleApplyToSimilar
}: SimilarElementsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const hasSimilar = similar.length > 0;
  const levelLabel = matchLevel ? MATCH_LEVEL_LABELS[matchLevel] : "未识别";
  const visibleSimilar = showAll ? similar : similar.slice(0, 10);

  useEffect(() => {
    setShowAll(false);
  }, [primaryFeature, totalMatched]);

  return (
    <InspectorSection as="section" className="wvaie-similar-card">
      <details className="wvaie-similar-panel">
        <summary>
          <span>相似元素</span>
          {hasSimilar ? (
            <StatusBadge variant="warning">{totalMatched} 个 / {levelLabel}</StatusBadge>
          ) : (
            <span className="wvaie-similar-count">无匹配</span>
          )}
        </summary>
        <div className="wvaie-similar-content">
          {hasSimilar ? (
            <>
            <p className="wvaie-similar-feature">
              匹配特征 <code>{primaryFeature}</code>
              {truncated && <span className="wvaie-similar-truncated">已截断</span>}
            </p>
            <label className="wvaie-shared-switch">
              <span>
                <strong>共享元素</strong>
                <small>开启后保存记录会带上这一组相似元素</small>
              </span>
              <input
                checked={applyToSimilar}
                onChange={(event) => {
                  onToggleApplyToSimilar(event.target.checked);
                  if (event.target.checked) {
                    onHighlightAll();
                  }
                }}
                type="checkbox"
              />
            </label>
            <p className="wvaie-similar-help">当前元素与以下元素会被作为同一批范围；聚焦或悬停可预览。</p>
            <ul className="wvaie-similar-list" aria-label="匹配到的其他相似元素">
              {visibleSimilar.map((element, index) => (
                <li key={`${element.selector}-${index}`}>
                  <button
                    className="wvaie-similar-target"
                    onBlur={() => onHoverSimilar(null)}
                    onFocus={() => onHoverSimilar(index)}
                    onMouseEnter={() => onHoverSimilar(index)}
                    onMouseLeave={() => onHoverSimilar(null)}
                    type="button"
                  >
                    {element.selector}
                  </button>
                </li>
              ))}
            </ul>
            {similar.length > 10 && (
              <button className="wvaie-button wvaie-button-text" onClick={() => setShowAll((value) => !value)} type="button">
                {showAll ? "仅显示前 10 个" : `查看全部 ${similar.length} 个其他目标`}
              </button>
            )}
              <button className="wvaie-button" onClick={onHighlightAll} type="button">
                高亮全部 {totalMatched} 个
              </button>
            </>
          ) : (
            <p className="wvaie-inline-empty">当前元素没有可批量应用的相似目标。</p>
          )}
        </div>
      </details>
    </InspectorSection>
  );
}
