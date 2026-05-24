import {
  DATA_FORMAT_APP_NAME,
  DATA_FORMAT_VERSION,
  SUPPORTED_IMPORT_VERSIONS
} from "../shared/json-schema";
import { DEFAULT_RECORD_METADATA } from "../shared/record-metadata";
import type {
  EditRecord,
  EditorSession,
  EditorSessionExport,
  ElementSnapshot,
  FontChange,
  PageInfo,
  StyleChange,
  RecordMetadata,
  RecordStatus,
  Measurements,
  SharedGroup,
  RecordCategory,
  RecordPriority,
  InteractionState,
  RecordScope,
  LayoutContext,
  LayoutIntent
} from "../shared/types";
import { isStyleUnit } from "../shared/style-units";
import { deriveFontChanges, isFontPropertyName } from "../shared/font-changes";

type RuntimeOptions = {
  idFactory?: () => string;
  now?: () => string;
  layoutContext?: LayoutContext | null;
  layoutIntent?: LayoutIntent | null;
};

type ParseEditorSessionResult =
  | {
      ok: true;
      session: EditorSession;
    }
  | {
      ok: false;
      reason: string;
    };

export function createInitialSession(options: RuntimeOptions = {}): EditorSession {
  const now = readNow(options);

  return {
    version: "0.8",
    sessionId: readId(options),
    page: readPageInfo(),
    createdAt: now,
    updatedAt: now,
    records: []
  };
}

export function addEditRecord(
  session: EditorSession,
  element: ElementSnapshot | null,
  comment: string,
  styleChanges: StyleChange[] = [],
  metadata: RecordMetadata = DEFAULT_RECORD_METADATA,
  measurements: Measurements | null = null,
  sharedGroup: SharedGroup | null = null,
  options: RuntimeOptions = {}
): EditorSession {
  const trimmedComment = comment.trim();
  const isPageScope = metadata.scope === "page";
  const scopedStyleChanges = isPageScope ? [] : styleChanges;
  const fontChanges = isPageScope ? [] : deriveFontChanges(scopedStyleChanges);

  if (!trimmedComment && scopedStyleChanges.length === 0) {
    return session;
  }

  const now = readNow(options);

  return {
    ...session,
    updatedAt: now,
    records: [
      ...session.records,
      {
        id: readId(options),
        element: isPageScope ? null : element,
        comment: trimmedComment,
        category: metadata.category,
        priority: metadata.priority,
        status: metadata.status,
        interactionState: isPageScope ? null : metadata.interactionState,
        scope: metadata.scope,
        createdAt: now,
        updatedAt: now,
        styleChanges: scopedStyleChanges,
        fontChanges,
        measurements: isPageScope ? null : measurements,
        sharedGroup: isPageScope ? null : sharedGroup,
        layoutContext: isPageScope ? null : options.layoutContext ?? null,
        layoutIntent: isPageScope ? null : options.layoutIntent ?? null
      }
    ]
  };
}

export function updateEditRecord(
  session: EditorSession,
  recordId: string,
  comment: string,
  metadata: RecordMetadata,
  measurements: Measurements | null = null,
  sharedGroup: SharedGroup | null = null,
  options: RuntimeOptions = {}
): EditorSession {
  const recordIndex = session.records.findIndex((r) => r.id === recordId);

  if (recordIndex === -1) {
    return session;
  }

  const now = readNow(options);
  const isPageScope = metadata.scope === "page";
  const updatedRecords = [...session.records];
  updatedRecords[recordIndex] = {
    ...updatedRecords[recordIndex],
    element: isPageScope ? null : updatedRecords[recordIndex].element,
    comment: comment.trim(),
    category: metadata.category,
    priority: metadata.priority,
    status: metadata.status,
    interactionState: isPageScope ? null : metadata.interactionState,
    scope: metadata.scope,
    styleChanges: isPageScope ? [] : updatedRecords[recordIndex].styleChanges,
    fontChanges: isPageScope
      ? []
      : updatedRecords[recordIndex].fontChanges ?? deriveFontChanges(updatedRecords[recordIndex].styleChanges),
    measurements: isPageScope ? null : measurements,
    sharedGroup: isPageScope ? null : sharedGroup,
    layoutContext: isPageScope ? null : options.layoutContext ?? updatedRecords[recordIndex].layoutContext ?? null,
    layoutIntent: isPageScope ? null : options.layoutIntent ?? updatedRecords[recordIndex].layoutIntent ?? null,
    updatedAt: now
  };

  return {
    ...session,
    updatedAt: now,
    records: updatedRecords
  };
}

export function deleteEditRecord(
  session: EditorSession,
  recordId: string,
  options: RuntimeOptions = {}
): EditorSession {
  const recordIndex = session.records.findIndex((r) => r.id === recordId);

  if (recordIndex === -1) {
    return session;
  }

  const now = readNow(options);

  return {
    ...session,
    updatedAt: now,
    records: session.records.filter((r) => r.id !== recordId)
  };
}

export function setRecordStatus(
  session: EditorSession,
  recordId: string,
  status: RecordStatus,
  options: RuntimeOptions = {}
): EditorSession {
  const recordIndex = session.records.findIndex((r) => r.id === recordId);

  if (recordIndex === -1) {
    return session;
  }

  const now = readNow(options);
  const updatedRecords = [...session.records];
  updatedRecords[recordIndex] = {
    ...updatedRecords[recordIndex],
    status,
    updatedAt: now
  };

  return {
    ...session,
    updatedAt: now,
    records: updatedRecords
  };
}

export function serializeEditorSession(session: EditorSession, options: RuntimeOptions = {}): string {
  const payload: EditorSessionExport = {
    app: DATA_FORMAT_APP_NAME,
    version: DATA_FORMAT_VERSION,
    exportedAt: readNow(options),
    page: session.page,
    records: session.records
  };

  return JSON.stringify(payload, null, 2);
}

export function parseEditorSessionExport(value: string, options: RuntimeOptions = {}): ParseEditorSessionResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return {
      ok: false,
      reason: "JSON 格式不正确"
    };
  }

  if (!isObject(parsed)) {
    return {
      ok: false,
      reason: "JSON 格式不正确"
    };
  }

  if (parsed.app !== DATA_FORMAT_APP_NAME) {
    return {
      ok: false,
      reason: "不是 Web Visual AI Editor 导出的数据"
    };
  }

  if (typeof parsed.version !== "string" || !isSupportedVersion(parsed.version)) {
    return {
      ok: false,
      reason: "当前版本暂不支持该数据版本"
    };
  }

  if (!Array.isArray(parsed.records)) {
    return {
      ok: false,
      reason: "未找到可导入的修改记录"
    };
  }

  if (!isPageInfo(parsed.page) || !parsed.records.every(isEditRecordLike)) {
    return {
      ok: false,
      reason: "导入数据缺少必要字段"
    };
  }

  const importedVersion = parsed.version as string;
  const records: EditRecord[] = parsed.records.map((record) => normalizeImportedRecord(record, importedVersion));
  const now = readNow(options);

  return {
    ok: true,
    session: {
      version: "0.8",
      sessionId: readId(options),
      page: parsed.page,
      createdAt: now,
      updatedAt: now,
      records
    }
  };
}

function normalizeImportedRecord(value: Record<string, unknown>, version: string): EditRecord {
  const scope: RecordScope = value.scope === "page" ? "page" : "element";
  const isPageScope = scope === "page";
  const element = isPageScope ? null : (value.element as ElementSnapshot | null);
  const rawStyleChanges = Array.isArray(value.styleChanges) ? value.styleChanges : [];
  const styleChanges = isPageScope ? [] : rawStyleChanges.filter(isStyleChangeLike).map((change) => ({ ...change }));
  const rawFontChanges = Array.isArray(value.fontChanges) ? value.fontChanges : [];
  const fontChanges =
    isPageScope
      ? []
      : version === "0.7" || version === "0.8"
        ? rawFontChanges.filter(isFontChangeLike).map((change) => ({ ...change }))
        : deriveFontChanges(styleChanges);

  // V0.3 fields with fallback to defaults for V0.1/V0.2
  const category: RecordCategory =
    value.category === "visual" ||
    value.category === "copy" ||
    value.category === "interaction" ||
    value.category === "layout" ||
    value.category === "data" ||
    value.category === "state"
      ? value.category
      : DEFAULT_RECORD_METADATA.category;
  const priority: RecordPriority =
    value.priority === "low" || value.priority === "medium" || value.priority === "high"
      ? value.priority
      : DEFAULT_RECORD_METADATA.priority;
  const interactionState: InteractionState | null =
    !isPageScope &&
    (value.interactionState === "default" ||
      value.interactionState === "hover" ||
      value.interactionState === "focus" ||
      value.interactionState === "active" ||
      value.interactionState === "disabled" ||
      value.interactionState === "loading" ||
      value.interactionState === "empty" ||
      value.interactionState === "error")
      ? value.interactionState
      : null;

  // Status: V0.1/V0.2 had "open"/"resolved", V0.3 adds "deferred"
  let status: RecordStatus = "open";
  if (value.status === "resolved") status = "resolved";
  else if (value.status === "deferred") status = "deferred";

  // V0.4: measurements (null for V0.1/V0.2/V0.3)
  const measurements = scope === "element" && isMeasurementsLike(value.measurements) ? value.measurements : null;
  // V0.5+: only V0.5+ payloads may carry a persisted shared selection scope.
  const sharedGroup =
    scope === "element" &&
    element &&
    (version === "0.5" || version === "0.6" || version === "0.7" || version === "0.8") &&
    isSharedGroupLike(value.sharedGroup)
      ? value.sharedGroup
      : null;
  const layoutContext =
    scope === "element" &&
    (version === "0.6" || version === "0.7" || version === "0.8") &&
    isLayoutContextLike(value.layoutContext)
      ? value.layoutContext
      : null;
  const layoutIntent =
    scope === "element" &&
    (version === "0.6" || version === "0.7" || version === "0.8") &&
    isLayoutIntentLike(value.layoutIntent)
      ? value.layoutIntent
      : null;

  return {
    id: String(value.id),
    element,
    comment: typeof value.comment === "string" ? value.comment : "",
    category,
    priority,
    status,
    interactionState,
    scope,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
    styleChanges,
    fontChanges,
    measurements,
    sharedGroup,
    layoutContext,
    layoutIntent
  };
}

function readPageInfo(): PageInfo {
  return {
    url: window.location.href,
    origin: window.location.origin,
    title: document.title,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
}

function readNow(options: RuntimeOptions): string {
  return options.now?.() ?? new Date().toISOString();
}

function readId(options: RuntimeOptions): string {
  return options.idFactory?.() ?? crypto.randomUUID();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSupportedVersion(value: string): boolean {
  return (SUPPORTED_IMPORT_VERSIONS as readonly string[]).includes(value);
}

function isPageInfo(value: unknown): value is PageInfo {
  return (
    isObject(value) &&
    typeof value.url === "string" &&
    typeof value.origin === "string" &&
    typeof value.title === "string" &&
    isObject(value.viewport) &&
    typeof value.viewport.width === "number" &&
    typeof value.viewport.height === "number"
  );
}

function isEditRecordLike(value: unknown): value is Record<string, unknown> {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.comment !== "string") {
    return false;
  }

  // Page-scope records ignore any stale element payload during normalization.
  if (value.scope === "page") {
    return true;
  }

  // Element-scope records must have a valid target element.
  return isElementSnapshotLike(value.element);
}

function isStyleChangeLike(value: unknown): value is StyleChange {
  return (
    isObject(value) &&
    typeof value.property === "string" &&
    typeof value.label === "string" &&
    typeof value.oldValue === "string" &&
    typeof value.newValue === "string" &&
    (value.unit === undefined || isStyleUnit(value.unit))
  );
}

function isFontChangeLike(value: unknown): value is FontChange {
  return isStyleChangeLike(value) && isFontPropertyName(value.property);
}

function isMeasurementsLike(value: unknown): value is Measurements {
  if (!isObject(value)) {
    return false;
  }

  // Minimum validation: must have size with numeric width/height
  if (!isObject(value.size) || typeof value.size.width !== "number" || typeof value.size.height !== "number") {
    return false;
  }

  // viewport must have 4 numeric distances
  if (!isObject(value.viewport)) {
    return false;
  }

  return true;
}

function isSharedGroupLike(value: unknown): value is SharedGroup {
  return (
    isObject(value) &&
    (value.matchLevel === "exact" || value.matchLevel === "class-primary" || value.matchLevel === "tag-only") &&
    typeof value.primaryFeature === "string" &&
    typeof value.totalMatched === "number" &&
    typeof value.truncated === "boolean" &&
    Array.isArray(value.targets) &&
    value.targets.every(isElementSnapshotLike)
  );
}

function isLayoutContextLike(value: unknown): value is LayoutContext {
  return (
    isObject(value) &&
    typeof value.parentSelector === "string" &&
    typeof value.parentTagName === "string" &&
    (value.display === "flex" ||
      value.display === "inline-flex" ||
      value.display === "grid" ||
      value.display === "inline-grid" ||
      value.display === "block" ||
      value.display === "inline" ||
      value.display === "other") &&
    (typeof value.flexDirection === "string" || value.flexDirection === null) &&
    (typeof value.justifyContent === "string" || value.justifyContent === null) &&
    (typeof value.alignItems === "string" || value.alignItems === null) &&
    isObject(value.gap) &&
    typeof value.gap.row === "string" &&
    typeof value.gap.column === "string" &&
    typeof value.childIndex === "number" &&
    typeof value.siblingCount === "number"
  );
}

function isLayoutIntentLike(value: unknown): value is LayoutIntent {
  return (
    isObject(value) &&
    (value.direction === "none" || value.direction === "horizontal" || value.direction === "vertical") &&
    (value.alignment === "none" ||
      value.alignment === "start" ||
      value.alignment === "center" ||
      value.alignment === "end" ||
      value.alignment === "space-between") &&
    typeof value.gap === "string" &&
    typeof value.note === "string"
  );
}

function isElementSnapshotLike(value: unknown): value is ElementSnapshot {
  return (
    isObject(value) &&
    typeof value.selector === "string" &&
    typeof value.tagName === "string" &&
    typeof value.text === "string" &&
    isObject(value.rect) &&
    typeof value.rect.x === "number" &&
    typeof value.rect.y === "number" &&
    typeof value.rect.width === "number" &&
    typeof value.rect.height === "number"
  );
}
