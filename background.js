chrome.history.onVisited.addListener((historyItem) => {
  const url = new URL(historyItem.url);

  // Store history in local storage
  const match = historyItem.url.match("/user/(.*)/impersonate");

  if (match) {
    const userId = match[1];

    chrome.storage.local.get([url.host], async (result) => {
      const histories = result[url.host] ?? [];

      const isHistoryExist = histories.find((history) => history.userId === userId);
      if (isHistoryExist) return;

      if (histories.length >= 5) histories.shift();

      const request = await fetch(`${url.origin}/dashboard`, { credentials: "include" });
      const body = await request.text();
      const match = body.match(/<div class="d-none d-xl-block ps-2">\s*<div>(.*?)<\/div>/);
      const username = match ? match[1].trim() : "Error";

      chrome.storage.local.set({
        [url.host]: [
          ...histories,
          { userId: userId, username: username, url: historyItem.url, visited_at: Date.now() },
        ],
      });
    });
  }
});
