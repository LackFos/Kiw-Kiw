document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;

    const tab = tabs[0];
    const url = new URL(tab.url);

    // Get History
    chrome.storage.local.get([url.host], (result) => {
      const $main = document.querySelector("main");

      const histories = result[url.host] ?? [];

      if (histories.length === 0) return;

      // Render History
      const cards = histories.map((history) => {
        const formattedVisitedAt = new Date(history.visited_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        return `
          <div data-url="${history.url}" class="card card--row card--shadow">
            <div class="avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21M12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8C17 10.7614 14.7614 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="card__content">
              <div class="card__title">${history.username}</div>
              <div class="card__description">${formattedVisitedAt}</div>
            </div>
          </div>
        `;
      });

      $main.innerHTML = cards.join("");

      // Handle Impersonate
      $main.querySelectorAll("[data-url]").forEach(($card) => {
        $card.addEventListener("click", async () => {
          await fetch(`${url.origin}/stop-impersonating`);

          const targetUrl = $card.getAttribute("data-url");
          chrome.tabs.create({ url: targetUrl });
        });
      });
    });
  });
});
