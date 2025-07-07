export const EXTENSION_ID = 'gkjemnmlpgdngnchlgnhacembojdfnbm';

export function sendMessageToExtension(action: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!window.chrome?.runtime?.sendMessage) return reject('Not in Chrome');

    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { from: 'website', action, data },
      (response) => {
        if (chrome.runtime.lastError) return reject(chrome.runtime.lastError.message);
        resolve(response);
      }
    );
  });
}
