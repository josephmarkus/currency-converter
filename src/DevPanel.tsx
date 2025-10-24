import { Component, createSignal, onMount } from "solid-js";

const DevPanel: Component = () => {
  const [isVisible, setIsVisible] = createSignal(false);
  const [isDev, setIsDev] = createSignal(false);

  onMount(() => {
    // Only show in development environment
    const isDevEnv =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";
    setIsDev(isDevEnv);
  });

  const handleToggle = () => {
    console.log("DevPanel toggle clicked");
    setIsVisible(!isVisible());
  };

  const handleUseMock = () => {
    console.log("Use Mock Data clicked");
    // Mock data functionality would go here
  };

  const handleUseReal = () => {
    console.log("Use Real API clicked");
    // Real API functionality would go here
  };

  if (!isDev()) return null;

  return (
    <div class="fixed top-4 right-4 z-50">
      <button
        onClick={handleToggle}
        class="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        {isVisible() ? "Hide Dev" : "Show Dev"}
      </button>

      {isVisible() && (
        <div class="mt-2 p-4 bg-gray-900 text-white rounded-lg shadow-xl min-w-64">
          <h3 class="font-bold mb-3">Development Panel</h3>

          <div class="space-y-2">
            <button
              onClick={handleUseMock}
              class="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded transition-colors"
            >
              Use Mock Data
            </button>

            <button
              onClick={handleUseReal}
              class="w-full bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded transition-colors"
            >
              Use Real API
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevPanel;
