// מערכת יצירת דוחות להורים

import { STORAGE_KEY } from './math-constants';
import { getTimeByPeriod, getTimeByCustomPeriod, getAllTimeTracking } from './math-time-tracking';
import { getGeometryTimeByPeriod, getGeometryTimeByCustomPeriod } from './math-time-tracking';
import { getEnglishTimeByCustomPeriod } from './english-time-tracking';
import { getScienceTimeByCustomPeriod } from './science-time-tracking';
import { getHebrewTimeByCustomPeriod } from './hebrew-time-tracking';
import { getMoledetGeographyTimeByCustomPeriod } from './moledet-geography-time-tracking';

// שמות פעולות בעברית (חשבון)
const OPERATION_NAMES = {
  addition: "חיבור",
  subtraction: "חיסור",
  multiplication: "כפל",
  division: "חילוק",
  fractions: "שברים",
  percentages: "אחוזים",
  sequences: "סדרות",
  decimals: "עשרוניים",
  rounding: "עיגול",
  divisibility: "סימני התחלקות",
  prime_composite: "מספרים ראשוניים ופריקים",
  powers: "חזקות",
  ratio: "יחס",
  equations: "משוואות",
  order_of_operations: "סדר פעולות",
  zero_one_properties: "תכונות ה-0 וה-1",
  estimation: "אומדן",
  scale: "קנה מידה",
  compare: "השוואה",
  number_sense: "חוש מספרים",
  factors_multiples: "גורמים וכפולות",
  word_problems: "בעיות מילוליות",
  mixed: "ערבוב"
};

// שמות נושאים בעברית (גאומטריה)
const TOPIC_NAMES = {
  shapes_basic: "צורות בסיסיות",
  area: "שטח",
  perimeter: "היקף",
  volume: "נפח",
  angles: "זוויות",
  parallel_perpendicular: "מקבילות ומאונכות",
  triangles: "משולשים",
  quadrilaterals: "מרובעים",
  transformations: "טרנספורמציות",
  rotation: "סיבוב",
  symmetry: "סימטרייה",
  diagonal: "אלכסון",
  heights: "גבהים",
  tiling: "ריצוף",
  circles: "מעגל ועיגול",
  solids: "גופים",
  pythagoras: "פיתגורס",
  mixed: "ערבוב"
};

export function getOperationName(op) {
  return OPERATION_NAMES[op] || op;
}

export function getTopicName(topic) {
  return TOPIC_NAMES[topic] || topic;
}

const ENGLISH_TOPIC_NAMES = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  translation: "Translation",
  sentences: "Sentence Building",
  writing: "Writing",
  mixed: "Mixed Practice",
};

export function getEnglishTopicName(topic) {
  return ENGLISH_TOPIC_NAMES[topic] || topic;
}

const SCIENCE_TOPIC_NAMES = {
  body: "גוף האדם",
  animals: "בעלי חיים",
  plants: "צמחים",
  materials: "חומרים",
  earth_space: "כדור הארץ והחלל",
  environment: "סביבה ואקולוגיה",
  experiments: "ניסויים ותהליכים",
  mixed: "ערבוב נושאים",
};

export function getScienceTopicName(topic) {
  return SCIENCE_TOPIC_NAMES[topic] || topic;
}

const HEBREW_TOPIC_NAMES = {
  reading: "קריאה",
  comprehension: "הבנת הנקרא",
  writing: "כתיבה והבעה",
  grammar: "דקדוק ולשון",
  vocabulary: "עושר שפתי",
  speaking: "דיבור ושיח",
  mixed: "ערבוב",
};

export function getHebrewTopicName(topic) {
  return HEBREW_TOPIC_NAMES[topic] || topic;
}

const MOLEDET_GEOGRAPHY_TOPIC_NAMES = {
  homeland: "מולדת",
  community: "קהילה",
  citizenship: "אזרחות",
  geography: "גאוגרפיה",
  values: "ערכים",
  maps: "מפות",
  mixed: "ערבוב",
};

export function getMoledetGeographyTopicName(topic) {
  return MOLEDET_GEOGRAPHY_TOPIC_NAMES[topic] || topic;
}

// יצירת דוח להורים
export function generateParentReport(playerName, period = 'week', customStartDate = null, customEndDate = null) {
  if (typeof window === "undefined") return null;
  
  try {
    // ========== חשבון ==========
    // איסוף נתוני התקדמות חשבון
    const mathProgress = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
    const mathProgressData = mathProgress.progress || {};
    
    // ========== גאומטריה ==========
    // איסוף נתוני התקדמות גאומטריה
    const geometryProgress = JSON.parse(localStorage.getItem("mleo_geometry_master" + "_progress") || "{}");
    const geometryProgressData = geometryProgress.progress || {};
    
    const englishProgress = JSON.parse(localStorage.getItem("mleo_english_master" + "_progress") || "{}");
    const englishProgressData = englishProgress.progress || {};
    
    const scienceProgress = JSON.parse(localStorage.getItem("mleo_science_master" + "_progress") || "{}");
    const scienceProgressData = scienceProgress.progress || {};
    
    // ========== עברית ==========
    const hebrewProgress = JSON.parse(localStorage.getItem("mleo_hebrew_master" + "_progress") || "{}");
    const hebrewProgressData = hebrewProgress.progress || {};
    
    // ========== מולדת וגאוגרפיה ==========
    const moledetGeographyProgress = JSON.parse(localStorage.getItem("mleo_moledet_geography_master" + "_progress") || "{}");
    const moledetGeographyProgressData = moledetGeographyProgress.progress || {};
    
    // חישוב תקופה
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      // וידוא ש-endDate לא אחרי היום
      if (endDate > now) {
        endDate = now;
      }
    } else {
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      endDate = now;
    }
    
    // איסוף נתוני זמן לפי תקופה מותאמת (חשבון)
    const mathTimeData = getTimeByCustomPeriod(startDate, endDate);
    
    // איסוף נתוני זמן לפי תקופה מותאמת (גאומטריה)
    const geometryTimeData = getGeometryTimeByCustomPeriod(startDate, endDate);
    const englishTimeData = getEnglishTimeByCustomPeriod(startDate, endDate);
    const scienceTimeData = getScienceTimeByCustomPeriod(startDate, endDate);
    const hebrewTimeData = getHebrewTimeByCustomPeriod(startDate, endDate);
    const moledetGeographyTimeData = getMoledetGeographyTimeByCustomPeriod(startDate, endDate);
    
    // איסוף שגיאות (חשבון)
    const mathMistakes = JSON.parse(localStorage.getItem("mleo_mistakes") || "[]");
    
    // איסוף שגיאות (גאומטריה) - אם יש
    const geometryMistakes = JSON.parse(localStorage.getItem("mleo_geometry_mistakes") || "[]");
    
    // איסוף שגיאות (אנגלית)
    const englishMistakes = JSON.parse(localStorage.getItem("mleo_english_mistakes") || "[]");
    const scienceMistakes = JSON.parse(localStorage.getItem("mleo_science_mistakes") || "[]");
    const hebrewMistakes = JSON.parse(localStorage.getItem("mleo_hebrew_mistakes") || "[]");
    const moledetGeographyMistakes = JSON.parse(localStorage.getItem("mleo_moledet_geography_mistakes") || "[]");
    
    // איסוף אתגרים (חשבון)
    const dailyChallenge = JSON.parse(localStorage.getItem("mleo_daily_challenge") || "{}");
    const weeklyChallenge = JSON.parse(localStorage.getItem("mleo_weekly_challenge") || "{}");
    
    // ========== סיכום חשבון ==========
    // נשתמש בנתוני זמן כדי לסנן רק פעולות שיש להן זמן בתקופה
    const mathOperationsSummary = {};
    let mathTotalQuestions = 0;
    let mathTotalCorrect = 0;
    
    // נסנן רק פעולות שיש להן זמן בתקופה
    const mathOperationsWithTime = Object.keys(mathTimeData.operations || {});
    
    // אם אין נתוני זמן, נשתמש בכל הנתונים (למקרה של דוח כללי)
    const operationsToProcess = mathOperationsWithTime.length > 0 
      ? mathOperationsWithTime 
      : Object.keys(mathProgressData);
    
    operationsToProcess.forEach((op) => {
      const progressData = mathProgressData[op] || { total: 0, correct: 0 };
      const questions = progressData.total || 0;
      const correct = progressData.correct || 0;
      const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
      const timeMinutes = mathTimeData.operations?.[op]?.minutes || 0;
      
      // מציאת הכיתה והרמה הנפוצים ביותר מהנתונים שנשמרו
      let mostCommonGrade = "לא זמין";
      let mostCommonLevel = "לא זמין";
      
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_time_tracking") || "{}");
        const opData = saved.operations?.[op];
        
        if (opData?.sessions && opData.sessions.length > 0) {
          // סיכום לפי כיתה
          const gradeCounts = {};
          const levelCounts = {};
          
          opData.sessions.forEach(session => {
            if (session.grade) {
              gradeCounts[session.grade] = (gradeCounts[session.grade] || 0) + 1;
            }
            if (session.level) {
              levelCounts[session.level] = (levelCounts[session.level] || 0) + 1;
            }
          });
          
          // מציאת הכיתה הנפוצה ביותר
          if (Object.keys(gradeCounts).length > 0) {
            const gradeEntries = Object.entries(gradeCounts);
            gradeEntries.sort((a, b) => b[1] - a[1]);
            const gradeKey = gradeEntries[0][0];
            const gradeNames = { g1: "א'", g2: "ב'", g3: "ג'", g4: "ד'", g5: "ה'", g6: "ו'" };
            mostCommonGrade = gradeNames[gradeKey] || gradeKey;
          }
          
          // מציאת הרמה הנפוצה ביותר
          if (Object.keys(levelCounts).length > 0) {
            const levelEntries = Object.entries(levelCounts);
            levelEntries.sort((a, b) => b[1] - a[1]);
            const levelKey = levelEntries[0][0];
            const levelNames = { easy: "קל", medium: "בינוני", hard: "קשה" };
            mostCommonLevel = levelNames[levelKey] || levelKey;
          }
        }
      } catch (e) {
        // אם יש שגיאה, נשאיר את הערכים ברירת המחדל
      }
      
      // אם יש זמן בתקופה, נכלול את הנתונים
      if (timeMinutes > 0 || questions > 0) {
        mathTotalQuestions += questions;
        mathTotalCorrect += correct;
        
        mathOperationsSummary[op] = {
          subject: "math",
          questions,
          correct,
          wrong: questions - correct,
          accuracy,
          timeMinutes,
          timeHours: (timeMinutes / 60).toFixed(2),
          needsPractice: accuracy < 70,
          excellent: accuracy >= 90,
          improvement: calculateImprovement(op, mathProgressData, period),
          grade: mostCommonGrade,
          level: mostCommonLevel
        };
      }
    });
    
    const mathOverallAccuracy = mathTotalQuestions > 0 
      ? Math.round((mathTotalCorrect / mathTotalQuestions) * 100) 
      : 0;
    
    // ========== סיכום גאומטריה ==========
    // נשתמש בנתוני זמן כדי לסנן רק נושאים שיש להם זמן בתקופה
    const geometryTopicsSummary = {};
    let geometryTotalQuestions = 0;
    let geometryTotalCorrect = 0;
    
    // נסנן רק נושאים שיש להם זמן בתקופה
    const geometryTopicsWithTime = Object.keys(geometryTimeData.topics || {});
    
    // אם אין נתוני זמן, נשתמש בכל הנתונים (למקרה של דוח כללי)
    const topicsToProcess = geometryTopicsWithTime.length > 0 
      ? geometryTopicsWithTime 
      : Object.keys(geometryProgressData);
    
    topicsToProcess.forEach((topic) => {
      const progressData = geometryProgressData[topic] || { total: 0, correct: 0 };
      const questions = progressData.total || 0;
      const correct = progressData.correct || 0;
      const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
      const timeMinutes = geometryTimeData.topics?.[topic]?.minutes || 0;
      
      // מציאת הכיתה והרמה הנפוצים ביותר מהנתונים שנשמרו
      let mostCommonGrade = "לא זמין";
      let mostCommonLevel = "לא זמין";
      
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_geometry_time_tracking") || "{}");
        const topicData = saved.topics?.[topic];
        
        if (topicData?.sessions && topicData.sessions.length > 0) {
          // סיכום לפי כיתה
          const gradeCounts = {};
          const levelCounts = {};
          
          topicData.sessions.forEach(session => {
            if (session.grade) {
              gradeCounts[session.grade] = (gradeCounts[session.grade] || 0) + 1;
            }
            if (session.level) {
              levelCounts[session.level] = (levelCounts[session.level] || 0) + 1;
            }
          });
          
          // מציאת הכיתה הנפוצה ביותר
          if (Object.keys(gradeCounts).length > 0) {
            const gradeEntries = Object.entries(gradeCounts);
            gradeEntries.sort((a, b) => b[1] - a[1]);
            const gradeKey = gradeEntries[0][0];
            const gradeNames = { g1: "א'", g2: "ב'", g3: "ג'", g4: "ד'", g5: "ה'", g6: "ו'" };
            mostCommonGrade = gradeNames[gradeKey] || gradeKey;
          }
          
          // מציאת הרמה הנפוצה ביותר
          if (Object.keys(levelCounts).length > 0) {
            const levelEntries = Object.entries(levelCounts);
            levelEntries.sort((a, b) => b[1] - a[1]);
            const levelKey = levelEntries[0][0];
            const levelNames = { easy: "קל", medium: "בינוני", hard: "קשה" };
            mostCommonLevel = levelNames[levelKey] || levelKey;
          }
        }
      } catch (e) {
        // אם יש שגיאה, נשאיר את הערכים ברירת המחדל
      }
      
      // אם יש זמן בתקופה, נכלול את הנתונים
      if (timeMinutes > 0 || questions > 0) {
        geometryTotalQuestions += questions;
        geometryTotalCorrect += correct;
        
        geometryTopicsSummary[topic] = {
          subject: "geometry",
          questions,
          correct,
          wrong: questions - correct,
          accuracy,
          timeMinutes,
          timeHours: (timeMinutes / 60).toFixed(2),
          needsPractice: accuracy < 70,
          excellent: accuracy >= 90,
          grade: mostCommonGrade,
          level: mostCommonLevel
        };
      }
    });
    
    const geometryOverallAccuracy = geometryTotalQuestions > 0 
      ? Math.round((geometryTotalCorrect / geometryTotalQuestions) * 100) 
      : 0;
    
    // ========== סיכום אנגלית ==========
    const englishTopicsSummary = {};
    let englishTotalQuestions = 0;
    let englishTotalCorrect = 0;
    
    const englishTopicsWithTime = Object.keys(englishTimeData.topics || {});
    const englishTopicsToProcess = englishTopicsWithTime.length > 0
      ? englishTopicsWithTime
      : Object.keys(englishProgressData);
    
    englishTopicsToProcess.forEach((topic) => {
      const progressData = englishProgressData[topic] || { total: 0, correct: 0 };
      const questions = progressData.total || 0;
      const correct = progressData.correct || 0;
      const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
      const timeMinutes = englishTimeData.topics?.[topic]?.minutes || 0;
      
      let mostCommonGrade = "לא זמין";
      let mostCommonLevel = "לא זמין";
      
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_english_time_tracking") || "{}");
        const topicData = saved.topics?.[topic];
        
        if (topicData?.sessions && topicData.sessions.length > 0) {
          const gradeCounts = {};
          const levelCounts = {};
          
          topicData.sessions.forEach(session => {
            if (session.grade) {
              gradeCounts[session.grade] = (gradeCounts[session.grade] || 0) + 1;
            }
            if (session.level) {
              levelCounts[session.level] = (levelCounts[session.level] || 0) + 1;
            }
          });
          
          if (Object.keys(gradeCounts).length > 0) {
            const gradeEntries = Object.entries(gradeCounts);
            gradeEntries.sort((a, b) => b[1] - a[1]);
            const gradeKey = gradeEntries[0][0];
            const gradeNames = { g1: "א'", g2: "ב'", g3: "ג'", g4: "ד'", g5: "ה'", g6: "ו'" };
            mostCommonGrade = gradeNames[gradeKey] || gradeKey;
          }
          
          if (Object.keys(levelCounts).length > 0) {
            const levelEntries = Object.entries(levelCounts);
            levelEntries.sort((a, b) => b[1] - a[1]);
            const levelKey = levelEntries[0][0];
            const levelNames = { easy: "קל", medium: "בינוני", hard: "קשה" };
            mostCommonLevel = levelNames[levelKey] || levelKey;
          }
        }
      } catch {}
      
      if (timeMinutes > 0 || questions > 0) {
        englishTotalQuestions += questions;
        englishTotalCorrect += correct;
        
        englishTopicsSummary[topic] = {
          subject: "english",
          questions,
          correct,
          wrong: questions - correct,
          accuracy,
          timeMinutes,
          timeHours: (timeMinutes / 60).toFixed(2),
          needsPractice: accuracy < 70 && questions > 0,
          excellent: accuracy >= 90 && questions >= 10,
          grade: mostCommonGrade,
          level: mostCommonLevel,
          displayName: getEnglishTopicName(topic)
        };
      }
    });
    
    const englishOverallAccuracy = englishTotalQuestions > 0
      ? Math.round((englishTotalCorrect / englishTotalQuestions) * 100)
      : 0;
    
    // ========== סיכום מדעים ==========
    const scienceTopicsSummary = {};
    let scienceTotalQuestions = 0;
    let scienceTotalCorrect = 0;
    
    const scienceTopicsWithTime = Object.keys(scienceTimeData.topics || {});
    const scienceTopicsToProcess = scienceTopicsWithTime.length > 0
      ? scienceTopicsWithTime
      : Object.keys(scienceProgressData);
    
    scienceTopicsToProcess.forEach((topic) => {
      const progressData = scienceProgressData[topic] || { total: 0, correct: 0 };
      const questions = progressData.total || 0;
      const correct = progressData.correct || 0;
      const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
      const timeMinutes = scienceTimeData.topics?.[topic]?.minutes || 0;
      
      let mostCommonGrade = "לא זמין";
      let mostCommonLevel = "לא זמין";
      
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_science_time_tracking") || "{}");
        const topicData = saved.topics?.[topic];
        if (topicData?.sessions && topicData.sessions.length > 0) {
          const gradeCounts = {};
          const levelCounts = {};
          
          topicData.sessions.forEach((session) => {
            if (session.grade) {
              gradeCounts[session.grade] = (gradeCounts[session.grade] || 0) + 1;
            }
            if (session.level) {
              levelCounts[session.level] = (levelCounts[session.level] || 0) + 1;
            }
          });
          
          if (Object.keys(gradeCounts).length > 0) {
            const gradeEntries = Object.entries(gradeCounts);
            gradeEntries.sort((a, b) => b[1] - a[1]);
            const gradeKey = gradeEntries[0][0];
            const gradeNames = { g1: "א'", g2: "ב'", g3: "ג'", g4: "ד'", g5: "ה'", g6: "ו'" };
            mostCommonGrade = gradeNames[gradeKey] || gradeKey;
          }
          
          if (Object.keys(levelCounts).length > 0) {
            const levelEntries = Object.entries(levelCounts);
            levelEntries.sort((a, b) => b[1] - a[1]);
            const levelKey = levelEntries[0][0];
            const levelNames = { easy: "קל", medium: "בינוני", hard: "קשה" };
            mostCommonLevel = levelNames[levelKey] || levelKey;
          }
        }
      } catch {}
      
      if (timeMinutes > 0 || questions > 0) {
        scienceTotalQuestions += questions;
        scienceTotalCorrect += correct;
        
        scienceTopicsSummary[topic] = {
          subject: "science",
          questions,
          correct,
          wrong: questions - correct,
          accuracy,
          timeMinutes,
          timeHours: (timeMinutes / 60).toFixed(2),
          needsPractice: accuracy < 70 && questions > 0,
          excellent: accuracy >= 90 && questions >= 10,
          grade: mostCommonGrade,
          level: mostCommonLevel,
          displayName: getScienceTopicName(topic)
        };
      }
    });
    
    const scienceOverallAccuracy = scienceTotalQuestions > 0
      ? Math.round((scienceTotalCorrect / scienceTotalQuestions) * 100)
      : 0;
    
    // ========== סיכום עברית ==========
    const hebrewTopicsSummary = {};
    let hebrewTotalQuestions = 0;
    let hebrewTotalCorrect = 0;
    
    const hebrewTopicsWithTime = Object.keys(hebrewTimeData.topics || {});
    const hebrewTopicsToProcess = hebrewTopicsWithTime.length > 0
      ? hebrewTopicsWithTime
      : Object.keys(hebrewProgressData);
    
    hebrewTopicsToProcess.forEach((topic) => {
      const progressData = hebrewProgressData[topic] || { total: 0, correct: 0 };
      const questions = progressData.total || 0;
      const correct = progressData.correct || 0;
      const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
      const timeMinutes = hebrewTimeData.topics?.[topic]?.minutes || 0;
      
      let mostCommonGrade = "לא זמין";
      let mostCommonLevel = "לא זמין";
      
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_hebrew_time_tracking") || "{}");
        const topicData = saved.topics?.[topic];
        
        if (topicData?.sessions && topicData.sessions.length > 0) {
          const gradeCounts = {};
          const levelCounts = {};
          
          topicData.sessions.forEach(session => {
            if (session.grade) {
              gradeCounts[session.grade] = (gradeCounts[session.grade] || 0) + 1;
            }
            if (session.level) {
              levelCounts[session.level] = (levelCounts[session.level] || 0) + 1;
            }
          });
          
          if (Object.keys(gradeCounts).length > 0) {
            const gradeEntries = Object.entries(gradeCounts);
            gradeEntries.sort((a, b) => b[1] - a[1]);
            const gradeKey = gradeEntries[0][0];
            const gradeNames = { g1: "א'", g2: "ב'", g3: "ג'", g4: "ד'", g5: "ה'", g6: "ו'" };
            mostCommonGrade = gradeNames[gradeKey] || gradeKey;
          }
          
          if (Object.keys(levelCounts).length > 0) {
            const levelEntries = Object.entries(levelCounts);
            levelEntries.sort((a, b) => b[1] - a[1]);
            const levelKey = levelEntries[0][0];
            const levelNames = { easy: "קל", medium: "בינוני", hard: "קשה" };
            mostCommonLevel = levelNames[levelKey] || levelKey;
          }
        }
      } catch {}
      
      if (timeMinutes > 0 || questions > 0) {
        hebrewTotalQuestions += questions;
        hebrewTotalCorrect += correct;
        
        hebrewTopicsSummary[topic] = {
          subject: "hebrew",
          questions,
          correct,
          wrong: questions - correct,
          accuracy,
          timeMinutes,
          timeHours: (timeMinutes / 60).toFixed(2),
          needsPractice: accuracy < 70 && questions > 0,
          excellent: accuracy >= 90 && questions >= 10,
          grade: mostCommonGrade,
          level: mostCommonLevel,
          displayName: getHebrewTopicName(topic)
        };
      }
    });
    
    const hebrewOverallAccuracy = hebrewTotalQuestions > 0
      ? Math.round((hebrewTotalCorrect / hebrewTotalQuestions) * 100)
      : 0;
    
    // ========== סיכום מולדת וגאוגרפיה ==========
    const moledetGeographyTopicsSummary = {};
    let moledetGeographyTotalQuestions = 0;
    let moledetGeographyTotalCorrect = 0;
    
    const moledetGeographyTopicsWithTime = Object.keys(moledetGeographyTimeData.topics || {});
    const moledetGeographyTopicsToProcess = moledetGeographyTopicsWithTime.length > 0
      ? moledetGeographyTopicsWithTime
      : Object.keys(moledetGeographyProgressData);
    
    moledetGeographyTopicsToProcess.forEach((topic) => {
      const progressData = moledetGeographyProgressData[topic] || { total: 0, correct: 0 };
      const questions = progressData.total || 0;
      const correct = progressData.correct || 0;
      const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
      const timeMinutes = moledetGeographyTimeData.topics?.[topic]?.minutes || 0;
      
      let mostCommonGrade = "לא זמין";
      let mostCommonLevel = "לא זמין";
      
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_moledet_geography_time_tracking") || "{}");
        const topicData = saved.topics?.[topic];
        
        if (topicData?.sessions && topicData.sessions.length > 0) {
          const gradeCounts = {};
          const levelCounts = {};
          
          topicData.sessions.forEach(session => {
            if (session.grade) {
              gradeCounts[session.grade] = (gradeCounts[session.grade] || 0) + 1;
            }
            if (session.level) {
              levelCounts[session.level] = (levelCounts[session.level] || 0) + 1;
            }
          });
          
          if (Object.keys(gradeCounts).length > 0) {
            const gradeEntries = Object.entries(gradeCounts);
            gradeEntries.sort((a, b) => b[1] - a[1]);
            const gradeKey = gradeEntries[0][0];
            const gradeNames = { g1: "א'", g2: "ב'", g3: "ג'", g4: "ד'", g5: "ה'", g6: "ו'" };
            mostCommonGrade = gradeNames[gradeKey] || gradeKey;
          }
          
          if (Object.keys(levelCounts).length > 0) {
            const levelEntries = Object.entries(levelCounts);
            levelEntries.sort((a, b) => b[1] - a[1]);
            const levelKey = levelEntries[0][0];
            const levelNames = { easy: "קל", medium: "בינוני", hard: "קשה" };
            mostCommonLevel = levelNames[levelKey] || levelKey;
          }
        }
      } catch {}
      
      if (timeMinutes > 0 || questions > 0) {
        moledetGeographyTotalQuestions += questions;
        moledetGeographyTotalCorrect += correct;
        
        moledetGeographyTopicsSummary[topic] = {
          subject: "moledet-geography",
          questions,
          correct,
          wrong: questions - correct,
          accuracy,
          timeMinutes,
          timeHours: (timeMinutes / 60).toFixed(2),
          needsPractice: accuracy < 70 && questions > 0,
          excellent: accuracy >= 90 && questions >= 10,
          grade: mostCommonGrade,
          level: mostCommonLevel,
          displayName: getMoledetGeographyTopicName(topic)
        };
      }
    });
    
    const moledetGeographyOverallAccuracy = moledetGeographyTotalQuestions > 0
      ? Math.round((moledetGeographyTotalCorrect / moledetGeographyTotalQuestions) * 100)
      : 0;
    
    // ========== סיכום כללי ==========
    const totalQuestions = mathTotalQuestions + geometryTotalQuestions + englishTotalQuestions + scienceTotalQuestions + hebrewTotalQuestions + moledetGeographyTotalQuestions;
    const totalCorrect = mathTotalCorrect + geometryTotalCorrect + englishTotalCorrect + scienceTotalCorrect + hebrewTotalCorrect + moledetGeographyTotalCorrect;
    const overallAccuracy = totalQuestions > 0 
      ? Math.round((totalCorrect / totalQuestions) * 100) 
      : 0;
    
    // ========== סינון שגיאות לפי תקופה ==========
    const filteredMathMistakes = mathMistakes.filter(mistake => {
      if (!mistake.timestamp) return false;
      const mistakeDate = new Date(mistake.timestamp);
      return mistakeDate >= startDate && mistakeDate <= endDate;
    });
    
    const filteredGeometryMistakes = geometryMistakes.filter(mistake => {
      if (!mistake.timestamp) return false;
      const mistakeDate = new Date(mistake.timestamp);
      return mistakeDate >= startDate && mistakeDate <= endDate;
    });
    
    const filteredEnglishMistakes = englishMistakes.filter(mistake => {
      if (!mistake.timestamp) return false;
      const mistakeDate = new Date(mistake.timestamp);
      return mistakeDate >= startDate && mistakeDate <= endDate;
    });
    
    const filteredScienceMistakes = scienceMistakes.filter(mistake => {
      if (!mistake.timestamp) return false;
      const mistakeDate = new Date(mistake.timestamp);
      return mistakeDate >= startDate && mistakeDate <= endDate;
    });
    
    const filteredHebrewMistakes = hebrewMistakes.filter(mistake => {
      if (!mistake.timestamp) return false;
      const mistakeDate = new Date(mistake.timestamp);
      return mistakeDate >= startDate && mistakeDate <= endDate;
    });
    
    const filteredMoledetGeographyMistakes = moledetGeographyMistakes.filter(mistake => {
      if (!mistake.timestamp) return false;
      const mistakeDate = new Date(mistake.timestamp);
      return mistakeDate >= startDate && mistakeDate <= endDate;
    });
    
    // ניתוח שגיאות (חשבון)
    const mathMistakesByOperation = {};
    filteredMathMistakes.forEach(mistake => {
      const op = mistake.operation;
      if (!mathMistakesByOperation[op]) {
        mathMistakesByOperation[op] = {
          count: 0,
          lastSeen: null,
          commonErrors: {}
        };
      }
      mathMistakesByOperation[op].count++;
      if (!mathMistakesByOperation[op].lastSeen || 
          new Date(mistake.timestamp) > new Date(mathMistakesByOperation[op].lastSeen)) {
        mathMistakesByOperation[op].lastSeen = mistake.timestamp;
      }
    });
    
    // ניתוח שגיאות (גאומטריה)
    const geometryMistakesByTopic = {};
    filteredGeometryMistakes.forEach(mistake => {
      const topic = mistake.topic;
      if (!geometryMistakesByTopic[topic]) {
        geometryMistakesByTopic[topic] = {
          count: 0,
          lastSeen: null,
          commonErrors: {}
        };
      }
      geometryMistakesByTopic[topic].count++;
      if (!geometryMistakesByTopic[topic].lastSeen || 
          new Date(mistake.timestamp) > new Date(geometryMistakesByTopic[topic].lastSeen)) {
        geometryMistakesByTopic[topic].lastSeen = mistake.timestamp;
      }
    });
    
    // ניתוח שגיאות (אנגלית)
    const englishMistakesByTopic = {};
    filteredEnglishMistakes.forEach(mistake => {
      const topic = mistake.topic;
      if (!englishMistakesByTopic[topic]) {
        englishMistakesByTopic[topic] = {
          count: 0,
          lastSeen: null,
          commonErrors: {}
        };
      }
      englishMistakesByTopic[topic].count++;
      if (
        !englishMistakesByTopic[topic].lastSeen ||
        new Date(mistake.timestamp) > new Date(englishMistakesByTopic[topic].lastSeen)
      ) {
        englishMistakesByTopic[topic].lastSeen = mistake.timestamp;
      }
    });
    
    const scienceMistakesByTopic = {};
    filteredScienceMistakes.forEach(mistake => {
      const topic = mistake.topic;
      if (!scienceMistakesByTopic[topic]) {
        scienceMistakesByTopic[topic] = {
          count: 0,
          lastSeen: null,
          commonErrors: {}
        };
      }
      scienceMistakesByTopic[topic].count++;
      if (
        !scienceMistakesByTopic[topic].lastSeen ||
        new Date(mistake.timestamp) > new Date(scienceMistakesByTopic[topic].lastSeen)
      ) {
        scienceMistakesByTopic[topic].lastSeen = mistake.timestamp;
      }
    });
    
    // ניתוח שגיאות (עברית)
    const hebrewMistakesByTopic = {};
    filteredHebrewMistakes.forEach(mistake => {
      const topic = mistake.topic;
      if (!hebrewMistakesByTopic[topic]) {
        hebrewMistakesByTopic[topic] = {
          count: 0,
          lastSeen: null,
          commonErrors: {}
        };
      }
      hebrewMistakesByTopic[topic].count++;
      if (
        !hebrewMistakesByTopic[topic].lastSeen ||
        new Date(mistake.timestamp) > new Date(hebrewMistakesByTopic[topic].lastSeen)
      ) {
        hebrewMistakesByTopic[topic].lastSeen = mistake.timestamp;
      }
    });
    
    // ניתוח שגיאות (מולדת וגאוגרפיה)
    const moledetGeographyMistakesByTopic = {};
    filteredMoledetGeographyMistakes.forEach(mistake => {
      const topic = mistake.topic;
      if (!moledetGeographyMistakesByTopic[topic]) {
        moledetGeographyMistakesByTopic[topic] = {
          count: 0,
          lastSeen: null,
          commonErrors: {}
        };
      }
      moledetGeographyMistakesByTopic[topic].count++;
      if (
        !moledetGeographyMistakesByTopic[topic].lastSeen ||
        new Date(mistake.timestamp) > new Date(moledetGeographyMistakesByTopic[topic].lastSeen)
      ) {
        moledetGeographyMistakesByTopic[topic].lastSeen = mistake.timestamp;
      }
    });
    
    // ========== המלצות ==========
    const mathRecommendations = generateRecommendations(mathOperationsSummary, mathMistakesByOperation);
    const geometryRecommendations = generateRecommendations(geometryTopicsSummary, geometryMistakesByTopic);
    const englishRecommendations = generateRecommendations(englishTopicsSummary, englishMistakesByTopic);
    const scienceRecommendations = generateRecommendations(scienceTopicsSummary, scienceMistakesByTopic);
    const hebrewRecommendations = generateRecommendations(hebrewTopicsSummary, hebrewMistakesByTopic);
    const moledetGeographyRecommendations = generateRecommendations(moledetGeographyTopicsSummary, moledetGeographyMistakesByTopic);
    const recommendations = [
      ...mathRecommendations,
      ...geometryRecommendations,
      ...englishRecommendations,
      ...scienceRecommendations,
      ...hebrewRecommendations,
      ...moledetGeographyRecommendations,
    ];
    
    // ========== הישגים ==========
    const mathAchievements = mathProgress.badges || [];
    const geometryAchievements = geometryProgress.badges || [];
    const englishAchievements = englishProgress.badges || [];
    const scienceAchievements = scienceProgress.badges || [];
    const hebrewAchievements = hebrewProgress.badges || [];
    const moledetGeographyAchievements = moledetGeographyProgress.badges || [];
    const achievements = [
      ...mathAchievements,
      ...geometryAchievements,
      ...englishAchievements,
      ...scienceAchievements,
      ...hebrewAchievements,
      ...moledetGeographyAchievements,
    ];
    const stars =
      (mathProgress.stars || 0) +
      (geometryProgress.stars || 0) +
      (englishProgress.stars || 0) +
      (scienceProgress.stars || 0) +
      (hebrewProgress.stars || 0) +
      (moledetGeographyProgress.stars || 0);
    const playerLevel = Math.max(
      mathProgress.playerLevel || 1,
      geometryProgress.playerLevel || 1,
      englishProgress.playerLevel || 1,
      scienceProgress.playerLevel || 1,
      hebrewProgress.playerLevel || 1,
      moledetGeographyProgress.playerLevel || 1
    );
    const xp =
      (mathProgress.xp || 0) +
      (geometryProgress.xp || 0) +
      (englishProgress.xp || 0) +
      (scienceProgress.xp || 0) +
      (hebrewProgress.xp || 0) +
      (moledetGeographyProgress.xp || 0);
    
    // פעילות יומית - רק בתקופה שנבחרה
    const dailyActivity = [];
    const mathDailyData = mathTimeData.daily || {};
    const geometryDailyData = geometryTimeData.daily || {};
    const englishDailyData = englishTimeData.daily || {};
    const scienceDailyData = scienceTimeData.daily || {};
    const hebrewDailyData = hebrewTimeData.daily || {};
    const moledetGeographyDailyData = moledetGeographyTimeData.daily || {};
    
    // איחוד נתונים יומיים
    const allDailyDates = new Set([
      ...Object.keys(mathDailyData),
      ...Object.keys(geometryDailyData),
      ...Object.keys(englishDailyData),
      ...Object.keys(scienceDailyData),
      ...Object.keys(hebrewDailyData),
      ...Object.keys(moledetGeographyDailyData)
    ]);
    
    allDailyDates.forEach(dateStr => {
      const dayDate = new Date(dateStr);
      if (dayDate >= startDate && dayDate <= endDate) {
        const mathDay = mathDailyData[dateStr] || { total: 0, operations: {} };
        const geometryDay = geometryDailyData[dateStr] || { total: 0, topics: {} };
        const englishDay = englishDailyData[dateStr] || { total: 0, topics: {} };
        const scienceDay = scienceDailyData[dateStr] || { total: 0, topics: {} };
        const hebrewDay = hebrewDailyData[dateStr] || { total: 0, topics: {} };
        const moledetGeographyDay = moledetGeographyDailyData[dateStr] || { total: 0, topics: {} };
        
        const totalTime =
          (mathDay.total || 0) +
          (geometryDay.total || 0) +
          (englishDay.total || 0) +
          (scienceDay.total || 0) +
          (hebrewDay.total || 0) +
          (moledetGeographyDay.total || 0);
        const mathQuestions = Object.values(mathDay.operations || {}).reduce((sum, time) => {
          return sum + Math.round(time / 30); // הערכה: שאלה אחת כל 30 שניות
        }, 0);
        const geometryQuestions = Object.values(geometryDay.topics || {}).reduce((sum, time) => {
          return sum + Math.round(time / 30);
        }, 0);
        const englishQuestions = Object.values(englishDay.topics || {}).reduce((sum, time) => {
          return sum + Math.round(time / 30);
        }, 0);
        const scienceQuestions = Object.values(scienceDay.topics || {}).reduce((sum, time) => {
          return sum + Math.round(time / 30);
        }, 0);
        const hebrewQuestions = Object.values(hebrewDay.topics || {}).reduce((sum, time) => {
          return sum + Math.round(time / 30);
        }, 0);
        const moledetGeographyQuestions = Object.values(moledetGeographyDay.topics || {}).reduce((sum, time) => {
          return sum + Math.round(time / 30);
        }, 0);
        
        dailyActivity.push({
          date: dateStr,
          timeMinutes: Math.round(totalTime / 60),
          questions: mathQuestions + geometryQuestions + englishQuestions + scienceQuestions + hebrewQuestions + moledetGeographyQuestions,
          mathTopics: Object.keys(mathDay.operations || {}).length,
          geometryTopics: Object.keys(geometryDay.topics || {}).length,
          englishTopics: Object.keys(englishDay.topics || {}).length,
          scienceTopics: Object.keys(scienceDay.topics || {}).length,
          hebrewTopics: Object.keys(hebrewDay.topics || {}).length,
          moledetGeographyTopics: Object.keys(moledetGeographyDay.topics || {}).length,
        });
      }
    });
    
    // מיון לפי תאריך
    dailyActivity.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // נושאים שצריך תרגול
    const needsPractice = [
      ...Object.entries(mathOperationsSummary)
        .filter(([_, data]) => data.needsPractice)
        .map(([op, _]) => `חשבון: ${getOperationName(op)}`),
      ...Object.entries(geometryTopicsSummary)
        .filter(([_, data]) => data.needsPractice)
        .map(([topic, _]) => `גאומטריה: ${getTopicName(topic)}`),
      ...Object.entries(englishTopicsSummary)
        .filter(([_, data]) => data.needsPractice)
        .map(([topic, _]) => `אנגלית: ${getEnglishTopicName(topic)}`),
      ...Object.entries(scienceTopicsSummary)
        .filter(([_, data]) => data.needsPractice)
        .map(([topic, _]) => `מדעים: ${getScienceTopicName(topic)}`),
      ...Object.entries(hebrewTopicsSummary)
        .filter(([_, data]) => data.needsPractice)
        .map(([topic, _]) => `עברית: ${getHebrewTopicName(topic)}`),
      ...Object.entries(moledetGeographyTopicsSummary)
        .filter(([_, data]) => data.needsPractice)
        .map(([topic, _]) => `מולדת וגאוגרפיה: ${getMoledetGeographyTopicName(topic)}`)
    ];
    
    // נושאים מצוינים
    const excellent = [
      ...Object.entries(mathOperationsSummary)
        .filter(([_, data]) => data.excellent && data.questions >= 10)
        .map(([op, _]) => `חשבון: ${getOperationName(op)}`),
      ...Object.entries(geometryTopicsSummary)
        .filter(([_, data]) => data.excellent && data.questions >= 10)
        .map(([topic, _]) => `גאומטריה: ${getTopicName(topic)}`),
      ...Object.entries(englishTopicsSummary)
        .filter(([_, data]) => data.excellent && data.questions >= 10)
        .map(([topic, _]) => `אנגלית: ${getEnglishTopicName(topic)}`),
      ...Object.entries(scienceTopicsSummary)
        .filter(([_, data]) => data.excellent && data.questions >= 10)
        .map(([topic, _]) => `מדעים: ${getScienceTopicName(topic)}`),
      ...Object.entries(hebrewTopicsSummary)
        .filter(([_, data]) => data.excellent && data.questions >= 10)
        .map(([topic, _]) => `עברית: ${getHebrewTopicName(topic)}`),
      ...Object.entries(moledetGeographyTopicsSummary)
        .filter(([_, data]) => data.excellent && data.questions >= 10)
        .map(([topic, _]) => `מולדת וגאוגרפיה: ${getMoledetGeographyTopicName(topic)}`)
    ];
    
    return {
      playerName,
      period: period === 'custom' ? 'custom' : period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      generatedAt: now.toISOString(),
      
      // סיכום כללי
      summary: {
        totalTimeMinutes:
          (mathTimeData.totalMinutes || 0) +
          (geometryTimeData.totalMinutes || 0) +
          (englishTimeData.totalMinutes || 0) +
          (scienceTimeData.totalMinutes || 0) +
          (hebrewTimeData.totalMinutes || 0) +
          (moledetGeographyTimeData.totalMinutes || 0),
        totalTimeHours: (
          ((mathTimeData.totalMinutes || 0) +
            (geometryTimeData.totalMinutes || 0) +
            (englishTimeData.totalMinutes || 0) +
            (scienceTimeData.totalMinutes || 0) +
            (hebrewTimeData.totalMinutes || 0) +
            (moledetGeographyTimeData.totalMinutes || 0)) /
          60
        ).toFixed(2),
        totalQuestions,
        totalCorrect,
        overallAccuracy,
        mathQuestions: mathTotalQuestions,
        mathCorrect: mathTotalCorrect,
        mathAccuracy: mathOverallAccuracy,
        geometryQuestions: geometryTotalQuestions,
        geometryCorrect: geometryTotalCorrect,
        geometryAccuracy: geometryOverallAccuracy,
        englishQuestions: englishTotalQuestions,
        englishCorrect: englishTotalCorrect,
        englishAccuracy: englishOverallAccuracy,
        scienceQuestions: scienceTotalQuestions,
        scienceCorrect: scienceTotalCorrect,
        scienceAccuracy: scienceOverallAccuracy,
        hebrewQuestions: hebrewTotalQuestions,
        hebrewCorrect: hebrewTotalCorrect,
        hebrewAccuracy: hebrewOverallAccuracy,
        moledetGeographyQuestions: moledetGeographyTotalQuestions,
        moledetGeographyCorrect: moledetGeographyTotalCorrect,
        moledetGeographyAccuracy: moledetGeographyOverallAccuracy,
        stars,
        playerLevel,
        xp,
        achievements: achievements.length
      },
      
      // לפי פעולות (חשבון)
      mathOperations: mathOperationsSummary,
      
      // לפי נושאים (גאומטריה)
      geometryTopics: geometryTopicsSummary,
      
      // לפי נושאים (אנגלית)
      englishTopics: englishTopicsSummary,
      
      // לפי נושאים (מדעים)
      scienceTopics: scienceTopicsSummary,
      
      // לפי נושאים (עברית)
      hebrewTopics: hebrewTopicsSummary,
      
      // לפי נושאים (מולדת וגאוגרפיה)
      moledetGeographyTopics: moledetGeographyTopicsSummary,
      
      // כל הפעולות והנושאים יחד (לצורך תצוגה)
      allItems: {
        ...Object.fromEntries(Object.entries(mathOperationsSummary).map(([k, v]) => [`math_${k}`, v])),
        ...Object.fromEntries(Object.entries(geometryTopicsSummary).map(([k, v]) => [`geometry_${k}`, v])),
        ...Object.fromEntries(Object.entries(englishTopicsSummary).map(([k, v]) => [`english_${k}`, v])),
        ...Object.fromEntries(Object.entries(scienceTopicsSummary).map(([k, v]) => [`science_${k}`, v])),
        ...Object.fromEntries(Object.entries(hebrewTopicsSummary).map(([k, v]) => [`hebrew_${k}`, v])),
        ...Object.fromEntries(Object.entries(moledetGeographyTopicsSummary).map(([k, v]) => [`moledet-geography_${k}`, v])),
      },
      
      // פעילות יומית
      dailyActivity: dailyActivity.sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      ),
      
      // ניתוח
      analysis: {
        needsPractice,
        excellent,
        mathMistakesByOperation,
        geometryMistakesByTopic,
        englishMistakesByTopic,
        scienceMistakesByTopic,
        hebrewMistakesByTopic,
        moledetGeographyMistakesByTopic,
        recommendations
      },
      
      // אתגרים
      challenges: {
        daily: {
          questions: dailyChallenge.questions || 0,
          correct: dailyChallenge.correct || 0,
          bestScore: dailyChallenge.bestScore || 0
        },
        weekly: {
          current: weeklyChallenge.current || 0,
          target: weeklyChallenge.target || 100,
          completed: weeklyChallenge.completed || false
        }
      },
      
      // הישגים
      achievements: achievements.map(badge => ({
        name: badge,
        earned: true
      }))
    };
  } catch (error) {
    console.error("Error generating parent report:", error);
    // מחזיר דוח ריק במקום null כדי שהמשתמש יוכל לבחור תקופות אחרות
    return {
      playerName: playerName || "שחקן",
      period: period === 'custom' ? 'custom' : period,
      startDate: customStartDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: customEndDate || new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      summary: {
        totalTimeMinutes: 0,
        totalTimeHours: "0",
        totalQuestions: 0,
        totalCorrect: 0,
        overallAccuracy: 0,
        mathQuestions: 0,
        mathCorrect: 0,
        mathAccuracy: 0,
        geometryQuestions: 0,
        geometryCorrect: 0,
        geometryAccuracy: 0,
        englishQuestions: 0,
        englishCorrect: 0,
        englishAccuracy: 0,
        scienceQuestions: 0,
        scienceCorrect: 0,
        scienceAccuracy: 0,
        hebrewQuestions: 0,
        hebrewCorrect: 0,
        hebrewAccuracy: 0,
        moledetGeographyQuestions: 0,
        moledetGeographyCorrect: 0,
        moledetGeographyAccuracy: 0,
        stars: 0,
        playerLevel: 1,
        xp: 0,
        achievements: 0
      },
      mathOperations: {},
      geometryTopics: {},
      englishTopics: {},
      scienceTopics: {},
      hebrewTopics: {},
      moledetGeographyTopics: {},
      allItems: {},
      dailyActivity: [],
      analysis: {
        needsPractice: [],
        excellent: [],
        mathMistakesByOperation: {},
        geometryMistakesByTopic: {},
        englishMistakesByTopic: {},
        scienceMistakesByTopic: {},
        hebrewMistakesByTopic: {},
        moledetGeographyMistakesByTopic: {},
        recommendations: []
      },
      challenges: {
        daily: { questions: 0, correct: 0, bestScore: 0 },
        weekly: { current: 0, target: 100, completed: false }
      },
      achievements: []
    };
  }
}

// חישוב שיפור
function calculateImprovement(operation, progressData, period) {
  // זה יכול להיות מורכב יותר - להשוות בין תקופות
  // כרגע נחזיר null או נתונים בסיסיים
  return null;
}

function getDisplayNameForEntry(op, data) {
  if (data.subject === 'geometry') return getTopicName(op);
  if (data.subject === 'english') return getEnglishTopicName(op);
  if (data.subject === 'science') return getScienceTopicName(op);
  if (data.subject === 'hebrew') return getHebrewTopicName(op);
  if (data.subject === 'moledet-geography') return getMoledetGeographyTopicName(op);
  return getOperationName(op);
}

// יצירת המלצות
function generateRecommendations(operations, mistakes) {
  const recommendations = [];
  
  // המלצות לפי דיוק
  Object.entries(operations).forEach(([op, data]) => {
    if (data.needsPractice && data.questions > 0) {
      const priority = data.accuracy < 50 ? 'high' : data.accuracy < 70 ? 'medium' : 'low';
      const operationName = getDisplayNameForEntry(op, data);
      recommendations.push({
        type: 'accuracy',
        operation: op,
        operationName,
        message: `מומלץ לתרגל יותר ${operationName} - דיוק ${data.accuracy}%`,
        priority,
        currentAccuracy: data.accuracy,
        targetAccuracy: 80
      });
    }
  });
  
  // המלצות לפי שגיאות
  Object.entries(mistakes).forEach(([op, data]) => {
    if (data.count > 10) {
      const sample = operations[op];
      const operationName = sample ? getDisplayNameForEntry(op, sample) : getOperationName(op);
      recommendations.push({
        type: 'mistakes',
        operation: op,
        operationName,
        message: `${operationName} - ${data.count} שגיאות. מומלץ לחזור על הנושא`,
        priority: 'high',
        mistakeCount: data.count
      });
    }
  });
  
  // המלצות לפי זמן
  Object.entries(operations).forEach(([op, data]) => {
    if (data.timeMinutes < 5 && data.questions > 0) {
      const opName = getDisplayNameForEntry(op, data);
      recommendations.push({
        type: 'time',
        operation: op,
        operationName: opName,
        message: `${opName} - רק ${data.timeMinutes} דקות תרגול. מומלץ להגדיל זמן תרגול`,
        priority: 'medium',
        currentTime: data.timeMinutes,
        recommendedTime: 15
      });
    }
  });
  
  // מיון לפי עדיפות
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  );
  
  return recommendations;
}

// יצירת דוח PDF (HTML → PDF) כדי לשמור עברית/RTL בצורה קריאה
export function exportReportToPDF(report, options = {}) {
  if (typeof window === "undefined") return;
  
  const elementId = options.elementId || "parent-report-pdf";
  const filename = options.filename || `דוח-${report?.playerName || "שחקן"}-${report?.endDate || ""}.pdf`;

  try {
    const el = document.getElementById(elementId);
    if (!el) {
      alert("שגיאה בייצוא PDF: לא נמצא תוכן להדפסה.");
      return;
    }

    // מניעת יצוא כפול שגורם לתקיעה/זיכרון
    if (window.__mleoPdfExportInProgress) return;
    window.__mleoPdfExportInProgress = true;

    // Overlay קטן כדי שהמשתמש יבין שהפעולה בעבודה (לא משנה עיצוב הדף עצמו)
    const overlay = document.createElement("div");
    overlay.setAttribute("data-pdf-overlay", "1");
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font: 600 16px/1.4 system-ui, -apple-system, Segoe UI, Arial;
      direction: rtl; text-align: center;
      backdrop-filter: blur(2px);
    `;
    overlay.textContent = "מכין PDF… זה יכול לקחת כמה שניות";
    document.body.appendChild(overlay);

    // תן לדפדפן “לנשום” ולצייר את ה-overlay לפני העבודה הכבדה
    const deferStart = (fn) => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(fn, { timeout: 300 });
      } else {
        setTimeout(fn, 50);
      }
    };

    // Dynamic import כדי לא להעמיס על SSR / build
    deferStart(() => {
      import("html2pdf.js/dist/html2pdf.js")
        .then((mod) => {
          const candidates = [mod, mod?.default, mod?.default?.default];
          const html2pdf = candidates.find((c) => typeof c === "function");
          if (!html2pdf) {
            throw new Error("html2pdf import did not return a function");
          }

          // ברירת מחדל: איכות קריאה (טקסט חד יותר) – עדיין לא "וקטורי", אבל הרבה יותר ברור
          const dpr = window.devicePixelRatio || 1;
          const scale = Math.min(2, Math.max(1.8, dpr)); // חדות טקסט טובה יותר

          const opt = {
            margin: [10, 10, 10, 10],
            filename,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale,
              useCORS: true,
              backgroundColor: "#ffffff",
              logging: false,
              onclone: (clonedDoc) => {
                try {
                  const root = clonedDoc.getElementById(elementId);
                  if (!root) return;

                  // עיצוב "ידידותי ל-PDF" רק בתוך ה-clone (לא משנה את העיצוב באתר!)
                  root.setAttribute("dir", "rtl");

                  // הכי חשוב: html2canvas לא תומך ב-oklab/oklch. נזריק CSS עם !important כדי לאלץ צבעים פשוטים.
                  const style = clonedDoc.createElement("style");
                  style.textContent = `
                    /* תבנית PDF לקריאות */
                    #${elementId} {
                      background: #fff !important;
                      color: #111 !important;
                      font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif !important;
                      font-size: 14px !important;
                      line-height: 1.55 !important;
                      -webkit-font-smoothing: antialiased !important;
                      text-rendering: geometricPrecision !important;
                      padding: 14px !important;
                      max-width: 780px !important;
                      margin: 0 auto !important;
                      direction: rtl !important;
                      text-align: right !important;
                      unicode-bidi: plaintext !important;
                    }
                    #${elementId} h1 { font-size: 22px !important; margin-bottom: 6px !important; }
                    #${elementId} h2 { font-size: 16px !important; margin: 10px 0 8px !important; }
                    #${elementId} p { margin: 4px 0 !important; }

                    #${elementId}, #${elementId} * {
                      color: #000 !important;
                      border-color: #d1d5db !important;
                      background-image: none !important;
                      background: transparent !important;
                      background-color: transparent !important;
                      box-shadow: none !important;
                      text-shadow: none !important;
                      filter: none !important;
                      backdrop-filter: none !important;
                      direction: rtl !important;
                      text-align: right !important;
                      unicode-bidi: plaintext !important;
                    }
                    #${elementId} {
                      background-color: #fff !important;
                    }

                    /* כרטיסים/בלוקים – להפוך למסודר ונקי */
                    #${elementId} .rounded-lg {
                      background-color: #fff !important;
                      border: 1px solid #e5e7eb !important;
                    }

                    /* טבלאות – ריווחים וגבולות לקריאות */
                    #${elementId} table { width: 100% !important; border-collapse: collapse !important; }
                    #${elementId} th, #${elementId} td {
                      padding: 6px 8px !important;
                      border: 1px solid #e5e7eb !important;
                      vertical-align: top !important;
                      font-size: 12.5px !important;
                      text-align: right !important;
                      direction: rtl !important;
                    }
                    #${elementId} thead th { background: #f3f4f6 !important; font-weight: 700 !important; }

                    /* אלמנטים שמסומנים LTR (כמו שורת תאריכים) – נשאיר LTR */
                    #${elementId} [dir="ltr"], #${elementId} [style*="direction: ltr"] {
                      direction: ltr !important;
                      unicode-bidi: isolate !important;
                      text-align: center !important;
                    }

                    /* שבירת עמוד חכמה */
                    #${elementId} .rounded-lg, #${elementId} table, #${elementId} tr {
                      break-inside: avoid !important;
                      page-break-inside: avoid !important;
                    }

                    /* גרפים – כן להציג ב-PDF, אבל בצורה מסודרת וקריאה */
                    #${elementId} .recharts-wrapper,
                    #${elementId} .recharts-responsive-container {
                      display: block !important;
                    }
                    #${elementId} .recharts-wrapper {
                      margin: 0 auto !important;
                    }
                    /* למסגר את אזור הגרף כדי שייראה כמו בדוח */
                    #${elementId} .recharts-wrapper,
                    #${elementId} svg.recharts-surface {
                      background: #fff !important;
                    }
                    /* לא לשבור עמוד באמצע גרף */
                    #${elementId} .recharts-wrapper,
                    #${elementId} .recharts-responsive-container {
                      break-inside: avoid !important;
                      page-break-inside: avoid !important;
                    }
                  `;
                  clonedDoc.head.appendChild(style);

                  // בנוסף, נוודא במפורש על ה-root (עם important) – למקרה שיש !important מהמקור
                  root.style.setProperty("background-color", "#ffffff", "important");
                  root.style.setProperty("color", "#000000", "important");
                  root.style.setProperty("background-image", "none", "important");

                  // חיזוק לגרפים: לפעמים RTL משפיע על SVG; נוודא שה-SVG נשאר LTR
                  const svgs = root.querySelectorAll("svg");
                  svgs.forEach((svg) => {
                    svg.setAttribute("direction", "ltr");
                    svg.style.setProperty("direction", "ltr", "important");
                  });
                } catch (e) {
                  console.warn("PDF onclone styling failed:", e);
                }
              },
              ignoreElements: (node) => node?.classList?.contains("no-pdf"),
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ["css", "legacy"] },
          };

          return html2pdf().set(opt).from(el).save();
        })
        .catch((error) => {
          console.error("Error loading/creating PDF:", error);
          alert("שגיאה בייצוא PDF. אנא נסה שוב. פרטים: " + (error?.message || "לא ידוע"));
        })
        .finally(() => {
          try {
            overlay.remove();
          } catch {}
          window.__mleoPdfExportInProgress = false;
        });
    });
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    alert("שגיאה בייצוא PDF. אנא נסה שוב.");
    try {
      const existing = document.querySelector('[data-pdf-overlay="1"]');
      existing?.remove?.();
    } catch {}
    window.__mleoPdfExportInProgress = false;
  }
}

