import {
  DATA_FORMAT_APP_NAME,
  DATA_FORMAT_VERSION,
  SUPPORTED_IMPORT_VERSIONS
} from "../shared/json-schema";
import type {
  EditRecord,
  EditorSession,
  EditorSessionExport,
  ElementSnapshot,
  PageInfo,
  StyleChange
} from "../shared/types";

type RuntimeOptions = {
  idFactory?: () => string;
  now?: () => string;
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
    version: "0.2",
    sessionId: readId(options),
    page: readPageInfo(),
    createdAt: now,
    updatedAt: now,
    records: []
  };
}

export function addEditRecord(
  session: EditorSession,
  element: ElementSnapshot,
  comment: string,
  styleChanges: StyleChange[] = [],
  options: RuntimeOptions = {}
): EditorSession {
  const trimmedComment = comment.trim();

  if (!trimmedComment && styleChanges.length === 0) {
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
        element,
        comment: trimmedComment,
        status: "open",
        createdAt: now,
        updatedAt: now,
        styleChanges
      }
    ]
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

  const records: EditRecord[] = parsed.records.map((record) => normalizeImportedRecord(record));
  const now = readNow(options);

  return {
    ok: true,
    session: {
      version: "0.2",
      sessionId: readId(options),
      page: parsed.page,
      createdAt: now,
      updatedAt: now,
      records
    }
  };
}

function normalizeImportedRecord(value: Record<string, unknown>): EditRecord {
  const element = value.element as ElementSnapshot;
  const rawStyleChanges = Array.isArray(value.styleChanges) ? value.styleChanges : [];
  const styleChanges = rawStyleChanges.filter(isStyleChangeLike).map((change) => ({ ...change }));

  return {
    id: String(value.id),
    element,
    comment: typeof value.comment === "string" ? value.comment : "",
    status: value.status === "resolved" ? "resolved" : "open",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
    styleChanges
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
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.comment === "string" &&
    isObject(value.element) &&
    typeof value.element.selector === "string" &&
    isObject(value.element.rect) &&
    typeof value.element.rect.x === "number" &&
    typeof value.element.rect.y === "number" &&
    typeof value.element.rect.width === "number" &&
    typeof value.element.rect.height === "number"
  );
}

function isStyleChangeLike(value: unknown): value is StyleChange {
  return (
    isObject(value) &&
    typeof value.property === "string" &&
    typeof value.label === "string" &&
    typeof value.oldValue === "string" &&
    typeof value.newValue === "string"
  );
}
