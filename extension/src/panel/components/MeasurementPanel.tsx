import type { Measurements } from "../../shared/types";
import { InspectorSection } from "./InspectorSection";

export type MeasurementMode = "off" | "awaiting-a" | "awaiting-b" | "complete";

type MeasurementPanelProps = {
  measurement: Measurements | null;
  measurementMode: MeasurementMode;
  hasSelection: boolean;
  onEnterMeasurementMode(): void;
  onExitMeasurementMode(): void;
  onResetPairMeasurement(): void;
};

export function MeasurementPanel({
  measurement,
  measurementMode,
  onExitMeasurementMode,
  onResetPairMeasurement,
}: MeasurementPanelProps) {
  return (
    <InspectorSection as="section" className="wvaie-measurement-panel">
      <div className="wvaie-mode-banner">
        <strong>双元素测距</strong>
        <span>{instructionForMode(measurementMode)}</span>
      </div>

      {measurement && (
        <>
          <div className="wvaie-property-section">
            <h2>尺寸与视口</h2>
            <p className="wvaie-measurement-size">{measurement.size.width} × {measurement.size.height} px</p>
            <div className="wvaie-value-grid wvaie-four-grid">
              <Distance label="上" value={measurement.viewport.top} />
              <Distance label="右" value={measurement.viewport.right} />
              <Distance label="下" value={measurement.viewport.bottom} />
              <Distance label="左" value={measurement.viewport.left} />
            </div>
          </div>
          {measurement.parent && (
            <div className="wvaie-property-section">
              <h2>距父容器</h2>
              <p className="wvaie-measurement-selector">{truncate(measurement.parent.selector, 38)}</p>
              <div className="wvaie-value-grid wvaie-four-grid">
                <Distance label="上" value={measurement.parent.distances.top} />
                <Distance label="右" value={measurement.parent.distances.right} />
                <Distance label="下" value={measurement.parent.distances.bottom} />
                <Distance label="左" value={measurement.parent.distances.left} />
              </div>
            </div>
          )}
          {measurement.pair && (
            <div className="wvaie-property-section wvaie-pair-results">
              <h2>与参照元素 B</h2>
              <p className="wvaie-measurement-selector">{truncate(measurement.pair.selector, 38)}</p>
              <div className="wvaie-value-grid">
                <Distance label="水平" value={measurement.pair.horizontalDistance} />
                <Distance label="垂直" value={measurement.pair.verticalDistance} />
                <Distance label="中心" value={measurement.pair.centerDistance} />
              </div>
            </div>
          )}
        </>
      )}
      <div className="wvaie-measurement-actions">
        <button className="wvaie-button" onClick={onResetPairMeasurement} type="button">重新测距</button>
        <button className="wvaie-button" onClick={onExitMeasurementMode} type="button">退出测距</button>
      </div>
    </InspectorSection>
  );
}

function Distance({ label, value }: { label: string; value: number }) {
  return (
    <div className="wvaie-value-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function instructionForMode(mode: MeasurementMode): string {
  if (mode === "awaiting-b") return "A 已确定，请点击网页中的参照元素 B";
  if (mode === "complete") return "测距完成，保存记录会以 A 为修改对象";
  return "请点击网页元素作为起点 A";
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}...`;
}
