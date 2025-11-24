import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";

// ================== CONFIG ==================

const STORAGE_KEY = "mleo_science_master";

const LEVELS = {
  easy: { name: "קל", difficulty: 1 },
  medium: { name: "בינוני", difficulty: 2 },
  hard: { name: "קשה", difficulty: 3 },
};

const MODES = {
  learning: { name: "למידה", description: "ללא סיום משחק, תרגול בקצב שלך" },
  challenge: { name: "אתגר", description: "טיימר + חיים, מרוץ ניקוד גבוה" },
  speed: { name: "מרוץ מהירות", description: "תשובות מהירות = יותר נקודות! ⚡" },
  marathon: { name: "מרתון", description: "כמה שאלות תצליח ברצף? 🏃" },
};

const GRADES = {
  g1_2: { name: "כיתות א–ב" },
  g3_4: { name: "כיתות ג–ד" },
  g5_6: { name: "כיתות ה–ו" },
  g7_8: { name: "כיתות ז–ח" },
};

const TOPICS = {
  body: { name: "גוף האדם", icon: "🫀" },
  animals: { name: "בעלי חיים", icon: "🐾" },
  plants: { name: "צמחים", icon: "🌿" },
  materials: { name: "חומרים", icon: "🧪" },
  earth_space: { name: "כדור הארץ והחלל", icon: "🌍" },
  environment: { name: "סביבה ואקולוגיה", icon: "🌱" },
  experiments: { name: "ניסויים ותהליכים", icon: "🔬" },
  mixed: { name: "ערבוב נושאים", icon: "🎲" },
};

function getTopicLabel(key) {
  const t = TOPICS[key];
  if (!t) return key;
  return `${t.icon} ${t.name}`;
}

// ================== QUESTION BANK ==================

// כל שאלה: נושא, כיתות מתאימות, רמת קושי, ניסוח, תשובות, הסבר, תיאוריה קצרה
// ================== QUESTION BANK ==================

// כל שאלה: נושא, כיתות מתאימות, רמת קושי, ניסוח, תשובות, הסבר, תיאוריה קצרה
const QUESTIONS = [
  // ========= גוף האדם =========
  {
    id: "body_1",
    topic: "body",
    grades: ["g1_2"],
    minLevel: "easy",
    maxLevel: "easy",
    type: "mcq",
    stem: "איפה נמצא הלב בגוף האדם?",
    options: ["בראש", "בחזה", "בבטן", "ברגליים"],
    correctIndex: 1,
    explanation: "הלב נמצא בחזה, מעט שמאלה מקו האמצע, ומזרים דם לכל הגוף.",
    theoryLines: [
      "הלב הוא איבר שרירי שפועל ללא הפסקה.",
      "תפקידו להזרים דם המכיל חמצן וחומרי מזון לכל חלקי הגוף.",
    ],
  },
  {
    id: "body_2",
    topic: "body",
    grades: ["g1_2"],
    minLevel: "easy",
    maxLevel: "easy",
    type: "mcq",
    stem: "באיזה איבר אנחנו משתמשים כדי לראות?",
    options: ["אוזניים", "עיניים", "פה", "ידיים"],
    correctIndex: 1,
    explanation: "העיניים הן איבר הראייה. דרכן נכנס האור למוח שמפרש את התמונה.",
    theoryLines: [
      "חמשת החושים: ראייה, שמיעה, ריח, טעם ומישוש.",
      "העיניים קשורות למוח בעזרת עצב הראייה.",
    ],
  },
  {
    id: "body_3",
    topic: "body",
    grades: ["g3_4"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "mcq",
    stem: "מה תפקידה העיקרי של מערכת הנשימה?",
    options: [
      "להזרים דם בגוף",
      "להכניס חמצן ולהוציא פחמן דו־חמצני",
      "לעכל מזון",
      "להגן על העצמות",
    ],
    correctIndex: 1,
    explanation:
      "מערכת הנשימה אחראית על חילוף הגזים: הכנסת חמצן הדרוש לתאים והוצאת פחמן דו־חמצני מהגוף.",
    theoryLines: [
      "איברי מערכת הנשימה כוללים אף, קנה הנשימה וריאות.",
      "בתוך הריאות מתבצע חילוף הגזים בין האוויר לדם.",
    ],
  },
  {
    id: "body_4",
    topic: "body",
    grades: ["g3_4", "g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "true_false",
    stem: "השרירים והשלד עובדים יחד כדי לאפשר לנו תנועה.",
    options: ["נכון", "לא נכון"],
    correctIndex: 0,
    explanation:
      "השלד נותן מסגרת לגוף, והשרירים מחוברים לעצמות ומושכים אותן כדי לייצר תנועה.",
    theoryLines: [
      "ללא שלד הגוף היה רפוי ולא יציב.",
      "ללא שרירים לא היינו יכולים להזיז את העצמות והגוף.",
    ],
  },
  {
    id: "body_5",
    topic: "body",
    grades: ["g5_6", "g7_8"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "איזה משפט מתאר בצורה הטובה ביותר את תפקיד מערכת הדם?",
    options: [
      "המערכת שמעכלת מזון ומפרקת אותו לחומרים פשוטים.",
      "המערכת שמובילה אותות עצביים בין המוח לשרירים.",
      "המערכת שמובילה חמצן, מזון והורמונים לתאים ומפנה מהם פסולת.",
      "המערכת שמגינה מפני חיידקים באמצעות העור בלבד.",
    ],
    correctIndex: 2,
    explanation:
      "מערכת הדם מורכבת מהלב, כלי הדם והדם עצמו, ותפקידה להוביל חומרים חיוניים ולפנות פסולת.",
    theoryLines: [
      "הדם זורם בעורקים, ורידים ונימים.",
      "הלב משמש משאבה שמניעה את הדם בכל הגוף.",
    ],
  },
  {
    id: "body_6",
    topic: "body",
    grades: ["g7_8"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "מהו תפקידה העיקרי של מערכת העצבים?",
    options: [
      "לסנן פסולת מהדם",
      "לתאם ולהעביר מידע בין חלקי הגוף והסביבה",
      "להוביל מזון מהמעיים לדם",
      "לאחסן אנרגיה כשומן",
    ],
    correctIndex: 1,
    explanation:
      "מערכת העצבים אחראית על קבלת מידע מהחושים, עיבודו במוח ושליחת הוראות לשרירים ולאיברים.",
    theoryLines: [
      "מערכת העצבים כוללת מוח, חוט שדרה ועצבים רבים.",
      "עצבים מעבירים אותות חשמליים במהירות רבה.",
    ],
  },

  // ========= בעלי חיים =========
  {
    id: "animals_1",
    topic: "animals",
    grades: ["g1_2"],
    minLevel: "easy",
    maxLevel: "easy",
    type: "mcq",
    stem: "איזה בעל חיים הוא יונק?",
    options: ["צפרדע", "כריש", "חתול", "תרנגול"],
    correctIndex: 2,
    explanation:
      "יונקים ממליטים צאצאים חיים ומניקים אותם בחלב. חתול הוא יונק, בעוד שצפרדע היא דו־חיים ותרנגול הוא עוף.",
    theoryLines: [
      "ליונקים יש פרווה או שיער, ריאות לנשימה וחלבונים להנקה.",
      "עופות מכוסים נוצות ומטילים ביצים.",
    ],
  },
  {
    id: "animals_2",
    topic: "animals",
    grades: ["g3_4"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "mcq",
    stem: "מהי תכונה שמתאימה דג לחיים במים?",
    options: [
      "כנפיים גדולות",
      "פרווה עבה",
      "סנפירים וגוף בצורת טורפדו",
      "רגליים ארוכות",
    ],
    correctIndex: 2,
    explanation:
      "הסנפירים והגוף הצר והמאורך מאפשרים לדג לשחות ביעילות במים.",
    theoryLines: [
      "בעלי חיים מותאמים לסביבת החיים שלהם.",
      "צורת הגוף משפיעה על יכולת התנועה במים, באוויר או ביבשה.",
    ],
  },
  {
    id: "animals_3",
    topic: "animals",
    grades: ["g3_4", "g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "true_false",
    stem: "זוחלים הם בעלי חיים שמכוסים בדרך כלל קשקשים ומטילים ביצים.",
    options: ["נכון", "לא נכון"],
    correctIndex: 0,
    explanation:
      "רוב הזוחלים מכוסים קשקשים, והם מטילים ביצים או ממליטים, אך אינם יונקים חלב.",
    theoryLines: [
      "זוחלים כוללים נחשים, לטאות, צבים ותנינים.",
      "הם בעלי דם קר, כלומר טמפרטורת גופם מושפעת מהסביבה.",
    ],
  },
  {
    id: "animals_4",
    topic: "animals",
    grades: ["g5_6"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "מהי 'שרשרת מזון'?",
    options: [
      "רשימת בעלי חיים שחיים באותו אזור",
      "סדרה של יצורים חיים שבה כל אחד נטרף על ידי הבא אחריו",
      "רשימה של מזונות בריאים",
      "קבוצת בעלי חיים מאותו מין",
    ],
    correctIndex: 1,
    explanation:
      "שרשרת מזון מתארת את זרימת האנרגיה מהיצרנים (צמחים) לצרכנים (בעלי חיים).",
    theoryLines: [
      "הצמחים הם בדרך כלל היצרנים, כי הם מייצרים מזון בפוטוסינתזה.",
      "טורפים ואוכלי עשב הם חלק משרשראות ומארגי מזון.",
    ],
  },
  {
    id: "animals_5",
    topic: "animals",
    grades: ["g7_8"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "מה נכון לגבי התאמות התנהגותיות אצל בעלי חיים?",
    options: [
      "הן תמיד קשורות רק לצבע הגוף.",
      "הן כוללות שינויי התנהגות שעוזרים לשרוד, כמו נדידה או תרדמת חורף.",
      "הן קורות רק אצל חיות מחמד.",
      "הן תלויות רק במזג האוויר.",
    ],
    correctIndex: 1,
    explanation:
      "התאמות התנהגותיות הן דרכי פעולה שעוזרות לבעל החיים לשרוד בסביבתו, כמו נדידה או פעילות לילה.",
    theoryLines: [
      "יש התאמות מבניות (צורת גוף) והתאמות התנהגותיות.",
      "התאמות נוצרות לאורך דורות בתהליך של אבולוציה.",
    ],
  },

  // ========= צמחים =========
  {
    id: "plants_1",
    topic: "plants",
    grades: ["g1_2"],
    minLevel: "easy",
    maxLevel: "easy",
    type: "mcq",
    stem: "מה הצמח צריך כדי לגדול?",
    options: [
      "רק מים",
      "אור שמש, מים ואדמה",
      "רק אור",
      "רק אדמה",
    ],
    correctIndex: 1,
    explanation:
      "צמח זקוק לאור, מים, מינרלים מהאדמה ואוויר כדי לגדול ולהתפתח.",
    theoryLines: [
      "העלים קולטים אור, השורשים קולטים מים ומינרלים.",
      "ללא אור או מים הצמח נחלש ועלול למות.",
    ],
  },
  {
    id: "plants_2",
    topic: "plants",
    grades: ["g3_4"],
    minLevel: "easy",
    maxLevel: "easy",
    type: "mcq",
    stem: "איזה חלק בצמח אחראי על הכנסת מים מהאדמה?",
    options: ["העלים", "הגבעול", "השורשים", "הפרחים"],
    correctIndex: 2,
    explanation:
      "השורשים סופגים מים ומינרלים מהאדמה ומעבירים אותם דרך הגבעול לשאר חלקי הצמח.",
    theoryLines: [
      "הצמח בנוי משורשים, גבעול, עלים ופרחים (ברוב המקרים).",
      "השורשים מעגנים את הצמח בקרקע.",
    ],
  },
  {
    id: "plants_3",
    topic: "plants",
    grades: ["g3_4", "g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "mcq",
    stem: "מהי פוטוסינתזה?",
    options: [
      "תהליך שבו הצמח משיר עלים",
      "תהליך שבו הצמח מייצר מזון מאור השמש",
      "תהליך שבו הצמח סופג מים בלבד",
      "תהליך שבו הצמח נרקב באדמה",
    ],
    correctIndex: 1,
    explanation:
      "בפוטוסינתזה הצמח משתמש באור, מים ופחמן דו־חמצני כדי לייצר סוכר (גלוקוז) ולשחרר חמצן.",
    theoryLines: [
      "התהליך מתרחש בכלורופלסטים שנמצאים בעלים.",
      "פוטוסינתזה היא בסיס שרשרת המזון ברוב המערכות האקולוגיות.",
    ],
  },
  {
    id: "plants_4",
    topic: "plants",
    grades: ["g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "true_false",
    stem: "הצמח נושם רק ביום, כאשר יש אור שמש.",
    options: ["נכון", "לא נכון"],
    correctIndex: 1,
    explanation:
      "צמח מבצע נשימה תאית כל הזמן, ביום ובלילה. פוטוסינתזה מתרחשת רק כאשר יש אור.",
    theoryLines: [
      "נשימה תאית היא תהליך הפקת אנרגיה מסוכר.",
      "פוטוסינתזה מייצרת סוכר; נשימה צורכת אותו כדי להפיק אנרגיה.",
    ],
  },
  {
    id: "plants_5",
    topic: "plants",
    grades: ["g7_8"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "מה תפקיד פיוניות בעלה?",
    options: [
      "קליטת מים מהקרקע",
      "ייצור כלורופיל",
      "ויסות כניסת פחמן דו־חמצני ויציאת גזים ואדים",
      "אחסון עמילן",
    ],
    correctIndex: 2,
    explanation:
      "פיוניות הן פתחים זעירים בעלה המאפשרים חילוף גזים: כניסת פחמן דו־חמצני ויציאת חמצן ואדי מים.",
    theoryLines: [
      "פתיחת וסגירת פיוניות מושפעת מאור וממצב המים בצמח.",
      "דרך פיוניות אובדים גם מים באידוי (דיות).",
    ],
  },

  // ========= חומרים =========
  {
    id: "materials_1",
    topic: "materials",
    grades: ["g3_4"],
    minLevel: "easy",
    maxLevel: "easy",
    type: "mcq",
    stem: "מהו מצב הצבירה של קרח?",
    options: ["מוצק", "נוזל", "גז", "תערובת"],
    correctIndex: 0,
    explanation:
      "קרח הוא מים במצב מוצק. חימום הקרח יהפוך אותו לנוזל, וקירור מים יכול להפוך אותם לקרח.",
    theoryLines: [
      "למים יש שלושה מצבי צבירה: מוצק (קרח), נוזל (מים), גז (אדי מים).",
      "שינוי טמפרטורה יכול לגרום לשינוי מצב הצבירה.",
    ],
  },
  {
    id: "materials_2",
    topic: "materials",
    grades: ["g3_4", "g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "mcq",
    stem: "מה נכון לגבי חומרים מתכתיים?",
    options: [
      "הם תמיד קלים ועדינים",
      "הם מוליכים חום וחשמל טוב",
      "הם לא ניתנים לעיבוד",
      "הם שקופים לאור",
    ],
    correctIndex: 1,
    explanation:
      "למתכות יש תכונה חשובה של הולכת חום וחשמל, ולכן משתמשים בהן בכבלים, סירים ועוד.",
    theoryLines: [
      "מתכות רבות גם מבריקות וניתנות לריקוע (יצירת יריעות) ולמתיחה.",
      "לא כל חומר מתכתי חזק, אבל רבים מהם חזקים ועמידים.",
    ],
  },
  {
    id: "materials_3",
    topic: "materials",
    grades: ["g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "true_false",
    stem: "פלסטיק הוא חומר מעשה ידי אדם, שאינו נמצא בטבע כפי שהוא.",
    options: ["נכון", "לא נכון"],
    correctIndex: 0,
    explanation:
      "פלסטיק מיוצר במפעלים מחומרי גלם, בעיקר מנפט, ואינו חומר טבעי כמו עץ או אבן.",
    theoryLines: [
      "חומרים טבעיים מקורם בעולם החי, הצומח או הדומם.",
      "חומרים סינתטיים מיוצרים בתהליכים תעשייתיים.",
    ],
  },
  {
    id: "materials_4",
    topic: "materials",
    grades: ["g5_6", "g7_8"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "תמיסה של מלח ומים היא דוגמה ל...",
    options: [
      "תערובת הטרוגנית",
      "תערובת הומוגנית",
      "תרכובת כימית טהורה",
      "גז דליק",
    ],
    correctIndex: 1,
    explanation:
      "כאשר המלח מתמוסס במים, מתקבלת תמיסה אחידה בכל חלקיה – זו תערובת הומוגנית.",
    theoryLines: [
      "תערובת הומוגנית נראית אחידה, ואין בה גבולות ברורים בין החומרים.",
      "תמיסה היא סוג של תערובת שבה חומר אחד מומס באחר.",
    ],
  },
  {
    id: "materials_5",
    topic: "materials",
    grades: ["g7_8"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "מהו שינוי פיזיקלי?",
    options: [
      "שינוי שבו נוצרת זהות חומר חדשה לגמרי",
      "שינוי שבו החומר משנה מצב צבירה אך נשאר אותו חומר",
      "שינוי שיכול לקרות רק בחימום חזק",
      "שינוי שקורה רק למתכות",
    ],
    correctIndex: 1,
    explanation:
      "בשינוי פיזיקלי החומר משנה צורה או מצב צבירה, אך הרכבו הכימי נשאר זהה.",
    theoryLines: [
      "התכת קרח למים היא שינוי פיזיקלי – עדיין מדובר במים.",
      "שרפת נייר היא שינוי כימי – נוצר חומר חדש (אפר וגזים).",
    ],
  },

  // ========= כדור הארץ והחלל =========
  {
    id: "earth_1",
    topic: "earth_space",
    grades: ["g3_4"],
    minLevel: "easy",
    maxLevel: "easy",
    type: "mcq",
    stem: "מדוע יש יום ולילה?",
    options: [
      "כי השמש מסתובבת סביב כדור הארץ",
      "כי כדור הארץ מסתובב סביב עצמו",
      "כי הירח מסתיר את השמש",
      "כי העננים מכסים את השמש",
    ],
    correctIndex: 1,
    explanation:
      "יום ולילה נוצרים בגלל שכדור הארץ מסתובב סביב צירו. החלק שפונה לשמש חווה יום, והחלק הרחוק ממנה לילה.",
    theoryLines: [
      "סיבוב כדור הארץ סביב צירו נמשך כ־24 שעות.",
      "בכל רגע חצי מכדור הארץ מואר וחצי אחר חשוך.",
    ],
  },
  {
    id: "earth_2",
    topic: "earth_space",
    grades: ["g3_4", "g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "mcq",
    stem: "מה נכון לגבי מסלול כדור הארץ?",
    options: [
      "כדור הארץ מסתובב סביב הירח פעם בשנה",
      "כדור הארץ סובב את השמש פעם בשנה",
      "השמש סובבת את כדור הארץ פעם ביום",
      "הירח והשמש סובבים יחד את כדור הארץ",
    ],
    correctIndex: 1,
    explanation:
      "כדור הארץ נע במסלול סביב השמש והקפה מלאה נמשכת כשנה אחת.",
    theoryLines: [
      "לכדור הארץ יש שני סוגי תנועה: סיבוב סביב צירו והקפה סביב השמש.",
      "ההקפה סביב השמש קשורה לעונות השנה.",
    ],
  },
  {
    id: "earth_3",
    topic: "earth_space",
    grades: ["g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "true_false",
    stem: "הירח הוא כוכב שמאיר מעצמו.",
    options: ["נכון", "לא נכון"],
    correctIndex: 1,
    explanation:
      "הירח אינו כוכב ואינו מייצר אור. הוא מחזיר את אור השמש שמאיר עליו.",
    theoryLines: [
      "כוכבים מפיקים אור ואנרגיה בעצמם.",
      "ירח הוא לוויין טבעי הסובב סביב כוכב לכת.",
    ],
  },
  {
    id: "earth_4",
    topic: "earth_space",
    grades: ["g7_8"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "מה נכון לגבי שכבות כדור הארץ?",
    options: [
      "כדור הארץ בנוי רק מקרום דק מעל חלל ריק",
      "כדור הארץ בנוי מקרום, מעטפת וליבה",
      "כדור הארץ בנוי משכבה אחת אחידה",
      "אין לנו כל מידע על פנים כדור הארץ",
    ],
    correctIndex: 1,
    explanation:
      "כדור הארץ בנוי משכבות: קרום חיצוני דק, מעטפת עבה וליבה חמה מאוד.",
    theoryLines: [
      "רוב הידע על פנים כדור הארץ מגיע מרעידות אדמה וממחקר גיאולוגי.",
      "הליבה הפנימית צפופה וחמה מאוד.",
    ],
  },

  // ========= סביבה ואקולוגיה =========
  {
    id: "env_1",
    topic: "environment",
    grades: ["g3_4"],
    minLevel: "easy",
    maxLevel: "easy",
    type: "mcq",
    stem: "מהי פעולה שעוזרת לשמור על הסביבה?",
    options: [
      "להשאיר אורות דולקים כל הזמן",
      "להשליך פסולת לים",
      "למחזר נייר, פלסטיק וזכוכית",
      "לבזבז מים ללא הגבלה",
    ],
    correctIndex: 2,
    explanation:
      "מיחזור מפחית כמות פסולת, חוסך בחומרי גלם ותורם לשמירה על הסביבה.",
    theoryLines: [
      "שמירה על הסביבה כוללת צמצום פסולת, מיחזור וחיסכון במשאבים.",
      "מיחזור מאפשר שימוש מחדש בחומרים קיימים.",
    ],
  },
  {
    id: "env_2",
    topic: "environment",
    grades: ["g3_4", "g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "mcq",
    stem: "מהי מערכת אקולוגית (מערכת סביבתית)?",
    options: [
      "עיר גדולה עם בניינים",
      "אוסף יצורים חיים וסביבת החיים שלהם והקשרים ביניהם",
      "רשימת בעלי חיים בספר",
      "רק צמחים ללא בעלי חיים",
    ],
    correctIndex: 1,
    explanation:
      "מערכת אקולוגית כוללת יצורים חיים, סביבת החיים שלהם והקשרים ביניהם.",
    theoryLines: [
      "דוגמאות: יער, בריכה, שונית אלמוגים.",
      "שינויים בסביבה משפיעים על כל המרכיבים במערכת.",
    ],
  },
  {
    id: "env_3",
    topic: "environment",
    grades: ["g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "true_false",
    stem: "זיהום אוויר יכול להשפיע גם על הבריאות של בני האדם.",
    options: ["נכון", "לא נכון"],
    correctIndex: 0,
    explanation:
      "זיהום אוויר פוגע במערכת הנשימה, עלול לגרום למחלות ריאה ולבעיות בריאות שונות.",
    theoryLines: [
      "מקורות לזיהום: תחבורה, תעשייה, שריפת דלקים.",
      "צמצום זיהום אוויר חשוב לבריאות האדם והטבע.",
    ],
  },
  {
    id: "env_4",
    topic: "environment",
    grades: ["g5_6", "g7_8"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "מה נכון לגבי גזי חממה?",
    options: [
      "הם תמיד מסוכנים ואסור שיהיו בכלל באטמוספרה",
      "הם לוכדים חום באטמוספרה, וכמותם משפיעה על האקלים",
      "הם נמצאים רק מעל הערים הגדולות",
      "הם נוצרים רק מפעילות הרי געש",
    ],
    correctIndex: 1,
    explanation:
      "גזי חממה כמו פחמן דו־חמצני ומתאן לוכדים חום; כמות גבוהה מדי שלהם גורמת להתחממות גלובלית.",
    theoryLines: [
      "אפקט החממה הטבעי חיוני לשמירה על טמפרטורה מתאימה לחיים.",
      "פעילות אנושית הוסיפה כמות גדולה של גזי חממה לאטמוספרה.",
    ],
  },

  // ========= ניסויים ותהליכים =========
  {
    id: "exp_1",
    topic: "experiments",
    grades: ["g3_4"],
    minLevel: "easy",
    maxLevel: "easy",
    type: "mcq",
    stem: "ביצעת ניסוי עם שני כוסות מים: אחת בשמש ואחת בצל. באיזו כוס המים יתחממו יותר?",
    options: [
      "בכוס שבצל",
      "בשתי הכוסות אותו דבר",
      "בכוס שבשמש",
      "בכוס הריקה",
    ],
    correctIndex: 2,
    explanation:
      "בשמש המים מקבלים יותר אנרגיית חום ולכן מתחממים יותר מאשר בצל.",
    theoryLines: [
      "חום הוא מעבר אנרגיה מגוף חם לגוף קר.",
      "קל לראות ניסויים פשוטים של חימום וקירור בעזרת השמש.",
    ],
  },
  {
    id: "exp_2",
    topic: "experiments",
    grades: ["g3_4", "g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "mcq",
    stem: "מה חשוב לעשות בתחילת כל ניסוי מדעי?",
    options: [
      "לנחש את התוצאה בלי לחשוב",
      "לכתוב שאלה או בעיה שרוצים לבדוק",
      "להחליף בין כל החומרים כל הזמן",
      "לא לרשום כלום במחברת",
    ],
    correctIndex: 1,
    explanation:
      "ניסוי מדעי מתחיל משאלה או בעיה ברורה שרוצים לבדוק. לאחר מכן מתכננים את הצעדים.",
    theoryLines: [
      "מדע מבוסס על שאלות, תצפיות וניסויים.",
      "רישום מסודר עוזר להשוות בין תוצאות.",
    ],
  },
  {
    id: "exp_3",
    topic: "experiments",
    grades: ["g5_6"],
    minLevel: "medium",
    maxLevel: "medium",
    type: "true_false",
    stem: "בכל ניסוי אפשרי חייבים תמיד להחליף כמה משתנים בו־זמנית.",
    options: ["נכון", "לא נכון"],
    correctIndex: 1,
    explanation:
      "בניסוי טוב משתדלים לשנות משתנה אחד בלבד ולשמור אחרים קבועים, כדי להבין מה בדיוק גרם לתוצאה.",
    theoryLines: [
      "משתנה בלתי תלוי – מה שאנחנו משנים.",
      "משתנה תלוי – מה שאנחנו מודדים כתוצאה.",
    ],
  },
  {
    id: "exp_4",
    topic: "experiments",
    grades: ["g5_6", "g7_8"],
    minLevel: "hard",
    maxLevel: "hard",
    type: "mcq",
    stem: "סדר את שלבי מחזור המים מהראשון לאחרון:",
    options: [
      "אידוי → עיבוי → ירידת משקעים → איסוף במקורות מים",
      "עיבוי → איסוף → אידוי → ירידת משקעים",
      "איסוף → ירידת משקעים → עיבוי → אידוי",
      "ירידת משקעים → אידוי → עיבוי → איסוף",
    ],
    correctIndex: 0,
    explanation:
      "ראשית המים מתאדים, אחר כך מתעבים לעננים, לאחר מכן יורדים כגשם/שלג ולבסוף נאספים בים, אגמים ומי תהום.",
    theoryLines: [
      "מחזור המים הוא תהליך מתמשך בין הים, היבשה והאטמוספרה.",
      "הוא מושפע מהשמש, מהרוח ומהטופוגרפיה של פני השטח.",
    ],
  },
];

// ================== HELPERS ==================

function levelAllowed(question, levelKey) {
  const order = { easy: 1, medium: 2, hard: 3 };
  const min = order[question.minLevel] || 1;
  const max = order[question.maxLevel] || 3;
  const cur = order[levelKey] || 1;
  return cur >= min && cur <= max;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTop10(saved) {
  const all = [];
  if (!saved) return [];
  Object.values(saved).forEach((arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((entry) => {
      if (!entry || !entry.playerName) return;
      all.push({
        name: entry.playerName,
        bestScore: entry.bestScore ?? entry.score ?? 0,
        bestStreak: entry.bestStreak ?? entry.streak ?? 0,
        timestamp: entry.timestamp || 0,
      });
    });
  });
  const sorted = all
    .sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
      return (b.timestamp || 0) - (a.timestamp || 0);
    })
    .slice(0, 10);
  while (sorted.length < 10) {
    sorted.push({
      name: "-",
      bestScore: 0,
      bestStreak: 0,
      timestamp: 0,
      placeholder: true,
    });
  }
  return sorted;
}

function getHintForQuestion(q) {
  if (!q) return "";
  if (q.theoryLines && q.theoryLines.length > 0) {
    return q.theoryLines[0];
  }
  return "נסה להיזכר בהסבר שלמדת בנושא זה.";
}

function getErrorExplanationScience(question, wrongAnswer) {
  if (!question) return "";
  const correct = question.options?.[question.correctIndex];
  switch (question.topic) {
    case "body":
      return "בדוק שוב: מה תפקיד המערכת או האיבר? נסה לחשוב איך הוא עוזר לגוף.";
    case "animals":
      return "שאל את עצמך: היכן החיה חיה? מה היא אוכלת? אלו סימני זיהוי יש לה?";
    case "plants":
      return "זכור את חלקי הצמח ותפקידם: שורש, גבעול, עלים, פרחים.";
    case "materials":
      return "חשוב על מצב הצבירה ועל תכונות החומר (מוצק/נוזל/גז, מסיסות וכו').";
    case "earth_space":
      return "תזכור: לכדור הארץ יש תנועות קבועות (סיבוב סביב עצמו והקפה סביב השמש).";
    case "environment":
      return "חשב האם הפעולה עוזרת לסביבה או פוגעת בה (זיהום, בזבוז, מיחזור).";
    case "experiments":
      return "חשוב כמו מדען: מה קורה בניסוי? מי הגורם ומה התוצאה?";
    default:
      break;
  }
  return correct
    ? `נסה לחשוב שוב. רמז: התשובה הנכונה קשורה ל-"${correct}".`
    : "בדוק שוב את הנתונים ואת ההסבר שלמדת.";
}

function getSolutionStepsScience(question) {
  if (!question) return [];
  const lines = [];
  lines.push("1. קודם כל נבין את השאלה – על איזה נושא היא מדברת?");
  if (question.theoryLines && question.theoryLines.length > 0) {
    question.theoryLines.forEach((line, i) => {
      lines.push(`${i + 2}. ${line}`);
    });
  }
  const correctText =
    question.options && question.options[question.correctIndex]
      ? question.options[question.correctIndex]
      : "";
  if (correctText) {
    lines.push(
      `${lines.length + 1}. מתוך כל האפשרויות, רק "${correctText}" מתאים להסבר.`
    );
  }
  if (question.explanation) {
    lines.push(`${lines.length + 1}. סיכום: ${question.explanation}`);
  }
  return lines;
}

// ================== MAIN COMPONENT ==================

export default function ScienceMaster() {
  useIOSViewportFix();
  const router = useRouter();
  const wrapRef = useRef(null);
  const headerRef = useRef(null);
  const controlsRef = useRef(null);
  const gameRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [grade, setGrade] = useState("g3_4");
  const [mode, setMode] = useState("learning");
  const [level, setLevel] = useState("easy");
  const [topic, setTopic] = useState("body");
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [errorExplanation, setErrorExplanation] = useState("");

  const questionPoolRef = useRef([]);
  const questionIndexRef = useRef(0);

  const [playerName, setPlayerName] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("mleo_player_name") || "";
    } catch {
      return "";
    }
  });
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [stars, setStars] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  // progress by topic
  const [progress, setProgress] = useState({
    body: { total: 0, correct: 0 },
    animals: { total: 0, correct: 0 },
    plants: { total: 0, correct: 0 },
    materials: { total: 0, correct: 0 },
    earth_space: { total: 0, correct: 0 },
    environment: { total: 0, correct: 0 },
    experiments: { total: 0, correct: 0 },
  });
  const [dailyChallenge, setDailyChallenge] = useState({
    date: new Date().toDateString(),
    bestScore: 0,
    questions: 0,
  });

  // ----- MOUNT -----
  useEffect(() => {
    setMounted(true);
  }, []);

  // ----- LAYOUT HEIGHT -----
  useEffect(() => {
    if (!wrapRef.current || !mounted) return;
    const calc = () => {
      const rootH = window.visualViewport?.height ?? window.innerHeight;
      const headH = headerRef.current?.offsetHeight || 0;
      const controlsH = controlsRef.current?.offsetHeight || 40;
      document.documentElement.style.setProperty("--head-h", headH + "px");
      const used = headH + controlsH + 160;
      const freeH = Math.max(260, rootH - used);
      document.documentElement.style.setProperty("--game-h", freeH + "px");
    };
    const timer = setTimeout(calc, 100);
    window.addEventListener("resize", calc);
    window.visualViewport?.addEventListener("resize", calc);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calc);
      window.visualViewport?.removeEventListener("resize", calc);
    };
  }, [mounted]);

  // ----- LOAD LONG-TERM PROGRESS -----
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY + "_progress");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.stars) setStars(saved.stars);
      if (saved.playerLevel) setPlayerLevel(saved.playerLevel);
      if (saved.xp) setXp(saved.xp);
      if (saved.progress) setProgress(saved.progress);
    } catch {
      // ignore
    }
  }, []);

  // ----- DAILY CHALLENGE RESET -----
  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyChallenge.date !== today) {
      setDailyChallenge({ date: today, bestScore: 0, questions: 0 });
    }
  }, [dailyChallenge.date]);

  // ----- TIMER -----
  useEffect(() => {
    if (!gameActive) return;
    if (mode !== "challenge" && mode !== "speed") return;
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    const t = setTimeout(() => {
      setTimeLeft((prev) => (prev != null ? prev - 1 : prev));
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameActive, mode]);

  // ----- BEST SCORES LOAD PER LEVEL+TOPIC -----
  useEffect(() => {
    if (typeof window === "undefined" || !playerName.trim()) {
      setBestScore(0);
      setBestStreak(0);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setBestScore(0);
        setBestStreak(0);
        return;
      }
      const saved = JSON.parse(raw);
      const key = `${level}_${topic}`;
      const items = saved[key];
      if (!Array.isArray(items)) {
        setBestScore(0);
        setBestStreak(0);
        return;
      }
      const playerItems = items.filter(
        (e) => e.playerName === playerName.trim()
      );
      if (playerItems.length === 0) {
        setBestScore(0);
        setBestStreak(0);
        return;
      }
      const maxScore = Math.max(
        ...playerItems.map((s) => s.bestScore ?? s.score ?? 0),
        0
      );
      const maxStreak = Math.max(
        ...playerItems.map((s) => s.bestStreak ?? s.streak ?? 0),
        0
      );
      setBestScore(maxScore);
      setBestStreak(maxStreak);
    } catch {
      setBestScore(0);
      setBestStreak(0);
    }
  }, [level, topic, playerName]);

  // ================== GAME LOGIC ==================

  function filterQuestionsForCurrentSettings() {
    // topic === mixed -> כל הנושאים למעט mixed
    const gradeKey = grade;
    let topicsList;
    if (topic === "mixed") {
      topicsList = Object.keys(TOPICS).filter((t) => t !== "mixed");
    } else {
      topicsList = [topic];
    }
    const pool = QUESTIONS.filter(
      (q) =>
        topicsList.includes(q.topic) &&
        q.grades.includes(gradeKey) &&
        levelAllowed(q, level)
    );
    return pool;
  }

  function generateNewQuestion(resetPool = false) {
    const pool = filterQuestionsForCurrentSettings();

    if (pool.length === 0) {
      questionPoolRef.current = [];
      questionIndexRef.current = 0;
      setCurrentQuestion(null);
      setFeedback(
        "אין עדיין מספיק שאלות לנושא/כיתה/רמה שבחרת. נסה לשנות הגדרה."
      );
      return;
    }

    // אם צריך לבנות מאפס את המאגר (התחלת משחק / שינוי הגדרות)
    if (resetPool || questionPoolRef.current.length === 0) {
      questionPoolRef.current = shuffleArray(pool);
      questionIndexRef.current = 0;
    }

    // אם עברנו על כל השאלות – מערבבים מחדש לסיבוב הבא
    if (questionIndexRef.current >= questionPoolRef.current.length) {
      questionPoolRef.current = shuffleArray(questionPoolRef.current);
      questionIndexRef.current = 0;
    }

    const q = questionPoolRef.current[questionIndexRef.current];
    questionIndexRef.current += 1;

    setCurrentQuestion(q);
    setSelectedAnswer(null);
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
    setQuestionStartTime(Date.now());
  }

  function hardResetGame() {
    setGameActive(false);
    setCurrentQuestion(null);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTimeLeft(20);
    setSelectedAnswer(null);
    setFeedback(null);
    setLives(3);

    // איפוס מאגר השאלות
    questionPoolRef.current = [];
    questionIndexRef.current = 0;
    setTotalQuestions(0);
    setAvgTime(0);
    setQuestionStartTime(null);
  }

  function saveRunToStorage() {
    if (typeof window === "undefined" || !playerName.trim()) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "{}";
      const saved = JSON.parse(raw);
      const key = `${level}_${topic}`;
      const arr = Array.isArray(saved[key]) ? saved[key] : [];
      arr.push({
        playerName: playerName.trim(),
        bestScore: score,
        bestStreak: streak,
        timestamp: Date.now(),
      });
      saved[key] = arr.slice(-100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      // update best
      const top = arr.reduce(
        (acc, item) => {
          const s = item.bestScore ?? item.score ?? 0;
          const st = item.bestStreak ?? item.streak ?? 0;
          return {
            bestScore: Math.max(acc.bestScore, s),
            bestStreak: Math.max(acc.bestStreak, st),
          };
        },
        { bestScore: 0, bestStreak: 0 }
      );
      setBestScore(top.bestScore);
      setBestStreak(top.bestStreak);
      if (leaderboardOpen) {
        const all = buildTop10(saved);
        setLeaderboardData(all);
      }
    } catch {
      // ignore
    }
  }

  function startGame() {
    setGameActive(true);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTotalQuestions(0);
    setAvgTime(0);
    setFeedback(null);
    setSelectedAnswer(null);
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
    setLives(mode === "challenge" ? 3 : 0);
    if (mode === "challenge") setTimeLeft(25);
    else if (mode === "speed") setTimeLeft(12);
    else setTimeLeft(null);

    // מאתחל מאגר שאלות חדש לסשן הזה
    generateNewQuestion(true);
  }

  function stopGame() {
    saveRunToStorage();
    setGameActive(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedAnswer(null);
  }

  function handleTimeUp() {
    setWrong((prev) => prev + 1);
    setStreak(0);
    setFeedback("הזמן נגמר! ⏰");
    setGameActive(false);
    setCurrentQuestion(null);
    saveRunToStorage();
    setTimeout(() => {
      hardResetGame();
    }, 1800);
  }

  function handleAnswer(idx) {
    if (!gameActive || !currentQuestion || selectedAnswer != null) return;
    const answerText = currentQuestion.options?.[idx];
    // update time stats
    setTotalQuestions((prev) => {
      const newTotal = prev + 1;
      if (questionStartTime) {
        const elapsed = (Date.now() - questionStartTime) / 1000;
        setAvgTime((prevAvg) =>
          prev === 0 ? elapsed : (prevAvg * prev + elapsed) / newTotal
        );
      }
      return newTotal;
    });
    setSelectedAnswer(idx);
    const isCorrect = idx === currentQuestion.correctIndex;
    if (isCorrect) {
      let points = 10 + streak;
      if (mode === "speed" && timeLeft != null) {
        points += Math.floor(timeLeft * 1.5);
      }
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      setCorrect((prev) => prev + 1);
      setErrorExplanation("");
      // progress by topic
      setProgress((prev) => {
        const key = currentQuestion.topic;
        const cur = prev[key] || { total: 0, correct: 0 };
        const next = {
          total: cur.total + 1,
          correct: cur.correct + 1,
        };
        const newAll = { ...prev, [key]: next };
        persistProgress(newAll);
        return newAll;
      });
      // stars
      const newCorrect = correct + 1;
      if (newCorrect % 5 === 0) {
        setStars((prev) => {
          const s = prev + 1;
          persistProgress(null, s, null, null);
          return s;
        });
      }
      // XP
      const xpGain = hintUsed ? 5 : 10;
      setXp((prev) => {
        let newXp = prev + xpGain;
        let lv = playerLevel;
        let changed = false;
        let xpNeeded = lv * 100;
        while (newXp >= xpNeeded) {
          newXp -= xpNeeded;
          lv += 1;
          changed = true;
          xpNeeded = lv * 100;
        }
        if (changed) {
          setPlayerLevel(lv);
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 2500);
        }
        persistProgress(null, null, lv, newXp);
        return newXp;
      });
      // daily challenge
      setDailyChallenge((prev) => ({
        date: prev.date,
        bestScore: Math.max(prev.bestScore, score + points),
        questions: prev.questions + 1,
      }));
      setFeedback("מצוין! ✅");
      if ("vibrate" in navigator) navigator.vibrate?.(50);
      setTimeout(() => {
        if (!gameActive) return;
        generateNewQuestion();
        if (mode === "challenge") setTimeLeft(25);
        else if (mode === "speed") setTimeLeft(12);
      }, 900);
    } else {
      setWrong((prev) => prev + 1);
      setStreak(0);
      setErrorExplanation(getErrorExplanationScience(currentQuestion, answerText));
      setProgress((prev) => {
        const key = currentQuestion.topic;
        const cur = prev[key] || { total: 0, correct: 0 };
        const next = {
          total: cur.total + 1,
          correct: cur.correct,
        };
        const newAll = { ...prev, [key]: next };
        persistProgress(newAll);
        return newAll;
      });
      if ("vibrate" in navigator) navigator.vibrate?.(200);
      if (mode === "learning") {
        setFeedback("לא מדויק... ❌");
        setTimeout(() => {
          generateNewQuestion();
          setSelectedAnswer(null);
          setFeedback(null);
        }, 1600);
      } else {
        setFeedback("טעות! ❌ (-1 ❤️)");
        setLives((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setFeedback("Game Over! 💔");
            saveRunToStorage();
            setGameActive(false);
            setCurrentQuestion(null);
            setTimeout(() => {
              hardResetGame();
            }, 2000);
          } else {
            setTimeout(() => {
              generateNewQuestion();
              setSelectedAnswer(null);
              setFeedback(null);
              if (mode === "challenge") setTimeLeft(25);
              else if (mode === "speed") setTimeLeft(12);
            }, 1600);
          }
          return next;
        });
      }
    }
  }

  function persistProgress(newProgress, newStars, newLevel, newXp) {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY + "_progress") || "{}";
      const saved = JSON.parse(raw);
      if (newProgress) saved.progress = newProgress;
      if (typeof newStars === "number") saved.stars = newStars;
      if (typeof newLevel === "number") saved.playerLevel = newLevel;
      if (typeof newXp === "number") saved.xp = newXp;
      localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
    } catch {
      // ignore
    }
  }

  function resetStats() {
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setBestScore(0);
    setBestStreak(0);
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "{}";
      const saved = JSON.parse(raw);
      const key = `${level}_${topic}`;
      delete saved[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // ignore
    }
  }

  function openLeaderboard() {
    setLeaderboardOpen(true);
    if (typeof window === "undefined") {
      setLeaderboardData([]);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "{}";
      const saved = JSON.parse(raw);
      const top = buildTop10(saved);
      setLeaderboardData(top);
    } catch {
      setLeaderboardData([]);
    }
  }

  const backSafe = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/learning");
    }
  };

  if (!mounted) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-[#050816] to-[#0b1121] flex items-center justify-center">
          <div className="text-white text-xl">טוען מדעים...</div>
        </div>
      </Layout>
    );
  }

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

  return (
    <Layout>
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden bg-gradient-to-b from-[#050816] to-[#0b1121] game-page-mobile"
        style={{ height: "100vh", height: "100dvh" }}
      >
        {/* רקע עדין */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
        </div>

        {/* HEADER */}
        <div
          ref={headerRef}
          className="absolute top-0 left-0 right-0 z-50 pointer-events-none"
        >
          <div
            className="relative px-2 py-3"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
          >
            <div className="absolute left-2 top-2 flex gap-2 pointer-events-auto">
              <button
                onClick={backSafe}
                className="min-w-[60px] px-3 py-1 rounded-lg text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10"
              >
                BACK
              </button>
            </div>
            <div className="absolute right-2 top-2 pointer-events-auto">
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                Local
              </span>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="relative flex flex-col items-center justify-start px-4"
          style={{
            height: "100%",
            maxHeight: "100%",
            paddingTop: "calc(var(--head-h, 56px) + 8px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
          }}
        >
          {/* TITLE */}
          <div className="text-center mb-2">
            <h1 className="text-2xl font-extrabold text-white mb-1">
              🔬 Science Master
            </h1>
            <p className="text-white/70 text-xs">
              {playerName || "שחקן"} • {GRADES[grade].name} • {LEVELS[level].name} •{" "}
              {getTopicLabel(topic)} • {MODES[mode].name}
            </p>
          </div>

          {/* TOP STATS */}
          <div
            ref={controlsRef}
            className="grid grid-cols-6 gap-1 mb-2 w-full max-w-md text-center"
          >
            <div className="bg-black/30 border border-white/10 rounded-lg p-1">
              <div className="text-[10px] text-white/60">ניקוד</div>
              <div className="text-sm font-bold text-emerald-400">{score}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1">
              <div className="text-[10px] text-white/60">רצף</div>
              <div className="text-sm font-bold text-amber-400">🔥{streak}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1">
              <div className="text-[10px] text-white/60">✅ נכונות</div>
              <div className="text-sm font-bold text-green-400">{correct}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1">
              <div className="text-[10px] text-white/60">❌ שגיאות</div>
              <div className="text-sm font-bold text-rose-400">{wrong}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1">
              <div className="text-[10px] text-white/60">מדעים Lv.</div>
              <div className="text-sm font-bold text-purple-400">
                {playerLevel}
              </div>
            </div>
            <div
              className={`rounded-lg p-1 ${
                gameActive &&
                (mode === "challenge" || mode === "speed") &&
                timeLeft != null &&
                timeLeft <= 5
                  ? "bg-red-500/30 border-2 border-red-400 animate-pulse"
                  : "bg-black/30 border border-white/10"
              }`}
            >
              <div className="text-[10px] text-white/60">⏰ טיימר</div>
              <div
                className={`text-lg font-black ${
                  gameActive &&
                  (mode === "challenge" || mode === "speed") &&
                  timeLeft != null &&
                  timeLeft <= 5
                    ? "text-red-400"
                    : "text-yellow-300"
                }`}
              >
                {gameActive
                  ? mode === "challenge" || mode === "speed"
                    ? timeLeft ?? "--"
                    : "∞"
                  : "--"}
              </div>
            </div>
          </div>

          {/* MODES */}
          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
            {Object.keys(MODES).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setGameActive(false);
                  setFeedback(null);
                }}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === m
                    ? "bg-emerald-500/80 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {MODES[m].name}
              </button>
            ))}
          </div>

          {/* LEVEL-UP POPUP */}
          {showLevelUp && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60">
              <div className="bg-gradient-to-br from-purple-600 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-2xl text-center animate-pulse max-w-xs">
                <div className="text-4xl mb-2">🌟</div>
                <div className="text-xl font-bold mb-1">עלית רמה במדעים!</div>
                <div className="text-sm">כעת אתה ברמה {playerLevel}</div>
              </div>
            </div>
          )}

          {/* SETUP / GAME */}
          {!gameActive ? (
            <>
              {/* PLAYER & SETTINGS */}
              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlayerName(val);
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem("mleo_player_name", val);
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  placeholder="שם שחקן"
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-sm font-bold placeholder:text-white/40 flex-1 min-w-[130px]"
                  maxLength={15}
                />
                <select
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {Object.keys(GRADES).map((g) => (
                    <option key={g} value={g}>
                      {GRADES[g].name}
                    </option>
                  ))}
                </select>
                <select
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {Object.keys(LEVELS).map((l) => (
                    <option key={l} value={l}>
                      {LEVELS[l].name}
                    </option>
                  ))}
                </select>
                <select
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold flex-1 min-w-[130px]"
                >
                  {Object.keys(TOPICS).map((t) => (
                    <option key={t} value={t}>
                      {getTopicLabel(t)}
                    </option>
                  ))}
                </select>
              </div>

              {/* BEST / ACCURACY */}
              <div className="grid grid-cols-3 gap-2 mb-2 w-full max-w-md">
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">שיא ניקוד</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {bestScore}
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">שיא רצף</div>
                  <div className="text-lg font-bold text-amber-400">
                    {bestStreak}
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">דיוק</div>
                  <div className="text-lg font-bold text-blue-400">
                    {accuracy}%
                  </div>
                </div>
              </div>

              {/* DAILY + XP */}
              <div className="grid grid-cols-3 gap-2 mb-2 w-full max-w-md">
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">כוכבים</div>
                  <div className="text-lg font-bold text-yellow-400">
                    ⭐ {stars}
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">רמת מדען</div>
                  <div className="text-xs font-bold text-purple-300">
                    Lv.{playerLevel} ({xp}/{playerLevel * 100} XP)
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">אתגר יומי</div>
                  <div className="text-xs text-white">
                    שיא: {dailyChallenge.bestScore} • שאלות:{" "}
                    {dailyChallenge.questions}
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-10 px-6 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  ▶️ התחל מדעים
                </button>
                <button
                  onClick={openLeaderboard}
                  className="h-10 px-4 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-sm"
                >
                  🏆 לוח תוצאות
                </button>
                {bestScore > 0 && (
                  <button
                    onClick={resetStats}
                    className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
                  >
                    🧹 איפוס
                  </button>
                )}
              </div>

              {!playerName.trim() && (
                <p className="text-xs text-white/60 text-center mb-2">
                  הכנס שם שחקן כדי להתחיל.
                </p>
              )}

              {/* כפתור "איך לומדים מדעים כאן?" */}
              <div className="mb-2 w-full max-w-md flex justify-center">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים מדעים כאן?
                </button>
              </div>
            </>
          ) : (
            <>
              {/* FEEDBACK */}
              {feedback && (
                <div
                  className={`mb-2 px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                    feedback.includes("מצוין") || feedback.includes("Game Over") === false
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  <div>{feedback}</div>
                  {errorExplanation && (
                    <div className="mt-1 text-xs text-red-100/90 font-normal">
                      {errorExplanation}
                    </div>
                  )}
                </div>
              )}

              {/* מה חשוב לזכור - מחוץ ל-container */}
              {mode === "learning" && currentQuestion && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white/80 text-right w-full max-w-md" dir="rtl">
                  <div className="font-bold mb-1">📘 מה חשוב לזכור?</div>
                  <ul className="list-disc pr-4 space-y-0.5">
                    {(currentQuestion.theoryLines || []).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* QUESTION AREA */}
              <div
                ref={gameRef}
                className="w-full max-w-md flex flex-col items-center justify-center mb-2 flex-1"
                style={{
                  height: "var(--game-h, 400px)",
                  minHeight: "300px",
                }}
              >
                {/* STEM */}
                <div
                  className="text-4xl font-black text-white mb-6 text-center -mt-12"
                  style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                >
                  {currentQuestion
                    ? currentQuestion.stem
                    : "אין שאלה זמינה להגדרה זו."}
                </div>

                {/* HINT + SOLUTION BUTTONS */}
                <div className="flex gap-2 mb-2">
                  {!hintUsed && !selectedAnswer && currentQuestion && (
                    <button
                      onClick={() => {
                        setShowHint(true);
                        setHintUsed(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-sm font-bold"
                    >
                      💡 רמז
                    </button>
                  )}
                  {mode === "learning" && currentQuestion && (
                    <button
                      onClick={() => setShowSolution(true)}
                      className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                    >
                      📘 הסבר מלא
                    </button>
                  )}
                </div>

                {showHint && currentQuestion && (
                  <div className="mb-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-100 text-xs text-right w-full max-w-md">
                    {getHintForQuestion(currentQuestion)}
                  </div>
                )}

                {/* ANSWERS */}
                {currentQuestion && (
                  <div className="grid grid-cols-2 gap-3 w-full mb-3">
                    {currentQuestion.options?.map((opt, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === currentQuestion.correctIndex;
                      const isWrong = isSelected && !isCorrect;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          disabled={selectedAnswer != null}
                          className={`rounded-xl border-2 px-6 py-6 text-2xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
                            isCorrect && isSelected
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : isWrong
                              ? "bg-red-500/30 border-red-400 text-red-200"
                              : selectedAnswer != null && isCorrect
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : "bg-black/30 border-white/15 text-white hover:border-white/40"
                          }`}
                          style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={stopGame}
                className="h-9 px-4 rounded-lg bg-red-500/80 hover:bg-red-500 font-bold text-sm"
              >
                ⏹️ עצור
              </button>

              {/* SOLUTION MODAL */}
              {showSolution && currentQuestion && (
                <div
                  className="fixed inset-0 z-[130] bg-black/70 flex items-center justify-center px-4"
                  onClick={() => setShowSolution(false)}
                >
                  <div
                    className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl p-4 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-emerald-100" dir="rtl">
                        {"\u200Fאיך פותרים את השאלה?"}
                      </h3>
                      <button
                        onClick={() => setShowSolution(false)}
                        className="text-emerald-200 hover:text-white text-xl leading-none px-2"
                      >
                        ✖
                      </button>
                    </div>
                    <div className="mb-2 text-sm text-emerald-50" dir="rtl">
                      {/* מציגים שוב את התרגיל */}
                      <p
                        className="text-base font-bold text-white mb-3"
                        style={{ textAlign: "center", direction: "rtl", unicodeBidi: "plaintext" }}
                      >
                        {(() => {
                          const q = (currentQuestion.stem || "").trim().replace(/^\?+/, "");
                          return q.endsWith("?") ? q : q + "?";
                        })()}
                      </p>
                      {/* כאן הצעדים */}
                      <div className="space-y-1 text-sm" style={{ direction: "rtl" }}>
                        {getSolutionStepsScience(currentQuestion).map(
                          (line, idx) => (
                            <div key={idx}>{line}</div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={() => setShowSolution(false)}
                        className="px-6 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                        dir="rtl"
                      >
                        {"\u200Fסגור"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* LEADERBOARD MODAL */}
          {leaderboardOpen && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[140] p-4"
              onClick={() => setLeaderboardOpen(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-4 max-w-md w-full max-h-[85svh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-1">
                    🏆 לוח תוצאות – מדעים
                  </h2>
                  <p className="text-white/70 text-xs">שיאים מקומיים</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-center">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-white/80 p-2 font-bold text-xs">
                          דירוג
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          שחקן
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          ניקוד
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          רצף
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-white/60 p-4 text-sm">
                            עדיין אין תוצאות לשמירה.
                          </td>
                        </tr>
                      ) : (
                        leaderboardData.map((row, idx) => (
                          <tr
                            key={`${row.name}-${row.timestamp}-${idx}`}
                            className={`border-b border-white/10 ${
                              row.placeholder
                                ? "opacity-40"
                                : idx === 0
                                ? "bg-amber-500/20"
                                : idx === 1
                                ? "bg-gray-500/20"
                                : idx === 2
                                ? "bg-amber-900/20"
                                : ""
                            }`}
                          >
                            <td className="text-white/80 p-2 text-sm font-bold">
                              {row.placeholder
                                ? `#${idx + 1}`
                                : idx === 0
                                ? "🥇"
                                : idx === 1
                                ? "🥈"
                                : idx === 2
                                ? "🥉"
                                : `#${idx + 1}`}
                            </td>
                            <td className="text-white p-2 text-sm font-semibold">
                              {row.name}
                            </td>
                            <td className="text-emerald-400 p-2 text-sm font-bold">
                              {row.bestScore}
                            </td>
                            <td className="text-amber-400 p-2 text-sm font-bold">
                              🔥{row.bestStreak}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setLeaderboardOpen(false)}
                    className="px-6 py-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-sm"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}

          {showHowTo && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[180] p-4"
              onClick={() => setShowHowTo(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-emerald-400/60 rounded-2xl p-4 max-w-md w-full text-sm text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-extrabold mb-2 text-center">
                  📘 איך לומדים מדעים כאן?
                </h2>

                <p className="text-white/80 text-xs mb-3 text-center">
                  המטרה היא לתרגל מדעים בצורה משחקית, עם התאמה לכיתה, נושא ורמת קושי.
                </p>

                <ul className="list-disc pr-4 space-y-1 text-[13px] text-white/90">
                  <li>בחר כיתה, רמה ונושא (לדוגמה: גוף האדם, צמחים, בעלי חיים ועוד).</li>
                  <li>בחר מצב משחק: למידה, אתגר עם טיימר וחיים, מרוץ מהירות או מרתון.</li>
                  <li>ענה על שאלות בחירה, נכון/לא נכון ותסריטי ניסוי.</li>
                  <li>לחץ על 💡 Hint להסבר קצר, ועל "📘 הסבר מלא" כדי לראות פתרון צעד־אחר־צעד.</li>
                  <li>נסה להגיע לרצף תשובות נכון ולקבל כוכבים ו־XP.</li>
                </ul>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowHowTo(false)}
                    className="px-5 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
