import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online) {
        setShowBanner(true);
        // Hide banner after 5 seconds
        setTimeout(() => setShowBanner(false), 5000);
      } else {
        setShowBanner(false);
      }
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (isOnline || !showBanner) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 animate-slide-down">
      <div className="max-w-md mx-auto bg-amber-500/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-amber-400/50">
        <div className="flex items-center gap-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              🔌 אתה במצב Offline
            </p>
            <p className="text-xs text-white/90">
              האתר זמין גם ללא אינטרנט
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

