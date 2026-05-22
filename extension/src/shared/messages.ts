export type ToggleEditorMessage = {
  type: "WVAIE_TOGGLE_EDITOR";
};

export type EditorMessage = ToggleEditorMessage;

export type ToggleEditorResponse = {
  ok: true;
  enabled: boolean;
};

