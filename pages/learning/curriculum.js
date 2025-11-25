import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";

export default function Curriculum() {
  useIOSViewportFix();
  const router = useRouter();
  
  const handleClose = () => {
    router.back();
  };
  
  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-[#120b1f] to-[#1b1430] text-white px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handleClose}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold tracking-widest hover:bg-white/20 transition"
            >
              ✖ סגירה
            </button>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              תוכנית לימודים
            </p>
          </div>

          <header className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-black" dir="rtl">
              תוכנית הלימודים באתר - מתמטיקה
            </h1>
            <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto" dir="rtl">
              סיכום מלא של כל הנושאים, רמות הקושי והכיתות הזמינות במערכת
            </p>
          </header>

          <div className="bg-white/5 rounded-2xl border border-white/10 p-6" dir="rtl">
            <div className="prose prose-invert max-w-none">
              <div className="bg-emerald-500/20 border-r-4 border-emerald-500 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold mb-2">מבנה כללי</h3>
                <ul className="list-disc pr-6 space-y-2">
                  <li><strong>6 כיתות</strong>: א', ב', ג', ד', ה', ו'</li>
                  <li><strong>3 רמות קושי</strong> לכל כיתה: קל, בינוני, קשה</li>
                  <li><strong>15 נושאים מתמטיים</strong> בסך הכל</li>
                </ul>
              </div>

              {/* כיתה א' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה א'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>חיבור</li>
                  <li>חיסור</li>
                  <li>השוואה</li>
                  <li>תחושת מספר - שכנים, זוגי/אי-זוגי, השלמה ל-10, עשרות/יחידות</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> חיבור עד 10, חיסור עד 10, השוואה עד 10, תחושת מספר עד 10</div>
                    <div><strong>בינוני:</strong> חיבור עד 20, חיסור עד 20, השוואה עד 20, תחושת מספר עד 20</div>
                    <div><strong>קשה:</strong> חיבור עד 20, חיסור עד 20, השוואה עד 20, תחושת מספר עד 20</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> אין כפל, חילוק או שברים. אין מספרים שליליים. רק תרגילים ישירים (ללא נעלם).
                </div>
              </div>

              {/* כיתה ב' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ב'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>חיבור</li>
                  <li>חיסור</li>
                  <li>כפל - לוח כפל עד 10×10</li>
                  <li>חילוק - לפי לוח הכפל</li>
                  <li>השוואה</li>
                  <li>תחושת מספר</li>
                  <li>מעורב - תרגילים מעורבים בתחום ה-100</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> חיבור/חיסור עד 50, כפל עד 5×5, חילוק עד 50, שברים מכנה עד 2</div>
                    <div><strong>בינוני:</strong> חיבור/חיסור עד 100, כפל עד 10×10, חילוק עד 100, שברים מכנה עד 4</div>
                    <div><strong>קשה:</strong> חיבור/חיסור עד 100, כפל עד 10×10, חילוק עד 100, שברים מכנה עד 4</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> אין מספרים שליליים. רק תרגילים ישירים (ללא נעלם).
                </div>
              </div>

              {/* כיתה ג' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ג'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>חיבור</li>
                  <li>חיסור</li>
                  <li>כפל</li>
                  <li>חילוק</li>
                  <li>שברים - היכרות עם שבר כחלק משלם</li>
                  <li>סדרות</li>
                  <li>עשרוניים - עשרוניים בסיסיים</li>
                  <li>השוואה</li>
                  <li>משוואות</li>
                  <li>תחושת מספר</li>
                  <li>מעורב</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> חיבור/חיסור עד 200, כפל עד 10, חילוק עד 100, שברים מכנה עד 4, סדרות התחלה עד 20, עשרוניים בסיס עד 50</div>
                    <div><strong>בינוני:</strong> חיבור/חיסור עד 500, כפל עד 12, חילוק עד 144, שברים מכנה עד 6, סדרות התחלה עד 50, עשרוניים בסיס עד 50</div>
                    <div><strong>קשה:</strong> חיבור/חיסור עד 1000, כפל עד 12, חילוק עד 200, שברים מכנה עד 6, סדרות התחלה עד 50, עשרוניים בסיס עד 50</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> אין מספרים שליליים. מתחילים תרגילי השלמה (נעלם).
                </div>
              </div>

              {/* כיתה ד' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ד'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>חיבור</li>
                  <li>חיסור</li>
                  <li>כפל</li>
                  <li>חילוק</li>
                  <li>שברים - שברים פשוטים, משמעות והשוואה</li>
                  <li>עשרוניים</li>
                  <li>סדרות</li>
                  <li>עיגול</li>
                  <li>משוואות</li>
                  <li>השוואה</li>
                  <li>תחושת מספר</li>
                  <li>גורמים וכפולות</li>
                  <li>מעורב</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> חיבור/חיסור עד 1000, כפל עד 20×20, חילוק עד 200, שברים מכנה עד 6, עיגול עד 999 לעשרות, גורמים/כפולות עד 100</div>
                    <div><strong>בינוני:</strong> חיבור/חיסור עד 5000, כפל עד 30×30, חילוק עד 500, שברים מכנה עד 8, עיגול עד 9999 למאות, גורמים/כפולות עד 200</div>
                    <div><strong>קשה:</strong> חיבור/חיסור עד 10000, כפל עד 50×50, חילוק עד 1000, שברים מכנה עד 8, עיגול עד 9999 למאות, גורמים/כפולות עד 500</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> אין מספרים שליליים. מתחילים עיגול וגורמים/כפולות.
                </div>
              </div>

              {/* כיתה ה' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ה'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>חיבור</li>
                  <li>חיסור</li>
                  <li>כפל</li>
                  <li>חילוק</li>
                  <li>שברים</li>
                  <li>אחוזים</li>
                  <li>סדרות</li>
                  <li>עשרוניים</li>
                  <li>עיגול</li>
                  <li>משוואות</li>
                  <li>השוואה</li>
                  <li>תחושת מספר</li>
                  <li>גורמים וכפולות</li>
                  <li>בעיות מילוליות</li>
                  <li>מעורב</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> חיבור/חיסור עד 10000, כפל עד 50×50, אחוזים בסיס עד 400, בעיות מילוליות עד 10000</div>
                    <div><strong>בינוני:</strong> חיבור/חיסור עד 50000, כפל עד 100×100, אחוזים בסיס עד 1000, בעיות מילוליות עד 50000</div>
                    <div><strong>קשה:</strong> חיבור/חיסור עד 100000, כפל עד 200×200, אחוזים בסיס עד 2000, בעיות מילוליות עד 100000, מספרים שליליים</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> מתחילים מספרים שליליים (ברמה קשה), אחוזים ובעיות מילוליות. תרגילים דו-שלביים (ברמה בינונית/קשה).
                </div>
              </div>

              {/* כיתה ו' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ו'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>חיבור</li>
                  <li>חיסור</li>
                  <li>כפל</li>
                  <li>חילוק</li>
                  <li>שברים</li>
                  <li>אחוזים</li>
                  <li>סדרות</li>
                  <li>עשרוניים</li>
                  <li>עיגול</li>
                  <li>משוואות</li>
                  <li>השוואה</li>
                  <li>תחושת מספר</li>
                  <li>גורמים וכפולות</li>
                  <li>בעיות מילוליות</li>
                  <li>מעורב</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> חיבור/חיסור עד 50000, כפל עד 100×100, אחוזים בסיס עד 1000, בעיות מילוליות עד 50000</div>
                    <div><strong>בינוני:</strong> חיבור/חיסור עד 100000, כפל עד 200×200, אחוזים בסיס עד 2000, בעיות מילוליות עד 100000</div>
                    <div><strong>קשה:</strong> חיבור/חיסור עד 200000, כפל עד 500×500, אחוזים בסיס עד 5000, בעיות מילוליות עד 200000, מספרים שליליים</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> מספרים שליליים (ברמה קשה). כל הנושאים זמינים. תרגילים דו-שלביים ומורכבים.
                </div>
              </div>

              {/* סיכום */}
              <div className="bg-emerald-500/20 border-r-4 border-emerald-500 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-3 text-center">סיכום כללי</h3>
                <p className="text-center">
                  המערכת כוללת <strong>15 נושאים מתמטיים</strong>, <strong>6 כיתות</strong>, <strong>3 רמות קושי</strong> לכל כיתה, 
                  עם התאמה מלאה לתכנית הלימודים של משרד החינוך.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}

