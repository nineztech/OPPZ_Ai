// Fixed Content Script with proper filter integration
let defaultFields = {
  YearsOfExperience: "",
  City: "",
  FirstName: "",
  LastName: "",
  Email: "",
  PhoneNumber: "",
};

let prevSearchValue = "";

async function stopScript() {
  const modalWrapper = document.getElementById("scriptRunningOverlay");
  if (modalWrapper) {
    modalWrapper.style.display = "none";
  }

  await chrome.storage.local.set({ autoApplyRunning: false });
  await chrome.storage.local.remove(["loopRestartUrl", "shouldRestartScript"]);

  try {
    if (!chrome || !chrome.tabs || typeof chrome.tabs.query !== "function") {
      console.error("Chrome tabs API not available");
      prevSearchValue = "";
      return;
    }
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs?.length > 0) {
      const currentTabId = tabs?.[0].id;
      const response = await chrome.runtime.sendMessage({
        action: "stopAutoApply",
        tabId: currentTabId,
      });
    }
  } catch (error) {
    console.error("Error in stopScript:", error);
  }
  prevSearchValue = "";
}

// ✅ FIXED: Get filter settings with proper error handling
async function getFilterSettings() {
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get([
        'badWords',
        'titleFilterWords', 
        'titleSkipWords',
        'badWordsEnabled',
        'titleFilterEnabled', 
        'titleSkipEnabled'
      ], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    console.log('🔧 Raw filter settings from storage:', result);
    
    // Set defaults for missing values
    const settings = {
      badWords: result.badWords || [],
      titleFilterWords: result.titleFilterWords || [],
      titleSkipWords: result.titleSkipWords || [],
      badWordsEnabled: result.badWordsEnabled !== undefined ? result.badWordsEnabled : true,
      titleFilterEnabled: result.titleFilterEnabled !== undefined ? result.titleFilterEnabled : true,
      titleSkipEnabled: result.titleSkipEnabled !== undefined ? result.titleSkipEnabled : true
    };

    console.log('🔧 Processed filter settings:', settings);
    return settings;
  } catch (error) {
    console.error('❌ Error getting filter settings:', error);
    // Return safe defaults
    return {
      badWords: [],
      titleFilterWords: [],
      titleSkipWords: [],
      badWordsEnabled: true,
      titleFilterEnabled: true,
      titleSkipEnabled: true
    };
  }
}

async function startScript() {
  await chrome.runtime.sendMessage({ action: "autoApplyRunning" });
  await chrome.storage.local.set({ autoApplyRunning: true });
}

async function checkAndPrepareRunState() {
  return new Promise((resolve) => {
    chrome.storage.local.get("autoApplyRunning", (result) => {
      if (result && result.autoApplyRunning) {
        resolve(true);
      } else {
        resolve(false);
        prevSearchValue = "";
      }
    });
  });
}

function getJobTitle(jobNameLink) {
  if (!jobNameLink) return "";
  let jobTitle = "";

  const visibleSpan = jobNameLink.querySelector('span[aria-hidden="true"]');
  if (visibleSpan && visibleSpan.textContent.trim().length > 0) {
    jobTitle = visibleSpan.textContent.trim();
  } else {
    jobTitle = jobNameLink.getAttribute("aria-label") || "";
    if (!jobTitle) {
      console.trace("Job title not found using both selectors");
    }
  }
  return jobTitle.toLowerCase();
}

async function clickDoneIfExist() {
  try {
    const modalWait = await waitForElements({
      elementOrSelector: ".artdeco-modal",
      timeout: 500,
    });
    const modal = modalWait?.[0];
    if (modal) {
      const xpathResult = getElementsByXPath({
        context: modal,
        xpath:
          '//button[.//*[contains(text(), "Done")] or contains(normalize-space(.), "Done")]',
      });
      if (xpathResult && xpathResult.length > 0) {
        const doneButton = xpathResult[0];
        await clickElement({ elementOrSelector: doneButton });
        await addDelay(300);
      }
    }
  } catch (error) {
    console.trace("clickDoneIfExist error:" + error?.message);
  }
}

// ✅ FIXED: Updated clickJob function with proper filter settings
async function clickJob(listItem, companyName, jobTitle, filterSettings) {
  return new Promise(async (resolve) => {
    if (!(await checkAndPrepareRunState())) {
      resolve(null);
      return;
    }
    
    if (filterSettings.badWordsEnabled) {
      const jobDetailsElement = document.querySelector(
        '[class*="jobs-box__html-content"]'
      );
      if (jobDetailsElement) {
        const jobContentText = jobDetailsElement.textContent
          .toLowerCase()
          .trim();
        
        const badWords = filterSettings.badWords || [];
        console.log('🔍 Checking bad words:', badWords);
        
        if (badWords?.length > 0) {
          let matchedBadWord = null;
          for (const badWord of badWords) {
            const regex = new RegExp(
              "\\b" + badWord.trim().replace(/\+/g, "\\+") + "\\b",
              "i"
            );
            if (regex.test(jobContentText)) {
              matchedBadWord = badWord;
              break;
            }
          }
          if (matchedBadWord) {
            console.log(`🚫 Job rejected due to bad word: "${matchedBadWord}"`);
            resolve(null);
            return;
          }
        }
      }
    }
    
    await runFindEasyApply(jobTitle, companyName);
    resolve(null);
  });
}

async function performInputFieldChecks() {
  try {
    const { defaultFields, inputFieldConfigs } = await chrome.storage.local.get([
      'defaultFields',
      'inputFieldConfigs'
    ]);

    const questionContainers = document.querySelectorAll(".fb-dash-form-element");

    for (const container of questionContainers) {
      if (!(await checkAndPrepareRunState())) return;

      const label = container.querySelector(".artdeco-text-input--label") ||
                   getElementsByXPath({ context: container, xpath: ".//label" })?.[0];
      const inputField = container.querySelector('input:not([type="hidden"]), textarea');

      if (!label || !inputField) continue;

      const labelText = label.textContent.trim();

      // Handle checkbox fields first
      if (inputField.type === "checkbox") {
        if (labelText.toLowerCase().includes("terms")) {
          setNativeValue(inputField, true);
          inputField.checked = true;
          inputField.dispatchEvent(new Event("change", { bubbles: true }));
        }
        continue;
      }

      // Check field configs first
      const foundConfig = inputFieldConfigs?.find(c => c.placeholderIncludes === labelText);
      if (foundConfig?.defaultValue) {
        await fillField(inputField, foundConfig.defaultValue);
        continue;
      }

      // Then check default fields
      const valueFromDefault = findClosestField(defaultFields, labelText);
      if (valueFromDefault) {
        await fillField(inputField, valueFromDefault);
        continue;
      }

      // If field is still empty, use default value "1"
      if (!inputField.value.trim()) {
        const defaultFallbackValue = "1";
        await fillField(inputField, defaultFallbackValue);

        // Optionally update config for future use
        await chrome.runtime.sendMessage({
          action: "updateInputFieldConfigsInStorage",
          data: labelText,
          defaultValue: defaultFallbackValue
        });
      }
    }
  } catch (error) {
    console.error("performInputFieldChecks error:", error);
  }
}


async function fillField(field, value) {
  if (field.matches('[role="combobox"]')) {
    await fillAutocompleteField(field, value);
  } else {
    setNativeValue(field, value);
    await performFillForm(field);
  }
}

async function performFillForm(inputField) {
  const keyEvents = ["keydown", "keypress", "input", "keyup"];
  for (const eventType of keyEvents) {
    inputField.dispatchEvent(
      new Event(eventType, { bubbles: true, cancelable: true })
    );
    await addDelay(100);
  }

  inputField.dispatchEvent(new Event("change", { bubbles: true }));
  await addDelay(200);
}

// ✅ FIXED: Enhanced job title filtering logic
function shouldSkipJobByTitle(jobTitle, filterSettings) {
  if (!jobTitle || typeof jobTitle !== 'string') {
    console.warn('⚠️ Invalid job title provided for filtering');
    return false;
  }

  const normalizedJobTitle = jobTitle.toLowerCase().trim();
  console.log('🔍 Filtering job title:', normalizedJobTitle);
  console.log('🔧 Filter settings:', filterSettings);

  // SKIP LOGIC - if enabled and has skip words
  if (filterSettings.titleSkipEnabled) {
    const skipWords = filterSettings.titleSkipWords || [];
    const cleanedSkipWords = skipWords
      .filter(word => word && typeof word === 'string')
      .map(word => word.trim().toLowerCase())
      .filter(word => word.length > 0);
    
    console.log('🚫 Skip words to check:', cleanedSkipWords);
    
    if (cleanedSkipWords.length > 0) {
      const matchedSkipWord = cleanedSkipWords.find(word => 
        normalizedJobTitle.includes(word)
      );
      
      if (matchedSkipWord) {
        console.log(`⏩ SKIPPING job "${jobTitle}" due to skip word: "${matchedSkipWord}"`);
        return true;
      }
    }
  } else {
    console.log('🔧 Title skip is disabled');
  }

  // FILTER LOGIC - if enabled and has filter words
  if (filterSettings.titleFilterEnabled) {
    const filterWords = filterSettings.titleFilterWords || [];
    const cleanedFilterWords = filterWords
      .filter(word => word && typeof word === 'string')
      .map(word => word.trim().toLowerCase())
      .filter(word => word.length > 0);
    
    console.log('✅ Filter words to check:', cleanedFilterWords);
    
    if (cleanedFilterWords.length > 0) {
      const matchedFilterWord = cleanedFilterWords.some(word => 
        normalizedJobTitle.includes(word)
      );
      
      if (!matchedFilterWord) {
        console.log(`⏩ SKIPPING job "${jobTitle}" - does not match any title filter`);
        return true;
      } else {
        console.log(`✅ Job "${jobTitle}" matches filter requirements`);
      }
    }
  } else {
    console.log('🔧 Title filter is disabled');
  }

  console.log(`✅ Job "${jobTitle}" passed all filters`);
  return false;
}

async function performRadioButtonChecks() {
  const storedRadioButtons = await new Promise((resolve) => {
    chrome.storage.local.get("radioButtons", (result) => {
      resolve(result.radioButtons || []);
    });
  });

  const radioFieldsets = document.querySelectorAll(
    'fieldset[data-test-form-builder-radio-button-form-component="true"]'
  );

  for (const fieldset of radioFieldsets) {
    const legendElement = fieldset.querySelector("legend");
    const questionTextElement = legendElement.querySelector(
      'span[aria-hidden="true"]'
    );
    const placeholderText =
      questionTextElement?.textContent.trim() ||
      legendElement.textContent.trim();

    const storedRadioButtonInfo = storedRadioButtons.find(
      (info) => info.placeholderIncludes === placeholderText
    );

    if (storedRadioButtonInfo) {
      const radioButtonWithValue = fieldset.querySelector(
        `input[type="radio"][value="${storedRadioButtonInfo.defaultValue}"]`
      );

      if (radioButtonWithValue) {
        radioButtonWithValue.checked = true;
        radioButtonWithValue.dispatchEvent(
          new Event("change", { bubbles: true })
        );
        await addDelay(500);
      }

      storedRadioButtonInfo.count++;
      if (
        !("createdAt" in storedRadioButtonInfo) ||
        !storedRadioButtonInfo.createdAt
      ) {
        storedRadioButtonInfo.createdAt = Date.now();
      }
    } else {
      const firstRadioButton = fieldset.querySelector('input[type="radio"]');
      if (firstRadioButton) {
        firstRadioButton.checked = true;
        firstRadioButton.dispatchEvent(new Event("change", { bubbles: true }));
        await addDelay(500);

        const options = Array.from(
          fieldset.querySelectorAll('input[type="radio"]')
        ).map((radioButton) => {
          const labelElement = fieldset.querySelector(
            `label[for="${radioButton.id}"]`
          );
          let text = labelElement?.textContent.trim();

          if (!text) {
            const parentElement = radioButton.parentElement;
            const textElement =
              parentElement?.querySelector("span") ||
              parentElement?.querySelector("div");
            text = textElement?.textContent?.trim() || radioButton.value;
          }

          return {
            value: radioButton.value,
            text: text,
            selected: radioButton.checked,
          };
        });

        const newRadioButtonInfo = {
          placeholderIncludes: placeholderText,
          defaultValue: firstRadioButton.value,
          count: 1,
          options: options,
          createdAt: Date.now(),
        };

        storedRadioButtons.push(newRadioButtonInfo);

        await chrome.storage.local.set({ radioButtons: storedRadioButtons });
      }
      const isStopScript = Boolean(
        (await chrome.storage.local.get("stopIfNotExistInFormControl"))
          ?.stopIfNotExistInFormControl
      );
      if (isStopScript) {
        await stopScript();
        alert(
          `Field with label "${placeholderText}" is not filled. Please fill it in the form control settings.`
        );
        return;
      }
    }
  }

  await chrome.storage.local.set({ radioButtons: storedRadioButtons });
}

async function performDropdownChecks() {
  const storedDropdowns = await new Promise((resolve) => {
    chrome.storage.local.get("dropdowns", (result) => {
      resolve(result.dropdowns || []);
    });
  });

  const dropdowns = document.querySelectorAll(".fb-dash-form-element select");
  dropdowns.forEach((dropdown, index) => {
    const parentElement = dropdown.closest(".fb-dash-form-element");
    if (parentElement) {
      const labelElement = parentElement.querySelector("label");
      let labelText = null;

      if (labelElement) {
        const ariaHiddenSpan = labelElement.querySelector(
          'span[aria-hidden="true"]'
        );
        labelText = ariaHiddenSpan?.textContent.trim();

        if (!labelText) {
          labelText = labelElement.innerText.trim();
        }
      }

      labelText = labelText || `Dropdown ${index}`;

      const secondOption = dropdown.options[1];
      if (secondOption && dropdown.selectedIndex < 1) {
        secondOption.selected = true;
        dropdown.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const options = Array.from(dropdown.options).map((option) => ({
        value: option.value,
        text: option.textContent.trim(),
        selected: option.selected,
      }));

      const storedDropdownInfo = storedDropdowns.find(
        (info) => info.placeholderIncludes === labelText
      );

      if (storedDropdownInfo) {
        const selectedValue = storedDropdownInfo.options.find(
          (option) => option.selected
        )?.value;

        Array.from(dropdown.options).forEach((option) => {
          option.selected = option.value === selectedValue;
        });

        dropdown.dispatchEvent(new Event("change", { bubbles: true }));

        storedDropdownInfo.count++;
      } else {
        const newDropdownInfo = {
          placeholderIncludes: labelText,
          count: 1,
          options: options.map((option) => ({
            value: option.value,
            text: option.text,
            selected: option.selected,
          })),
        };

        storedDropdowns.push(newDropdownInfo);
      }
    }
  });

  void chrome.storage.local.set({ dropdowns: storedDropdowns });
}

async function performCheckBoxFieldCityCheck() {
  const checkboxFieldsets = document.querySelectorAll(
    'fieldset[data-test-checkbox-form-component="true"]'
  );
  for (const fieldset of checkboxFieldsets) {
    const firstCheckbox = fieldset.querySelector('input[type="checkbox"]');
    if (firstCheckbox) {
      firstCheckbox.checked = true;
      firstCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
      await addDelay(500);
    }
  }
}

async function performSafetyReminderCheck() {
  const modal = document.querySelector(".artdeco-modal");
  if (modal) {
    const modalHeader = modal.querySelector(".artdeco-modal__header");
    if (
      modalHeader &&
      modalHeader.textContent.includes("Job search safety reminder")
    ) {
      const dismissButton = modal.querySelector(".artdeco-modal__dismiss");
      if (dismissButton) {
        dismissButton.click();
      }
    }
  }
}

async function validateAndCloseConfirmationModal() {
  const modal = document.querySelector(".artdeco-modal");
  if (modal) {
    const modalHeader = modal.querySelector(".artdeco-modal__header");
    if (
      modalHeader &&
      modalHeader.textContent.includes("Save this application?")
    ) {
      const dismissButton = modal.querySelector(".artdeco-modal__dismiss");
      if (dismissButton) {
        dismissButton.click();
      }
    }
  }
}

async function checkForError() {
  const feedbackMessageElement = document.querySelector(
    ".artdeco-inline-feedback__message"
  );
  return feedbackMessageElement !== null;
}

async function terminateJobModel(context = document) {
  const dismissButton = context.querySelector('button[aria-label="Dismiss"]');
  if (dismissButton) {
    dismissButton.click();
    dismissButton.dispatchEvent(new Event("change", { bubbles: true }));
    await addDelay(500);
    const discardButton = Array.from(
      document.querySelectorAll("button[data-test-dialog-secondary-btn]")
    ).find((button) => button.textContent.trim() === "Discard");
    if (discardButton) {
      discardButton.click();
      discardButton.dispatchEvent(new Event("change", { bubbles: true }));
      await addDelay(500);
    }
  }
}

async function runValidations() {
  await validateAndCloseConfirmationModal();
  await performInputFieldChecks();
  await performRadioButtonChecks();
  await performDropdownChecks();
  await performCheckBoxFieldCityCheck();
}

async function uncheckFollowCompany() {
  const followCheckboxWait = await waitForElements({
    elementOrSelector: "#follow-company-checkbox",
    timeout: 3000,
  });

  const followCheckbox = followCheckboxWait?.[0];
  if (followCheckbox?.checked) {
    followCheckbox?.scrollIntoView({ block: "center" });
    await addDelay(300);
    followCheckbox.checked = false;
    const changeEvent = new Event("change", {
      bubbles: true,
      cancelable: true,
    });

    followCheckbox.dispatchEvent(changeEvent);
    await addDelay(200);
  }
}

async function runApplyModel() {
  try {
    return await Promise.race([
      new Promise(async (resolve) => {
        await addDelay();
        await performSafetyReminderCheck();
        const applyModalWait = await waitForElements({
          elementOrSelector: ".artdeco-modal",
          timeout: 3000,
        });
        if (Array.isArray(applyModalWait)) {
          const applyModal = applyModalWait[0];
          const continueApplyingButton = applyModal?.querySelector(
            'button[aria-label="Continue applying"]'
          );

          if (continueApplyingButton) {
            continueApplyingButton?.scrollIntoView({ block: "center" });
            await addDelay(300);
            continueApplyingButton.click();
            await runApplyModel();
          }

          const nextButton =
            applyModal?.querySelectorAll &&
            Array.from(applyModal.querySelectorAll("button")).find((button) =>
              button.textContent.includes("Next")
            );
          const reviewButtonWait = await waitForElements({
            elementOrSelector: 'button[aria-label="Review your application"]',
            timeout: 2000,
          });
          const reviewButton = reviewButtonWait?.[0];
          const submitButtonWait = await waitForElements({
            elementOrSelector: 'button[aria-label="Submit application"]',
            timeout: 2000,
          });
          const submitButton = submitButtonWait?.[0];
          if (submitButton) {
            await uncheckFollowCompany();
            submitButton?.scrollIntoView({ block: "center" });
            await addDelay(300);
            if (!(await checkAndPrepareRunState())) return;
            submitButton.click();
            await addDelay();
            if (!(await checkAndPrepareRunState())) return;
            const modalCloseButton = document.querySelector(
              ".artdeco-modal__dismiss"
            );
            if (modalCloseButton) {
              modalCloseButton?.scrollIntoView({ block: "center" });
              await addDelay(300);
              modalCloseButton.click();
            }
            await clickDoneIfExist();
          }
          if (nextButton || reviewButton) {
            const buttonToClick = reviewButton || nextButton;
            await runValidations();
            const isError = await checkForError();

            if (isError) {
              await terminateJobModel();
            } else {
              buttonToClick?.scrollIntoView({ block: "center" });
              await addDelay();
              buttonToClick.click();
              await runApplyModel();
            }
            if (
              document
                ?.querySelector("button[data-test-dialog-secondary-btn]")
                ?.innerText.includes("Discard")
            ) {
              await terminateJobModel();
              resolve(null);
            }
          }
        }
        if (!document?.querySelector(".artdeco-modal")) {
          resolve(null);
        } else {
          const modalsToClose = Array.from(
            document.querySelectorAll(".artdeco-modal")
          );
          for (const modal of modalsToClose) {
            await addDelay(1000);
            await terminateJobModel(modal);
          }
        }
        await addDelay(1000);
        return new Promise((resolve) => {
          const artdecoModal = document.querySelector(
            '[class*="artdeco-modal"]'
          );
          if (artdecoModal) {
            const buttons = artdecoModal.querySelectorAll("button");
            for (const button of buttons) {
              if (
                "textContent" in button &&
                button?.textContent?.trim()?.includes("No thanks")
              ) {
                button.click();
                resolve(null);
                break;
              }
            }
            resolve(null);
          }
        }).catch(() => resolve(null));
      }),
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, 30000);
      }),
    ]);
  } catch (error) {
    const message = "runApplyModel error:" + error?.message;
    console.trace(message);
    console.error(message);
  }
}

const savedJobsCache = new Set();

async function runFindEasyApply(jobTitle, companyName) {
  return new Promise(async (resolve) => {
    await addDelay(1000);
    const currentPageLink = window.location.href;

    const jobKey = `${jobTitle?.toLowerCase().trim()}::${companyName?.toLowerCase().trim()}::${currentPageLink}`;

    if (!savedJobsCache.has(jobKey)) {
      savedJobsCache.add(jobKey); // prevent repeat per page

      const jobId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

      await chrome.runtime.sendMessage({
        action: "recordAutoAppliedJob",
        data: {
          job: {
            id: jobId,
            title: jobTitle,
            companyName,
            link: currentPageLink,
            time: Date.now(),
          },
        },
      });
    }

    const easyApplyElements = getElementsByXPath({ xpath: easy_apply_button });
    if (easyApplyElements.length > 0) {
      const buttonPromises = Array.from(easyApplyElements).map(async (button) => {
        return await new Promise((resolve) => {
          checkAndPrepareRunState().then((result) => {
            if (!result) return resolve(null);
            button.click();
            resolve(runApplyModel());
          });
        });
      });
      await Promise.race(buttonPromises);
    }

    resolve(null);
  });
}

let currentPage = "";

function toggleBlinkingBorder(element) {
  let count = 0;
  const intervalId = setInterval(() => {
    element.style.border = count % 2 === 0 ? "2px solid red" : "none";
    count++;
    if (count === 10) {
      clearInterval(intervalId);
      element.style.border = "none";
    }
  }, 500);
}

async function checkLimitReached() {
  return new Promise((resolve) => {
    const feedbackMessageElement = document.querySelector(
      ".artdeco-inline-feedback__message"
    );

    if (feedbackMessageElement) {
      const textContent = feedbackMessageElement.textContent;

      const searchString = "You've exceeded the daily application limit";

      resolve(textContent.includes(searchString));
    } else {
      resolve(false);
    }
  });
}

function isChromeStorageAvailable() {
  return (
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
  );
}

async function checkAndPromptFields() {
  try {
    if (!isChromeStorageAvailable()) {
      return false;
    }
    const response = await chrome.storage.local.get("defaultFields");
    return response?.defaultFields;
  } catch (error) {
    console.trace("Error in checkAndPromptFields: " + error?.message);
    return false;
  }
}

async function fillSearchFieldIfEmpty() {
  if (!(await checkAndPrepareRunState())) return;
  const inputElement = document?.querySelector(
    '[id*="jobs-search-box-keyword"]'
  );
  if (prevSearchValue && inputElement) {
    if (!inputElement.value.trim()) {
      inputElement.focus();
      await addDelay(2000);
      inputElement.value = prevSearchValue;
      const inputEvent = new Event("input", { bubbles: true });
      await addDelay(100);
      inputElement.dispatchEvent(inputEvent);
      await addDelay(100);
      const changeEvent = new Event("change", { bubbles: true });
      await addDelay(100);
      inputElement.dispatchEvent(changeEvent);
      await addDelay(100);
      const lists = document?.querySelectorAll(
        '[class*="typeahead-results"] > li'
      );
      if (lists) {
        for (const list of lists) {
          if ("click" in list) {
            list.click();
          }
        }
      }
    }
  }
}

async function closeApplicationSentModal() {
  const modal = document.querySelector(".artdeco-modal");

  if (
    modal?.textContent.includes("Application sent") &&
    modal.textContent.includes("Your application was sent to")
  ) {
    modal.querySelector(".artdeco-modal__dismiss")?.click();
  }
}

let isNavigating = false;

async function handleLoopRestart() {
  try {
    const { lastJobSearchUrl, loopRunningDelay } = await chrome.storage.local.get([
      "lastJobSearchUrl",
      "loopRunningDelay"
    ]);
    
    const delayInMs = (loopRunningDelay || 0) * 1000;
    
    if (delayInMs > 0) {
      await addDelay(delayInMs);
    }
    
    const urlToUse = lastJobSearchUrl || window.location.href;
    const url = new URL(urlToUse);
    url.searchParams.set("start", "1");

    const baseSearchParams = new URLSearchParams();
    const importantParams = [
      "keywords",
      "geoId",
      "f_TPR",
      "sortBy",
      "origin",
      "refresh",
    ];

    importantParams.forEach((param) => {
      if (url.searchParams.has(param)) {
        baseSearchParams.set(param, url.searchParams.get(param));
      }
    });
    baseSearchParams.set("start", "1");

    const newUrl = `${url.origin}${
      url.pathname
    }?${baseSearchParams.toString()}`;

    await chrome.storage.local.set({
      loopRestartUrl: newUrl,
      shouldRestartScript: true,
    });

    window.location.href = newUrl;
  } catch (error) {
    console.trace("Error in handleLoopRestart: " + error?.message);
    stopScript();
  }
}

async function goToNextPage() {
  await addDelay();
  if (isNavigating) {
    return false;
  }

  isNavigating = true;

  try {
    const pagination = document?.querySelector(".jobs-search-pagination");
    const paginationPage = pagination?.querySelector(
      ".jobs-search-pagination__indicator-button--active"
    )?.innerText;
    const nextButton = pagination?.querySelector("button[aria-label*='next']");
    if (!nextButton) {
      isNavigating = false;
      const { loopRunning } = await chrome.storage.local.get("loopRunning");
      if (loopRunning) {
        await handleLoopRestart();
      } else {
        stopScript();
      }
      return false;
    }

    nextButton.scrollIntoView({ behavior: "smooth", block: "center" });
    await addDelay(1000);
    nextButton.click();

    try {
      await waitForElements({
        elementOrSelector: ".scaffold-layout__list-item",
        timeout: 5000,
      });
    } catch (error) {
      console.trace("goToNextPage waitForElements error:" + error?.message);
    }

    await addDelay(1000);
    const scrollElement = document?.querySelector(
      ".scaffold-layout__list > div"
    );
    scrollElement?.scrollTo({
      top: scrollElement.scrollHeight,
    });

    await new Promise((resolve) => {
      const checkPageLoaded = () => {
        if (document.readyState === "complete") {
          resolve();
        } else {
          setTimeout(checkPageLoaded, 500);
        }
      };
      checkPageLoaded();
    });

    currentPage = paginationPage;

    isNavigating = false;

    await runScript();
    return true;
  } catch (error) {
    console.error("Error navigating to next page:", error);
    isNavigating = false;
    return false;
  }
}

// ✅ FIXED: Main runScript function with proper filter integration
async function runScript() {
  try {
    console.log("🔥 runScript triggered");

    await addDelay(3000);
    if (!chrome || !chrome.runtime) {
      console.error("❌ Extension context invalidated");
      return;
    }

    const currentUrl = window.location.href;
    if (
      currentUrl.includes("/jobs/search/") &&
      currentUrl.includes("keywords=")
    ) {
      await chrome.storage.local.set({ lastJobSearchUrl: currentUrl });
    }

    await startScript();
    await fillSearchFieldIfEmpty();
    if (!(await checkAndPrepareRunState())) return;

    await chrome.storage.local.set({ autoApplyRunning: true });

    const fieldsComplete = await checkAndPromptFields();
    if (!fieldsComplete) {
      await chrome.runtime.sendMessage({ action: "openDefaultInputPage" });
      return;
    }

    const limitReached = await checkLimitReached();
    if (limitReached) {
      const feedbackMessageElement = document.querySelector(
        ".artdeco-inline-feedback__message"
      );
      toggleBlinkingBorder(feedbackMessageElement);
      return;
    }

    // ✅ FIXED: Get filter settings using the new function
    const filterSettings = await getFilterSettings();
    console.log("🔧 Filter settings loaded:", filterSettings);

    const listItems = await waitForElements({
      elementOrSelector: ".scaffold-layout__list-item",
    });

    for (const listItem of listItems) {
      if (!(await checkAndPrepareRunState())) return;
      await addDelay(300);

      await closeApplicationSentModal();

      const linksElements = await waitForElements({
        elementOrSelector: ".artdeco-entity-lockup__title .job-card-container__link",
        timeout: 5000,
        contextNode: listItem,
      });
      const jobNameLink = linksElements?.[0];

      if (!jobNameLink) {
        console.warn("⚠️ No job link found");
        continue;
      }

      jobNameLink.scrollIntoView({ behavior: "smooth", block: "center" });

      const jobFooter = listItem.querySelector('[class*="footer"]');
      if (jobFooter && jobFooter.textContent.trim() === "Applied") {
        console.log("⛔ Already applied to job");
        continue;
      }

      const companyNames = listItem.querySelectorAll('[class*="subtitle"]');
      const companyNamesArray = Array.from(companyNames).map((el) =>
        el.textContent.trim()
      );
      const companyName = companyNamesArray?.[0] ?? "";

      const jobTitle = getJobTitle(jobNameLink);

      if (!jobTitle) {
        console.warn("❌ Could not extract job title. Skipping.");
        continue;
      }

      // ✅ FIXED: Use the enhanced filtering function
      if (shouldSkipJobByTitle(jobTitle, filterSettings)) {
        continue; // Skip this job
      }

      // ✅ If we reach here, the job passed all filters
      console.log(`✅ Processing job: "${jobTitle}" at "${companyName}"`);

      if (await checkAndPrepareRunState()) {
        try {
          await clickElement({ elementOrSelector: jobNameLink });
          const mainContentElement = (
            await waitForElements({ elementOrSelector: ".jobs-details__main-content" })
          )?.[0];
          if (!mainContentElement) {
            console.warn("⚠️ Could not find job details section. Skipping.");
            continue;
          }
          // ✅ FIXED: Pass the full filterSettings object
          await clickJob(listItem, companyName, jobTitle, filterSettings);
        } catch (err) {
          console.error("⚠️ Error clicking or applying:", err);
        }
      }
    }

    if (await checkAndPrepareRunState()) {
      await goToNextPage();
    }
  } catch (error) {
    console.error("💥 Error in runScript:", error);
    await stopScript();
  }
}

// ✅ FIXED: Enhanced message listener with filter settings support
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showNotOnJobSearchAlert") {
    const modalWrapper = document.getElementById("notOnJobSearchOverlay");
    if (modalWrapper) {
      modalWrapper.style.display = "flex";
      sendResponse({ success: true });
    } else {
      sendResponse({
        success: false,
        error: "onotOnJobSearchOverlay not found",
      });
    }
  } else if (message.action === "showFormControlAlert") {
    const modalWrapper = document.getElementById("formControlOverlay");
    if (modalWrapper) {
      modalWrapper.style.display = "flex";
    } else {
      sendResponse({ success: false, error: "formControlOverlay not found" });
    }
  } else if (message.action === "checkScriptRunning") {
    checkAndPrepareRunState()
      .then((isRunning) => {
        sendResponse({ isRunning: Boolean(isRunning) });
      })
      .catch(() => {
        sendResponse({ isRunning: false });
      });
    return true;
  } else if (message.action === "getCurrentUrl") {
    sendResponse({ url: window.location.href });
  } else if (message.action === "showSavedLinksModal") {
    const modalWrapper = document.getElementById("savedLinksOverlay");
    if (modalWrapper) {
      const linksData = message.savedLinks;
      modalWrapper.style.display = "flex";
      const listEl = modalWrapper.querySelector("#savedLinksList");
      if (listEl) {
        listEl.innerHTML = "";
        Object.entries(linksData).forEach(([name, url]) => {
          const li = document.createElement("li");
          li.className = "saved-link-item";
          const nameEl = document.createElement("span");
          nameEl.textContent = name;
          li.appendChild(nameEl);
          const goButton = document.createElement("button");
          goButton.className = "modal-button primary go-button";
          goButton.textContent = "Go";
          goButton.addEventListener("click", () => {
            if (typeof url === "string") {
              window.open(url, "_blank");
              void chrome.runtime.sendMessage({
                action: "openTabAndRunScript",
                url: url,
              });
            } else {
              console.trace("Invalid url type:" + String(typeof url));
            }
          });
          li.appendChild(goButton);
          const deleteButton = document.createElement("button");
          deleteButton.className = "modal-button danger delete-button";
          deleteButton.textContent = "Delete";
          deleteButton.addEventListener("click", () => {
            chrome.storage.local.get("savedLinks", (result) => {
              const savedLinks = result.savedLinks || {};
              delete savedLinks[name];
              chrome.storage.local.set({ savedLinks }, () => {
                li.remove();
              });
            });
          });
          li.appendChild(deleteButton);
          listEl.appendChild(li);
        });
      }
    }
    sendResponse({ success: true });
  } else if (message.action === "showRunningModal") {
    sendResponse({ success: true });
  } else if (message.action === "hideRunningModal") {
    const modalWrapper = document.getElementById("scriptRunningOverlay");
    if (modalWrapper) {
      modalWrapper.style.display = "none";
      sendResponse({ success: true });
    } else {
      sendResponse({
        success: false,
        message: "scriptRunningOverlay not found",
      });
    }
  } else if (message.action === "filterSettingsUpdated") {
    // ✅ NEW: Handle filter settings updates from extension popup
    console.log("🔧 Filter settings updated, refreshing cache...");
    // Force refresh filter settings on next job processing
    filterSettingsCache = null;
    sendResponse({ success: true });
  } else if (message.action === "getFilterSettings") {
    // ✅ NEW: Handle filter settings requests
    getFilterSettings()
      .then(settings => sendResponse({ success: true, data: settings }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep response channel open
  }
});

// ✅ NEW: Add filter settings cache for performance
let filterSettingsCache = null;
const CACHE_DURATION = 5000; // 5 seconds

// ✅ NEW: Enhanced filter settings getter with caching
async function getCachedFilterSettings() {
  if (filterSettingsCache && 
      Date.now() - filterSettingsCache.timestamp < CACHE_DURATION) {
    return filterSettingsCache.data;
  }
  
  const settings = await getFilterSettings();
  filterSettingsCache = {
    data: settings,
    timestamp: Date.now()
  };
  
  return settings;
}

window.addEventListener("error", function (event) {
  if (
    event.error &&
    event.error.message &&
    event.error.message.includes("Extension context invalidated")
  ) {
    console.error("Extension context invalidated. Stopping script.");

    try {
      const modalWrapper = document.getElementById("scriptRunningOverlay");
      if (modalWrapper) {
        modalWrapper.style.display = "none";
      }
    } catch {}
  }
});

window.addEventListener("load", function () {
  chrome.storage.local.get(
    ["shouldRestartScript", "loopRestartUrl"],
    ({ shouldRestartScript, loopRestartUrl }) => {
      try {
        if (shouldRestartScript && loopRestartUrl) {
          const currentUrl = new URL(window.location.href);
          const savedUrl = new URL(loopRestartUrl);

          const isJobSearchPage = currentUrl.pathname.includes("/jobs/search/");
          const hasKeywords =
            currentUrl.searchParams.has("keywords") ||
            savedUrl.searchParams.has("keywords");
          const isStartPage =
            currentUrl.searchParams.get("start") === "1" ||
            !currentUrl.searchParams.has("start");
          if (isJobSearchPage && hasKeywords && isStartPage) {
            chrome.storage.local.remove([
              "loopRestartUrl",
              "shouldRestartScript",
            ]);
            setTimeout(() => {
              startScript();
              runScript();
            }, 3000);
          } else if (currentUrl.href.includes("JOBS_HOME_JYMBII")) {
            setTimeout(() => {
              window.location.href = loopRestartUrl;
            }, 2000);
          } else {
            chrome.storage.local.remove([
              "loopRestartUrl",
              "shouldRestartScript",
            ]);
            chrome.storage.local.set({ autoApplyRunning: false });
          }
        } else {
          chrome.storage.local.set({ autoApplyRunning: false });
        }
      } catch {}
    }
  );
});

try {
  window.addEventListener("beforeunload", function () {
    chrome.storage.local.set({ autoApplyRunning: false });
  });
} catch {}

// ✅ FIXED: Storage listener for real-time filter updates
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    const filterKeys = [
      'badWords', 'titleFilterWords', 'titleSkipWords',
      'badWordsEnabled', 'titleFilterEnabled', 'titleSkipEnabled'
    ];
    
    const hasFilterChanges = Object.keys(changes).some(key => 
      filterKeys.includes(key)
    );
    
    if (hasFilterChanges) {
      console.log('🔧 Filter settings changed in storage, clearing cache...');
      filterSettingsCache = null; // Clear cache to force refresh
    }
  }
});

// Your existing content script functionality...
// PERSISTENT Auto-popup functionality - Always visible on LinkedIn
let extensionNotificationShown = false;
let notificationCheckInterval = null;
let currentNotificationType = null;
let isExtensionActive = true; // Always active
let initializationComplete = false;

// Force show notification - no conditions that prevent it
function shouldShowNotification() {
    return new Promise((resolve) => {
        const currentUrl = window.location.href;
        const isLinkedIn = currentUrl.includes('linkedin.com');
        // Always show on LinkedIn - no storage checks that could prevent it
        resolve(isLinkedIn);
    });
}

async function autoShowExtensionPopup() {
    const shouldShow = await shouldShowNotification();
    if (!shouldShow) {
        return;
    }

    // Force show even if exists - ensure visibility
    const existingNotification = document.getElementById('personal-extension-notification');
    const existingMinimized = document.getElementById('personal-extension-notification-minimized');
    
    // If already visible, don't duplicate
    if (existingNotification || existingMinimized) {
        extensionNotificationShown = true;
        isExtensionActive = true;
        return;
    }

    // Get current state
    chrome.storage.local.get(['authToken', 'userEmail', 'extensionPersistentState'], (result) => {
        const isAuthenticated = result.authToken && result.userEmail;
        const persistentState = result.extensionPersistentState || { active: true, minimized: false };
        const currentUrl = window.location.href;
        const isJobPage = currentUrl.includes('/jobs/view/') || 
                         currentUrl.includes('/jobs/collections/') ||
                         currentUrl.includes('/jobs/search/');
        
        // Determine notification type
        let notificationType;
        if (!isAuthenticated) {
            notificationType = 'login';
        } else if (isJobPage) {
            notificationType = 'job-ready';
        } else {
            notificationType = 'ready';
        }
        
        currentNotificationType = notificationType;
        isExtensionActive = true;
        
        // Always update state to active
        chrome.storage.local.set({
            extensionPersistentState: {
                active: true,
                minimized: persistentState.minimized,
                type: notificationType
            }
        });
        
        // Show appropriate notification
        if (persistentState.minimized) {
            showMinimizedNotification();
        } else {
            showFullNotification(notificationType, isAuthenticated, isJobPage);
        }
    });
}

function showFullNotification(notificationType, isAuthenticated, isJobPage) {
    let config;
    
    if (!isAuthenticated) {
        config = {
            type: 'login',
            title: 'OPPZ Ai',
            message: 'Please log in to start auto-applying to jobs',
            actionText: 'Login Now',
            actionCallback: () => openExtensionAction('login')
        };
    } else if (isJobPage) {
        config = {
            type: 'job-ready',
            title: 'Auto Apply Ready!',
            message: 'Auto-apply feature ready for this job',
            actionText: 'Start Auto Apply',
            actionCallback: () => openExtensionAction('auto-apply')
        };
    } else {
        config = {
            type: 'ready',
            title: 'OPPZ Ai',
            message: 'Ready to help you apply to jobs on LinkedIn',
            actionText: 'Open Extension',
            actionCallback: () => openExtensionAction('open-extension')
        };
    }
    
    showExtensionNotification(config);
}

function openExtensionAction(actionType) {
    switch (actionType) {
        case 'login':
            chrome.runtime.sendMessage({ action: 'openExtensionPopup' });
            break;
        case 'auto-apply':
            chrome.runtime.sendMessage({ 
                action: 'startAutoApply',
                currentUrl: window.location.href 
            });
            break;
        case 'open-extension':
            chrome.runtime.sendMessage({ action: 'openExtensionPopup' });
            break;
        default:
            console.log('Unknown action type:', actionType);
    }
}

function showExtensionNotification({ type, title, message, actionText, actionCallback }) {
    // Remove any existing full notification
    const existingNotification = document.getElementById('personal-extension-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
 
    extensionNotificationShown = true;

    // Create notification
    const notification = document.createElement('div');
notification.id = 'personal-extension-notification';
notification.innerHTML = `
  <div class="extension-notification-content">
    <div class="extension-notification-header">
     <div class="extension-notification-icon" id="extension-logo-container" style="position: relative; width: 40px; height: 40px;">
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style="position: absolute; top: 0; left: 10;">
    <rect x="1" y="1" width="38" height="38" rx="10" ry="10" 
          fill="transparent" stroke="white" stroke-width="1" />
  </svg>
</div>

      <h3 class="extension-notification-title">${title}</h3>
      <button class="extension-notification-minimize" id="extension-notification-minimize" title="Minimize">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
          <path d="M4 8h8" stroke="#ffffffff" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <p class="extension-notification-message">${message}</p>
    <div class="extension-notification-actions">
      <button class="extension-notification-action" id="extension-notification-action">
        ${actionText}
      </button>
    </div>
  </div>
`;

// 🔽 Dynamically inject the logo image
const logoImg = document.createElement('img');
logoImg.src = chrome.runtime.getURL('assets/images/OPPZ_Ai_Logo.png');
logoImg.alt = 'Logo';

// Center the image inside the 40x40 container
logoImg.style.position = 'absolute';
logoImg.style.top = '50%';
logoImg.style.left = '72%';
logoImg.style.transform = 'translate(-50%, -50%)';
logoImg.style.width = '26px'; // adjust size as needed
logoImg.style.height = '26px';
logoImg.style.pointerEvents = 'none'; // avoid click interference

const logoContainer = notification.querySelector('#extension-logo-container');
if (logoContainer) {
  logoContainer.appendChild(logoImg);
}

// Add styles
addNotificationStyles();

document.body.appendChild(notification);

    // Add event listeners
    const actionButton = notification.querySelector('#extension-notification-action');
    const minimizeButton = notification.querySelector('#extension-notification-minimize');

    if (actionButton) {
        actionButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                actionCallback();
            } catch (error) {
                console.error('Error executing action callback:', error);
            }
        });
    }

    if (minimizeButton) {
        minimizeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            minimizeNotification(notification);
        });
    }

    // Update badge
    try {
        chrome.runtime.sendMessage({ 
            action: 'updateExtensionBadge', 
            text: type === 'login' ? '!' : '●',
            color: type === 'login' ? '#ff4444' : '#0066cc'
        });
    } catch (error) {
        console.log('Could not update badge:', error);
    }
}

function addNotificationStyles() {
    if (document.head.querySelector('#extension-notification-styles')) {
        return; // Already added
    }
    
    const style = document.createElement('style');
    style.id = 'extension-notification-styles';
    style.textContent = `
        #personal-extension-notification {
            position: fixed !important;
            top: 80px !important;
            right: 20px !important;
            width: 320px !important;
            background: white !important;
            color:white;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
            border: 1px solid #e1e5e9 !important;
            z-index: 999999 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            animation: extensionSlideIn 0.3s ease-out !important;
            overflow: hidden !important;
        }

        @keyframes extensionSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .extension-notification-content {
            padding: px !important;
        }

        .extension-notification-header {
            display: flex !important;
            align-items: center !important;
            background: linear-gradient(to right, #8c33daff, #655ee7ff) !important;
            gap: 8px !important;
            height:46px; !important;
            margin-bottom: 8px !important;
        }

        .extension-notification-icon {
            flex-shrink: 0 !important;
        }

        .extension-notification-title {
            flex: 1 !important;
            margin: 0 !important;
            margin-left:8px !important;
            font-size: 21px !important;
            font-weight: 600 !important;
            color: #ffffffff !important;
        }

        .extension-notification-minimize {
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            color:white;
            padding: 4px !important;
            border-radius: 4px !important;
            transition: background-color 0.2s !important;
            opacity: 0.6 !important;
            margin-right:8px !important;
        }

        .extension-notification-minimize:hover {
            background-color: none !important;
            opacity: 1 !important;
        }

        .extension-notification-message {
           margin: 12px 0 12px 8px !important;

            font-size: 13px !important;
            color: #070707ff !important;
            line-height: 1.4 !important;
        }

        .extension-notification-actions {
            display: flex !important;
            gap: 8px !important;
            margin:16px !important;
        }

        .extension-notification-action {
            flex: 1 !important;
           background: linear-gradient(to right, #8c33daff, #655ee7ff) !important;
            color: white !important;
            border: none !important;
            padding: 10px 16px !important;
             margin:16px !important;
            border-radius: 8px !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: background-color 0.2s !important;
        }

        .extension-notification-action:hover {
            background: linear-gradient(to right, #792dbbff, #514cbeff) !important;
        }

        .extension-notification-action:active {
            transform: translateY(1px) !important;
        }

        #personal-extension-notification-minimized {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: linear-gradient(to right, #8c33daff, #655ee7ff) !important;
            border-radius: 24px !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
            border: 1px solid #e1e5e9 !important;
            z-index: 999999 !important;
            cursor: pointer !important;
            color:#ffffffff !important;
            transition: transform 0.2s !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        #personal-extension-notification-minimized:hover {
            transform: scale(1.05) !important;
            color:white !important;
        }

        .extension-notification-minimized-content {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 8px 12px !important;
        }

        .extension-notification-minimized-text {
            font-size: 12px !important;
            font-weight: 500 !important;
            color: #fafafaff !important;
        }
    `;
    
    document.head.appendChild(style);
}

function minimizeNotification(notification) {
    // Update state to minimized
    chrome.storage.local.set({
        extensionPersistentState: {
            active: true,
            minimized: true,
            type: currentNotificationType
        }
    });
    
    notification.remove();
    showMinimizedNotification();
}

function showMinimizedNotification() {
    // Remove existing minimized
    const existingMinimized = document.getElementById('personal-extension-notification-minimized');
    if (existingMinimized) {
        existingMinimized.remove();
    }

    const minimized = document.createElement('div');
    minimized.id = 'personal-extension-notification-minimized';
    minimized.innerHTML = `
        <div class="extension-notification-minimized-content">
            <div class="extension-notification-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#41cc00ff"/>
                    <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <span class="extension-notification-minimized-text">OPPZ Ai</span>
        </div>
    `;

    addNotificationStyles(); // Ensure styles are present
    document.body.appendChild(minimized);
    extensionNotificationShown = true;

    // Click to restore
    minimized.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        chrome.storage.local.set({
            extensionPersistentState: {
                active: true,
                minimized: false,
                type: currentNotificationType
            }
        });
        
        minimized.remove();
        extensionNotificationShown = false;
        setTimeout(() => autoShowExtensionPopup(), 100);
    });
}

// Force restore notification - more aggressive
function forceRestoreNotification() {
    const hasNotification = document.getElementById('personal-extension-notification') || 
                           document.getElementById('personal-extension-notification-minimized');
    
    if (!hasNotification) {
        console.log('Force restoring notification...');
        extensionNotificationShown = false;
        autoShowExtensionPopup();
    }
}

// Aggressive watchdog - checks frequently and forces restoration
function startNotificationWatchdog() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
    }
    
    notificationCheckInterval = setInterval(async () => {
        try {
            // Always force check and restore
            forceRestoreNotification();
            
            // Update notification type if page changed
            const currentUrl = window.location.href;
            const isJobPage = currentUrl.includes('/jobs/view/') || 
                             currentUrl.includes('/jobs/collections/') ||
                             currentUrl.includes('/jobs/search/');
            
            chrome.storage.local.get(['authToken', 'userEmail'], (result) => {
                const isAuthenticated = result.authToken && result.userEmail;
                let expectedType;
                
                if (!isAuthenticated) {
                    expectedType = 'login';
                } else if (isJobPage) {
                    expectedType = 'job-ready';
                } else {
                    expectedType = 'ready';
                }
                
                // Update if type changed
                if (expectedType !== currentNotificationType) {
                    currentNotificationType = expectedType;
                    
                    // Force update notification
                    const fullNotification = document.getElementById('personal-extension-notification');
                    if (fullNotification) {
                        fullNotification.remove();
                        extensionNotificationShown = false;
                        setTimeout(() => autoShowExtensionPopup(), 200);
                    }
                }
            });
        } catch (error) {
            console.log('Watchdog error:', error);
        }
    }, 1000); // Check every second for maximum persistence
}

// Multiple initialization points for maximum reliability
function initializeExtension() {
    console.log('Initializing OPPZ extension...');
    isExtensionActive = true;
    
    // Force show immediately
    setTimeout(() => {
        autoShowExtensionPopup();
        startNotificationWatchdog();
        initializationComplete = true;
    }, 500);
    
    // Backup initialization
    setTimeout(() => {
        if (!initializationComplete) {
            console.log('Backup initialization...');
            autoShowExtensionPopup();
            startNotificationWatchdog();
        }
    }, 2000);
}

// Execute on LinkedIn
if (window.location.hostname.includes('linkedin.com')) {
    // Immediate initialization
    initializeExtension();
    
    // DOM ready initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    }
    
    // Window load initialization
    window.addEventListener('load', () => {
        setTimeout(initializeExtension, 500);
    });

    // Page navigation handling
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            console.log('Navigation detected:', lastUrl);
            
            // Force restore after navigation
            setTimeout(() => {
                forceRestoreNotification();
            }, 500);
            
            setTimeout(() => {
                forceRestoreNotification();
            }, 1500);
        }
    });
    
    // Start observing
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });
    }

    // Tab visibility handling
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(forceRestoreNotification, 300);
        }
    });

    // Window focus handling
    window.addEventListener('focus', () => {
        setTimeout(forceRestoreNotification, 200);
    });

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
        if (notificationCheckInterval) {
            clearInterval(notificationCheckInterval);
        }
    });

    // Additional safety nets
    setInterval(() => {
        if (window.location.hostname.includes('linkedin.com')) {
            forceRestoreNotification();
        }
    }, 3000); // Every 3 seconds as ultimate fallback

    // Handle dynamic content changes
    const contentObserver = new MutationObserver(() => {
        // Ensure notification survives DOM changes
        setTimeout(forceRestoreNotification, 100);
    });
    
    if (document.body) {
        contentObserver.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: false 
        });
    }
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'startAutoApply':
      return handleStartAutoApply(msg.jobUrl, sender.tab, sendResponse);
    case 'stopAutoApply':
      return handleAutoApplyStop(sender.tab?.id, sendResponse);
    case 'checkAutoApplyStatus':
      return checkAutoApplyStatus(sender.tab?.id, sendResponse);
    default:
      console.warn('Unknown action:', msg.action);
      sendResponse({ success: false, message: 'Unknown action' });
      return false;
  }
});

// Add these functions to your content script (the one that handles auto-apply)
// Enhanced Content Script for Job Application Tracking System
// This script handles job information extraction and auto-apply tracking on LinkedIn

/**
 * Extracts comprehensive job information from LinkedIn page
 * @returns {Object} Contains jobTitle, jobLink, companyName, location, jobType, etc.
 */
function extractJobInfo() {
    try {
        let jobTitle = '';
        let companyName = '';
        let location = '';
        let jobType = '';
        let jobLink = window.location.href.split('?')[0]; // Clean URL without query params
        
        // Enhanced job title selectors for better compatibility
        const titleSelectors = [
            'h1.job-title',
            '.job-details-jobs-unified-top-card__job-title',
            '.job-details-jobs-unified-top-card__job-title h1',
            '.jobs-unified-top-card__job-title',
            '.jobs-unified-top-card__job-title h1',
            'h1[data-test-id="job-title"]',
            '.job-title',
            'h1.jobs-s-apply__job-title',
            '.t-24',
            '.jobs-details-top-card__job-title',
            'h1[data-test-job-title]',
            '.job-details-jobs-unified-top-card__job-title-link'
        ];
        
        // Extract job title
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                jobTitle = element.textContent.trim();
                break;
            }
        }
        
        // Enhanced company name selectors
        const companySelectors = [
            '.job-details-jobs-unified-top-card__company-name',
            '.job-details-jobs-unified-top-card__company-name a',
            '.jobs-unified-top-card__company-name',
            '.jobs-unified-top-card__company-name a',
            'a[data-test-id="company-name"]',
            '.company-name',
            '.jobs-s-apply__company-name',
            '.jobs-unified-top-card__subtitle-primary-grouping a',
            '.jobs-details-top-card__company-url',
            '.job-card-container__company-name',
            '.jobs-company-name',
            '.jobs-poster__company-name'
        ];
        
        // Extract company name
        for (const selector of companySelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                companyName = element.textContent.trim();
                break;
            }
        }
        
        // Extract location information
        const locationSelectors = [
            '.job-details-jobs-unified-top-card__bullet',
            '.jobs-unified-top-card__bullet',
            '.job-details-jobs-unified-top-card__primary-description-container .t-black--light',
            '.jobs-unified-top-card__primary-description .t-black--light'
        ];
        
        for (const selector of locationSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                location = element.textContent.trim();
                break;
            }
        }
        
        // Extract job type (Full-time, Part-time, Contract, etc.)
        const jobTypeSelectors = [
            '.job-details-jobs-unified-top-card__job-insight .job-details-jobs-unified-top-card__job-insight-view-model-secondary',
            '.jobs-unified-top-card__job-insight .jobs-unified-top-card__job-insight-view-model-secondary'
        ];
        
        for (const selector of jobTypeSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                jobType = element.textContent.trim();
                break;
            }
        }
        
        // Clean up extracted data
        jobTitle = jobTitle.replace(/\s+/g, ' ').trim();
        companyName = companyName.replace(/\s+/g, ' ').trim();
        location = location.replace(/\s+/g, ' ').trim();
        jobType = jobType.replace(/\s+/g, ' ').trim();
        
        // Additional cleanup for company name (remove extra text)
        if (companyName.includes('•')) {
            companyName = companyName.split('•')[0].trim();
        }
        
        return {
            jobTitle: jobTitle || 'Unknown Job Title',
            companyName: companyName || 'Unknown Company',
            jobLink: jobLink,
            location: location || 'Unknown Location',
            jobType: jobType || 'Unknown Type',
            extractedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error extracting job info:', error);
        return {
            jobTitle: 'Unknown Job Title',
            companyName: 'Unknown Company',
            jobLink: window.location.href.split('?')[0],
            location: 'Unknown Location',
            jobType: 'Unknown Type',
            extractedAt: new Date().toISOString()
        };
    }
}

/**
 * Saves auto-applied job to storage via background script
 * @param {Object} additionalData - Additional job data to save
 * @returns {Promise<boolean>} True if successful
 */
async function saveAutoAppliedJob(additionalData = {}) {
    try {
        const jobInfo = extractJobInfo();
        
        if (!jobInfo.jobTitle || jobInfo.jobTitle === 'Unknown Job Title') {
            console.warn('Insufficient job information to save auto-applied job');
            return false;
        }

        const jobData = {
            jobTitle: jobInfo.jobTitle,
            jobLink: jobInfo.jobLink,
            companyName: jobInfo.companyName,
            location: jobInfo.location,
            jobType: jobInfo.jobType,
            applicationTime: new Date().toISOString(),
            ...additionalData
        };

        // Send message to background script to save the job
        const response = await chrome.runtime.sendMessage({
            action: 'saveAutoAppliedJob',
            data: jobData
        });

        if (response && response.success) {
            console.log('Auto-applied job saved successfully:', jobData);
            showNotification('Job application tracked successfully!', 'success');
            return true;
        } else {
            console.error('Failed to save auto-applied job:', response?.error || 'Unknown error');
            showNotification('Failed to track job application', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error saving auto-applied job:', error);
        showNotification('Error tracking job application', 'error');
        return false;
    }
}

/**
 * Saves external job application to storage
 * @param {Object} additionalData - Additional job data to save
 * @returns {Promise<boolean>} True if successful
 */
async function saveExternalJob(additionalData = {}) {
    try {
        const jobInfo = extractJobInfo();
        
        if (!jobInfo.jobTitle || jobInfo.jobTitle === 'Unknown Job Title') {
            console.warn('Insufficient job information to save external job');
            return false;
        }

        const jobData = {
            jobTitle: jobInfo.jobTitle,
            currentPageLink: jobInfo.jobLink,
            companyName: jobInfo.companyName,
            location: jobInfo.location,
            jobType: jobInfo.jobType,
            savedAt: new Date().toISOString(),
            ...additionalData
        };

        // Send message to background script to save the job
        const response = await chrome.runtime.sendMessage({
            action: 'externalApplyAction',
            data: jobData
        });

        if (response && response.success) {
            console.log('External job saved successfully:', jobData);
            showNotification('Job saved successfully!', 'success');
            return true;
        } else {
            console.error('Failed to save external job:', response?.error || 'Unknown error');
            showNotification('Failed to save job', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error saving external job:', error);
        showNotification('Error saving job', 'error');
        return false;
    }
}

/**
 * Enhanced application success detection with multiple methods
 * @returns {boolean} True if application was successful
 */
function checkApplicationSuccess() {
    try {
        // Success indicators on LinkedIn
        const successSelectors = [
            // Modal success messages
            '.jobs-s-apply-modal__success-message',
            '.jobs-s-apply-modal__success',
            '.artdeco-inline-feedback--success',
            
            // Success banners and alerts
            '[data-test-id="application-success"]',
            '.application-success',
            '.jobs-details-apply-success',
            'div[role="alert"]',
            '.jobs-toast-banner--success',
            '.jobs-application-success',
            
            // Header and status indicators
            '.jobs-s-apply-modal__header',
            '.jobs-unified-top-card__subtitle-applied',
            '.jobs-apply-button--applied',
            
            // Success text containers
            '.jobs-s-apply-modal__content',
            '.jobs-application-modal'
        ];
        
        // Check for success elements with specific text content
        for (const selector of successSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = element.textContent.toLowerCase();
                if (text.includes('success') || 
                    text.includes('submitted') || 
                    text.includes('applied') ||
                    text.includes('application sent') ||
                    text.includes('thank you') ||
                    text.includes('congrat') ||
                    text.includes('received your application') ||
                    text.includes('application complete')) {
                    return true;
                }
            }
        }
        
        // Check for applied status indicators
        const appliedIndicators = [
            '.jobs-unified-top-card__subtitle-applied',
            '.jobs-apply-button--applied',
            '[data-control-name="applied_state"]'
        ];
        
        for (const selector of appliedIndicators) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent.toLowerCase();
                if (text.includes('applied') || text.includes('submitted')) {
                    return true;
                }
            }
        }
        
        // Check for URL changes that indicate success
        const currentUrl = window.location.href.toLowerCase();
        if (currentUrl.includes('application-success') || 
            currentUrl.includes('applied') ||
            currentUrl.includes('success') ||
            currentUrl.includes('submitted')) {
            return true;
        }
        
        // Check for button state changes
        const applyButtons = document.querySelectorAll('[data-control-name="submit_application"], .jobs-apply-button, .jobs-s-apply button');
        for (const button of applyButtons) {
            if (button.disabled || 
                button.textContent.toLowerCase().includes('applied') ||
                button.textContent.toLowerCase().includes('submitted')) {
                return true;
            }
        }
        
        // Check for modal dialog changes
        const modals = document.querySelectorAll('.jobs-s-apply-modal, .application-modal');
        for (const modal of modals) {
            if (modal.style.display === 'none' || modal.classList.contains('hidden')) {
                // Modal closed might indicate success
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error checking application success:', error);
        return false;
    }
}

/**
 * Monitors for application success using MutationObserver
 * @param {number} timeout Maximum observation time in ms
 * @returns {Promise<boolean>} True if success detected
 */
function monitorForApplicationSuccess(timeout = 15000) {
    return new Promise((resolve) => {
        let resolved = false;
        
        const observer = new MutationObserver((mutations) => {
            if (resolved) return;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node;
                            const text = element.textContent ? element.textContent.toLowerCase() : '';
                            
                            // Check for success indicators in new content
                            if (text.includes('application sent') || 
                                text.includes('successfully submitted') ||
                                text.includes('application submitted') ||
                                text.includes('thank you for applying') ||
                                text.includes('congrat') ||
                                text.includes('received your application') ||
                                element.classList.contains('jobs-s-apply-modal__success') ||
                                element.querySelector('.jobs-s-apply-modal__success')) {
                                
                                resolved = true;
                                observer.disconnect();
                                resolve(true);
                            }
                        }
                    });
                }
                
                // Check for attribute changes that might indicate success
                if (mutation.type === 'attributes' && mutation.target) {
                    const target = mutation.target;
                    if (target.classList.contains('jobs-apply-button') && 
                        target.textContent.toLowerCase().includes('applied')) {
                        resolved = true;
                        observer.disconnect();
                        resolve(true);
                    }
                }
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-control-name']
        });
        
        // Set timeout
        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                observer.disconnect();
                resolve(false);
            }
        }, timeout);
        
        // Cleanup on resolve
        const cleanup = () => {
            clearTimeout(timer);
            observer.disconnect();
        };
        
        return cleanup;
    });
}

/**
 * Handles application submission with retry logic and enhanced tracking
 * @param {number} retries Number of retry attempts
 * @param {number} delay Delay between retries in ms
 * @returns {Promise<boolean>} True if successful
 */
async function handleApplicationSubmission(retries = 3, delay = 2000) {
    try {
        let success = false;
        let attempts = 0;
        
        console.log('Starting application submission handler...');
        
        while (attempts < retries && !success) {
            attempts++;
            console.log(`Attempt ${attempts}/${retries}: Checking for application success...`);
            
            // Wait before checking
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Check for immediate success
            if (checkApplicationSuccess()) {
                console.log('Application success detected immediately');
                success = await saveAutoAppliedJob({
                    detectionMethod: 'immediate',
                    attempt: attempts
                });
                if (success) break;
            }
            
            // If not immediately successful, wait and monitor
            if (!success && attempts === 1) {
                console.log('Starting DOM monitoring for success indicators...');
                const monitorSuccess = await monitorForApplicationSuccess(5000);
                if (monitorSuccess) {
                    console.log('Application success detected via monitoring');
                    success = await saveAutoAppliedJob({
                        detectionMethod: 'monitoring',
                        attempt: attempts
                    });
                    if (success) break;
                }
            }
            
            if (attempts < retries && !success) {
                console.log(`Retrying application check (attempt ${attempts + 1}/${retries})`);
            }
        }
        
        if (!success) {
            console.warn('Failed to confirm application success after all retries');
            // Still try to save with uncertainty flag
            await saveAutoAppliedJob({
                detectionMethod: 'uncertain',
                attempts: attempts,
                note: 'Application success could not be confirmed'
            });
        }
        
        return success;
    } catch (error) {
        console.error('Error in application submission handler:', error);
        return false;
    }
}

/**
 * Main application tracking function
 * @returns {Promise<boolean>} True if tracking was successful
 */
async function trackApplication() {
    try {
        console.log('Starting application tracking...');
        
        // Try immediate detection first
        if (checkApplicationSuccess()) {
            console.log('Application success detected immediately');
            const saved = await saveAutoAppliedJob({
                detectionMethod: 'immediate'
            });
            if (saved) return true;
        }
        
        // If not immediately successful, use comprehensive tracking
        console.log('Starting comprehensive application tracking...');
        
        const successDetected = await Promise.race([
            monitorForApplicationSuccess(10000),
            new Promise(resolve => setTimeout(() => resolve(false), 8000))
        ]);
        
        if (successDetected) {
            console.log('Application success detected via monitoring');
            const saved = await saveAutoAppliedJob({
                detectionMethod: 'monitoring'
            });
            if (saved) return true;
        }
        
        // Fallback to submission handler
        console.log('Using fallback submission handler...');
        return await handleApplicationSubmission();
        
    } catch (error) {
        console.error('Error in application tracking:', error);
        return false;
    }
}

/**
 * Shows notification to user
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    try {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `oppz-notification oppz-notification--${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        // Set color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                break;
            case 'error':
                notification.style.backgroundColor = '#f44336';
                break;
            case 'info':
            default:
                notification.style.backgroundColor = '#2196F3';
                break;
        }
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
        
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

/**
 * Initializes the content script
 */
function initializeContentScript() {
    console.log('OPPZ Content Script initialized');
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            switch (request.action) {
                case 'extractJobInfo':
                    const jobInfo = extractJobInfo();
                    sendResponse({ success: true, data: jobInfo });
                    break;
                    
                case 'saveExternalJob':
                    saveExternalJob(request.data || {})
                        .then(success => sendResponse({ success }))
                        .catch(error => sendResponse({ success: false, error: error.message }));
                    return true; // Keep response channel open
                    
                case 'trackApplication':
                    trackApplication()
                        .then(success => sendResponse({ success }))
                        .catch(error => sendResponse({ success: false, error: error.message }));
                    return true; // Keep response channel open
                    
                case 'checkApplicationSuccess':
                    const isSuccess = checkApplicationSuccess();
                    sendResponse({ success: true, isSuccess });
                    break;
                    
                case 'showNotification':
                    showNotification(request.message, request.type);
                    sendResponse({ success: true });
                    break;
                    
                default:
                    console.warn('Unknown action:', request.action);
                    sendResponse({ success: false, error: 'Unknown action' });
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    });
    
    // Auto-track applications when certain events occur
    if (window.location.href.includes('linkedin.com/jobs/')) {
        // Set up listeners for application events
        setupApplicationListeners();
    }
}

/**
 * Sets up event listeners for application tracking
 */
function setupApplicationListeners() {
    try {
        // Listen for clicks on apply buttons
        const applyButtonSelectors = [
            '.jobs-apply-button',
            '[data-control-name="submit_application"]',
            '.jobs-s-apply button[type="submit"]',
            '.jobs-apply-form button[type="submit"]'
        ];
        
        applyButtonSelectors.forEach(selector => {
            document.addEventListener('click', (event) => {
                if (event.target.matches(selector) || event.target.closest(selector)) {
                    console.log('Apply button clicked, starting tracking...');
                    
                    // Delay tracking to allow for form submission
                    setTimeout(() => {
                        trackApplication().then(success => {
                            if (success) {
                                console.log('Application tracked successfully');
                            } else {
                                console.log('Application tracking failed or uncertain');
                            }
                        });
                    }, 2000);
                }
            });
        });
        
        // Listen for form submissions
        document.addEventListener('submit', (event) => {
            if (event.target.matches('.jobs-apply-form, .jobs-s-apply form')) {
                console.log('Application form submitted, starting tracking...');
                
                setTimeout(() => {
                    trackApplication().then(success => {
                        if (success) {
                            console.log('Application tracked successfully');
                        } else {
                            console.log('Application tracking failed or uncertain');
                        }
                    });
                }, 2000);
            }
        });
        
        console.log('Application listeners set up successfully');
    } catch (error) {
        console.error('Error setting up application listeners:', error);
    }
}

// Global object for external access
window.oppzTracker = {
    extractJobInfo,
    saveAutoAppliedJob,
    saveExternalJob,
    checkApplicationSuccess,
    handleApplicationSubmission,
    monitorForApplicationSuccess,
    trackApplication,
    showNotification
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
    initializeContentScript();
}

// Also initialize immediately in case DOMContentLoaded has already fired
initializeContentScript();

window.runScript = runScript;
