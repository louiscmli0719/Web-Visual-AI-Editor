export type EditorSession = {
  version: "0.2";
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

export type StylePropertySnapshot = {
  property: StylePropertyName;
  label: string;
  value: string;
  inputType: StyleInputType;
  unit?: "px";
};

export type StyleChange = {
  property: StylePropertyName;
  label: string;
  oldValue: string;
  newValue: string;
  unit?: "px";
};

export type StyleDraft = Partial<Record<StylePropertyName, string>>;

export type EditRecord = {
  id: string;
  element: ElementSnapshot;
  comment: string;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
  styleChanges: StyleChange[];
};

export type EditorSessionExport = {
  app: "Web Visual AI Editor";
  version: "0.1" | "0.2";
  exportedAt: string;
  page: PageInfo;
  records: EditRecord[];
};
