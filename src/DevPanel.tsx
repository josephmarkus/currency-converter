import { useState } from "react";

const isDev =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";

const DevPanel = () => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isDev) return null;

  const handleUseMock = () => {
    console.log("Use Mock Data clicked");
  };

  const handleUseReal = () => {
    console.log("Use Real API clicked");
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-darkyellow text-darkblue px-4 py-2 rounded-lg shadow-lg hover:bg-yellow-300 transition-colors border border-darkyellow font-bold"
      >
        {isVisible ? "Hide Dev" : "Show Dev"}
      </button>

      {isVisible && (
        <div className="mt-2 p-4 bg-darkblue text-darkyellow rounded-lg shadow-xl min-w-64 border-2 border-darkyellow">
          <h3 className="font-bold mb-3 text-darkyellow">Development Panel</h3>

          <div className="space-y-2">
            <button
              onClick={handleUseMock}
              className="w-full bg-darkyellow hover:bg-yellow-300 text-darkblue px-3 py-2 rounded transition-colors border-2 border-darkyellow font-semibold"
            >
              Use Mock Data
            </button>

            <button
              onClick={handleUseReal}
              className="w-full bg-darkyellow hover:bg-yellow-300 text-darkblue px-3 py-2 rounded transition-colors border-2 border-darkyellow font-semibold"
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
