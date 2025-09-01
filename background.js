chrome.history.onVisited.addListener((historyItem) => {
  const url = new URL(historyItem.url);

  // Store history in local storage
  const match = historyItem.url.match("/user/(.*)/impersonate");

  if (match) {
    const userId = match[1];

    chrome.storage.local.get(["histories"], async (result) => {
      const oldHistories = result?.histories?.[url.origin] ?? [];

      const isHistoryExist = oldHistories.find((history) => history.userId === userId);
      if (isHistoryExist) return;

      if (oldHistories.length >= 5) oldHistories.shift();

      const request = await fetch(`${url.origin}/dashboard`);
      const body = await request.text();
      const match = body.match(/<div class="d-none d-xl-block ps-2">\s*<div>(.*?)<\/div>/);
      const username = match ? match[1].trim() : "Error";

      const newHistory = { userId: userId, username: username, url: historyItem.url, visitedAt: Date.now() };

      chrome.storage.local.set({
        histories: {
          ...result.histories,
          [url.origin]: [...oldHistories, newHistory],
        },
      });
    });
  }
});
