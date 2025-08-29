chrome.history.onVisited.addListener((historyItem) => {
  const url = new URL(historyItem.url);

  // Store history in local storage
  const match = historyItem.url.match("/user/(.*)/impersonate");

  if (match) {
    const userId = match[1];

    chrome.storage.local.get([url.host], (result) => {
      const histories = result[url.host] ?? [];

      const isHistoryExist = histories.find((history) => history.userId === userId);
      if (isHistoryExist) return;

      if (histories.length >= 5) histories.shift();

      chrome.storage.local.set({
        [url.host]: [...histories, { userId: userId, url: historyItem.url, visited_at: Date.now() }],
      });
    });
  }
});
