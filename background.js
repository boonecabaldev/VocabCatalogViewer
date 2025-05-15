/*
let isEnabled = true;
let popupVisible = false;

// Initialize without showing indicator
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ isEnabled: true });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle") {
    handleToggle(true); // true means show indicator
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (popupVisible) {
    hidePopup();
  } else {
    showPopup(tab.id);
  }
});

function handleToggle(showIndicator) {
  chrome.storage.sync.get(['isEnabled'], (result) => {
    const currentState = result.isEnabled !== false; // Default to true
    const newState = !currentState;
    isEnabled = newState;
    
    chrome.storage.sync.set({ isEnabled: newState }, () => {
      updateExtensionState(newState, showIndicator);
    });
  });
}

function showPopup(tabId) {
  popupVisible = true;
  chrome.tabs.sendMessage(tabId, { action: "showPopup" });
}

function hidePopup() {
  popupVisible = false;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "hidePopup" });
    }
  });
}

function updateExtensionState(enabled, showIndicator = false) {
  // Update browser action
  chrome.action.setTitle({
    title: `Nomi Key Helper: ${enabled ? 'ON' : 'OFF'}`
  });

  // Broadcast to tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { 
          action: "toggle", 
          isEnabled: enabled,
          showIndicator: showIndicator
        }).catch(() => {});
      }
    });
  });
}

// Listen for popup state changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "popupHidden") {
    popupVisible = false;
  }
});

// Keep background alive
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "keepAlive") {
    setTimeout(() => port.disconnect(), 250e3);
  }
});
*/