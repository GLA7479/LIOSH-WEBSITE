// מערכת יצירת דוחות להורים

import { STORAGE_KEY } from './math-constants';
import { getTimeByPeriod, getTimeByCustomPeriod, getAllTimeTracking } from './math-time-tracking';
import { getGeometryTimeByPeriod, getGeometryTimeByCustomPeriod } from './math-time-tracking';
import { getEnglishTimeByCustomPeriod } from './english-time-tracking';

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
    
    // איסוף שגיאות (חשבון)
    const mathMistakes = JSON.parse(localStorage.getItem("mleo_mistakes") || "[]");
    
    // איסוף שגיאות (גאומטריה) - אם יש
    const geometryMistakes = JSON.parse(localStorage.getItem("mleo_geometry_mistakes") || "[]");
    
    // איסוף שגיאות (אנגלית)
    const englishMistakes = JSON.parse(localStorage.getItem("mleo_english_mistakes") || "[]");
    
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
    
    // ========== סיכום כללי ==========
    const totalQuestions = mathTotalQuestions + geometryTotalQuestions + englishTotalQuestions;
    const totalCorrect = mathTotalCorrect + geometryTotalCorrect + englishTotalCorrect;
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
    
    // ========== המלצות ==========
    const mathRecommendations = generateRecommendations(mathOperationsSummary, mathMistakesByOperation);
    const geometryRecommendations = generateRecommendations(geometryTopicsSummary, geometryMistakesByTopic);
    const englishRecommendations = generateRecommendations(englishTopicsSummary, englishMistakesByTopic);
    const recommendations = [...mathRecommendations, ...geometryRecommendations, ...englishRecommendations];
    
    // ========== הישגים ==========
    const mathAchievements = mathProgress.badges || [];
    const geometryAchievements = geometryProgress.badges || [];
    const englishAchievements = englishProgress.badges || [];
    const achievements = [...mathAchievements, ...geometryAchievements, ...englishAchievements];
    const stars = (mathProgress.stars || 0) + (geometryProgress.stars || 0) + (englishProgress.stars || 0);
    const playerLevel = Math.max(
      mathProgress.playerLevel || 1,
      geometryProgress.playerLevel || 1,
      englishProgress.playerLevel || 1
    );
    const xp = (mathProgress.xp || 0) + (geometryProgress.xp || 0) + (englishProgress.xp || 0);
    
    // פעילות יומית - רק בתקופה שנבחרה
    const dailyActivity = [];
    const mathDailyData = mathTimeData.daily || {};
    const geometryDailyData = geometryTimeData.daily || {};
    const englishDailyData = englishTimeData.daily || {};
    
    // איחוד נתונים יומיים
    const allDailyDates = new Set([
      ...Object.keys(mathDailyData),
      ...Object.keys(geometryDailyData),
      ...Object.keys(englishDailyData)
    ]);
    
    allDailyDates.forEach(dateStr => {
      const dayDate = new Date(dateStr);
      if (dayDate >= startDate && dayDate <= endDate) {
        const mathDay = mathDailyData[dateStr] || { total: 0, operations: {} };
        const geometryDay = geometryDailyData[dateStr] || { total: 0, topics: {} };
        const englishDay = englishDailyData[dateStr] || { total: 0, topics: {} };
        
        const totalTime = (mathDay.total || 0) + (geometryDay.total || 0) + (englishDay.total || 0);
        const mathQuestions = Object.values(mathDay.operations || {}).reduce((sum, time) => {
          return sum + Math.round(time / 30); // הערכה: שאלה אחת כל 30 שניות
        }, 0);
        const geometryQuestions = Object.values(geometryDay.topics || {}).reduce((sum, time) => {
          return sum + Math.round(time / 30);
        }, 0);
        const englishQuestions = Object.values(englishDay.topics || {}).reduce((sum, time) => {
          return sum + Math.round(time / 30);
        }, 0);
        
        dailyActivity.push({
          date: dateStr,
          timeMinutes: Math.round(totalTime / 60),
          questions: mathQuestions + geometryQuestions + englishQuestions,
          mathTopics: Object.keys(mathDay.operations || {}).length,
          geometryTopics: Object.keys(geometryDay.topics || {}).length,
          englishTopics: Object.keys(englishDay.topics || {}).length
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
        .map(([topic, _]) => `אנגלית: ${getEnglishTopicName(topic)}`)
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
        .map(([topic, _]) => `אנגלית: ${getEnglishTopicName(topic)}`)
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
          (englishTimeData.totalMinutes || 0),
        totalTimeHours: (
          ((mathTimeData.totalMinutes || 0) +
            (geometryTimeData.totalMinutes || 0) +
            (englishTimeData.totalMinutes || 0)) /
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
      
      // כל הפעולות והנושאים יחד (לצורך תצוגה)
      allItems: {
        ...Object.fromEntries(Object.entries(mathOperationsSummary).map(([k, v]) => [`math_${k}`, v])),
        ...Object.fromEntries(Object.entries(geometryTopicsSummary).map(([k, v]) => [`geometry_${k}`, v])),
        ...Object.fromEntries(Object.entries(englishTopicsSummary).map(([k, v]) => [`english_${k}`, v]))
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
        stars: 0,
        playerLevel: 1,
        xp: 0,
        achievements: 0
      },
      mathOperations: {},
      geometryTopics: {},
      englishTopics: {},
      allItems: {},
      dailyActivity: [],
      analysis: {
        needsPractice: [],
        excellent: [],
        mathMistakesByOperation: {},
        geometryMistakesByTopic: {},
        englishMistakesByTopic: {},
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

// יצירת דוח PDF (דורש jsPDF)
export function exportReportToPDF(report) {
  if (typeof window === "undefined") return;
  
  try {
    // Dynamic import של jsPDF
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      // כותרת
      doc.setFontSize(20);
      doc.text('דוח להורים', 105, 20, { align: 'center' });
      
      // פרטים בסיסיים
      doc.setFontSize(12);
      let y = 35;
      doc.text(`שם: ${report.playerName}`, 20, y);
      y += 8;
      doc.text(`תקופה: ${report.period === 'week' ? 'שבוע' : report.period === 'month' ? 'חודש' : 'שנה'}`, 20, y);
      y += 8;
      doc.text(`תאריכים: ${report.startDate} - ${report.endDate}`, 20, y);
      y += 15;
      
      // סיכום כללי
      doc.setFontSize(14);
      doc.text('סיכום כללי', 20, y);
      y += 10;
      doc.setFontSize(11);
      doc.text(`זמן כולל: ${report.summary.totalTimeMinutes} דקות (${report.summary.totalTimeHours} שעות)`, 20, y);
      y += 7;
      doc.text(`שאלות: ${report.summary.totalQuestions} (${report.summary.totalCorrect} נכון)`, 20, y);
      y += 7;
      doc.text(`דיוק כללי: ${report.summary.overallAccuracy}%`, 20, y);
      y += 7;
      doc.text(`רמה: ${report.summary.playerLevel} | כוכבים: ${report.summary.stars} | הישגים: ${report.summary.achievements}`, 20, y);
      y += 15;
      
      // פעולות חשבון
      if (Object.keys(report.mathOperations || {}).length > 0) {
        doc.setFontSize(14);
        doc.text('התקדמות בחשבון', 20, y);
        y += 10;
        doc.setFontSize(10);
        
        Object.entries(report.mathOperations)
          .sort(([_, a], [__, b]) => b.questions - a.questions)
          .slice(0, 10)
          .forEach(([op, data]) => {
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            const opName = getOperationName(op);
            doc.text(`${opName}: ${data.questions} שאלות, ${data.correct} נכון, ${data.accuracy}% דיוק, ${data.timeMinutes} דק'`, 20, y);
            y += 7;
          });
        y += 5;
      }
      
      // נושאי גאומטריה
      if (Object.keys(report.geometryTopics || {}).length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.text('התקדמות בגאומטריה', 20, y);
        y += 10;
        doc.setFontSize(10);
        
        Object.entries(report.geometryTopics)
          .sort(([_, a], [__, b]) => b.questions - a.questions)
          .slice(0, 10)
          .forEach(([topic, data]) => {
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            const topicName = getTopicName(topic);
            doc.text(`${topicName}: ${data.questions} שאלות, ${data.correct} נכון, ${data.accuracy}% דיוק, ${data.timeMinutes} דק'`, 20, y);
            y += 7;
          });
        y += 5;
      }
      
      if (Object.keys(report.englishTopics || {}).length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.text('התקדמות באנגלית', 20, y);
        y += 10;
        doc.setFontSize(10);
        
        Object.entries(report.englishTopics)
          .sort(([_, a], [__, b]) => b.questions - a.questions)
          .slice(0, 10)
          .forEach(([topic, data]) => {
            if (y > 250) {
              doc.addPage();
              y = 20;
            }
            const topicName = getEnglishTopicName(topic);
            doc.text(`${topicName}: ${data.questions} שאלות, ${data.correct} נכון, ${data.accuracy}% דיוק, ${data.timeMinutes} דק'`, 20, y);
            y += 7;
          });
        y += 5;
      }
      
      // המלצות
      if (report.analysis.recommendations.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.text('המלצות', 20, y);
        y += 10;
        doc.setFontSize(10);
        
        report.analysis.recommendations.slice(0, 10).forEach(rec => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          doc.text(`• ${rec.message}`, 20, y);
          y += 7;
        });
      }
      
      // שמירה
      doc.save(`דוח-${report.playerName}-${report.endDate}.pdf`);
    }).catch(error => {
      console.error("Error loading jsPDF:", error);
      alert("שגיאה בייצוא PDF. אנא נסה שוב.");
    });
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    alert("שגיאה בייצוא PDF. אנא נסה שוב.");
  }
}

