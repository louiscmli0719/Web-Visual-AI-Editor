export type EditorSession = {
  version: "0.4" | "0.5";
  sessionId: string;
  page: PageInfo;
  createdAt: string;
  updatedAt: string;
  records: EditRecord[];
};

export type PageInfo = {
  url: string;
  origin: string;
  title: string;
  viewport: {
    width: number;
    height: number;
  };
};

export type ElementSnapshot = {
  tagName: string;
  id: string | null;
  className: string | null;
  selector: string;
  text: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type StylePropertyName =
  | "color"
  | "backgroundColor"
  | "fontSize"
  | "fontWeight"
  | "lineHeight"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "borderRadius"
  | "borderWidth"
  | "borderColor"
  | "boxShadow";

export type StyleInputType = "color" | "number" | "select" | "text";

export type StyleUnit = "px" | "pt";

export type StylePropertySnapshot = {
  property: StylePropertyName;
  label: string;
  value: string;
  inputType: StyleInputType;
  unit?: StyleUnit;
  unitOptions?: StyleUnit[];
};

export type StyleChange = {
  property: StylePropertyName;
  label: string;
  oldValue: string;
  newValue: string;
  unit?: StyleUnit;
};

export type StyleDraft = Partial<Record<StylePropertyName, string>>;

export type RecordCategory = "visual" | "copy" | "interaction" | "layout" | "data" | "state";

export type RecordPriority = "low" | "medium" | "high";

export type RecordStatus = "open" | "resolved" | "deferred";

export type InteractionState = "default" | "hover" | "focus" | "active" | "disabled" | "loading" | "empty" | "error";

export type RecordScope = "element" | "page";

export type RecordRangeFilter = "all" | "single" | "shared";

export type RecordMetadata = {
  category: RecordCategory;
  priority: RecordPriority;
  status: RecordStatus;
  interactionState: InteractionState | null;
  scope: RecordScope;
};

export type Measurements = {
  size: { width: number; height: number };
  viewport: { top: number; right: number; bottom: number; left: number };
  parent: {
    selector: string;
    distances: { top: number; right: number; bottom: number; left: number };
  } | null;
  pair: {
    selector: string;
    text: string;
    rect: { x: number; y: number; width: number; height: number };
    horizontalDistance: number;
    verticalDistance: number;
    centerDistance: number;
  } | null;
};

export type MatchLevel = "exact" | "class-primary" | "tag-only";

export type SharedGroup = {
  matchLevel: MatchLevel;
  primaryFeature: string;
  totalMatched: number;
  truncated: boolean;
  targets: ElementSnapshot[];
};

export type EditRecord = {
  id: string;
  element: ElementSnapshot | null;
  comment: string;
  category: RecordCategory;
  priority: RecordPriority;
  status: RecordStatus;
  interactionState: InteractionState | null;
  scope: RecordScope;
  createdAt: string;
  updatedAt: string;
  styleChanges: StyleChange[];
  measurements: Measurements | null;
  sharedGroup: SharedGroup | null;
};

export type EditorSessionExport = {
  app: "Web Visual AI Editor";
  version: "0.1" | "0.2" | "0.3" | "0.4" | "0.5";
  exportedAt: string;
  page: PageInfo;
  records: EditRecord[];
};
