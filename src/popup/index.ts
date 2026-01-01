import type { Settings } from "../types";
import { DEFAULT_SETTINGS } from "../types";

const statusEl = document.getElementById("status")!;
const statusText = statusEl.querySelector(".status-text")!;
const enabledEl = document.getElementById("enabled") as HTMLInputElement;
const modelEl = document.getElementById("model") as HTMLSelectElement;
const urlEl = document.getElementById("url") as HTMLInputElement;

let currentSettings: Settings = { ...DEFAULT_SETTINGS };

async function loadSettings(): Promise<void> {
  const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
  if (response.type === "SETTINGS") {
    currentSettings = response.settings;
    enabledEl.checked = currentSettings.enabled;
    urlEl.value = currentSettings.ollamaUrl;
  }
}

async function saveSettings(partial: Partial<Settings>): Promise<void> {
  currentSettings = { ...currentSettings, ...partial };
  await chrome.runtime.sendMessage({ type: "SET_SETTINGS", settings: partial });
}

async function checkHealth(): Promise<void> {
  statusEl.classList.remove("connected", "disconnected");
  statusText.textContent = "Checking...";

  const response = await chrome.runtime.sendMessage({ type: "HEALTH" });

  if (response.type === "HEALTH_OK") {
    statusEl.classList.add("connected");
    statusText.textContent = "Connected";

    modelEl.innerHTML = "";
    for (const model of response.models) {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      if (model === currentSettings.model) {
        option.selected = true;
      }
      modelEl.appendChild(option);
    }

    if (
      !response.models.includes(currentSettings.model) &&
      response.models.length > 0
    ) {
      modelEl.value = response.models[0];
      await saveSettings({ model: response.models[0] });
    }
  } else {
    statusEl.classList.add("disconnected");
    statusText.textContent = "Disconnected";
  }
}

enabledEl.addEventListener("change", () => {
  saveSettings({ enabled: enabledEl.checked });
});

modelEl.addEventListener("change", () => {
  saveSettings({ model: modelEl.value });
});

urlEl.addEventListener("change", async () => {
  await saveSettings({ ollamaUrl: urlEl.value });
  await checkHealth();
});

loadSettings().then(checkHealth);
