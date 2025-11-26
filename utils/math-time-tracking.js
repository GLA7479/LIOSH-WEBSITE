// מערכת מעקב זמן לפי פעולה/נושא, כיתה ורמה (חשבון וגאומטריה)

const TIME_TRACKING_KEY = "mleo_time_tracking";
const GEOMETRY_TIME_TRACKING_KEY = "mleo_geometry_time_tracking";

// שמירת זמן עבודה על פעולה ספציפית (חשבון)
export function trackOperationTime(operation, grade, level, duration) {
  if (typeof window === "undefined") return;
  
  try {
    const saved = JSON.parse(localStorage.getItem(TIME_TRACKING_KEY) || "{}");
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // אתחול מבנה הנתונים
    if (!saved.operations) saved.operations = {};
    if (!saved.operations[operation]) {
      saved.operations[operation] = {
        total: 0, // סך הכל בשניות
        sessions: [],
        byGrade: {},
        byLevel: {}
      };
    }
    
    if (!saved.daily) saved.daily = {};
    if (!saved.daily[today]) {
      saved.daily[today] = {
        total: 0,
        operations: {},
        byGrade: {},
        byLevel: {}
      };
    }
    
    // עדכון סך הכל
    saved.operations[operation].total += duration;
    
    // עדכון לפי כיתה
    if (!saved.operations[operation].byGrade[grade]) {
      saved.operations[operation].byGrade[grade] = 0;
    }
    saved.operations[operation].byGrade[grade] += duration;
    
    // עדכון לפי רמה
    if (!saved.operations[operation].byLevel[level]) {
      saved.operations[operation].byLevel[level] = 0;
    }
    saved.operations[operation].byLevel[level] += duration;
    
    // הוספת סשן
    saved.operations[operation].sessions.push({
      date: today,
      duration,
      grade,
      level,
      timestamp: Date.now()
    });
    
    // שמירת רק 1000 סשנים אחרונים לכל פעולה
    if (saved.operations[operation].sessions.length > 1000) {
      saved.operations[operation].sessions = saved.operations[operation].sessions.slice(-1000);
    }
    
    // עדכון יומי
    saved.daily[today].total += duration;
    if (!saved.daily[today].operations[operation]) {
      saved.daily[today].operations[operation] = 0;
    }
    saved.daily[today].operations[operation] += duration;
    
    if (!saved.daily[today].byGrade[grade]) {
      saved.daily[today].byGrade[grade] = 0;
    }
    saved.daily[today].byGrade[grade] += duration;
    
    if (!saved.daily[today].byLevel[level]) {
      saved.daily[today].byLevel[level] = 0;
    }
    saved.daily[today].byLevel[level] += duration;
    
    // שמירה
    localStorage.setItem(TIME_TRACKING_KEY, JSON.stringify(saved));
  } catch (error) {
    console.error("Error tracking time:", error);
  }
}

// קבלת זמן כולל לפי פעולה
export function getOperationTime(operation) {
  if (typeof window === "undefined") return { total: 0, minutes: 0, hours: 0 };
  
  try {
    const saved = JSON.parse(localStorage.getItem(TIME_TRACKING_KEY) || "{}");
    const total = saved.operations?.[operation]?.total || 0;
    
    return {
      total, // בשניות
      minutes: Math.round(total / 60),
      hours: (total / 3600).toFixed(2)
    };
  } catch {
    return { total: 0, minutes: 0, hours: 0 };
  }
}

// קבלת זמן לפי תקופה מותאמת אישית
export function getTimeByCustomPeriod(startDate, endDate) {
  if (typeof window === "undefined") return {};
  
  try {
    const saved = JSON.parse(localStorage.getItem(TIME_TRACKING_KEY) || "{}");
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const result = {
      total: 0,
      operations: {},
      daily: [],
      byGrade: {},
      byLevel: {}
    };
    
    // סיכום לפי ימים
    Object.entries(saved.daily || {}).forEach(([date, data]) => {
      const dateObj = new Date(date);
      if (dateObj >= start && dateObj <= end) {
        result.total += data.total || 0;
        result.daily.push({
          date,
          total: data.total || 0,
          operations: data.operations || {},
          byGrade: data.byGrade || {},
          byLevel: data.byLevel || {}
        });
        
        // סיכום לפי פעולות
        Object.entries(data.operations || {}).forEach(([op, time]) => {
          if (!result.operations[op]) result.operations[op] = 0;
          result.operations[op] += time;
        });
        
        // סיכום לפי כיתה
        Object.entries(data.byGrade || {}).forEach(([grade, time]) => {
          if (!result.byGrade[grade]) result.byGrade[grade] = 0;
          result.byGrade[grade] += time;
        });
        
        // סיכום לפי רמה
        Object.entries(data.byLevel || {}).forEach(([level, time]) => {
          if (!result.byLevel[level]) result.byLevel[level] = 0;
          result.byLevel[level] += time;
        });
      }
    });
    
    // המרה לדקות
    result.totalMinutes = Math.round(result.total / 60);
    result.totalHours = (result.total / 3600).toFixed(2);
    
    Object.keys(result.operations).forEach(op => {
      result.operations[op] = {
        seconds: result.operations[op],
        minutes: Math.round(result.operations[op] / 60),
        hours: (result.operations[op] / 3600).toFixed(2)
      };
    });
    
    return result;
  } catch {
    return { total: 0, totalMinutes: 0, operations: {}, daily: [], byGrade: {}, byLevel: {} };
  }
}

// קבלת זמן לפי תקופה (שבוע/חודש/שנה)
export function getTimeByPeriod(period = 'week') {
  if (typeof window === "undefined") return {};
  
  try {
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return getTimeByCustomPeriod(startDate, now);
  } catch {
    return { total: 0, totalMinutes: 0, operations: {}, daily: [], byGrade: {}, byLevel: {} };
  }
}

// קבלת כל הנתונים
export function getAllTimeTracking() {
  if (typeof window === "undefined") return null;
  
  try {
    return JSON.parse(localStorage.getItem(TIME_TRACKING_KEY) || "{}");
  } catch {
    return null;
  }
}

// ניקוי נתונים ישנים (יותר מ-90 יום)
export function cleanOldTimeTracking() {
  if (typeof window === "undefined") return;
  
  try {
    const saved = JSON.parse(localStorage.getItem(TIME_TRACKING_KEY) || "{}");
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // ניקוי ימים ישנים
    if (saved.daily) {
      Object.keys(saved.daily).forEach(date => {
        const dateObj = new Date(date);
        if (dateObj < cutoffDate) {
          delete saved.daily[date];
        }
      });
    }
    
    // ניקוי סשנים ישנים
    if (saved.operations) {
      Object.keys(saved.operations).forEach(op => {
        if (saved.operations[op].sessions) {
          saved.operations[op].sessions = saved.operations[op].sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= cutoffDate;
          });
        }
      });
    }
    
    localStorage.setItem(TIME_TRACKING_KEY, JSON.stringify(saved));
  } catch (error) {
    console.error("Error cleaning old time tracking:", error);
  }
}

// ========== גאומטריה ==========

// שמירת זמן עבודה על נושא ספציפי (גאומטריה)
export function trackGeometryTopicTime(topic, grade, level, duration) {
  if (typeof window === "undefined") return;
  
  try {
    const saved = JSON.parse(localStorage.getItem(GEOMETRY_TIME_TRACKING_KEY) || "{}");
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // אתחול מבנה הנתונים
    if (!saved.topics) saved.topics = {};
    if (!saved.topics[topic]) {
      saved.topics[topic] = {
        total: 0, // סך הכל בשניות
        sessions: [],
        byGrade: {},
        byLevel: {}
      };
    }
    
    if (!saved.daily) saved.daily = {};
    if (!saved.daily[today]) {
      saved.daily[today] = {
        total: 0,
        topics: {},
        byGrade: {},
        byLevel: {}
      };
    }
    
    // עדכון סך הכל
    saved.topics[topic].total += duration;
    
    // עדכון לפי כיתה
    if (!saved.topics[topic].byGrade[grade]) {
      saved.topics[topic].byGrade[grade] = 0;
    }
    saved.topics[topic].byGrade[grade] += duration;
    
    // עדכון לפי רמה
    if (!saved.topics[topic].byLevel[level]) {
      saved.topics[topic].byLevel[level] = 0;
    }
    saved.topics[topic].byLevel[level] += duration;
    
    // הוספת סשן
    saved.topics[topic].sessions.push({
      date: today,
      duration,
      grade,
      level,
      timestamp: Date.now()
    });
    
    // שמירת רק 1000 סשנים אחרונים לכל נושא
    if (saved.topics[topic].sessions.length > 1000) {
      saved.topics[topic].sessions = saved.topics[topic].sessions.slice(-1000);
    }
    
    // עדכון יומי
    saved.daily[today].total += duration;
    if (!saved.daily[today].topics[topic]) {
      saved.daily[today].topics[topic] = 0;
    }
    saved.daily[today].topics[topic] += duration;
    
    if (!saved.daily[today].byGrade[grade]) {
      saved.daily[today].byGrade[grade] = 0;
    }
    saved.daily[today].byGrade[grade] += duration;
    
    if (!saved.daily[today].byLevel[level]) {
      saved.daily[today].byLevel[level] = 0;
    }
    saved.daily[today].byLevel[level] += duration;
    
    // שמירה
    localStorage.setItem(GEOMETRY_TIME_TRACKING_KEY, JSON.stringify(saved));
  } catch (error) {
    console.error("Error tracking geometry time:", error);
  }
}

// קבלת זמן לפי תקופה מותאמת אישית (גאומטריה)
export function getGeometryTimeByCustomPeriod(startDate, endDate) {
  if (typeof window === "undefined") return {};
  
  try {
    const saved = JSON.parse(localStorage.getItem(GEOMETRY_TIME_TRACKING_KEY) || "{}");
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const result = {
      total: 0,
      topics: {},
      daily: [],
      byGrade: {},
      byLevel: {}
    };
    
    // סיכום לפי ימים
    Object.entries(saved.daily || {}).forEach(([date, data]) => {
      const dateObj = new Date(date);
      if (dateObj >= start && dateObj <= end) {
        result.total += data.total || 0;
        result.daily.push({
          date,
          total: data.total || 0,
          topics: data.topics || {},
          byGrade: data.byGrade || {},
          byLevel: data.byLevel || {}
        });
        
        // סיכום לפי נושאים
        Object.entries(data.topics || {}).forEach(([topic, time]) => {
          if (!result.topics[topic]) result.topics[topic] = 0;
          result.topics[topic] += time;
        });
        
        // סיכום לפי כיתה
        Object.entries(data.byGrade || {}).forEach(([grade, time]) => {
          if (!result.byGrade[grade]) result.byGrade[grade] = 0;
          result.byGrade[grade] += time;
        });
        
        // סיכום לפי רמה
        Object.entries(data.byLevel || {}).forEach(([level, time]) => {
          if (!result.byLevel[level]) result.byLevel[level] = 0;
          result.byLevel[level] += time;
        });
      }
    });
    
    // המרה לדקות
    result.totalMinutes = Math.round(result.total / 60);
    result.totalHours = (result.total / 3600).toFixed(2);
    
    Object.keys(result.topics).forEach(topic => {
      result.topics[topic] = {
        seconds: result.topics[topic],
        minutes: Math.round(result.topics[topic] / 60),
        hours: (result.topics[topic] / 3600).toFixed(2)
      };
    });
    
    return result;
  } catch {
    return { total: 0, totalMinutes: 0, topics: {}, daily: [], byGrade: {}, byLevel: {} };
  }
}

// קבלת זמן לפי תקופה (גאומטריה)
export function getGeometryTimeByPeriod(period = 'week') {
  if (typeof window === "undefined") return {};
  
  try {
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return getGeometryTimeByCustomPeriod(startDate, now);
  } catch {
    return { total: 0, totalMinutes: 0, topics: {}, daily: [], byGrade: {}, byLevel: {} };
  }
}

