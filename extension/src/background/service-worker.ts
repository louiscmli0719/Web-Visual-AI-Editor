import type { EditorMessage } from "../shared/messages";

const CONTENT_SCRIPT_FILE = "content/index.js";

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [CONTENT_SCRIPT_FILE]
    });

    await chrome.tabs.sendMessage(tab.id, {
      type: "WVAIE_TOGGLE_EDITOR"
    } satisfies EditorMessage);
  } catch (error) {
    console.warn("[Web Visual AI Editor] Failed to toggle editor", error);
  }
});

