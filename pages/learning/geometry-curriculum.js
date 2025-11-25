import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import { GRADES, TOPICS, LEVELS, TOPIC_SHAPES } from "../../utils/geometry-constants";

export default function GeometryCurriculum() {
  useIOSViewportFix();
  const router = useRouter();
  
  const handleClose = () => {
    router.back();
  };

  const getTopicName = (topicKey) => {
    return TOPICS[topicKey]?.name || topicKey;
  };

  const getShapesForGradeTopic = (gradeKey, topicKey) => {
    const shapes = TOPIC_SHAPES[topicKey]?.[gradeKey] || [];
    const shapeNames = {
      square: "ריבוע",
      rectangle: "מלבן",
      triangle: "משולש",
      circle: "עיגול",
      parallelogram: "מקבילית",
      trapezoid: "טרפז",
      rectangular_prism: "תיבה",
      cube: "קובייה",
      cylinder: "גליל",
      sphere: "כדור",
    };
    return shapes.map(s => shapeNames[s] || s).join(", ");
  };

  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-[#120b1f] to-[#1b1430] text-white px-4 py-10" dir="rtl">
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
              תוכנית הלימודים באתר - הנדסה
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
                  <li><strong>6 נושאי הנדסה</strong>: שטח, היקף, נפח, זוויות, פיתגורס, ערבוב</li>
                </ul>
              </div>

              {/* כיתה א' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה א'</h2>
                <div className="bg-yellow-500/20 p-3 rounded text-sm mb-3">
                  <strong>הערות:</strong> הנדסה לא נלמדת בכיתה א'. המערכת לא כוללת נושאי הנדסה לכיתה זו.
                </div>
              </div>

              {/* כיתה ב' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ב'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>שטח - היכרות בסיסית</li>
                  <li>היקף - היכרות בסיסית</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">צורות זמינות:</h4>
                  <div className="text-sm">ריבוע, מלבן</div>
                </div>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> צלעות עד 10, ללא עשרוניים</div>
                    <div><strong>בינוני:</strong> צלעות עד 20, עם עשרוניים</div>
                    <div><strong>קשה:</strong> צלעות עד 50, עם עשרוניים</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> היכרות ראשונית עם מושגי שטח והיקף. רק צורות בסיסיות (ריבוע ומלבן).
                </div>
              </div>

              {/* כיתה ג' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ג'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>שטח</li>
                  <li>היקף</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">צורות זמינות:</h4>
                  <div className="text-sm">ריבוע, מלבן, משולש</div>
                </div>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> צלעות עד 10, ללא עשרוניים</div>
                    <div><strong>בינוני:</strong> צלעות עד 20, עם עשרוניים</div>
                    <div><strong>קשה:</strong> צלעות עד 50, עם עשרוניים</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> מתווספת צורת המשולש. הרחבת הבנת שטח והיקף.
                </div>
              </div>

              {/* כיתה ד' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ד'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>שטח</li>
                  <li>היקף</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">צורות זמינות:</h4>
                  <div className="text-sm">ריבוע, מלבן, משולש, עיגול</div>
                </div>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> צלעות עד 10, ללא עשרוניים</div>
                    <div><strong>בינוני:</strong> צלעות עד 20, עם עשרוניים</div>
                    <div><strong>קשה:</strong> צלעות עד 50, עם עשרוניים</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> מתווספת צורת העיגול. חישוב שטח והיקף של עיגול (π = 3.14).
                </div>
              </div>

              {/* כיתה ה' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ה'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>שטח</li>
                  <li>היקף</li>
                  <li>נפח - היכרות ראשונית</li>
                  <li>ערבוב - תרגילים מעורבים</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">צורות זמינות:</h4>
                  <div className="text-sm mb-2">
                    <strong>לשטח והיקף:</strong> ריבוע, מלבן, משולש, עיגול, מקבילית, טרפז
                  </div>
                  <div className="text-sm">
                    <strong>לנפח:</strong> תיבה, קובייה
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> צלעות עד 10, ללא עשרוניים</div>
                    <div><strong>בינוני:</strong> צלעות עד 20, עם עשרוניים</div>
                    <div><strong>קשה:</strong> צלעות עד 50, עם עשרוניים</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> מתווספות צורות מורכבות יותר (מקבילית, טרפז) ונפח. תרגילי ערבוב מאפשרים תרגול מעורב של כל הנושאים.
                </div>
              </div>

              {/* כיתה ו' */}
              <div className="bg-blue-500/20 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-3">כיתה ו'</h2>
                <h3 className="text-lg font-semibold mb-2">נושאים זמינים:</h3>
                <ol className="list-decimal pr-6 space-y-1 mb-4">
                  <li>שטח</li>
                  <li>היקף</li>
                  <li>נפח</li>
                  <li>זוויות</li>
                  <li>פיתגורס - משפט פיתגורס</li>
                  <li>ערבוב - תרגילים מעורבים</li>
                </ol>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">צורות זמינות:</h4>
                  <div className="text-sm mb-2">
                    <strong>לשטח והיקף:</strong> ריבוע, מלבן, משולש, עיגול, מקבילית, טרפז
                  </div>
                  <div className="text-sm mb-2">
                    <strong>לנפח:</strong> תיבה, קובייה, גליל, כדור
                  </div>
                  <div className="text-sm">
                    <strong>לזוויות ופיתגורס:</strong> משולש
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded mb-3">
                  <h4 className="font-semibold mb-2">רמות קושי:</h4>
                  <div className="text-sm space-y-2">
                    <div><strong>קל:</strong> צלעות עד 10, ללא עשרוניים</div>
                    <div><strong>בינוני:</strong> צלעות עד 20, עם עשרוניים</div>
                    <div><strong>קשה:</strong> צלעות עד 50, עם עשרוניים</div>
                  </div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded text-sm">
                  <strong>הערות:</strong> כל נושאי ההנדסה זמינים. משפט פיתגורס לחישוב אורך צלעות במשולש ישר זווית. זוויות במשולשים. נפח של צורות תלת-ממדיות מורכבות (גליל, כדור).
                </div>
              </div>

              {/* סיכום */}
              <div className="bg-emerald-500/20 border-r-4 border-emerald-500 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-3 text-center">סיכום כללי</h3>
                <p className="text-center">
                  המערכת כוללת <strong>6 נושאי הנדסה</strong>, <strong>6 כיתות</strong> (ב'-ו'), <strong>3 רמות קושי</strong> לכל כיתה, 
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

