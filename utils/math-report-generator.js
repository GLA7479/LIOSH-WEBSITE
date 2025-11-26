// מערכת יצירת דוחות להורים

import { STORAGE_KEY } from './math-constants';
import { getTimeByPeriod, getAllTimeTracking } from './math-time-tracking';

// שמות פעולות בעברית
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

export function getOperationName(op) {
  return OPERATION_NAMES[op] || op;
}

// יצירת דוח להורים
export function generateParentReport(playerName, period = 'week') {
  if (typeof window === "undefined") return null;
  
  try {
    // איסוף נתוני התקדמות
    const progress = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
    const progressData = progress.progress || {};
    
    // איסוף נתוני זמן
    const timeData = getTimeByPeriod(period);
    
    // איסוף שגיאות
    const mistakes = JSON.parse(localStorage.getItem("mleo_mistakes") || "[]");
    
    // איסוף אתגרים
    const dailyChallenge = JSON.parse(localStorage.getItem("mleo_daily_challenge") || "{}");
    const weeklyChallenge = JSON.parse(localStorage.getItem("mleo_weekly_challenge") || "{}");
    
    // חישוב תקופה
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // סיכום לפי פעולות
    const operationsSummary = {};
    let totalQuestions = 0;
    let totalCorrect = 0;
    
    Object.entries(progressData).forEach(([op, data]) => {
      const questions = data.total || 0;
      const correct = data.correct || 0;
      const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
      const timeMinutes = timeData.operations?.[op]?.minutes || 0;
      
      totalQuestions += questions;
      totalCorrect += correct;
      
      operationsSummary[op] = {
        questions,
        correct,
        wrong: questions - correct,
        accuracy,
        timeMinutes,
        timeHours: (timeMinutes / 60).toFixed(2),
        needsPractice: accuracy < 70,
        excellent: accuracy >= 90,
        improvement: calculateImprovement(op, progressData, period)
      };
    });
    
    const overallAccuracy = totalQuestions > 0 
      ? Math.round((totalCorrect / totalQuestions) * 100) 
      : 0;
    
    // ניתוח שגיאות
    const mistakesByOperation = {};
    mistakes.forEach(mistake => {
      const op = mistake.operation;
      if (!mistakesByOperation[op]) {
        mistakesByOperation[op] = {
          count: 0,
          lastSeen: null,
          commonErrors: {}
        };
      }
      mistakesByOperation[op].count++;
      if (!mistakesByOperation[op].lastSeen || 
          new Date(mistake.timestamp) > new Date(mistakesByOperation[op].lastSeen)) {
        mistakesByOperation[op].lastSeen = mistake.timestamp;
      }
    });
    
    // המלצות
    const recommendations = generateRecommendations(operationsSummary, mistakesByOperation);
    
    // הישגים
    const achievements = progress.badges || [];
    const stars = progress.stars || 0;
    const playerLevel = progress.playerLevel || 1;
    const xp = progress.xp || 0;
    
    // פעילות יומית
    const dailyActivity = [];
    if (timeData.daily) {
      timeData.daily.forEach(day => {
        const dayQuestions = Object.values(day.operations || {}).reduce((sum, time) => {
          // הערכה: שאלה אחת כל 30 שניות בממוצע
          return sum + Math.round(time / 30);
        }, 0);
        
        dailyActivity.push({
          date: day.date,
          timeMinutes: Math.round(day.total / 60),
          questions: dayQuestions,
          operations: Object.keys(day.operations || {}).length
        });
      });
    }
    
    // נושאים שצריך תרגול
    const needsPractice = Object.entries(operationsSummary)
      .filter(([_, data]) => data.needsPractice)
      .map(([op, _]) => getOperationName(op));
    
    // נושאים מצוינים
    const excellent = Object.entries(operationsSummary)
      .filter(([_, data]) => data.excellent && data.questions >= 10)
      .map(([op, _]) => getOperationName(op));
    
    return {
      playerName,
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      generatedAt: now.toISOString(),
      
      // סיכום כללי
      summary: {
        totalTimeMinutes: timeData.totalMinutes || 0,
        totalTimeHours: timeData.totalHours || "0",
        totalQuestions,
        totalCorrect,
        overallAccuracy,
        stars,
        playerLevel,
        xp,
        achievements: achievements.length
      },
      
      // לפי פעולות
      operations: operationsSummary,
      
      // פעילות יומית
      dailyActivity: dailyActivity.sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      ),
      
      // ניתוח
      analysis: {
        needsPractice,
        excellent,
        mistakesByOperation,
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
    return null;
  }
}

// חישוב שיפור
function calculateImprovement(operation, progressData, period) {
  // זה יכול להיות מורכב יותר - להשוות בין תקופות
  // כרגע נחזיר null או נתונים בסיסיים
  return null;
}

// יצירת המלצות
function generateRecommendations(operations, mistakes) {
  const recommendations = [];
  
  // המלצות לפי דיוק
  Object.entries(operations).forEach(([op, data]) => {
    if (data.needsPractice && data.questions > 0) {
      const priority = data.accuracy < 50 ? 'high' : data.accuracy < 70 ? 'medium' : 'low';
      recommendations.push({
        type: 'accuracy',
        operation: op,
        operationName: getOperationName(op),
        message: `מומלץ לתרגל יותר ${getOperationName(op)} - דיוק ${data.accuracy}%`,
        priority,
        currentAccuracy: data.accuracy,
        targetAccuracy: 80
      });
    }
  });
  
  // המלצות לפי שגיאות
  Object.entries(mistakes).forEach(([op, data]) => {
    if (data.count > 10) {
      recommendations.push({
        type: 'mistakes',
        operation: op,
        operationName: getOperationName(op),
        message: `${getOperationName(op)} - ${data.count} שגיאות. מומלץ לחזור על הנושא`,
        priority: 'high',
        mistakeCount: data.count
      });
    }
  });
  
  // המלצות לפי זמן
  Object.entries(operations).forEach(([op, data]) => {
    if (data.timeMinutes < 5 && data.questions > 0) {
      recommendations.push({
        type: 'time',
        operation: op,
        operationName: getOperationName(op),
        message: `${getOperationName(op)} - רק ${data.timeMinutes} דקות תרגול. מומלץ להגדיל זמן תרגול`,
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
      
      // פעולות
      if (Object.keys(report.operations).length > 0) {
        doc.setFontSize(14);
        doc.text('התקדמות לפי פעולות', 20, y);
        y += 10;
        doc.setFontSize(10);
        
        Object.entries(report.operations)
          .sort(([_, a], [__, b]) => b.questions - a.questions)
          .slice(0, 15)
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

