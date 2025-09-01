document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;

    const tab = tabs[0];
    const url = new URL(tab.url);

    // Handle Segmented Control
    const $segmentedButtons = document.querySelectorAll(".segmented-control__button");

    $segmentedButtons.forEach(($clicked) => {
      $clicked.addEventListener("click", () => {
        // Remove Active for tabs
        $segmentedButtons.forEach(($segmentedButton) =>
          $segmentedButton.classList.remove("segmented-control__button--active")
        );

        // Hide Sections
        document.querySelector("#history-container").classList.add("hide");
        document.querySelector("#favorite-container").classList.add("hide");

        document.querySelector(`#${$clicked.dataset.segment}-container`).classList.remove("hide");

        $clicked.classList.add("segmented-control__button--active");
        chrome.storage.local.set({ activeSegment: $clicked.dataset.segment });
      });
    });

    // Get History
    chrome.storage.local.get(["histories", "favorites", "activeSegment"], (result) => {
      const $historySection = document.querySelector("#history-container");
      const $favoriteSection = document.querySelector("#favorite-container");

      const activeSegment = result?.activeSegment ?? "history";
      document.querySelector(`#${activeSegment}-container`).classList.remove("hide");
      document
        .querySelector(`button[data-segment="${activeSegment}"]`)
        .classList.add("segmented-control__button--active");

      const oldHistories = result?.histories?.[url.origin] ?? [];
      let oldFavorites = result?.favorites?.[url.origin] ?? [];

      renderCards(oldHistories, $historySection);
      renderCards(oldFavorites, $favoriteSection);

      function renderCards(data, $container) {
        if (data.length === 0) return;

        // Render History
        const cards = data
          .sort((a, b) => b.visitedAt - a.visitedAt)
          .map((history) => {
            const formattedVisitedAt = new Date(history.visitedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            return `
          <div 
            data-url="${history.url}"
            data-user-id="${history.userId}"
            data-username="${history.username}" 
            data-visited-at="${history.visitedAt}"  
            class="card card--row"
          >
            <div class="card__bookmark ${
              oldFavorites.find((favorite) => favorite.url === history.url) ? "card__bookmark--active" : ""
            }">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 7.2002V16.6854C6 18.0464 6 18.7268 6.20412 19.1433C6.58245 19.9151 7.41157 20.3588 8.26367 20.2454C8.7234 20.1842 9.28964 19.8067 10.4221 19.0518L10.4248 19.0499C10.8737 18.7507 11.0981 18.6011 11.333 18.5181C11.7642 18.3656 12.2348 18.3656 12.666 18.5181C12.9013 18.6012 13.1266 18.7515 13.5773 19.0519C14.7098 19.8069 15.2767 20.1841 15.7364 20.2452C16.5885 20.3586 17.4176 19.9151 17.7959 19.1433C18 18.7269 18 18.0462 18 16.6854V7.19691C18 6.07899 18 5.5192 17.7822 5.0918C17.5905 4.71547 17.2837 4.40973 16.9074 4.21799C16.4796 4 15.9203 4 14.8002 4H9.2002C8.08009 4 7.51962 4 7.0918 4.21799C6.71547 4.40973 6.40973 4.71547 6.21799 5.0918C6 5.51962 6 6.08009 6 7.2002Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="card__content">
              <div class="card__title">${history.username}</div>
              <div class="card__description">${formattedVisitedAt}</div>
            </div>
          </div>
        `;
          });

        $container.innerHTML = cards.join("");

        // Handle Impersonate
        $container.querySelectorAll("[data-url]").forEach(($card) => {
          $card.addEventListener("click", async () => {
            await fetch(`${url.origin}/stop-impersonating`);
            const targetUrl = $card.getAttribute("data-url");
            chrome.tabs.create({ url: targetUrl });
          });
        });

        // Handle Bookmark
        $container.querySelectorAll(".card__bookmark").forEach(($bookmark) => {
          $bookmark.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const $target = event.currentTarget;

            const newFavorites = {
              url: $target.closest(".card").getAttribute("data-url"),
              userId: $target.closest(".card").getAttribute("data-user-id"),
              username: $target.closest(".card").getAttribute("data-username"),
              visitedAt: Number($target.closest(".card").getAttribute("data-visited-at")),
            };

            const isFavoriteExist = oldFavorites.find((favorite) => favorite.url === newFavorites.url);
            console.log(oldFavorites);

            if (isFavoriteExist) {
              $target.classList.remove("card__bookmark--active");
              oldFavorites = oldFavorites.filter((favorite) => favorite.url !== newFavorites.url);
            } else {
              $target.classList.add("card__bookmark--active");
              oldFavorites = [...oldFavorites, newFavorites];
            }
            console.log(oldFavorites);

            chrome.storage.local.set({
              favorites: {
                ...(result?.favorites ?? {}),
                [url.origin]: oldFavorites, // This updated on above
              },
            });
          });
        });
      }
    });
  });
});
