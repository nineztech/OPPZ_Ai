// src/utils/extensionUtils.ts
const EXTENSION_ID = 'gkjemnmlpgdngnchlgnhacembojdfnbm';

export const isChromeRuntime = () =>
  typeof chrome !== 'undefined' &&
  typeof chrome.runtime?.sendMessage === 'function';

export const isInExtension = () =>
  window.location.protocol === 'chrome-extension:';

/**
 * A safe wrapper for chrome.runtime.sendMessage from both website and extension
 */
export function sendExtensionMessage(
  message: any,
  callback?: (response: any) => void
) {
  if (!isChromeRuntime()) {
    console.warn('Chrome runtime is not available.');
    return;
  }

  const targetId = isInExtension() ? undefined : EXTENSION_ID;

  try {
    chrome.runtime.sendMessage(targetId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Message failed:', chrome.runtime.lastError.message);
      }
      callback?.(response);
    });
  } catch (err) {
    console.error('Error sending message to extension:', err);
  }
}
