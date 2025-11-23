import { useEffect, useState } from "react";

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // בדיקה אם זה iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // בדיקה אם האפליקציה כבר מותקנת (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
                         window.navigator.standalone ||
                         document.referrer.includes("android-app://");
    setIsInstalled(isStandalone);

    // אם כבר מותקן, לא להציג את ההודעה
    if (isStandalone) {
      return;
    }

    // טיפול ב-beforeinstallprompt (אנדרואיד/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // בדיקה אם יש localStorage flag שמציין שהמשתמש דחה את ההודעה
      const dismissed = localStorage.getItem("app-install-dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // בדיקה אם יש localStorage flag שמציין שהמשתמש דחה את ההודעה
    const dismissed = localStorage.getItem("app-install-dismissed");
    if (!dismissed && iOS) {
      // הצג את ההודעה אחרי 3 שניות עבור iOS
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (deferredPrompt) {
        // אנדרואיד/Chrome - התקנה אוטומטית
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
          setShowPrompt(false);
          setDeferredPrompt(null);
          // אפשר להוסיף הודעה של הצלחה
        } else {
          // המשתמש ביטל - אפשר להשאיר את החלון פתוח
        }
      } else if (isIOS) {
        // iOS - ההוראות כבר מוצגות, אפשר להוסיף הודעה
        // ההוראות כבר מוצגות בחלון
      } else {
        // דפדפן שלא תומך - הצג הוראות
        alert("אנא השתמש בדפדפן Chrome או Edge להתקנה אוטומטית, או עקוב אחר ההוראות המוצגות.");
      }
    } catch (error) {
      console.error("Error installing app:", error);
      alert("אירעה שגיאה בהתקנה. אנא נסה שוב או עקוב אחר ההוראות המוצגות.");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("app-install-dismissed", "true");
    // הסתר למשך 7 ימים
    setTimeout(() => {
      localStorage.removeItem("app-install-dismissed");
    }, 7 * 24 * 60 * 60 * 1000);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-amber-500/90 to-orange-600/90 backdrop-blur-sm rounded-2xl p-5 shadow-2xl border border-white/20">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">התקן את LEO K</h3>
            <p className="text-sm text-white/90 mb-3">
              {isIOS
                ? "הוסף את האפליקציה למסך הבית לחוויה טובה יותר"
                : "התקן את האפליקציה לגישה מהירה ונוחה יותר"}
            </p>
            
            {/* כפתור הורדה ראשי - תמיד מוצג */}
            <button
              onClick={handleInstallClick}
              type="button"
              className="w-full mb-3 px-5 py-3 bg-white text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {deferredPrompt ? "הורד והתקן עכשיו" : isIOS ? "הצג הוראות הורדה" : "התקן אפליקציה"}
            </button>

            {isIOS && (
              <div className="bg-black/30 rounded-lg p-3 mb-3 text-xs text-white/90">
                <p className="font-semibold mb-2">הוראות התקנה:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>לחץ על כפתור השיתוף <span className="font-bold">📤</span> בתחתית Safari</li>
                  <li>בחר "הוסף למסך הבית"</li>
                  <li>לחץ "הוסף"</li>
                </ol>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                type="button"
                className="flex-1 px-4 py-2 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-all hover:scale-105 active:scale-95 text-sm"
              >
                ✕ סגור
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

