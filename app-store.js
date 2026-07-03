(() => {
  const canUseServiceWorker =
    "serviceWorker" in navigator && ["http:", "https:"].includes(window.location.protocol);
  const isAutomatedBrowser = navigator.webdriver === true;

  if (!canUseServiceWorker || isAutomatedBrowser) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.warn("Kira Home service worker registration failed.", error);
    });
  });
})();
