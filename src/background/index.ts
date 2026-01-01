import { handleMessage } from "./handler";
import type { Request } from "../types/messages";

chrome.runtime.onMessage.addListener(
  (request: Request, sender, sendResponse) => {
    handleMessage(request, sender).then(sendResponse);
    return true;
  },
);

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Scribe] Extension installed");
});
