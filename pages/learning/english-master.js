import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import { trackEnglishTopicTime } from "../../utils/english-time-tracking";
import {
  addSessionProgress,
  loadMonthlyProgress,
  loadRewardChoice,
  saveRewardChoice,
  getCurrentYearMonth,
} from "../../utils/progress-storage";
import {
  REWARD_OPTIONS,
  MONTHLY_MINUTES_TARGET,
  getRewardLabel,
} from "../../data/reward-options";
import {
  ENGLISH_GRADES,
  ENGLISH_GRADE_ORDER,
} from "../../data/english-curriculum";

const LEVELS = {
  easy: { name: "קל", maxWords: 5, complexity: "basic" },
  medium: { name: "בינוני", maxWords: 10, complexity: "intermediate" },
  hard: { name: "קשה", maxWords: 15, complexity: "advanced" },
};

const TOPICS = {
  vocabulary: { name: "אוצר מילים", description: "Vocabulary practice", icon: "📚" },
  grammar: { name: "דקדוק", description: "Grammar focus", icon: "✏️" },
  translation: { name: "תרגום", description: "Sentence translation", icon: "🌐" },
  sentences: { name: "משפטים", description: "Sentence building", icon: "💬" },
  writing: { name: "כתיבה", description: "Free typing practice", icon: "✍️" },
  mixed: { name: "ערבוב", description: "Blend topics", icon: "🎲" },
};

const GRADES = ENGLISH_GRADES;
const GRADE_ORDER = ENGLISH_GRADE_ORDER;

const MODES = {
  learning: { name: "למידה", description: "ללא סיום משחק, תרגול בקצב שלך" },
  challenge: { name: "אתגר", description: "טיימר + חיים, מרוץ ניקוד גבוה" },
  speed: { name: "מהירות", description: "תשובות מהירות = יותר נקודות! ⚡" },
  marathon: { name: "מרתון", description: "כמה שאלות תוכל לפתור? 🏃" },
  practice: { name: "תרגול", description: "בוחר נושא/מצב אימון מדויק" },
};

const STORAGE_KEY = "mleo_english_master";

// Word lists for vocabulary questions (aligned with curriculum themes)
const WORD_LISTS = {
  animals: {
    dog: "כלב",
    cat: "חתול",
    bird: "ציפור",
    fish: "דג",
    rabbit: "ארנב",
    horse: "סוס",
    cow: "פרה",
    sheep: "כבשה",
    lion: "אריה",
    dolphin: "דולפין",
  },
  colors: {
    red: "אדום",
    blue: "כחול",
    yellow: "צהוב",
    green: "ירוק",
    orange: "כתום",
    purple: "סגול",
    pink: "ורוד",
    black: "שחור",
    white: "לבן",
    brown: "חום",
  },
  numbers: {
    zero: "אפס",
    one: "אחד",
    two: "שניים",
    three: "שלושה",
    four: "ארבעה",
    five: "חמישה",
    six: "שישה",
    seven: "שבעה",
    eight: "שמונה",
    nine: "תשעה",
    ten: "עשרה",
    twenty: "עשרים",
  },
  family: {
    mother: "אמא",
    father: "אבא",
    brother: "אח",
    sister: "אחות",
    grandmother: "סבתא",
    grandfather: "סבא",
    uncle: "דוד",
    aunt: "דודה",
    cousin: "בן דוד",
  },
  body: {
    head: "ראש",
    eye: "עין",
    ear: "אוזן",
    nose: "אף",
    mouth: "פה",
    hand: "יד",
    foot: "כף רגל",
    leg: "רגל",
    shoulder: "כתף",
  },
  food: {
    apple: "תפוח",
    bread: "לחם",
    milk: "חלב",
    egg: "ביצה",
    cheese: "גבינה",
    banana: "בננה",
    water: "מים",
    cake: "עוגה",
    rice: "אורז",
    salad: "סלט",
  },
  school: {
    book: "ספר",
    pen: "עט",
    pencil: "עיפרון",
    desk: "שולחן",
    chair: "כיסא",
    teacher: "מורה",
    student: "תלמיד",
    classroom: "כיתה",
    backpack: "תיק",
  },
  weather: {
    sun: "שמש",
    rain: "גשם",
    cloud: "ענן",
    wind: "רוח",
    snow: "שלג",
    hot: "חם",
    cold: "קר",
    warm: "חמים",
    storm: "סערה",
  },
  sports: {
    football: "כדורגל",
    basketball: "כדורסל",
    tennis: "טניס",
    swimming: "שחייה",
    running: "ריצה",
    cycling: "רכיבה על אופניים",
    yoga: "יוגה",
    hiking: "טיול רגלי",
  },
  travel: {
    car: "מכונית",
    bus: "אוטובוס",
    train: "רכבת",
    plane: "מטוס",
    hotel: "מלון",
    beach: "חוף",
    mountain: "הר",
    passport: "דרכון",
  },
  emotions: {
    happy: "שמח",
    sad: "עצוב",
    angry: "כועס",
    excited: "נרגש",
    tired: "עייף",
    scared: "מפחד",
    proud: "גאה",
    worried: "מודאג",
  },
  actions: {
    run: "לרוץ",
    jump: "לקפוץ",
    read: "לקרוא",
    write: "לכתוב",
    draw: "לצייר",
    sing: "לשיר",
    dance: "לרקוד",
    play: "לשחק",
  },
  house: {
    kitchen: "מטבח",
    bedroom: "חדר שינה",
    living_room: "סלון",
    bathroom: "חדר רחצה",
    garden: "גינה",
    window: "חלון",
    door: "דלת",
    roof: "גג",
  },
  community: {
    library: "ספרייה",
    park: "פארק",
    hospital: "בית חולים",
    police: "משטרה",
    museum: "מוזיאון",
    supermarket: "סופרמרקט",
    post_office: "דואר",
  },
  technology: {
    computer: "מחשב",
    tablet: "טאבלט",
    keyboard: "מקלדת",
    screen: "מסך",
    robot: "רובוט",
    camera: "מצלמה",
    internet: "אינטרנט",
  },
  health: {
    doctor: "רופא",
    nurse: "אחות",
    medicine: "תרופה",
    healthy: "בריא",
    hurt: "כואב",
    exercise: "התעמלות",
    rest: "מנוחה",
  },
  environment: {
    recycle: "למחזר",
    clean_water: "מים נקיים",
    tree: "עץ",
    planet: "כדור הארץ",
    save_energy: "לחסוך באנרגיה",
    pollution: "זיהום",
    nature: "טבע",
  },
  culture: {
    tradition: "מסורת",
    music: "מוזיקה",
    dance: "ריקוד",
    language: "שפה",
    holiday: "חג",
    flag: "דגל",
    story: "סיפור",
  },
  history: {
    hero: "גיבור",
    leader: "מנהיג",
    past: "עבר",
    today: "היום",
    future: "עתיד",
    memory: "זיכרון",
    journey: "מסע",
  },
  global_issues: {
    ocean: "אוקיינוס",
    climate: "אקלים",
    recycle_bin: "פח מחזור",
    energy: "אנרגיה",
    planet_earth: "כדור הארץ",
    protect: "להגן",
    volunteer: "להתנדב",
  },
};

const PRACTICE_FOCUS_OPTIONS = [
  { value: "balanced", label: "📚 כל הנושאים" },
  { value: "vocab_core", label: "🔤 אוצר מילים בסיסי" },
  { value: "grammar_forms", label: "✏️ דקדוק ומבנים" },
  { value: "writing_lab", label: "📝 כתיבה ומשפטים" },
  { value: "translation_boost", label: "📖 תרגום והבנת קטע" },
];

const AVATAR_OPTIONS = [
  "👤",
  "🧑",
  "👦",
  "👧",
  "🦁",
  "🐱",
  "🐶",
  "🐰",
  "🐻",
  "🐼",
  "🦊",
  "🐸",
  "🦄",
  "🌟",
  "🎮",
  "🏆",
  "⭐",
  "💫",
];

const REFERENCE_CATEGORIES = {
  colors: { label: "צבעים", lists: ["colors"] },
  animals: { label: "חיות", lists: ["animals"] },
  actions: { label: "פעלים נפוצים", lists: ["actions"] },
  emotions: { label: "רגשות", lists: ["emotions"] },
  school: { label: "חיי בית ספר", lists: ["school", "family"] },
  technology: { label: "טכנולוגיה", lists: ["technology", "global_issues"] },
};

const REFERENCE_CATEGORY_KEYS = Object.keys(REFERENCE_CATEGORIES);

const GRADE_FACTORS = {
  g1: 0.5,
  g2: 0.7,
  g3: 1,
  g4: 1.1,
  g5: 1.3,
  g6: 1.5,
};

const GRAMMAR_POOLS = {
  be_basic: [
    {
      question: `Choose the correct word: "I ___ ten years old"`,
      options: ["am", "is", "are"],
      correct: "am",
      explanation: "עם I משתמשים ב-am.",
    },
    {
      question: `Choose the correct word: "He ___ my teacher"`,
      options: ["are", "is", "am"],
      correct: "is",
      explanation: "He/She/It → is.",
    },
    {
      question: `Complete the sentence: "We ___ in class"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "We/They → are.",
    },
    {
      question: `Choose the correct word: "They ___ happy"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "They → are.",
    },
    {
      question: `Choose the correct word: "She ___ a student"`,
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "She → is.",
    },
    {
      question: `Complete: "You ___ my friend"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "You → are.",
    },
    {
      question: `Choose: "It ___ a book"`,
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "It → is.",
    },
    {
      question: `Complete: "Tom and I ___ friends"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "Tom and I = We → are.",
    },
    {
      question: `Choose: "The cat ___ sleeping"`,
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "The cat = It → is.",
    },
    {
      question: `Complete: "My friends ___ nice"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "My friends = They → are.",
    },
    {
      question: `Choose: "I ___ from Israel"`,
      options: ["am", "is", "are"],
      correct: "am",
      explanation: "I → am.",
    },
    {
      question: `Complete: "You and Sarah ___ in class"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "You and Sarah = plural → are.",
    },
    {
      question: `Choose: "The pencil ___ blue"`,
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "The pencil = It → is.",
    },
    {
      question: `Complete: "These books ___ new"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "These books = plural → are.",
    },
    {
      question: `Choose: "My mother ___ a teacher"`,
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "My mother = She → is.",
    },
    {
      question: `Complete: "The children ___ playing"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "The children = They → are.",
    },
    {
      question: `Choose: "I ___ six years old"`,
      options: ["am", "is", "are"],
      correct: "am",
      explanation: "I → am.",
    },
    {
      question: `Complete: "Sara and I ___ classmates"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "Sara and I = We → are.",
    },
    {
      question: `Choose: "The dog ___ brown"`,
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "The dog = It → is.",
    },
    {
      question: `Complete: "My sister and brother ___ at home"`,
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "My sister and brother = They → are.",
    },
  ],
  question_frames: [
    {
      question: `Choose the correct question word: "___ is your name?"`,
      options: ["What", "Where", "When"],
      correct: "What",
      explanation: "שואלים על שם בעזרת What.",
    },
    {
      question: `Choose the correct question word: "___ do you live?"`,
      options: ["Where", "Why", "Who"],
      correct: "Where",
      explanation: "שאלה על מקום → Where.",
    },
    {
      question: `Choose the correct helper: "___ you like pizza?"`,
      options: ["Do", "Does", "Is"],
      correct: "Do",
      explanation: "You → Do בשאלות.",
    },
    {
      question: `Choose the correct order: "___ is this?" (pointing at an object)`,
      options: ["Who", "What", "When"],
      correct: "What",
      explanation: "שואלים על חפץ עם What.",
    },
    {
      question: `Choose: "___ are you?" - "I'm fine"`,
      options: ["How", "What", "Where"],
      correct: "How",
      explanation: "שואלים על מצב/בריאות עם How.",
    },
    {
      question: `Choose: "___ is your birthday?"`,
      options: ["When", "Where", "Who"],
      correct: "When",
      explanation: "שואלים על זמן עם When.",
    },
    {
      question: `Choose: "___ is your favorite color?"`,
      options: ["What", "Where", "When"],
      correct: "What",
      explanation: "שואלים על בחירה/דעה עם What.",
    },
    {
      question: `Choose: "___ do you go to school?" - "At eight o'clock"`,
      options: ["When", "Where", "Why"],
      correct: "When",
      explanation: "שואלים על שעה/זמן עם When.",
    },
    {
      question: `Choose: "___ is your teacher?"`,
      options: ["Who", "What", "Where"],
      correct: "Who",
      explanation: "שואלים על אדם עם Who.",
    },
    {
      question: `Choose: "___ do you go to school?" - "By bus"`,
      options: ["How", "What", "Where"],
      correct: "How",
      explanation: "שואלים על דרך/אמצעי עם How.",
    },
    {
      question: `Choose: "___ color is your bag?"`,
      options: ["What", "Where", "When"],
      correct: "What",
      explanation: "שואלים על תכונה עם What + noun.",
    },
    {
      question: `Choose: "___ does she like ice cream?" - "Because it's sweet"`,
      options: ["Why", "What", "Where"],
      correct: "Why",
      explanation: "שואלים על סיבה עם Why.",
    },
    {
      question: `Choose: "___ old are you?"`,
      options: ["How", "What", "Where"],
      correct: "How",
      explanation: "שואלים על גיל עם How old.",
    },
    {
      question: `Choose: "___ is your best friend?"`,
      options: ["Who", "What", "Where"],
      correct: "Who",
      explanation: "שואלים על אדם עם Who.",
    },
    {
      question: `Choose: "___ does the lesson start?"`,
      options: ["When", "Where", "Who"],
      correct: "When",
      explanation: "שואלים על זמן התחלה עם When.",
    },
    {
      question: `Choose: "___ is your pencil?" - "In my bag"`,
      options: ["Where", "What", "Who"],
      correct: "Where",
      explanation: "שואלים על מיקום עם Where.",
    },
    {
      question: `Choose: "___ does Tom play?" - "Football"`,
      options: ["What", "Where", "When"],
      correct: "What",
      explanation: "שואלים על פעילות עם What.",
    },
    {
      question: `Choose: "___ many books do you have?"`,
      options: ["How", "What", "Where"],
      correct: "How",
      explanation: "שואלים על כמות עם How many.",
    },
    {
      question: `Choose: "___ is the library?" - "Next to the school"`,
      options: ["Where", "What", "Who"],
      correct: "Where",
      explanation: "שואלים על מיקום עם Where.",
    },
    {
      question: `Choose: "___ does she study?" - "English and Math"`,
      options: ["What", "Where", "When"],
      correct: "What",
      explanation: "שואלים על נושא לימוד עם What.",
    },
  ],
  present_simple: [
    {
      question: `Choose the correct form: "She ___ basketball on Fridays"`,
      options: ["play", "plays", "playing"],
      correct: "plays",
      explanation: "He/She/It מקבלים ‎-s‎ בזמן הווה פשוט.",
    },
    {
      question: `Choose the correct form: "We ___ breakfast at seven"`,
      options: ["eat", "eats", "eating"],
      correct: "eat",
      explanation: "We → צורת הבסיס ללא ‎-s.",
    },
    {
      question: `Choose the correct negative: "He ___ like carrots"`,
      options: ["don't", "doesn't", "isn't"],
      correct: "doesn't",
      explanation: "He/she/it → doesn't + verb base.",
    },
    {
      question: `Choose the question: "___ they play music?"`,
      options: ["Do", "Does", "Did"],
      correct: "Do",
      explanation: "They → Do בשאלות בהווה.",
    },
    {
      question: `Choose: "Tom ___ to school every day"`,
      options: ["go", "goes", "going"],
      correct: "goes",
      explanation: "Tom (he) → goes עם ‎-es‎.",
    },
    {
      question: `Choose: "I ___ my homework after school"`,
      options: ["do", "does", "doing"],
      correct: "do",
      explanation: "I → do (base form).",
    },
    {
      question: `Choose: "They ___ TV in the evening"`,
      options: ["watch", "watches", "watching"],
      correct: "watch",
      explanation: "They → watch (base form).",
    },
    {
      question: `Choose: "My sister ___ English well"`,
      options: ["speak", "speaks", "speaking"],
      correct: "speaks",
      explanation: "My sister (she) → speaks עם ‎-s.",
    },
    {
      question: `Choose: "We ___ books from the library"`,
      options: ["borrow", "borrows", "borrowing"],
      correct: "borrow",
      explanation: "We → borrow (base form).",
    },
    {
      question: `Choose: "The cat ___ milk"`,
      options: ["like", "likes", "liking"],
      correct: "likes",
      explanation: "The cat (it) → likes עם ‎-s.",
    },
    {
      question: `Choose: "I ___ like broccoli"`,
      options: ["don't", "doesn't", "isn't"],
      correct: "don't",
      explanation: "I → don't בשלילה.",
    },
    {
      question: `Choose: "She ___ watch cartoons"`,
      options: ["don't", "doesn't", "isn't"],
      correct: "doesn't",
      explanation: "She → doesn't בשלילה.",
    },
    {
      question: `Choose: "___ you like apples?"`,
      options: ["Do", "Does", "Are"],
      correct: "Do",
      explanation: "You → Do בשאלות.",
    },
    {
      question: `Choose: "___ he play football?"`,
      options: ["Do", "Does", "Is"],
      correct: "Does",
      explanation: "He → Does בשאלות.",
    },
    {
      question: `Choose: "My friends ___ study together"`,
      options: ["don't", "doesn't", "isn't"],
      correct: "don't",
      explanation: "My friends (they) → don't בשלילה.",
    },
    {
      question: `Choose: "The teacher ___ us new words"`,
      options: ["teach", "teaches", "teaching"],
      correct: "teaches",
      explanation: "The teacher (he/she) → teaches עם ‎-es‎.",
    },
    {
      question: `Choose: "Children ___ to play games"`,
      options: ["love", "loves", "loving"],
      correct: "love",
      explanation: "Children (they) → love (base form).",
    },
    {
      question: `Choose: "___ they eat lunch at school?"`,
      options: ["Do", "Does", "Are"],
      correct: "Do",
      explanation: "They → Do בשאלות.",
    },
    {
      question: `Choose: "The sun ___ in the east"`,
      options: ["rise", "rises", "rising"],
      correct: "rises",
      explanation: "The sun (it) → rises עם ‎-s.",
    },
    {
      question: `Choose: "I ___ understand this exercise"`,
      options: ["don't", "doesn't", "am not"],
      correct: "don't",
      explanation: "I → don't בשלילה.",
    },
    {
      question: `Choose: "___ she help you with homework?"`,
      options: ["Do", "Does", "Is"],
      correct: "Does",
      explanation: "She → Does בשאלות.",
    },
  ],
  progressive: [
    {
      question: `Choose the correct tense: "Right now, they ___ English"`,
      options: ["study", "studies", "are studying"],
      correct: "are studying",
      explanation: "Right now → Present Continuous.",
    },
    {
      question: `Choose the correct form: "I ___ a movie"`,
      options: ["watch", "am watching", "watched"],
      correct: "am watching",
      explanation: "I + am + verb-ing בזמן הווה ממושך.",
    },
    {
      question: `Choose the correct sentence: "She ___ dinner at the moment"`,
      options: ["is cook", "is cooking", "cook"],
      correct: "is cooking",
      explanation: "She + is + verb-ing.",
    },
    {
      question: `Choose: "Look! It ___ outside"`,
      options: ["rain", "rains", "is raining"],
      correct: "is raining",
      explanation: "Look! = עכשיו → is raining.",
    },
    {
      question: `Choose: "We ___ for the bus now"`,
      options: ["wait", "waits", "are waiting"],
      correct: "are waiting",
      explanation: "We + are + verb-ing.",
    },
    {
      question: `Choose: "He ___ his homework right now"`,
      options: ["do", "does", "is doing"],
      correct: "is doing",
      explanation: "He + is + verb-ing.",
    },
    {
      question: `Choose: "I ___ a letter to my friend"`,
      options: ["write", "am writing", "writes"],
      correct: "am writing",
      explanation: "I + am + verb-ing.",
    },
    {
      question: `Choose: "The children ___ in the park"`,
      options: ["play", "plays", "are playing"],
      correct: "are playing",
      explanation: "The children (they) + are + verb-ing.",
    },
    {
      question: `Choose: "She ___ to music now"`,
      options: ["listen", "listens", "is listening"],
      correct: "is listening",
      explanation: "She + is + verb-ing.",
    },
    {
      question: `Choose: "They ___ a new game"`,
      options: ["learn", "learns", "are learning"],
      correct: "are learning",
      explanation: "They + are + verb-ing.",
    },
    {
      question: `Choose: "I ___ my room this morning"`,
      options: ["clean", "am cleaning", "cleans"],
      correct: "am cleaning",
      explanation: "I + am + verb-ing.",
    },
    {
      question: `Choose: "What ___ you ___?" - "I'm reading"`,
      options: ["are / doing", "do / do", "is / doing"],
      correct: "are / doing",
      explanation: "What are you doing? = שאלה ב-Present Continuous.",
    },
    {
      question: `Choose: "Why ___ she ___?" - "Because she's tired"`,
      options: ["does / cry", "is / crying", "do / cry"],
      correct: "is / crying",
      explanation: "Why is she crying? = שאלה ב-Present Continuous.",
    },
    {
      question: `Choose: "We ___ not ___ TV right now"`,
      options: ["are / watching", "do / watch", "is / watching"],
      correct: "are / watching",
      explanation: "We are not watching = שלילה ב-Present Continuous.",
    },
    {
      question: `Choose: "The dog ___ in the garden"`,
      options: ["run", "runs", "is running"],
      correct: "is running",
      explanation: "The dog (it) + is + verb-ing.",
    },
    {
      question: `Choose: "I ___ for my test tomorrow"`,
      options: ["study", "am studying", "studies"],
      correct: "am studying",
      explanation: "תכנית קרובה → Present Continuous.",
    },
    {
      question: `Choose: "She ___ her grandmother this weekend"`,
      options: ["visits", "is visiting", "visit"],
      correct: "is visiting",
      explanation: "תכנית עתידית → Present Continuous.",
    },
    {
      question: `Choose: "They ___ to the beach next week"`,
      options: ["go", "are going", "goes"],
      correct: "are going",
      explanation: "תכנית → are going.",
    },
    {
      question: `Choose: "What ___ he ___ for lunch?"`,
      options: ["does / eat", "is / eating", "do / eat"],
      correct: "is / eating",
      explanation: "What is he eating? = שאלה ב-Present Continuous.",
    },
    {
      question: `Choose: "The students ___ in class now"`,
      options: ["sit", "sits", "are sitting"],
      correct: "are sitting",
      explanation: "The students (they) + are + verb-ing.",
    },
  ],
  quantifiers: [
    {
      question: `Choose the correct word: "There aren't ___ apples left"`,
      options: ["some", "any", "much"],
      correct: "any",
      explanation: "בשלילה משתמשים ב-any.",
    },
    {
      question: `Choose the correct option: "How ___ water do you drink?"`,
      options: ["many", "much", "few"],
      correct: "much",
      explanation: "Water הוא לא ספיר → much.",
    },
    {
      question: `Choose the correct option: "We have ___ homework today"`,
      options: ["a few", "much", "many"],
      correct: "a few",
      explanation: "Homework במובן של משימות נפרדות → a few.",
    },
    {
      question: `Choose: "There are ___ books on the table"`,
      options: ["some", "any", "much"],
      correct: "some",
      explanation: "בחיוב עם שמות עצם רבים → some.",
    },
    {
      question: `Choose: "Do you have ___ pencils?"`,
      options: ["some", "any", "much"],
      correct: "any",
      explanation: "בשאלות עם שמות עצם רבים → any.",
    },
    {
      question: `Choose: "I need ___ milk for the cake"`,
      options: ["a few", "many", "some"],
      correct: "some",
      explanation: "Milk = לא ספיר, בחיוב → some.",
    },
    {
      question: `Choose: "How ___ students are in your class?"`,
      options: ["much", "many", "few"],
      correct: "many",
      explanation: "Students = ספיר → many.",
    },
    {
      question: `Choose: "There isn't ___ time left"`,
      options: ["many", "much", "few"],
      correct: "much",
      explanation: "Time = לא ספיר → much.",
    },
    {
      question: `Choose: "We have ___ friends at school"`,
      options: ["a lot of", "much", "a little"],
      correct: "a lot of",
      explanation: "Friends = ספיר, בחיוב → a lot of.",
    },
    {
      question: `Choose: "Can I have ___ water, please?"`,
      options: ["a few", "some", "many"],
      correct: "some",
      explanation: "בבקשה/הצעה עם לא ספיר → some.",
    },
    {
      question: `Choose: "There are ___ trees in the park"`,
      options: ["a little", "many", "much"],
      correct: "many",
      explanation: "Trees = ספיר → many.",
    },
    {
      question: `Choose: "I have ___ homework to do"`,
      options: ["a few", "a lot of", "many"],
      correct: "a lot of",
      explanation: "Homework = לא ספיר, בחיוב → a lot of.",
    },
    {
      question: `Choose: "There isn't ___ sugar in the coffee"`,
      options: ["many", "any", "few"],
      correct: "any",
      explanation: "בשלילה → any.",
    },
    {
      question: `Choose: "How ___ money do you need?"`,
      options: ["many", "much", "few"],
      correct: "much",
      explanation: "Money = לא ספיר → much.",
    },
    {
      question: `Choose: "We have ___ apples in the basket"`,
      options: ["a few", "a little", "much"],
      correct: "a few",
      explanation: "Apples = ספיר → a few.",
    },
    {
      question: `Choose: "There is ___ snow on the ground"`,
      options: ["many", "a lot of", "few"],
      correct: "a lot of",
      explanation: "Snow = לא ספיר, בחיוב → a lot of.",
    },
    {
      question: `Choose: "Do you want ___ ice cream?"`,
      options: ["some", "any", "many"],
      correct: "some",
      explanation: "בהצעה → some.",
    },
    {
      question: `Choose: "I don't have ___ friends in this city"`,
      options: ["many", "much", "a little"],
      correct: "many",
      explanation: "Friends = ספיר → many (גם בשלילה).",
    },
    {
      question: `Choose: "There is ___ milk in the fridge"`,
      options: ["a few", "a little", "many"],
      correct: "a little",
      explanation: "Milk = לא ספיר, כמות קטנה → a little.",
    },
    {
      question: `Choose: "We need ___ more chairs"`,
      options: ["a few", "a little", "much"],
      correct: "a few",
      explanation: "Chairs = ספיר → a few.",
    },
  ],
  past_simple: [
    {
      question: `Choose the correct verb: "Yesterday we ___ a science project"`,
      options: ["finish", "finished", "finishing"],
      correct: "finished",
      explanation: "Yesterday → Past Simple.",
    },
    {
      question: `Choose the correct form: "He ___ to the museum last week"`,
      options: ["go", "goes", "went"],
      correct: "went",
      explanation: "Went היא צורת העבר של go.",
    },
    {
      question: `Choose the correct negative: "They ___ the film"`,
      options: ["don't like", "didn't like", "weren't like"],
      correct: "didn't like",
      explanation: "Past Simple שלילי: didn't + verb base.",
    },
    {
      question: `Choose: "I ___ to school yesterday"`,
      options: ["walk", "walked", "walking"],
      correct: "walked",
      explanation: "Yesterday → Past Simple, פועל סדיר → +ed.",
    },
    {
      question: `Choose: "She ___ a book last night"`,
      options: ["read", "reads", "reading"],
      correct: "read",
      explanation: "Read (קריאה) היא צורת העבר של read.",
    },
    {
      question: `Choose: "We ___ pizza for dinner"`,
      options: ["eat", "ate", "eating"],
      correct: "ate",
      explanation: "Ate היא צורת העבר של eat.",
    },
    {
      question: `Choose: "They ___ football in the park"`,
      options: ["play", "played", "playing"],
      correct: "played",
      explanation: "Played = Past Simple של play.",
    },
    {
      question: `Choose: "He ___ his homework yesterday"`,
      options: ["do", "did", "doing"],
      correct: "did",
      explanation: "Did היא צורת העבר של do.",
    },
    {
      question: `Choose: "I ___ see you at the library"`,
      options: ["don't", "didn't", "wasn't"],
      correct: "didn't",
      explanation: "Past Simple שלילי → didn't.",
    },
    {
      question: `Choose: "She ___ like the movie"`,
      options: ["doesn't", "didn't", "wasn't"],
      correct: "didn't",
      explanation: "Past Simple שלילי → didn't.",
    },
    {
      question: `Choose: "___ you go to the park?"`,
      options: ["Do", "Does", "Did"],
      correct: "Did",
      explanation: "Past Simple שאלה → Did.",
    },
    {
      question: `Choose: "What ___ you do yesterday?"`,
      options: ["do", "does", "did"],
      correct: "did",
      explanation: "Past Simple שאלה → did.",
    },
    {
      question: `Choose: "My friend ___ me a present"`,
      options: ["give", "gave", "giving"],
      correct: "gave",
      explanation: "Gave היא צורת העבר של give.",
    },
    {
      question: `Choose: "We ___ to the beach last summer"`,
      options: ["go", "went", "going"],
      correct: "went",
      explanation: "Went היא צורת העבר של go.",
    },
    {
      question: `Choose: "The cat ___ on the chair"`,
      options: ["sit", "sat", "sitting"],
      correct: "sat",
      explanation: "Sat היא צורת העבר של sit.",
    },
    {
      question: `Choose: "I ___ breakfast at 8 o'clock"`,
      options: ["have", "had", "having"],
      correct: "had",
      explanation: "Had היא צורת העבר של have.",
    },
    {
      question: `Choose: "They ___ a great time at the party"`,
      options: ["have", "has", "had"],
      correct: "had",
      explanation: "Had היא צורת העבר של have.",
    },
    {
      question: `Choose: "She ___ home early yesterday"`,
      options: ["come", "came", "coming"],
      correct: "came",
      explanation: "Came היא צורת העבר של come.",
    },
    {
      question: `Choose: "___ he finish his project?"`,
      options: ["Do", "Does", "Did"],
      correct: "Did",
      explanation: "Past Simple שאלה → Did.",
    },
    {
      question: `Choose: "I ___ not understand the question"`,
      options: ["do", "does", "did"],
      correct: "did",
      explanation: "Past Simple שלילי → did not.",
    },
  ],
  modals: [
    {
      question: `Choose the correct modal: "You ___ wear a helmet when you ride"`,
      options: ["should", "am", "was"],
      correct: "should",
      explanation: "עצה → should.",
    },
    {
      question: `Choose the correct modal: "We ___ go to the new science fair"`,
      options: ["might", "am", "is"],
      correct: "might",
      explanation: "אפשרות עתידית → might.",
    },
    {
      question: `Choose the correct modal: "Students ___ bring water to the trip"`,
      options: ["must", "can", "am"],
      correct: "must",
      explanation: "חובה → must.",
    },
    {
      question: `Choose: "I ___ swim when I was five"`,
      options: ["can", "could", "must"],
      correct: "could",
      explanation: "יכולת בעבר → could.",
    },
    {
      question: `Choose: "You ___ be careful with fire"`,
      options: ["should", "can", "will"],
      correct: "should",
      explanation: "עצה/המלצה → should.",
    },
    {
      question: `Choose: "We ___ play outside if it rains"`,
      options: ["can't", "can", "must"],
      correct: "can't",
      explanation: "אי אפשר → can't.",
    },
    {
      question: `Choose: "She ___ speak three languages"`,
      options: ["can", "should", "must"],
      correct: "can",
      explanation: "יכולת → can.",
    },
    {
      question: `Choose: "You ___ do your homework before playing"`,
      options: ["should", "can", "might"],
      correct: "should",
      explanation: "עצה → should.",
    },
    {
      question: `Choose: "They ___ come to the party tomorrow"`,
      options: ["might", "must", "should"],
      correct: "might",
      explanation: "אפשרות → might.",
    },
    {
      question: `Choose: "Students ___ not run in the hallway"`,
      options: ["should", "can", "must"],
      correct: "must",
      explanation: "חובה/איסור → must not.",
    },
    {
      question: `Choose: "I ___ help you with that"`,
      options: ["can", "must", "should"],
      correct: "can",
      explanation: "הצעת עזרה → can.",
    },
    {
      question: `Choose: "We ___ save water for the environment"`,
      options: ["should", "can", "might"],
      correct: "should",
      explanation: "עצה/מוסר → should.",
    },
    {
      question: `Choose: "You ___ be at school by 8 o'clock"`,
      options: ["can", "must", "might"],
      correct: "must",
      explanation: "חובה → must.",
    },
    {
      question: `Choose: "He ___ not find his keys"`,
      options: ["can", "could", "should"],
      correct: "could",
      explanation: "אי יכולת בעבר → could not.",
    },
    {
      question: `Choose: "___ I borrow your pencil?"`,
      options: ["Can", "Should", "Must"],
      correct: "Can",
      explanation: "בקשה → Can I?",
    },
    {
      question: `Choose: "We ___ visit the museum next week"`,
      options: ["might", "can", "must"],
      correct: "might",
      explanation: "אפשרות עתידית → might.",
    },
    {
      question: `Choose: "You ___ listen to your teacher"`,
      options: ["should", "can", "might"],
      correct: "should",
      explanation: "עצה/חובה מוסרית → should.",
    },
    {
      question: `Choose: "She ___ play the piano very well"`,
      options: ["can", "must", "should"],
      correct: "can",
      explanation: "יכולת → can.",
    },
    {
      question: `Choose: "Children ___ not play near the road"`,
      options: ["should", "can", "must"],
      correct: "must",
      explanation: "חובה/איסור → must not.",
    },
    {
      question: `Choose: "I ___ finish my project by Friday"`,
      options: ["should", "can", "might"],
      correct: "should",
      explanation: "עצה/המלצה → should.",
    },
  ],
  comparatives: [
    {
      question: `Choose the correct form: "This book is ___ than that one"`,
      options: ["more interesting", "most interesting", "interesting"],
      correct: "more interesting",
      explanation: "השוואה של תואר דו-הברתי → more + adjective.",
    },
    {
      question: `Choose the correct word: "My bag is ___ than yours"`,
      options: ["heavier", "heavy", "heaviest"],
      correct: "heavier",
      explanation: "השוואה → adjective + er.",
    },
    {
      question: `Choose the correct form: "This exercise is the ___ of the unit"`,
      options: ["harder", "hardest", "hard"],
      correct: "hardest",
      explanation: "Superlative → the + adjective + est.",
    },
    {
      question: `Choose: "Tom is ___ than his brother"`,
      options: ["tall", "taller", "tallest"],
      correct: "taller",
      explanation: "השוואה → taller (er).",
    },
    {
      question: `Choose: "This is the ___ day of the week"`,
      options: ["long", "longer", "longest"],
      correct: "longest",
      explanation: "Superlative → longest (est).",
    },
    {
      question: `Choose: "My room is ___ than yours"`,
      options: ["big", "bigger", "biggest"],
      correct: "bigger",
      explanation: "השוואה → bigger (כפילת האות האחרונה + er).",
    },
    {
      question: `Choose: "This test was ___ than the last one"`,
      options: ["easy", "easier", "easiest"],
      correct: "easier",
      explanation: "השוואה → easier (y → ier).",
    },
    {
      question: `Choose: "She is the ___ student in class"`,
      options: ["good", "better", "best"],
      correct: "best",
      explanation: "Superlative של good → best.",
    },
    {
      question: `Choose: "This movie is ___ than the book"`,
      options: ["more exciting", "most exciting", "exciting"],
      correct: "more exciting",
      explanation: "השוואה של תואר ארוך → more + adjective.",
    },
    {
      question: `Choose: "Today is ___ than yesterday"`,
      options: ["cold", "colder", "coldest"],
      correct: "colder",
      explanation: "השוואה → colder (er).",
    },
    {
      question: `Choose: "This is the ___ cake I've ever eaten"`,
      options: ["good", "better", "best"],
      correct: "best",
      explanation: "Superlative של good → best.",
    },
    {
      question: `Choose: "My pencil is ___ than yours"`,
      options: ["short", "shorter", "shortest"],
      correct: "shorter",
      explanation: "השוואה → shorter (er).",
    },
    {
      question: `Choose: "This problem is ___ than the previous one"`,
      options: ["difficult", "more difficult", "most difficult"],
      correct: "more difficult",
      explanation: "השוואה של תואר ארוך → more + adjective.",
    },
    {
      question: `Choose: "That is the ___ building in the city"`,
      options: ["high", "higher", "highest"],
      correct: "highest",
      explanation: "Superlative → highest (est).",
    },
    {
      question: `Choose: "This route is ___ than the other"`,
      options: ["long", "longer", "longest"],
      correct: "longer",
      explanation: "השוואה → longer (er).",
    },
    {
      question: `Choose: "She is ___ than her sister"`,
      options: ["old", "older", "oldest"],
      correct: "older",
      explanation: "השוואה → older (er).",
    },
    {
      question: `Choose: "This is the ___ question in the test"`,
      options: ["hard", "harder", "hardest"],
      correct: "hardest",
      explanation: "Superlative → hardest (est).",
    },
    {
      question: `Choose: "My homework is ___ than yours"`,
      options: ["easy", "easier", "easiest"],
      correct: "easier",
      explanation: "השוואה → easier (y → ier).",
    },
    {
      question: `Choose: "This book is the ___ one I've read"`,
      options: ["interesting", "more interesting", "most interesting"],
      correct: "most interesting",
      explanation: "Superlative של תואר ארוך → most + adjective.",
    },
    {
      question: `Choose: "The weather today is ___ than yesterday"`,
      options: ["nice", "nicer", "nicest"],
      correct: "nicer",
      explanation: "השוואה → nicer (e → er).",
    },
  ],
  future_forms: [
    {
      question: `Choose the correct future: "Tomorrow we ___ a trip"`,
      options: ["take", "will take", "took"],
      correct: "will take",
      explanation: "Tomorrow → will + base form.",
    },
    {
      question: `Choose the correct plan: "We ___ my cousins on Sunday"`,
      options: ["are visiting", "visited", "visits"],
      correct: "are visiting",
      explanation: "תכנית קרובה → Present Continuous.",
    },
    {
      question: `Choose the correct option: "I'm sure it ___ fine"`,
      options: ["is", "will be", "was"],
      correct: "will be",
      explanation: "בטחון בעתיד → will + base.",
    },
    {
      question: `Choose: "Next week I ___ to the beach"`,
      options: ["go", "will go", "went"],
      correct: "will go",
      explanation: "עתיד → will go.",
    },
    {
      question: `Choose: "She ___ a party next month"`,
      options: ["has", "will have", "had"],
      correct: "will have",
      explanation: "עתיד → will have.",
    },
    {
      question: `Choose: "We ___ pizza for dinner tonight"`,
      options: ["are having", "have", "had"],
      correct: "are having",
      explanation: "תכנית קרובה → are having.",
    },
    {
      question: `Choose: "They ___ visit us tomorrow"`,
      options: ["visit", "will visit", "visited"],
      correct: "will visit",
      explanation: "עתיד → will visit.",
    },
    {
      question: `Choose: "I ___ finish my homework soon"`,
      options: ["finish", "will finish", "finished"],
      correct: "will finish",
      explanation: "עתיד → will finish.",
    },
    {
      question: `Choose: "What ___ you do next summer?"`,
      options: ["do", "will", "did"],
      correct: "will",
      explanation: "שאלה בעתיד → What will you do?",
    },
    {
      question: `Choose: "I ___ not forget your birthday"`,
      options: ["do", "will", "am"],
      correct: "will",
      explanation: "עתיד שלילי → will not.",
    },
    {
      question: `Choose: "We ___ going to the park this afternoon"`,
      options: ["are", "will", "was"],
      correct: "are",
      explanation: "תכנית → are going to.",
    },
    {
      question: `Choose: "She ___ start her new school in September"`,
      options: ["starts", "will start", "started"],
      correct: "will start",
      explanation: "עתיד → will start.",
    },
    {
      question: `Choose: "I ___ see you next week"`,
      options: ["see", "will see", "saw"],
      correct: "will see",
      explanation: "עתיד → will see.",
    },
    {
      question: `Choose: "They ___ not come to school tomorrow"`,
      options: ["do", "will", "are"],
      correct: "will",
      explanation: "עתיד שלילי → will not.",
    },
    {
      question: `Choose: "What time ___ the movie start?"`,
      options: ["does", "will", "did"],
      correct: "will",
      explanation: "שאלה בעתיד → will.",
    },
    {
      question: `Choose: "I ___ help you with that tomorrow"`,
      options: ["help", "will help", "helped"],
      correct: "will help",
      explanation: "עתיד → will help.",
    },
    {
      question: `Choose: "We ___ have a test next Friday"`,
      options: ["have", "will have", "had"],
      correct: "will have",
      explanation: "עתיד → will have.",
    },
    {
      question: `Choose: "She ___ be ten years old next month"`,
      options: ["is", "will be", "was"],
      correct: "will be",
      explanation: "עתיד → will be.",
    },
    {
      question: `Choose: "I think it ___ rain tomorrow"`,
      options: ["rains", "will rain", "rained"],
      correct: "will rain",
      explanation: "תחזית/חיזוי → will rain.",
    },
    {
      question: `Choose: "We ___ going to learn about space"`,
      options: ["are", "will", "was"],
      correct: "are",
      explanation: "תכנית → are going to.",
    },
  ],
  complex_tenses: [
    {
      question: `Choose the correct tense: "They ___ when the phone rang"`,
      options: ["played", "were playing", "are playing"],
      correct: "were playing",
      explanation: "פעולה נמשכת בעבר → Past Continuous.",
    },
    {
      question: `Choose the correct form: "I have ___ finished my project"`,
      options: ["already", "ever", "never"],
      correct: "already",
      explanation: "Present Perfect אוהב already/just.",
    },
    {
      question: `Choose the correct option: "She has ___ visited London"` ,
      options: ["never", "ever", "always"],
      correct: "never",
      explanation: "ניסיון בעבר עד כה → never/ever.",
    },
    {
      question: `Choose: "I ___ my homework when you called"`,
      options: ["was doing", "did", "do"],
      correct: "was doing",
      explanation: "פעולה נמשכת בעבר → was doing.",
    },
    {
      question: `Choose: "She ___ a book when the bell rang"`,
      options: ["read", "was reading", "reads"],
      correct: "was reading",
      explanation: "פעולה נמשכת בעבר → was reading.",
    },
    {
      question: `Choose: "We ___ already eaten lunch"`,
      options: ["have", "has", "had"],
      correct: "have",
      explanation: "Present Perfect → have + past participle.",
    },
    {
      question: `Choose: "Have you ___ been to Paris?"`,
      options: ["ever", "never", "already"],
      correct: "ever",
      explanation: "שאלה ב-Present Perfect → ever.",
    },
    {
      question: `Choose: "They ___ studying when I arrived"`,
      options: ["were", "was", "are"],
      correct: "were",
      explanation: "Past Continuous → were studying.",
    },
    {
      question: `Choose: "I have ___ seen that movie"`,
      options: ["already", "ever", "never"],
      correct: "already",
      explanation: "כבר → already.",
    },
    {
      question: `Choose: "He ___ not finished his work yet"`,
      options: ["has", "have", "had"],
      correct: "has",
      explanation: "Present Perfect שלילי → has not.",
    },
    {
      question: `Choose: "What ___ you doing at 5 o'clock?"`,
      options: ["were", "was", "are"],
      correct: "were",
      explanation: "שאלה ב-Past Continuous → were.",
    },
    {
      question: `Choose: "She has ___ lived here for five years"`,
      options: ["ever", "never", "already"],
      correct: "already",
      explanation: "כבר/כל כך הרבה זמן → already (או ללא מילת זמן).",
    },
    {
      question: `Choose: "While I ___ dinner, he was watching TV"`,
      options: ["was eating", "ate", "eat"],
      correct: "was eating",
      explanation: "פעולה נמשכת בעבר → was eating.",
    },
    {
      question: `Choose: "Have they ___ visited Israel?"`,
      options: ["ever", "never", "already"],
      correct: "ever",
      explanation: "שאלה ב-Present Perfect → ever.",
    },
    {
      question: `Choose: "I ___ just finished my breakfast"`,
      options: ["have", "has", "had"],
      correct: "have",
      explanation: "Present Perfect עם just → have just.",
    },
    {
      question: `Choose: "She ___ crying when I saw her"`,
      options: ["was", "were", "is"],
      correct: "was",
      explanation: "Past Continuous → was crying.",
    },
    {
      question: `Choose: "We have ___ been to this place before"`,
      options: ["never", "ever", "already"],
      correct: "never",
      explanation: "מעולם לא → never.",
    },
    {
      question: `Choose: "The children ___ playing outside when it started raining"`,
      options: ["was", "were", "are"],
      correct: "were",
      explanation: "Past Continuous → were playing.",
    },
    {
      question: `Choose: "Has she ___ done her homework?"`,
      options: ["already", "ever", "never"],
      correct: "already",
      explanation: "שאלה עם already → כבר?",
    },
    {
      question: `Choose: "I ___ sleeping when the alarm went off"`,
      options: ["was", "were", "am"],
      correct: "was",
      explanation: "Past Continuous → was sleeping.",
    },
  ],
  conditionals: [
    {
      question: `Choose the correct form: "If we save water, we ___ the planet"`,
      options: ["help", "helped", "will help"],
      correct: "help",
      explanation: "Zero conditional: If + present, present.",
    },
    {
      question: `Choose the correct option: "If it rains, we ___ at home"`,
      options: ["stay", "stayed", "will stay"],
      correct: "will stay",
      explanation: "First conditional: If + present, will + base.",
    },
    {
      question: `Choose the correct sentence: "If you study, you ___ the test"`,
      options: ["pass", "passed", "passes"],
      correct: "pass",
      explanation: "עובדה כללית → Zero conditional.",
    },
    {
      question: `Choose: "If you heat water, it ___"`,
      options: ["boils", "boiled", "will boil"],
      correct: "boils",
      explanation: "עובדה כללית → Zero conditional (present, present).",
    },
    {
      question: `Choose: "If I have time, I ___ you"`,
      options: ["help", "helped", "will help"],
      correct: "will help",
      explanation: "תנאי אפשרי → First conditional (present, will).",
    },
    {
      question: `Choose: "If it's sunny tomorrow, we ___ to the park"`,
      options: ["go", "went", "will go"],
      correct: "will go",
      explanation: "תנאי עתידי → First conditional (present, will).",
    },
    {
      question: `Choose: "If you don't study, you ___ pass the test"`,
      options: ["don't", "didn't", "won't"],
      correct: "won't",
      explanation: "First conditional שלילי → won't.",
    },
    {
      question: `Choose: "If plants don't get water, they ___"`,
      options: ["die", "died", "will die"],
      correct: "die",
      explanation: "עובדה כללית → Zero conditional.",
    },
    {
      question: `Choose: "If she comes early, we ___ start on time"`,
      options: ["start", "started", "will start"],
      correct: "will start",
      explanation: "First conditional → will start.",
    },
    {
      question: `Choose: "If you touch fire, you ___ burned"`,
      options: ["get", "got", "will get"],
      correct: "get",
      explanation: "עובדה כללית → Zero conditional.",
    },
    {
      question: `Choose: "If I finish early, I ___ help you"`,
      options: ["help", "helped", "will help"],
      correct: "will help",
      explanation: "First conditional → will help.",
    },
    {
      question: `Choose: "If it snows, school ___ closed"`,
      options: ["closes", "closed", "will close"],
      correct: "will close",
      explanation: "תנאי אפשרי → First conditional.",
    },
    {
      question: `Choose: "If you water plants, they ___"`,
      options: ["grow", "grew", "will grow"],
      correct: "grow",
      explanation: "עובדה כללית → Zero conditional.",
    },
    {
      question: `Choose: "If we recycle, we ___ the environment"`,
      options: ["protect", "protected", "will protect"],
      correct: "protect",
      explanation: "Zero conditional: עובדה כללית.",
    },
    {
      question: `Choose: "If he doesn't hurry, he ___ late"`,
      options: ["is", "was", "will be"],
      correct: "will be",
      explanation: "First conditional → will be.",
    },
    {
      question: `Choose: "If you eat too much, you ___ sick"`,
      options: ["feel", "felt", "will feel"],
      correct: "feel",
      explanation: "Zero conditional: עובדה כללית.",
    },
    {
      question: `Choose: "If she studies hard, she ___ good grades"`,
      options: ["gets", "got", "will get"],
      correct: "will get",
      explanation: "First conditional → will get.",
    },
    {
      question: `Choose: "If the sun shines, it ___ warm"`,
      options: ["is", "was", "will be"],
      correct: "is",
      explanation: "Zero conditional: עובדה כללית.",
    },
    {
      question: `Choose: "If we don't hurry, we ___ miss the bus"`,
      options: ["miss", "missed", "will miss"],
      correct: "will miss",
      explanation: "First conditional → will miss.",
    },
    {
      question: `Choose: "If you mix red and blue, you ___ purple"`,
      options: ["get", "got", "will get"],
      correct: "get",
      explanation: "Zero conditional: עובדה כללית.",
    },
  ],
};

const SENTENCE_POOLS = {
  base: [
    {
      template: "I ___ a cat",
      options: ["have", "has", "having"],
      correct: "have",
      explanation: "I + have.",
    },
    {
      template: "We ___ friends",
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "We/They → are.",
    },
    {
      template: "It ___ cold today",
      options: ["is", "are", "am"],
      correct: "is",
      explanation: "It → is.",
    },
    {
      template: "She ___ my sister",
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "She → is.",
    },
    {
      template: "You ___ a student",
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "You → are.",
    },
    {
      template: "They ___ in the classroom",
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "They → are.",
    },
    {
      template: "I ___ happy",
      options: ["am", "is", "are"],
      correct: "am",
      explanation: "I → am.",
    },
    {
      template: "The dog ___ brown",
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "The dog (it) → is.",
    },
    {
      template: "My friends ___ nice",
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "My friends (they) → are.",
    },
    {
      template: "I ___ from Israel",
      options: ["am", "is", "are"],
      correct: "am",
      explanation: "I → am.",
    },
    {
      template: "He ___ a teacher",
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "He → is.",
    },
    {
      template: "We ___ classmates",
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "We → are.",
    },
    {
      template: "The book ___ on the table",
      options: ["am", "is", "are"],
      correct: "is",
      explanation: "The book (it) → is.",
    },
    {
      template: "I ___ seven years old",
      options: ["am", "is", "are"],
      correct: "am",
      explanation: "I → am.",
    },
    {
      template: "You and I ___ friends",
      options: ["am", "is", "are"],
      correct: "are",
      explanation: "You and I = We → are.",
    },
  ],
  routine: [
    {
      template: "She ___ her teeth every night",
      options: ["brush", "brushes", "brushing"],
      correct: "brushes",
      explanation: "She + ‎-es‎ בזמן הווה.",
    },
    {
      template: "They ___ the bus to school",
      options: ["take", "takes", "took"],
      correct: "take",
      explanation: "They → take.",
    },
    {
      template: "Do you ___ breakfast early?",
      options: ["eat", "eats", "ate"],
      correct: "eat",
      explanation: "Do + subject + base form.",
    },
    {
      template: "I ___ up at seven every morning",
      options: ["wake", "wakes", "waking"],
      correct: "wake",
      explanation: "I → wake (base form).",
    },
    {
      template: "Tom ___ to school every day",
      options: ["go", "goes", "going"],
      correct: "goes",
      explanation: "Tom (he) → goes עם ‎-es.",
    },
    {
      template: "We ___ our homework after school",
      options: ["do", "does", "doing"],
      correct: "do",
      explanation: "We → do.",
    },
    {
      template: "She ___ lunch at one o'clock",
      options: ["have", "has", "having"],
      correct: "has",
      explanation: "She → has.",
    },
    {
      template: "They ___ TV in the evening",
      options: ["watch", "watches", "watching"],
      correct: "watch",
      explanation: "They → watch.",
    },
    {
      template: "I ___ English at school",
      options: ["study", "studies", "studying"],
      correct: "study",
      explanation: "I → study.",
    },
    {
      template: "My mother ___ dinner at six",
      options: ["cook", "cooks", "cooking"],
      correct: "cooks",
      explanation: "My mother (she) → cooks עם ‎-s.",
    },
    {
      template: "Do you ___ to music every day?",
      options: ["listen", "listens", "listening"],
      correct: "listen",
      explanation: "Do you + base form.",
    },
    {
      template: "We ___ books before bed",
      options: ["read", "reads", "reading"],
      correct: "read",
      explanation: "We → read.",
    },
    {
      template: "He ___ his room on Sundays",
      options: ["clean", "cleans", "cleaning"],
      correct: "cleans",
      explanation: "He → cleans עם ‎-s.",
    },
    {
      template: "They ___ sports after school",
      options: ["play", "plays", "playing"],
      correct: "play",
      explanation: "They → play.",
    },
    {
      template: "I ___ breakfast at 8 o'clock",
      options: ["eat", "eats", "eating"],
      correct: "eat",
      explanation: "I → eat.",
    },
    {
      template: "She ___ her bike to school",
      options: ["ride", "rides", "riding"],
      correct: "rides",
      explanation: "She → rides עם ‎-s.",
    },
  ],
  descriptive: [
    {
      template: "The library is ___ the park",
      options: ["next to", "under", "between"],
      correct: "next to",
      explanation: "תיאור מיקום שכיח לכיתה ד'.",
    },
    {
      template: "This notebook is ___ than mine",
      options: ["bigger", "biggest", "big"],
      correct: "bigger",
      explanation: "השוואה → ‎-er‎.",
    },
    {
      template: "The cake smells ___",
      options: ["delicious", "deliciously", "delish"],
      correct: "delicious",
      explanation: "תארים מתארים שמות עצם.",
    },
    {
      template: "The cat is ___ the table",
      options: ["under", "over", "next to"],
      correct: "under",
      explanation: "תיאור מיקום → under.",
    },
    {
      template: "This bag is ___ than that one",
      options: ["heavy", "heavier", "heaviest"],
      correct: "heavier",
      explanation: "השוואה → heavier.",
    },
    {
      template: "The flowers look ___",
      options: ["beautiful", "beautifully", "beauty"],
      correct: "beautiful",
      explanation: "תואר → beautiful.",
    },
    {
      template: "My room is ___ than yours",
      options: ["big", "bigger", "biggest"],
      correct: "bigger",
      explanation: "השוואה → bigger.",
    },
    {
      template: "The ball is ___ the box",
      options: ["in", "on", "at"],
      correct: "in",
      explanation: "תיאור מיקום → in.",
    },
    {
      template: "This test is the ___ one",
      options: ["hard", "harder", "hardest"],
      correct: "hardest",
      explanation: "Superlative → hardest.",
    },
    {
      template: "The food tastes ___",
      options: ["good", "well", "goodly"],
      correct: "good",
      explanation: "תואר → good.",
    },
    {
      template: "She is ___ than her brother",
      options: ["tall", "taller", "tallest"],
      correct: "taller",
      explanation: "השוואה → taller.",
    },
    {
      template: "The book is ___ the shelf",
      options: ["on", "in", "at"],
      correct: "on",
      explanation: "תיאור מיקום → on.",
    },
    {
      template: "This is the ___ day",
      options: ["nice", "nicer", "nicest"],
      correct: "nicest",
      explanation: "Superlative → nicest.",
    },
    {
      template: "The music sounds ___",
      options: ["loud", "loudly", "loudness"],
      correct: "loud",
      explanation: "תואר → loud.",
    },
    {
      template: "My pencil is ___ than yours",
      options: ["short", "shorter", "shortest"],
      correct: "shorter",
      explanation: "השוואה → shorter.",
    },
    {
      template: "The bird is ___ the tree",
      options: ["on", "in", "at"],
      correct: "in",
      explanation: "תיאור מיקום → in.",
    },
  ],
  narrative: [
    {
      template: "Yesterday we ___ to the science museum",
      options: ["go", "went", "gone"],
      correct: "went",
      explanation: "Past Simple של go.",
    },
    {
      template: "While I ___, my friend called",
      options: ["study", "was studying", "studied"],
      correct: "was studying",
      explanation: "פעולה נמשכת בעבר → was/were + verb-ing.",
    },
    {
      template: "He ___ a robot for the fair",
      options: ["built", "builds", "building"],
      correct: "built",
      explanation: "עבר של build.",
    },
    {
      template: "Last week I ___ a new book",
      options: ["read", "reads", "reading"],
      correct: "read",
      explanation: "Past Simple של read.",
    },
    {
      template: "She ___ her homework yesterday",
      options: ["finish", "finished", "finishing"],
      correct: "finished",
      explanation: "Past Simple → finished.",
    },
    {
      template: "They ___ football in the park",
      options: ["play", "played", "playing"],
      correct: "played",
      explanation: "Past Simple → played.",
    },
    {
      template: "While she ___ dinner, the phone rang",
      options: ["was cooking", "cooked", "cooks"],
      correct: "was cooking",
      explanation: "Past Continuous → was cooking.",
    },
    {
      template: "We ___ pizza for lunch",
      options: ["eat", "ate", "eating"],
      correct: "ate",
      explanation: "Past Simple של eat → ate.",
    },
    {
      template: "He ___ to school early this morning",
      options: ["come", "came", "coming"],
      correct: "came",
      explanation: "Past Simple של come → came.",
    },
    {
      template: "I ___ my keys when I was leaving",
      options: ["lost", "lose", "losing"],
      correct: "lost",
      explanation: "Past Simple של lose → lost.",
    },
    {
      template: "The children ___ playing when it started raining",
      options: ["was", "were", "are"],
      correct: "were",
      explanation: "Past Continuous → were playing.",
    },
    {
      template: "She ___ a beautiful picture",
      options: ["draw", "drew", "drawing"],
      correct: "drew",
      explanation: "Past Simple של draw → drew.",
    },
    {
      template: "We ___ at the library all afternoon",
      options: ["study", "studied", "studying"],
      correct: "studied",
      explanation: "Past Simple → studied.",
    },
    {
      template: "While they ___ TV, the power went out",
      options: ["watched", "were watching", "watch"],
      correct: "were watching",
      explanation: "Past Continuous → were watching.",
    },
    {
      template: "I ___ my friend at the park yesterday",
      options: ["meet", "met", "meeting"],
      correct: "met",
      explanation: "Past Simple של meet → met.",
    },
    {
      template: "He ___ home late last night",
      options: ["come", "came", "coming"],
      correct: "came",
      explanation: "Past Simple של come → came.",
    },
  ],
  advanced: [
    {
      template: "If we ___ plastic, the beach stays clean",
      options: ["recycle", "recycled", "are recycling"],
      correct: "recycle",
      explanation: "Zero conditional.",
    },
    {
      template: "She ___ a presentation by tomorrow",
      options: ["will finish", "finished", "finishes"],
      correct: "will finish",
      explanation: "פעולה תושלם בעתיד → will + base.",
    },
    {
      template: "They have ___ studied renewable energy",
      options: ["already", "ever", "never"],
      correct: "already",
      explanation: "Present Perfect עם already.",
    },
    {
      template: "If it rains, we ___ at home",
      options: ["stay", "stayed", "will stay"],
      correct: "will stay",
      explanation: "First conditional → will stay.",
    },
    {
      template: "I have ___ finished my project",
      options: ["already", "ever", "never"],
      correct: "already",
      explanation: "Present Perfect → already.",
    },
    {
      template: "If you study hard, you ___ the test",
      options: ["pass", "passed", "will pass"],
      correct: "will pass",
      explanation: "First conditional → will pass.",
    },
    {
      template: "She has ___ been to London",
      options: ["never", "ever", "already"],
      correct: "never",
      explanation: "Present Perfect → never.",
    },
    {
      template: "If you heat water, it ___",
      options: ["boils", "boiled", "will boil"],
      correct: "boils",
      explanation: "Zero conditional → boils.",
    },
    {
      template: "We have ___ learned about space",
      options: ["already", "ever", "never"],
      correct: "already",
      explanation: "Present Perfect → already.",
    },
    {
      template: "If I have time, I ___ help you",
      options: ["help", "helped", "will help"],
      correct: "will help",
      explanation: "First conditional → will help.",
    },
    {
      template: "Have you ___ visited Paris?",
      options: ["ever", "never", "already"],
      correct: "ever",
      explanation: "שאלה ב-Present Perfect → ever.",
    },
    {
      template: "If we don't hurry, we ___ late",
      options: ["are", "were", "will be"],
      correct: "will be",
      explanation: "First conditional → will be.",
    },
    {
      template: "I have ___ seen that movie",
      options: ["already", "ever", "never"],
      correct: "already",
      explanation: "Present Perfect → already.",
    },
    {
      template: "If she comes early, we ___ start on time",
      options: ["start", "started", "will start"],
      correct: "will start",
      explanation: "First conditional → will start.",
    },
    {
      template: "They have ___ finished their homework",
      options: ["already", "ever", "never"],
      correct: "already",
      explanation: "Present Perfect → already.",
    },
    {
      template: "If you don't study, you ___ pass",
      options: ["don't", "didn't", "won't"],
      correct: "won't",
      explanation: "First conditional שלילי → won't.",
    },
  ],
};

const TRANSLATION_POOLS = {
  classroom: [
    { en: "Please sit down", he: "בבקשה שבו" },
    { en: "Open your notebook", he: "פתחו את המחברת" },
    { en: "Raise your hand", he: "הרימו את היד" },
    { en: "Listen carefully", he: "הקשיבו היטב" },
    { en: "Write the date", he: "כתבו את התאריך" },
    { en: "Close the door softly", he: "סגרו את הדלת בעדינות" },
  ],
  routines: [
    { en: "I brush my teeth at night", he: "אני מצחצח שיניים בלילה" },
    { en: "She drinks milk every morning", he: "היא שותה חלב בכל בוקר" },
    { en: "We walk the dog after school", he: "אנחנו מטיילים עם הכלב אחרי בית הספר" },
    { en: "My brother cleans his room on Friday", he: "אחי מנקה את החדר שלו ביום שישי" },
    { en: "They read a story before bed", he: "הם קוראים סיפור לפני השינה" },
    { en: "Dad cooks dinner on Sundays", he: "אבא מבשל ארוחת ערב בימי ראשון" },
  ],
  hobbies: [
    { en: "We play basketball after school", he: "אנחנו משחקים כדורסל אחרי בית הספר" },
    { en: "My sister paints colorful pictures", he: "אחותי מציירת ציורים צבעוניים" },
    { en: "It is windy, so we fly a kite", he: "יש רוח, אז אנחנו מעיפים עפיפון" },
    { en: "He collects stickers of animals", he: "הוא אוסף מדבקות של חיות" },
    { en: "They practice piano every Tuesday", he: "הם מתרגלים פסנתר בכל יום שלישי" },
    { en: "I like to build Lego cities", he: "אני אוהב לבנות ערי לגו" },
  ],
  community: [
    { en: "The library is next to the park", he: "הספרייה נמצאת ליד הפארק" },
    { en: "We visited the science museum", he: "ביקרנו במוזיאון המדע" },
    { en: "Please recycle the bottles in the bin", he: "בבקשה ממחזרו את הבקבוקים בפח" },
    { en: "The market is crowded on Fridays", he: "השוק עמוס בימי שישי" },
    { en: "Our town celebrates a music festival", he: "העיר שלנו חוגגת פסטיבל מוזיקה" },
    { en: "The nurse helps people feel better", he: "האחות עוזרת לאנשים להרגיש טוב יותר" },
  ],
  technology: [
    { en: "She is coding a friendly robot", he: "היא כותבת קוד לרובוט ידידותי" },
    { en: "We use tablets for digital art", he: "אנחנו משתמשים בטאבלטים לאמנות דיגיטלית" },
    { en: "The drone takes photos of the field", he: "הרחפן מצלם את השדה" },
    { en: "He uploads a podcast every week", he: "הוא מעלה פודקאסט בכל שבוע" },
    { en: "Our class designs a smart garden", he: "הכיתה שלנו מתכננת גינה חכמה" },
    { en: "They research clean energy online", he: "הם חוקרים אנרגיה נקייה באינטרנט" },
  ],
  global: [
    { en: "If we save water, rivers stay clean", he: "אם אנחנו חוסכים במים, הנהרות נשארים נקיים" },
    { en: "Planting trees helps our planet breathe", he: "נטיעת עצים עוזרת לכדור הארץ לנשום" },
    { en: "We write about cultures around the world", he: "אנחנו כותבים על תרבויות ברחבי העולם" },
    { en: "She reads news about space missions", he: "היא קוראת חדשות על משימות חלל" },
    { en: "They discuss how communities share water", he: "הם דנים כיצד קהילות חולקות מים" },
    { en: "Working together keeps the ocean blue", he: "עבודה משותפת שומרת על האוקיינוס כחול" },
  ],
};

const WRITING_SENTENCES_BASIC = [
  { en: "Good morning", he: "בוקר טוב" },
  { en: "Good night", he: "לילה טוב" },
  { en: "I love my dog", he: "אני אוהב את הכלב שלי" },
  { en: "I am happy", he: "אני שמח" },
];

const WRITING_SENTENCES_ADVANCED = [
  { en: "I will visit my grandparents tomorrow", he: "אני אבקר את סבא וסבתא מחר" },
  { en: "We are going to start a science project", he: "אנחנו הולכים להתחיל פרויקט מדעים" },
  { en: "If it rains, we will stay at home", he: "אם ירד גשם, נישאר בבית" },
  { en: "I have already finished my homework", he: "כבר סיימתי את שיעורי הבית שלי" },
];

const WRITING_SENTENCES_MASTER = [
  { en: "We should protect the forest to keep animals safe", he: "אנחנו צריכים להגן על היער כדי לשמור על החיות" },
  { en: "By working together, we can solve difficult problems", he: "בעבודה משותפת נוכל לפתור בעיות קשות" },
  { en: "I have never forgotten the trip to the science park", he: "מעולם לא שכחתי את הטיול לפארק המדע" },
  { en: "If we recycle plastic, the beach stays beautiful", he: "אם נמחזר פלסטיק, החוף יישאר יפה" },
];

const DEFAULT_GRADE_PROFILE = {
  choiceCount: 4,
  translationPools: ["routines"],
  grammarPools: ["present_simple"],
  sentencePools: ["routine"],
  writingPools: ["word", "sentence_basic"],
  vocabDirections: ["en_to_he", "he_to_en"],
};

const GRADE_PROFILES = {
  g1: {
    ...DEFAULT_GRADE_PROFILE,
    choiceCount: 2,
    translationPools: ["classroom"],
    grammarPools: ["be_basic"],
    sentencePools: ["base"],
    writingPools: ["word"],
    vocabDirections: ["en_to_he", "en_to_he", "he_to_en"],
  },
  g2: {
    ...DEFAULT_GRADE_PROFILE,
    choiceCount: 3,
    translationPools: ["classroom", "routines"],
    grammarPools: ["be_basic", "question_frames"],
    sentencePools: ["base", "routine"],
    writingPools: ["word", "sentence_basic"],
  },
  g3: {
    ...DEFAULT_GRADE_PROFILE,
    translationPools: ["routines", "hobbies"],
    grammarPools: ["present_simple", "question_frames"],
    sentencePools: ["routine", "descriptive"],
    writingPools: ["word", "sentence_basic"],
  },
  g4: {
    ...DEFAULT_GRADE_PROFILE,
    translationPools: ["hobbies", "community"],
    grammarPools: ["present_simple", "progressive", "quantifiers"],
    sentencePools: ["descriptive", "narrative"],
    writingPools: ["word", "sentence_basic", "sentence_extended"],
  },
  g5: {
    ...DEFAULT_GRADE_PROFILE,
    translationPools: ["community", "technology"],
    grammarPools: ["past_simple", "modals", "comparatives", "future_forms"],
    sentencePools: ["narrative", "advanced"],
    writingPools: ["sentence_extended", "sentence_extended", "word"],
  },
  g6: {
    ...DEFAULT_GRADE_PROFILE,
    translationPools: ["technology", "global"],
    grammarPools: ["complex_tenses", "conditionals", "modals", "comparatives"],
    sentencePools: ["advanced"],
    writingPools: ["sentence_extended", "sentence_master"],
    vocabDirections: ["he_to_en", "en_to_he", "he_to_en"],
  },
};

function getLevelForGrade(levelKey, gradeKey) {
  const base = LEVELS[levelKey] || LEVELS.easy;
  const factor = GRADE_FACTORS[gradeKey] || 1;
  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  return {
    name: base.name,
    maxWords: clamp(Math.round(base.maxWords * factor), 3, 20),
    complexity: base.complexity,
  };
}

function buildTop10ByScore(saved, level) {
  const allScores = [];
  Object.keys(TOPICS).forEach((topic) => {
    const key = `${level}_${topic}`;
    const levelData = saved[key] || [];
    if (Array.isArray(levelData)) {
      levelData.forEach((entry) => {
        const bestScore = entry.bestScore ?? entry.score ?? 0;
        const bestStreak = entry.bestStreak ?? entry.streak ?? 0;
        if (bestScore > 0) {
          allScores.push({
            name: entry.playerName || entry.name || "שחקן",
            bestScore,
            bestStreak,
            topic,
            timestamp: entry.timestamp || 0,
          });
        }
      });
    } else {
      Object.entries(levelData).forEach(([name, data]) => {
        const bestScore = data.bestScore ?? data.score ?? 0;
        const bestStreak = data.bestStreak ?? data.streak ?? 0;
        if (bestScore > 0) {
          allScores.push({
            name,
            bestScore,
            bestStreak,
            topic,
            timestamp: data.timestamp || 0,
          });
        }
      });
    }
  });
  const sorted = allScores
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
      topic: "",
      timestamp: 0,
      placeholder: true,
    });
  }
  return sorted;
}

function saveScoreEntry(saved, key, entry) {
  let levelData = saved[key];
  if (!levelData) {
    levelData = [];
  } else if (!Array.isArray(levelData)) {
    levelData = Object.entries(levelData).map(([name, data]) => ({
      playerName: name,
      bestScore: data.bestScore ?? data.score ?? 0,
      bestStreak: data.bestStreak ?? data.streak ?? 0,
      timestamp: data.timestamp || 0,
    }));
  }
  levelData.push(entry);
  if (levelData.length > 100) {
    levelData = levelData.slice(-100);
  }
  saved[key] = levelData;
}

function generateQuestion(level, topic, gradeKey, mixedOps = null) {
  const isMixed = topic === "mixed";
  let selectedTopic;
  
  if (isMixed) {
    let availableTopics;
    if (mixedOps) {
      availableTopics = Object.entries(mixedOps)
        .filter(([t, selected]) => selected && t !== "mixed")
        .map(([t]) => t);
    } else {
      availableTopics = GRADES[gradeKey].topics.filter((t) => t !== "mixed");
    }
    if (availableTopics.length === 0) {
      availableTopics = GRADES[gradeKey].topics.filter((t) => t !== "mixed");
    }
    selectedTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
  } else {
    selectedTopic = topic;
  }

  let question,
    correctAnswer,
    params = {};
  let qType = "choice"; // ברירת מחדל – שאלת בחירה
  const gradeConfig = GRADES[gradeKey] || GRADES.g3;
  const gradeProfile = GRADE_PROFILES[gradeKey] || DEFAULT_GRADE_PROFILE;
  const gradeWordLists = (gradeConfig.wordLists || []).filter(
    (list) => WORD_LISTS[list]
  );
  const fallbackWordLists = gradeWordLists.length
    ? gradeWordLists
    : Object.keys(WORD_LISTS);
  const selectedList =
    fallbackWordLists[Math.floor(Math.random() * fallbackWordLists.length)];
  const words = WORD_LISTS[selectedList] || WORD_LISTS.colors;
  const wordEntries = Object.entries(words);
  const randomWord =
    wordEntries[Math.floor(Math.random() * wordEntries.length)] || [
      "sun",
      "שמש",
    ];

  switch (selectedTopic) {
    case "vocabulary": {
      const vocabDirections =
        gradeProfile.vocabDirections || ["en_to_he", "he_to_en"];
      const directionKey =
        vocabDirections[Math.floor(Math.random() * vocabDirections.length)];
      const directionIsEnglish = directionKey === "en_to_he";
      if (directionIsEnglish) {
        question = `מה פירוש המילה "${randomWord[0]}"\u200F?`;
        correctAnswer = randomWord[1];
        params = {
          word: randomWord[0],
          translation: randomWord[1],
          direction: "en_to_he",
        };
      } else {
        question = `מה פירוש המילה "${randomWord[1]}"\u200F?`;
        correctAnswer = randomWord[0];
        params = {
          word: randomWord[1],
          translation: randomWord[0],
          direction: "he_to_en",
        };
      }
      break;
    }

    case "grammar": {
      const grammarPools = gradeProfile.grammarPools || ["present_simple"];
      let pool = [];
      grammarPools.forEach((key) => {
        if (GRAMMAR_POOLS[key]) {
          pool = pool.concat(GRAMMAR_POOLS[key]);
        }
      });
      if (pool.length === 0) {
        pool = Object.values(GRAMMAR_POOLS).flat();
      }
      const grammarQ = pool[Math.floor(Math.random() * pool.length)];
      question = grammarQ.question;
      correctAnswer = grammarQ.correct;
      params = { explanation: grammarQ.explanation };
      break;
    }

    case "translation": {
      const translationPools = gradeProfile.translationPools || ["classroom"];
      let sentencesPool = [];
      translationPools.forEach((key) => {
        if (TRANSLATION_POOLS[key]) {
          sentencesPool = sentencesPool.concat(TRANSLATION_POOLS[key]);
        }
      });
      if (sentencesPool.length === 0) {
        sentencesPool = Object.values(TRANSLATION_POOLS).flat();
      }
      const sentence =
        sentencesPool[Math.floor(Math.random() * sentencesPool.length)];
      const direction = Math.random() > 0.5 ? "en_to_he" : "he_to_en";
      if (direction === "en_to_he") {
        question = `תרגם: "${sentence.en}"`;
        correctAnswer = sentence.he;
        params = {
          sentence: sentence.en,
          translation: sentence.he,
          direction: "en_to_he",
        };
      } else {
        question = `תרגם: "${sentence.he}"`;
        correctAnswer = sentence.en;
        params = {
          sentence: sentence.he,
          translation: sentence.en,
          direction: "he_to_en",
        };
      }
      break;
    }

    case "sentences": {
      const sentencePools = gradeProfile.sentencePools || ["routine"];
      let pool = [];
      sentencePools.forEach((key) => {
        if (SENTENCE_POOLS[key]) {
          pool = pool.concat(SENTENCE_POOLS[key]);
        }
      });
      if (pool.length === 0) {
        pool = SENTENCE_POOLS.base;
      }
      const template =
        pool[Math.floor(Math.random() * pool.length)] || SENTENCE_POOLS.base[0];
      question = `השלם את המשפט: "${template.template}"`;
      correctAnswer = template.correct;
      params = { template: template.template, explanation: template.explanation };
      break;
    }

    case "writing": {
      const writingPools = gradeProfile.writingPools || ["word"];
      const mode =
        writingPools[Math.floor(Math.random() * writingPools.length)] || "word";
      if (mode === "word") {
        const [en, he] = randomWord;
        question = `כתוב באנגלית: "${he}"`;
        correctAnswer = en;
        params = {
          type: "word",
          wordHe: he,
          wordEn: en,
          direction: "he_to_en",
        };
      } else {
        let pool = WRITING_SENTENCES_BASIC;
        if (mode === "sentence_extended") {
          pool = WRITING_SENTENCES_ADVANCED;
        } else if (mode === "sentence_master") {
          pool = WRITING_SENTENCES_MASTER;
        }
        const s = pool[Math.floor(Math.random() * pool.length)];
        question = `כתוב באנגלית: "${s.he}"`;
        correctAnswer = s.en;
        params = {
          type: "sentence",
          sentenceHe: s.he,
          sentenceEn: s.en,
          direction: "he_to_en",
        };
        qType = "typing";
        break;
      }
      qType = "typing";
      break;
    }

    case "mixed": {
      const availableTopics = GRADES[gradeKey].topics.filter((t) => t !== "mixed");
      const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      return generateQuestion(level, randomTopic, gradeKey);
    }
  }

  let allAnswers = [];
  if (qType === "choice") {
    // יצירת תשובות שגויות רק לשאלות בחירה
  const targetChoices = Math.max(2, gradeProfile.choiceCount || 4);
  const wrongNeeded = Math.max(1, targetChoices - 1);
  const wrongAnswers = new Set();
  while (wrongAnswers.size < wrongNeeded) {
    let wrong;
    if (selectedTopic === "vocabulary") {
      if (params.direction === "he_to_en") {
          const allEnglishWords = Object.values(WORD_LISTS).flatMap((list) =>
            Object.keys(list)
          );
          wrong =
            allEnglishWords[Math.floor(Math.random() * allEnglishWords.length)];
      } else {
          const allHebrewWords = Object.values(WORD_LISTS).flatMap((list) =>
            Object.values(list)
          );
          wrong =
            allHebrewWords[Math.floor(Math.random() * allHebrewWords.length)];
      }
    } else if (selectedTopic === "grammar" || selectedTopic === "sentences") {
        const allOptions = [
          "am",
          "is",
          "are",
          "go",
          "goes",
          "have",
          "has",
          "read",
          "reads",
          "play",
          "plays",
        ];
      wrong = allOptions[Math.floor(Math.random() * allOptions.length)];
    } else {
      if (params.direction === "he_to_en") {
          const allEnglishWords = Object.values(WORD_LISTS).flatMap((list) =>
            Object.keys(list)
          );
          wrong =
            allEnglishWords[Math.floor(Math.random() * allEnglishWords.length)];
      } else {
          const allHebrewWords = Object.values(WORD_LISTS).flatMap((list) =>
            Object.values(list)
          );
          wrong =
            allHebrewWords[Math.floor(Math.random() * allHebrewWords.length)];
      }
    }
    if (wrong !== correctAnswer && !wrongAnswers.has(wrong)) {
      wrongAnswers.add(wrong);
    }
  }
    allAnswers = [correctAnswer, ...Array.from(wrongAnswers)].slice(
      0,
      targetChoices
    );
  for (let i = allAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
    }
  }

  return {
    question,
    correctAnswer,
    answers: allAnswers,
    topic: selectedTopic,
    params,
    qType,
  };
}

// פונקציה ליצירת רמז
function getHint(question, topic, gradeKey) {
  if (!question || !question.params) return "";
  switch (topic) {
    case "vocabulary":
      if (question.params.direction === "en_to_he") {
        return `נסה לחשוב על המילה "${question.params.word}" - מה הפירוש שלה בעברית?`;
      } else {
        return `נסה לחשוב על המילה "${question.params.word}" - מה הפירוש שלה באנגלית?`;
      }
    case "grammar":
      return question.params.explanation || "זכור: I am, You/We/They are, He/She/It is";
    case "translation":
      if (question.params.direction === "en_to_he") {
        return `תרגם מילה אחר מילה: "${question.params.sentence}"`;
      } else {
        return `תרגם מילה אחר מילה: "${question.params.sentence}"`;
      }
    case "sentences":
      return question.params.explanation || "בדוק מה מתאים: I/You/We/They = are, He/She/It = is";
    case "writing":
      if (question.params?.type === "word" && question.params.wordHe) {
        return `כתוב באנגלית את המילה "${question.params.wordHe}". שים לב לאיות (spelling) של כל אות.`;
      }
      if (question.params?.type === "sentence" && question.params.sentenceHe) {
        return `נסה לפרק את המשפט "${question.params.sentenceHe}" למילים באנגלית. התחל באות גדולה בתחילת המשפט.`;
      }
      return "בדוק אות אחר אות באנגלית, בלי למהר.";
    default:
      return "נסה לחשוב על התשובה צעד אחר צעד";
  }
}

// פונקציית עזר למיספור צעדים
function makeStep(num, text) {
  return (
    <div
      key={num}
      dir="rtl"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.4rem",
      }}
    >
      {/* המספר – תמיד מיושר וכיווני LTR כדי שלא יברח לסוף */}
      <span
        dir="ltr"
        style={{
          minWidth: "1.5em",
          textAlign: "center",
          fontWeight: 700,
        }}
      >
        .{num}
      </span>
      {/* הטקסט – בעברית, RTL */}
      <span style={{ flex: 1 }}>{text}</span>
    </div>
  );
}

// הסבר מפורט צעד-אחר-צעד לפי נושא וכיתה
function getSolutionSteps(question, topic, gradeKey) {
  if (!question || !question.params) return [];
  const { correctAnswer } = question;

  switch (topic) {
    case "vocabulary": {
      if (question.params.direction === "en_to_he") {
        return [
          makeStep(1, `נבין שהמילה "${question.params.word}" היא באנגלית.`),
          makeStep(2, "נחפש את הפירוש של המילה בעברית."),
          makeStep(3, `הפירוש הנכון הוא: ${correctAnswer}.`),
          makeStep(4, "נבדוק שהפירוש הגיוני ונכון."),
        ];
      } else {
        return [
          makeStep(1, `נבין שהמילה "${question.params.word}" היא בעברית.`),
          makeStep(2, "נחפש את הפירוש של המילה באנגלית."),
          makeStep(3, `הפירוש הנכון הוא: ${correctAnswer}.`),
          makeStep(4, "נבדוק שהפירוש הגיוני ונכון."),
        ];
      }
    }

    case "grammar": {
      return [
        makeStep(1, "נבין את כללי הדקדוק באנגלית."),
        makeStep(
          2,
          "I (אני) = am, You/We/They (אתה/אנחנו/הם) = are, He/She/It (הוא/היא/זה) = is."
        ),
        makeStep(3, `התשובה הנכונה היא: ${correctAnswer}.`),
        makeStep(
          4,
          question.params.explanation ||
            "נבדוק שהתשובה מתאימה לנושא המשפט."
        ),
      ];
    }

    case "translation": {
      if (question.params.direction === "en_to_he") {
        return [
          makeStep(
            1,
            `נקרא את המשפט באנגלית: "${question.params.sentence}".`
          ),
          makeStep(2, "ננסה לתרגם כל מילה או חלק מהמשפט."),
          makeStep(3, "נחבר את המילים למשפט בעברית."),
          makeStep(4, `התרגום הנכון: ${correctAnswer}.`),
        ];
      } else {
        return [
          makeStep(
            1,
            `נקרא את המשפט בעברית: "${question.params.sentence}".`
          ),
          makeStep(2, "ננסה לתרגם כל מילה או חלק מהמשפט לאנגלית."),
          makeStep(3, "נחבר את המילים למשפט באנגלית."),
          makeStep(4, `התרגום הנכון: ${correctAnswer}.`),
        ];
      }
    }

    case "sentences": {
      return [
        makeStep(1, `נקרא את המשפט: "${question.params.template}".`),
        makeStep(
          2,
          "נבין מה חסר במשפט - איזו מילה או צורה דקדוקית."
        ),
        makeStep(
          3,
          "נבדוק מה מתאים לפי כללי הדקדוק: I/You/We/They = are, He/She/It = is."
        ),
        makeStep(
          4,
          `התשובה הנכונה: ${correctAnswer}. ${
            question.params.explanation || ""
          }`
        ),
      ];
    }

    case "writing": {
      if (question.params.type === "word") {
        return [
          makeStep(
            1,
            `נקרא את המילה בעברית: "${question.params.wordHe}".`
          ),
          makeStep(2, "נזכר בצורה שלה באנגלית שלמדנו קודם."),
          makeStep(
            3,
            "נכתוב אות-אחר-אות, ושמים לב לאיות (spelling)."
          ),
          makeStep(4, `התשובה הנכונה היא: ${correctAnswer}.`),
        ];
      }
      if (question.params.type === "sentence") {
        return [
          makeStep(
            1,
            `נקרא את המשפט בעברית: "${question.params.sentenceHe}".`
          ),
          makeStep(
            2,
            "נפרק את המשפט לחלקים ונחשוב איך אומרים כל חלק באנגלית."
          ),
          makeStep(
            3,
            "נבדוק סדר מילים נכון ואות גדולה בתחילת המשפט."
          ),
          makeStep(4, `המשפט הנכון באנגלית: ${correctAnswer}.`),
        ];
      }
      return [];
  }

    default:
  return [];
  }
}

// "למה טעיתי?" – הסבר קצר לטעות נפוצה
function getErrorExplanation(question, topic, wrongAnswer, gradeKey) {
  if (!question) return "";
  const userAns = String(wrongAnswer).toLowerCase();
  const correctAns = String(question.correctAnswer).toLowerCase();

  switch (topic) {
    case "vocabulary":
      return "בדוק שוב: האם הפירוש שאתה בחרת מתאים למילה? נסה לחשוב על המילה בעברית/אנגלית ולמצוא את הפירוש הנכון.";

    case "grammar":
      if (userAns === "is" && correctAns === "am") {
        return "זכור: I (אני) תמיד עם am, לא is. I am = אני.";
      }
      if (userAns === "am" && (correctAns === "is" || correctAns === "are")) {
        return "זכור: am משמש רק עם I (אני). He/She/It = is, You/We/They = are.";
      }
      return "בדוק שוב את כללי הדקדוק: I am, You/We/They are, He/She/It is.";

    case "translation":
      return "בדוק שוב: האם תרגמת את כל המילים נכון? נסה לחשוב על המשמעות של המשפט ולא רק על מילים בודדות.";

    case "sentences":
      return "בדוק שוב: האם המילה שבחרת מתאימה לנושא המשפט? זכור: I/You/We/They = are, He/She/It = is.";

    case "writing":
      return "כנראה שטעית באיות (spelling). בדוק שוב אות-אחר-אות, שים לב ל־th / sh / ch ולסיום המילה (s / ed / ing).";

    default:
      return "";
  }
}

export default function EnglishMaster() {
  useIOSViewportFix();
  const router = useRouter();
  const wrapRef = useRef(null);
  const headerRef = useRef(null);
  const gameRef = useRef(null);
  const controlsRef = useRef(null);
  const topicSelectRef = useRef(null);
  const sessionStartRef = useRef(null);
  const solvedCountRef = useRef(0);
  const yearMonthRef = useRef(getCurrentYearMonth());

  const [mounted, setMounted] = useState(false);
  const [grade, setGrade] = useState("g3");
  const [gradeNumber, setGradeNumber] = useState(() => {
    const idx = GRADE_ORDER.indexOf("g3");
    return idx >= 0 ? idx + 1 : 3;
  });
  const [mode, setMode] = useState("learning");
  const [practiceFocus, setPracticeFocus] = useState("balanced");
  const [focusedPracticeMode, setFocusedPracticeMode] = useState("normal");
  const [useStoryQuestions, setUseStoryQuestions] = useState(false);
  const [storyOnly, setStoryOnly] = useState(false);
  const [level, setLevel] = useState("easy");
  const [topic, setTopic] = useState("vocabulary");
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [recentQuestions, setRecentQuestions] = useState(new Set());
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showBadge, setShowBadge] = useState(null);
  const [showPracticeOptions, setShowPracticeOptions] = useState(false);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [progress, setProgress] = useState({
    vocabulary: { total: 0, correct: 0 },
    grammar: { total: 0, correct: 0 },
    translation: { total: 0, correct: 0 },
    sentences: { total: 0, correct: 0 },
    writing: { total: 0, correct: 0 },
  });
  const [dailyChallenge, setDailyChallenge] = useState({
    date: new Date().toDateString(),
    bestScore: 0,
    questions: 0,
    correct: 0,
  });
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  // הסבר מפורט לשאלה
  const [showSolution, setShowSolution] = useState(false);

  // הסבר לטעות אחרונה
  const [errorExplanation, setErrorExplanation] = useState("");

  const [showMixedSelector, setShowMixedSelector] = useState(false);
  const [mixedTopics, setMixedTopics] = useState({
    vocabulary: true,
    grammar: false,
    translation: true,
    sentences: false,
    writing: false,
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardLevel, setLeaderboardLevel] = useState("easy");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showHowTo, setShowHowTo] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [referenceCategory, setReferenceCategory] = useState(REFERENCE_CATEGORY_KEYS[0]);
  const [monthlyProgress, setMonthlyProgress] = useState({
    totalMinutes: 0,
    totalExercises: 0,
  });
  const [goalPercent, setGoalPercent] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(MONTHLY_MINUTES_TARGET);
  const [rewardChoice, setRewardChoice] = useState(null);
const refreshMonthlyProgress = useCallback(() => {
  if (typeof window === "undefined") return;
  try {
    const all = loadMonthlyProgress();
    const current = all[yearMonthRef.current] || { totalMinutes: 0, totalExercises: 0 };
    setMonthlyProgress(current);
    const percent = MONTHLY_MINUTES_TARGET
      ? Math.min(100, Math.round((current.totalMinutes / MONTHLY_MINUTES_TARGET) * 100))
      : 0;
    setGoalPercent(percent);
    setMinutesRemaining(Math.max(0, MONTHLY_MINUTES_TARGET - current.totalMinutes));
    const choice = loadRewardChoice(yearMonthRef.current);
    setRewardChoice(choice);
  } catch {
    // ignore
  }
}, []);
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("mleo_player_name") || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  const [playerAvatar, setPlayerAvatar] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("mleo_player_avatar") || "👤";
      } catch {
        return "👤";
      }
    }
    return "👤";
  });
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const gradeLabels = ["א", "ב", "ג", "ד", "ה", "ו"];
  const [weeklyChallenge, setWeeklyChallenge] = useState({
    target: 50,
    current: 0,
    completed: false,
  });

  useEffect(() => {
    const idx = GRADE_ORDER.indexOf(grade);
    if (idx !== -1 && gradeNumber !== idx + 1) {
      setGradeNumber(idx + 1);
    }
  }, [grade, gradeNumber]);

  useEffect(() => {
    refreshMistakes();
  }, []);

  useEffect(() => {
    refreshMonthlyProgress();
  }, [refreshMonthlyProgress]);

  const handleGradeNumberChange = (value) => {
    const numeric = Number(value);
    if (!numeric) return;
    const nextGradeKey = GRADE_ORDER[numeric - 1] || "g3";
    setGradeNumber(numeric);
    setGrade(nextGradeKey);
    setGameActive(false);
  };

  function persistProgressSnapshot(newProgress) {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY + "_progress") || "{}"
      );
      saved.progress = newProgress;
      localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
    } catch {}
  }

  function updateTopicProgress(topic, isCorrect) {
    if (!topic) return;
    setProgress((prev) => {
      const prevEntry = prev[topic] || { total: 0, correct: 0 };
      const updated = {
        ...prev,
        [topic]: {
          total: (prevEntry.total || 0) + 1,
          correct: (prevEntry.correct || 0) + (isCorrect ? 1 : 0),
        },
      };
      persistProgressSnapshot(updated);
      return updated;
    });
  }

  function refreshMistakes() {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem("mleo_english_mistakes") || "[]");
      setMistakes(saved.slice(-50).reverse());
    } catch {}
  }

  function clearMistakes() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("mleo_english_mistakes");
      setMistakes([]);
    } catch {}
  }

  function handleMistakePractice(entry) {
    if (!entry) return;
    const gradeKey = entry.grade || grade;
    const levelKey = entry.level || level;
    const topicKey = entry.topic || "vocabulary";
    const gradeIdx = GRADE_ORDER.indexOf(gradeKey);
    if (gradeIdx !== -1) {
      setGradeNumber(gradeIdx + 1);
    }
    setGrade(gradeKey);
    setLevel(levelKey);
    setTopic(topicKey);
    setMode("learning");
    setGameActive(false);
    setShowPracticeModal(false);
    setTimeout(() => {
      if (playerName.trim()) {
        startGame();
      } else {
        setFeedback("הכנס שם שחקן כדי לתרגל את הטעות שנבחרה");
      }
    }, 200);
  }

  function logEnglishMistakeEntry(entry) {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(
        localStorage.getItem("mleo_english_mistakes") || "[]"
      );
      saved.push({ ...entry, timestamp: Date.now() });
      if (saved.length > 200) saved.shift();
      localStorage.setItem("mleo_english_mistakes", JSON.stringify(saved));
      refreshMistakes();
    } catch {}
  }

  function trackCurrentQuestionTime() {
    if (!questionStartTime || !currentQuestion) return;
    const duration = (Date.now() - questionStartTime) / 1000;
    if (duration > 0 && duration < 300) {
      const qGrade = currentQuestion.gradeKey || grade;
      const qLevel = currentQuestion.levelKey || level;
      trackEnglishTopicTime(currentQuestion.topic, qGrade, qLevel, duration);
    }
  }

  function recordSessionProgress() {
    if (!sessionStartRef.current) return;
    const elapsedMs = Date.now() - sessionStartRef.current;
    if (elapsedMs <= 0) {
      sessionStartRef.current = null;
      solvedCountRef.current = 0;
      return;
    }
    const durationMinutes = Math.max(1, Math.round(elapsedMs / 60000));
    const exercises = Math.max(solvedCountRef.current, totalQuestions);
    addSessionProgress(durationMinutes, exercises);
    refreshMonthlyProgress();
    sessionStartRef.current = null;
    solvedCountRef.current = 0;
  }

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const key = `${level}_${topic}`;
        if (saved[key] && playerName.trim()) {
          if (Array.isArray(saved[key])) {
            const playerScores = saved[key].filter(
              (s) => s.playerName === playerName.trim()
            );
            if (playerScores.length > 0) {
              const maxScore = Math.max(
                ...playerScores.map((s) => s.bestScore || 0),
                0
              );
              const maxStreak = Math.max(
                ...playerScores.map((s) => s.bestStreak || 0),
                0
              );
              setBestScore(maxScore);
              setBestStreak(maxStreak);
            } else {
              setBestScore(0);
              setBestStreak(0);
            }
          } else {
            if (saved[key][playerName.trim()]) {
              setBestScore(saved[key][playerName.trim()].bestScore || 0);
              setBestStreak(saved[key][playerName.trim()].bestStreak || 0);
            } else {
              setBestScore(0);
              setBestStreak(0);
            }
          }
        } else {
          setBestScore(0);
          setBestStreak(0);
        }
      } catch {}
    }
  }, [level, topic, playerName]);

  useEffect(() => {
    return () => {
      recordSessionProgress();
    };
  }, []);

  useEffect(() => {
    if (showMixedSelector) return;
    const allowed = GRADES[grade].topics;
    if (!allowed.includes(topic)) {
      const firstAllowed = allowed.find((t) => t !== "mixed") || allowed[0];
      setTopic(firstAllowed);
    }
  }, [grade]);

  useEffect(() => {
    const availableTopics = GRADES[grade].topics.filter((t) => t !== "mixed");
    const newMixedTopics = {
      vocabulary: availableTopics.includes("vocabulary"),
      grammar: availableTopics.includes("grammar"),
      translation: availableTopics.includes("translation"),
      sentences: availableTopics.includes("sentences"),
      writing: availableTopics.includes("writing"),
    };
    setMixedTopics(newMixedTopics);
  }, [grade]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyChallenge.date !== today) {
      setDailyChallenge({ date: today, bestScore: 0, questions: 0, correct: 0 });
    }
  }, [dailyChallenge.date]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
      if (saved.stars) setStars(saved.stars);
      if (saved.badges) setBadges(saved.badges);
      if (saved.playerLevel) setPlayerLevel(saved.playerLevel);
      if (saved.xp) setXp(saved.xp);
      if (saved.progress) {
        setProgress((prev) => ({
          ...prev,
          ...saved.progress,
        }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (showLeaderboard && typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const topScores = buildTop10ByScore(saved, leaderboardLevel);
        setLeaderboardData(topScores);
      } catch (e) {
        console.error("Error loading leaderboard:", e);
        setLeaderboardData([]);
      }
    }
  }, [showLeaderboard, leaderboardLevel]);

  useEffect(() => {
    if (!wrapRef.current || !mounted) return;
    const calc = () => {
      const rootH = window.visualViewport?.height ?? window.innerHeight;
      const headH = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty("--head-h", headH + "px");
      const controlsH = controlsRef.current?.offsetHeight || 40;
      // Use more conservative calculation to ensure content doesn't get cut
      const used = headH + controlsH + 120 + 40;
      const freeH = Math.max(300, rootH - used);
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

  useEffect(() => {
    if (!gameActive || (mode !== "challenge" && mode !== "speed")) return;
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((prev) => (prev != null ? prev - 1 : prev));
    }, 1000);
    return () => clearTimeout(timer);
  }, [gameActive, mode, timeLeft]);

  function saveRunToStorage() {
    if (typeof window === "undefined" || !playerName.trim()) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const key = `${level}_${topic}`;
      saveScoreEntry(saved, key, {
        playerName: playerName.trim(),
        bestScore: score,
        bestStreak: streak,
        timestamp: Date.now(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      const playerScores = (saved[key] || []).filter(
        (s) => s.playerName === playerName.trim()
      );
      const maxScore = Math.max(
        ...playerScores.map((s) => s.bestScore || 0),
        0
      );
      const maxStreak = Math.max(
        ...playerScores.map((s) => s.bestStreak || 0),
        0
      );
      setBestScore(maxScore);
      setBestStreak(maxStreak);
      if (showLeaderboard) {
        const topScores = buildTop10ByScore(saved, leaderboardLevel);
        setLeaderboardData(topScores);
      }
    } catch {}
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
    setTypedAnswer("");
    setFeedback(null);
    setLives(3);
    setTotalQuestions(0);
    setAvgTime(0);
    setQuestionStartTime(null);
  }

  function generateNewQuestion() {
    let gradeForQuestion = grade;
    let levelForQuestion = level;
    let topicForState = topic;
    let mixedConfig = topic === "mixed" ? mixedTopics : null;

    if (focusedPracticeMode === "mistakes" && mistakes.length > 0) {
      const randomMistake =
        mistakes[Math.floor(Math.random() * mistakes.length)];
      if (randomMistake.grade) {
        gradeForQuestion = randomMistake.grade;
      }
      if (randomMistake.level) {
        levelForQuestion = randomMistake.level;
      }
      if (randomMistake.topic) {
        topicForState = randomMistake.topic;
      }
    }

    if (focusedPracticeMode === "graded") {
      levelForQuestion =
        correct < 5 ? "easy" : correct < 15 ? "medium" : level;
    }

    if (mode === "practice") {
      switch (practiceFocus) {
        case "vocab_core":
          topicForState = "vocabulary";
          break;
        case "grammar_forms":
          topicForState = "grammar";
          break;
        case "writing_lab":
          topicForState = "writing";
          break;
        case "translation_boost":
          topicForState = "translation";
          break;
        default:
          break;
      }
    }

    if (storyOnly) {
      topicForState = "translation";
    } else if (useStoryQuestions && topicForState !== "translation") {
      topicForState = Math.random() < 0.5 ? "translation" : topicForState;
    }

    const levelConfig = getLevelForGrade(levelForQuestion, gradeForQuestion);
    let question;
    let attempts = 0;
    const maxAttempts = 50;
    trackCurrentQuestionTime();
    do {
      question = generateQuestion(
        levelConfig,
        topicForState,
        gradeForQuestion,
        topicForState === "mixed" ? mixedConfig : null
      );
      attempts++;
      const questionKey = question.question;
      if (!recentQuestions.has(questionKey)) {
        setRecentQuestions((prev) => {
          const newSet = new Set(prev);
          newSet.add(questionKey);
          if (newSet.size > 20) {
            const first = Array.from(newSet)[0];
            newSet.delete(first);
          }
          return newSet;
        });
        break;
      }
    } while (attempts < maxAttempts);
    if (attempts >= maxAttempts) {
      setRecentQuestions(new Set());
    }
    question.gradeKey = gradeForQuestion;
    question.levelKey = levelForQuestion;
    question.practiceFocus = mode === "practice" ? practiceFocus : "default";
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setFeedback(null);
    setQuestionStartTime(Date.now());
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
  }

  function startGame() {
    recordSessionProgress();
    sessionStartRef.current = Date.now();
    solvedCountRef.current = 0;
    setRecentQuestions(new Set());
    setGameActive(true);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTotalQuestions(0);
    setAvgTime(0);
    setQuestionStartTime(null);
    setFeedback(null);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setLives(mode === "challenge" ? 3 : 0);
    setShowHint(false);
    setHintUsed(false);
    setShowBadge(null);
    setShowLevelUp(false);
    setShowSolution(false);
    setErrorExplanation("");
    if (mode === "challenge") {
      setTimeLeft(20);
    } else if (mode === "speed") {
      setTimeLeft(10);
    } else {
      setTimeLeft(null);
    }
    generateNewQuestion();
  }

  function stopGame() {
    trackCurrentQuestionTime();
    recordSessionProgress();
    setGameActive(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedAnswer(null);
    saveRunToStorage();
  }

  function handleTimeUp() {
    trackCurrentQuestionTime();
    recordSessionProgress();
    setWrong((prev) => prev + 1);
    setStreak(0);
    setFeedback("הזמן נגמר! המשחק נגמר! ⏰");
    setGameActive(false);
    setCurrentQuestion(null);
    setTimeLeft(0);
    saveRunToStorage();
    setTimeout(() => {
      hardResetGame();
    }, 2000);
  }

  function handleAnswer(answer) {
    if (selectedAnswer || !gameActive || !currentQuestion) return;
    setTotalQuestions((prevCount) => {
      const newCount = prevCount + 1;
      if (questionStartTime) {
        const elapsed = (Date.now() - questionStartTime) / 1000;
        setAvgTime((prevAvg) =>
          prevCount === 0 ? elapsed : (prevAvg * prevCount + elapsed) / newCount
        );
      }
      return newCount;
    });
    setSelectedAnswer(answer);
    solvedCountRef.current += 1;
    const normalize = (v) => String(v).trim().toLowerCase();
    const isCorrect =
      normalize(answer) === normalize(currentQuestion.correctAnswer);
    let awardedPoints = 0;
    if (isCorrect) {
      awardedPoints = 10 + streak;
      if (mode === "speed") {
        const timeBonus = timeLeft ? Math.floor(timeLeft * 2) : 0;
        awardedPoints += timeBonus;
      }
      setScore((prev) => prev + awardedPoints);
      setStreak((prev) => prev + 1);
      setCorrect((prev) => prev + 1);
      
      setErrorExplanation("");

      const top = currentQuestion.topic;
      updateTopicProgress(top, true);
      const newCorrect = correct + 1;
      if (newCorrect % 5 === 0) {
        setStars((prev) => {
          const newStars = prev + 1;
          if (typeof window !== "undefined") {
            try {
              const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
              saved.stars = newStars;
              localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
            } catch {}
          }
          return newStars;
        });
      }
      const newStreak = streak + 1;
      if (newStreak === 10 && !badges.includes("🔥 Hot Streak")) {
        const newBadge = "🔥 Hot Streak";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.badges = [...badges, newBadge];
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
      } else if (newStreak === 25 && !badges.includes("⚡ Lightning Fast")) {
        const newBadge = "⚡ Lightning Fast";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.badges = [...badges, newBadge];
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
      } else if (newStreak === 50 && !badges.includes("🌟 Master")) {
        const newBadge = "🌟 Master";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.badges = [...badges, newBadge];
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
      }
      const xpGain = hintUsed ? 5 : 10;
      setXp((prev) => {
        const newXp = prev + xpGain;
        const xpNeeded = playerLevel * 100;
        if (newXp >= xpNeeded) {
          setPlayerLevel((prevLevel) => {
            const newLevel = prevLevel + 1;
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 3000);
            if (typeof window !== "undefined") {
              try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
                saved.playerLevel = newLevel;
                saved.xp = newXp - xpNeeded;
                localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
              } catch {}
            }
            return newLevel;
          });
          return newXp - xpNeeded;
        }
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.xp = newXp;
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
        return newXp;
      });
      setFeedback("Correct! 🎉");
      if ("vibrate" in navigator) navigator.vibrate?.(50);
      setTimeout(() => {
        generateNewQuestion();
        if (mode === "challenge") {
          setTimeLeft(20);
        } else if (mode === "speed") {
          setTimeLeft(10);
        } else {
          setTimeLeft(null);
        }
      }, 1000);
    } else {
      setWrong((prev) => prev + 1);
      setStreak(0);
      
      const questionGradeKey = currentQuestion.gradeKey || grade;
      setErrorExplanation(
        getErrorExplanation(
          currentQuestion,
          currentQuestion.topic,
          answer,
          questionGradeKey
        )
      );
      
      const top = currentQuestion.topic;
      updateTopicProgress(top, false);
      logEnglishMistakeEntry({
        topic: currentQuestion.topic,
        grade: questionGradeKey,
        level: currentQuestion.levelKey || level,
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correctAnswer,
        wrongAnswer: answer,
      });
      if ("vibrate" in navigator) navigator.vibrate?.(200);
      if (mode === "learning") {
        setFeedback(
          `Wrong! Correct answer: ${currentQuestion.correctAnswer} ❌`
        );
        setTimeout(() => {
          generateNewQuestion();
          setSelectedAnswer(null);
          setFeedback(null);
          setTimeLeft(null);
        }, 1500);
      } else {
        setFeedback(
          `Wrong! Correct: ${currentQuestion.correctAnswer} ❌ (-1 ❤️)`
        );
        setLives((prevLives) => {
          const nextLives = prevLives - 1;
          if (nextLives <= 0) {
            trackCurrentQuestionTime();
            setFeedback("Game Over! 💔");
            recordSessionProgress();
            saveRunToStorage();
            setGameActive(false);
            setCurrentQuestion(null);
            setTimeLeft(0);
            setTimeout(() => {
              hardResetGame();
            }, 2000);
          } else {
            setTimeout(() => {
              generateNewQuestion();
              setSelectedAnswer(null);
              setFeedback(null);
              setTimeLeft(20);
            }, 1500);
          }
          return nextLives;
        });
      }
    }

    const potentialScore = isCorrect ? score + awardedPoints : score;
    setDailyChallenge((prev) => ({
      ...prev,
      bestScore: Math.max(prev.bestScore || 0, potentialScore),
      questions: (prev.questions || 0) + 1,
      correct: (prev.correct || 0) + (isCorrect ? 1 : 0),
    }));
    if (isCorrect) {
      setWeeklyChallenge((prev) => {
        if (prev.completed) return prev;
        const next = prev.current + 1;
        const completed = next >= prev.target;
        return {
          ...prev,
          current: next,
          completed,
        };
      });
    }
  }

  function resetStats() {
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setBestScore(0);
    setBestStreak(0);
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const key = `${level}_${topic}`;
        delete saved[key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch {}
    }
  }

  const backSafe = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/learning");
    }
  };

  const goToParentReport = () => {
    router.push("/learning/parent-report");
  };

  const getTopicName = (t) => {
    return TOPICS[t]?.icon + " " + TOPICS[t]?.name || t;
  };

  const getGradeLabel = (gradeKey) => {
    const idx = GRADE_ORDER.indexOf(gradeKey);
    if (idx === -1) return "";
    return `כיתה ${gradeLabels[idx]}`;
  };

  if (!mounted)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const gradeInfo = GRADES[grade] || GRADES.g3;
  const dailySolved = dailyChallenge.correct || 0;
  const dailyProgress =
    dailyChallenge.questions > 0
      ? Math.min(1, dailySolved / dailyChallenge.questions)
      : 0;
  const dailyPercent = Math.round(dailyProgress * 100);
  const weeklyProgress = Math.min(
    1,
    (weeklyChallenge.current || 0) / (weeklyChallenge.target || 1)
  );
  const weeklyPercent = Math.round(weeklyProgress * 100);
  const referenceData =
    REFERENCE_CATEGORIES[referenceCategory] ||
    REFERENCE_CATEGORIES[REFERENCE_CATEGORY_KEYS[0]];
  const referenceEntries = referenceData.lists.flatMap((listKey) =>
    Object.entries(WORD_LISTS[listKey] || {})
  );

  return (
    <Layout>
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden bg-gradient-to-b from-[#0a0f1d] to-[#141928] game-page-mobile"
        style={{ height: "100vh", height: "100dvh" }}
        dir="rtl"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
        </div>

        <div
          ref={headerRef}
          className="absolute top-0 left-0 right-0 z-50 pointer-events-none"
        >
          <div
            className="relative px-2 py-3"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
          >
            <div className="absolute right-2 top-2 flex gap-2 pointer-events-auto">
              <button
                onClick={() => router.push("/learning/curriculum?subject=english")}
                className="min-w-[100px] px-3 py-1 rounded-lg text-sm font-bold bg-emerald-500/20 border border-emerald-400/30 hover:bg-emerald-500/30 text-emerald-200"
              >
                📋 תוכנית לימודים
              </button>
            </div>
            <div className="absolute left-2 top-2 pointer-events-auto">
              <button
                onClick={backSafe}
                className="min-w-[60px] px-3 py-1 rounded-lg text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10"
              >
                BACK
              </button>
            </div>
          </div>
        </div>

        <div
          className="relative flex flex-col items-center justify-start px-4 overflow-hidden"
          style={{
            height: "100%",
            maxHeight: "100%",
            paddingTop: "calc(var(--head-h, 56px) + 8px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
            overflow: "hidden"
          }}
        >
          <div className="text-center mb-1">
            <h1 className="text-2xl font-extrabold text-white mb-0.5">
              🇬🇧 English Master
            </h1>
            <p className="text-white/70 text-xs">
              {playerName || "שחקן"} • {gradeInfo.name} •{" "}
              {LEVELS[level].name} • {getTopicName(topic)} • {MODES[mode].name}
            </p>
          </div>

          <div
            ref={controlsRef}
            className="grid grid-cols-7 gap-0.5 mb-1 w-full max-w-md"
          >
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">ניקוד</div>
              <div className="text-sm font-bold text-emerald-400 leading-tight">{score}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">רצף</div>
              <div className="text-sm font-bold text-amber-400 leading-tight">🔥{streak}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">כוכבים</div>
              <div className="text-sm font-bold text-yellow-400 leading-tight">⭐{stars}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">רמה</div>
              <div className="text-sm font-bold text-purple-400 leading-tight">Lv.{playerLevel}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">✅</div>
              <div className="text-sm font-bold text-green-400 leading-tight">{correct}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">חיים</div>
              <div className="text-sm font-bold text-rose-400 leading-tight">
                {mode === "challenge" ? `${lives} ❤️` : "∞"}
              </div>
            </div>
            <div
              className={`rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px] ${
                gameActive && (mode === "challenge" || mode === "speed") && timeLeft <= 5
                  ? "bg-red-500/30 border-2 border-red-400 animate-pulse"
                  : "bg-black/30 border border-white/10"
              }`}
            >
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">⏰ טיימר</div>
              <div
                className={`text-sm font-black leading-tight ${
                  gameActive && (mode === "challenge" || mode === "speed") && timeLeft <= 5
                    ? "text-red-400"
                    : gameActive && (mode === "challenge" || mode === "speed")
                    ? "text-yellow-400"
                    : "text-white/60"
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

          <div className="flex items-center justify-center gap-2 mb-2 w-full max-w-md overflow-x-auto flex-nowrap px-1 whitespace-nowrap">
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
            <button
              onClick={() => setShowPlayerProfile(true)}
              className="h-8 w-8 rounded-lg bg-purple-500/80 hover:bg-purple-500 border border-white/20 text-white text-lg font-bold flex items-center justify-center transition-all"
              title="פרופיל שחקן"
            >
              {playerAvatar}
            </button>
          </div>

          {showBadge && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-bounce">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-2xl font-bold">תג חדש!</div>
                <div className="text-xl">{showBadge}</div>
              </div>
            </div>
          )}


          {showLevelUp && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-pulse">
                <div className="text-4xl mb-2">🌟</div>
                <div className="text-2xl font-bold">עלית רמה!</div>
                <div className="text-xl">אתה עכשיו ברמה {playerLevel}!</div>
              </div>
            </div>
          )}

          {!gameActive ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-3 flex-wrap w-full max-w-3xl">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setPlayerName(newName);
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem("mleo_player_name", newName);
                      } catch {}
                    }
                  }}
                  placeholder="שם שחקן"
                  className="h-9 px-2 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold placeholder:text-white/40 w-[55px]"
                  maxLength={15}
                  dir={playerName && /[\u0590-\u05FF]/.test(playerName) ? "rtl" : "ltr"}
                  style={{ textAlign: playerName && /[\u0590-\u05FF]/.test(playerName) ? "right" : "left" }}
                />
                <select
                  value={gradeNumber}
                  onChange={(e) => handleGradeNumberChange(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {GRADE_ORDER.map((_, idx) => (
                    <option key={`grade-${idx + 1}`} value={idx + 1}>
                      {`כיתה ${gradeLabels[idx]}`}
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
                  {Object.keys(LEVELS).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {LEVELS[lvl].name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1 min-w-[180px]">
                  <select
                    ref={topicSelectRef}
                    value={topic}
                    onChange={(e) => {
                      const newTopic = e.target.value;
                      setGameActive(false);
                      if (newTopic === "mixed") {
                        setTopic(newTopic);
                        setShowMixedSelector(true);
                      } else {
                        setTopic(newTopic);
                        setShowMixedSelector(false);
                      }
                    }}
                    className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold flex-1"
                  >
                    {GRADES[grade].topics.map((t) => (
                      <option key={t} value={t}>
                        {getTopicName(t)}
                      </option>
                    ))}
                  </select>
                  {topic === "mixed" && (
                    <button
                      onClick={() => setShowMixedSelector(true)}
                      className="h-9 w-9 rounded-lg bg-blue-500/80 hover:bg-blue-500 border border-white/20 text-white text-xs font-bold flex items-center justify-center"
                      title="ערוך נושאים למיקס"
                    >
                      ⚙️
                    </button>
                  )}
                </div>
              </div>

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

              

              <div className="bg-black/20 border border-white/10 rounded-lg p-3 mb-2 w-full max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-white/60">אתגר יומי</div>
                  <button
                    onClick={() => setShowDailyChallenge(true)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    פרטים
                  </button>
                </div>
                <div className="text-sm text-white mb-1">
                  {dailySolved} נכון מתוך {dailyChallenge.questions || 0} שאלות
                </div>
                <div className="w-full bg-black/30 rounded-full h-2 mb-1">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${dailyProgress * 100}%` }}
                  />
                </div>
                <div className="text-xs text-white/60">דיוק {dailyPercent}%</div>
                <div className="text-xs text-white/60 mt-3 mb-1">אתגר שבועי</div>
                <div className="text-sm text-white mb-1">
                  {weeklyChallenge.current} / {weeklyChallenge.target} שאלות נכונות
                </div>
                <div className="w-full bg-black/30 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      weeklyChallenge.completed ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${weeklyProgress * 100}%` }}
                  />
                </div>
                {weeklyChallenge.completed && (
                  <div className="text-xs text-yellow-400 mt-1">
                    🎉 השלמת את האתגר השבועי!
                  </div>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2 w-full max-w-md">
                <div className="flex items-center justify-between text-[11px] text-white/70 mb-1">
                  <span>🎁 מסע פרס חודשי</span>
                  <span>
                    {monthlyProgress.totalMinutes} / {MONTHLY_MINUTES_TARGET} דק׳
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/70 mt-1 text-center">
                  {minutesRemaining > 0
                    ? `נותרו עוד ${minutesRemaining} דק׳ (~${Math.ceil(
                        minutesRemaining / 60
                      )} ש׳)`
                    : "🎉 יעד הושלם! בקשו מההורה לבחור פרס."}
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {REWARD_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        saveRewardChoice(yearMonthRef.current, option.key);
                        setRewardChoice(option.key);
                      }}
                      className={`rounded-lg border p-2 text-[11px] bg-black/30 flex flex-col items-center gap-1 transition-all hover:scale-105 ${
                        rewardChoice === option.key
                          ? "border-emerald-400 text-emerald-200 bg-emerald-500/20"
                          : "border-white/15 text-white/70 hover:border-white/30"
                      }`}
                    >
                      <div className="text-xl">{option.icon}</div>
                      <div className="font-bold leading-tight" dir="ltr">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-2 w-full max-w-md flex-wrap px-1">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-10 px-6 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  ▶️ התחל
                </button>
                <button
                  onClick={() => setShowReferenceModal(true)}
                  className="h-9 px-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-xs"
                >
                  📚 לוח מילים
                </button>
                {mistakes.length > 0 && (
                  <button
                    onClick={() => setShowPracticeOptions(true)}
                    className="h-9 px-3 rounded-lg bg-purple-500/80 hover:bg-purple-500 font-bold text-xs"
                  >
                    🎯 תרגול ({mistakes.length})
                  </button>
                )}
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="h-9 px-3 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-xs"
                >
                  🏆 לוח תוצאות
                </button>
              </div>

              <div className="mb-2 w-full max-w-md flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים אנגלית כאן?
                </button>
                <button
                  onClick={goToParentReport}
                  className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
                >
                  📊 דוח להורים
                </button>
                {mistakes.length > 0 && (
                  <button
                    onClick={() => setShowPracticeOptions(true)}
                    className="px-4 py-2 rounded-lg bg-purple-500/80 hover:bg-purple-500 text-xs font-bold text-white shadow-sm"
                  >
                    🎯 תרגול ({mistakes.length})
                  </button>
                )}
              </div>

              {!playerName.trim() && (
                <p className="text-xs text-white/60 text-center mb-2">
                  הכנס את שמך כדי להתחיל
                </p>
              )}
            </>
          ) : (
            <>
              {feedback && (
                <div
                  className={`mb-2 px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                    feedback.includes("Correct") ||
                    feedback.includes("∞") ||
                    feedback.includes("Start")
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  <div>{feedback}</div>
                  {errorExplanation && (
                    <div className="mt-1 text-xs text-red-100/90 font-normal" dir="ltr">
                      {errorExplanation}
                    </div>
                  )}
                </div>
              )}

              {currentQuestion && (
                <div
                  ref={gameRef}
                  className="w-full max-w-md flex flex-col items-center justify-center mb-2 flex-1"
                  style={{ height: "var(--game-h, 400px)", minHeight: "300px" }}
                >
                  <div className="text-4xl font-black text-white mb-4 text-center" dir="auto">
                    {currentQuestion.question}
                  </div>

                  {!hintUsed && !selectedAnswer && (
                    <button
                      onClick={() => {
                        setShowHint(true);
                        setHintUsed(true);
                      }}
                      className="mb-2 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-sm font-bold"
                    >
                      💡 Hint
                    </button>
                  )}

                  {showHint && (
                    <div className="mb-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-200 text-sm text-center max-w-md" dir="ltr">
                      {getHint(currentQuestion, currentQuestion.topic, grade)}
                    </div>
                  )}

                  {/* כפתור הסבר מלא – רק במצב Learning */}
                  {mode === "learning" && currentQuestion && (
                    <>
                      <button
                        onClick={() => setShowSolution(true)}
                        className="mb-2 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                      >
                        📘 הסבר מלא
                      </button>
                    </>
                  )}

                  {currentQuestion.qType === "typing" ? (
                    <div className="w-full max-w-md mb-3 flex flex-col items-center">
                      <input
                        dir="ltr"
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        disabled={!!selectedAnswer || !gameActive}
                        placeholder="כתוב את התשובה שלך כאן..."
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/30 text-white text-lg text-center"
                      />
                      <button
                        onClick={() => {
                          if (!typedAnswer.trim()) return;
                          handleAnswer(typedAnswer);
                        }}
                        disabled={!!selectedAnswer || !gameActive || !typedAnswer.trim()}
                        className="mt-2 px-6 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/60 font-bold text-sm"
                      >
                        ✅ בדוק תשובה
                      </button>
                    </div>
                  ) : (
                  <div className="grid grid-cols-2 gap-3 w-full mb-3">
                    {currentQuestion.answers.map((answer, idx) => {
                      const isSelected = selectedAnswer === answer;
                        const isCorrect =
                          String(answer).trim().toLowerCase() ===
                          String(currentQuestion.correctAnswer).trim().toLowerCase();
                      const isWrong = isSelected && !isCorrect;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(answer)}
                          disabled={!!selectedAnswer}
                          className={`rounded-xl border-2 px-6 py-6 text-2xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
                            isCorrect && isSelected
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : isWrong
                              ? "bg-red-500/30 border-red-400 text-red-200"
                              : selectedAnswer &&
                                  String(answer).trim().toLowerCase() ===
                                    String(currentQuestion.correctAnswer)
                                      .trim()
                                      .toLowerCase()
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : "bg-black/30 border-white/15 text-white hover:border-white/40"
                          }`}
                        >
                          {answer}
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}

              <button
                onClick={stopGame}
                className="h-9 px-4 rounded-lg bg-red-500/80 hover:bg-red-500 font-bold text-sm"
              >
                ⏹️ עצור
              </button>
            </>
          )}

          {showLeaderboard && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowLeaderboard(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-4 max-w-md w-full max-h-[85svh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-1">
                    🏆 לוח תוצאות
                  </h2>
                  <p className="text-white/70 text-xs">שיאים מקומיים</p>
                </div>

                <div className="flex gap-2 mb-4 justify-center">
                  {Object.keys(LEVELS).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setLeaderboardLevel(lvl);
                        if (typeof window !== "undefined") {
                          try {
                            const saved = JSON.parse(
                              localStorage.getItem(STORAGE_KEY) || "{}"
                            );
                            const topScores = buildTop10ByScore(saved, lvl);
                            setLeaderboardData(topScores);
                          } catch (e) {
                            console.error("Error loading leaderboard:", e);
                          }
                        }
                      }}
                      className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                        leaderboardLevel === lvl
                          ? "bg-amber-500/80 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {LEVELS[lvl].name}
                    </button>
                  ))}
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
                          <td
                            colSpan={4}
                            className="text-white/60 p-4 text-sm"
                          >
                            עדיין אין תוצאות עבור רמה {LEVELS[leaderboardLevel].name}
                          </td>
                        </tr>
                      ) : (
                        leaderboardData.map((score, idx) => (
                          <tr
                            key={`${score.name}-${score.timestamp}-${idx}`}
                            className={`border-b border-white/10 ${
                              score.placeholder
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
                              {score.placeholder
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
                              {score.name}
                            </td>
                            <td className="text-emerald-400 p-2 text-sm font-bold">
                              {score.bestScore}
                            </td>
                            <td className="text-amber-400 p-2 text-sm font-bold">
                              🔥{score.bestStreak}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="px-6 py-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-sm"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}

          {showMixedSelector && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
              onClick={() => {
                setShowMixedSelector(false);
                const hasSelected = Object.values(mixedTopics).some(
                  (selected) => selected
                );
                if (!hasSelected && topic === "mixed") {
                  const allowed = GRADES[grade].topics;
                  setTopic(allowed.find((t) => t !== "mixed") || allowed[0]);
                }
              }}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4 flex-shrink-0">
                  <h2 className="text-2xl font-extrabold text-white mb-2">
                    🎲 בחר נושאים למיקס
                  </h2>
                  <p className="text-white/70 text-sm">
                    בחר אילו נושאים לכלול במיקס
                  </p>
                </div>

                <div className="space-y-3 mb-4 overflow-y-auto flex-1 min-h-0">
                  {GRADES[grade].topics
                    .filter((t) => t !== "mixed")
                    .map((t) => (
                      <label
                        key={t}
                        className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/10 hover:bg-black/40 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={mixedTopics[t] || false}
                          onChange={(e) => {
                            setMixedTopics((prev) => ({
                              ...prev,
                              [t]: e.target.checked,
                            }));
                          }}
                          className="w-5 h-5 rounded"
                        />
                        <span className="text-white font-semibold text-lg">
                          {getTopicName(t)}
                        </span>
                      </label>
                    ))}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      const availableTopics = GRADES[grade].topics.filter(
                        (t) => t !== "mixed"
                      );
                      const allSelected = {};
                      availableTopics.forEach((t) => {
                        allSelected[t] = true;
                      });
                      setMixedTopics(allSelected);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                  >
                    הכל
                  </button>
                  <button
                    onClick={() => {
                      const availableTopics = GRADES[grade].topics.filter(
                        (t) => t !== "mixed"
                      );
                      const noneSelected = {};
                      availableTopics.forEach((t) => {
                        noneSelected[t] = false;
                      });
                      setMixedTopics(noneSelected);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-500/80 hover:bg-gray-500 font-bold text-sm"
                  >
                    בטל הכל
                  </button>
                  <button
                    onClick={() => {
                      const hasSelected = Object.values(mixedTopics).some(
                        (selected) => selected
                      );
                      if (hasSelected) {
                        setShowMixedSelector(false);
                      } else {
                        alert("אנא בחר לפחות נושא אחד");
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm"
                  >
                    שמור
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPracticeModal && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[190] p-4"
              onClick={() => setShowPracticeModal(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-purple-400/60 rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-1">
                    🎯 תרגול טעויות אחרונות
                  </h2>
                  <p className="text-white/70 text-sm">
                    בחר טעות אחרונה כדי לפתוח משחק ממוקד באותו נושא, כיתה ורמת קושי.
                  </p>
                </div>

                {mistakes.length === 0 ? (
                  <div className="text-center py-6 text-white/60">
                    אין טעויות פעילות כרגע. תתחיל משחק, אסוף נתונים ואז חזור לכאן.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mistakes.slice(0, 10).map((mistake, idx) => (
                      <div
                        key={`${mistake.timestamp || idx}-${idx}`}
                        className="bg-black/30 border border-white/10 rounded-xl p-3"
                        dir="rtl"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white font-semibold mb-1">
                          <span>{getTopicName(mistake.topic || "vocabulary")}</span>
                          <span className="text-white/70 text-xs">
                            {getGradeLabel(mistake.grade) || "כיתה נוכחית"} ·{" "}
                            {LEVELS[mistake.level || level]?.name || LEVELS[level].name}
                          </span>
                        </div>
                        {mistake.question && (
                          <p className="text-xs text-white/80 mb-1" dir="auto">
                            {mistake.question}
                          </p>
                        )}
                        {mistake.correctAnswer && (
                          <p className="text-xs text-emerald-300 mb-1" dir="auto">
                            תשובה נכונה: {mistake.correctAnswer}
                          </p>
                        )}
                        <button
                          onClick={() => handleMistakePractice(mistake)}
                          className="mt-2 w-full px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-xs font-bold text-white"
                        >
                          תרגל עכשיו
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowPracticeModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold text-white"
                  >
                    סגור
                  </button>
                  {mistakes.length > 0 && (
                    <button
                      onClick={clearMistakes}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-sm font-bold text-white"
                    >
                      🧹 איפוס טעויות
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showReferenceModal && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[185] p-4"
              onClick={() => setShowReferenceModal(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-blue-400/60 rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-extrabold">📚 לוח מילים אינטראקטיבי</h2>
                  <button
                    onClick={() => setShowReferenceModal(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                <p className="text-sm text-white/70 mb-3">
                  בחר קטגוריה כדי לראות מילים חשובות באנגלית ובעברית, בדיוק כמו בעזרי העזר של משחק החשבון.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {REFERENCE_CATEGORY_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setReferenceCategory(key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        referenceCategory === key
                          ? "bg-blue-500/80 border-blue-300 text-white"
                          : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {REFERENCE_CATEGORIES[key].label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" dir="ltr">
                  {referenceEntries.map(([en, he]) => (
                    <div
                      key={`${referenceCategory}-${en}-${he}`}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                    >
                      <span className="font-semibold">{en}</span>
                      <span className="text-white/50 mx-2">|</span>
                      <span className="text-right" dir="rtl">
                        {he}
                      </span>
                    </div>
                  ))}
                  {referenceEntries.length === 0 && (
                    <div className="text-center col-span-full text-white/60 py-4">
                      אין מילים להצגה בקטגוריה זו.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showPracticeOptions && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[188] p-4"
              onClick={() => setShowPracticeOptions(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-emerald-400/60 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-extrabold">🎛️ הגדרות תרגול חכם</h2>
                  <button
                    onClick={() => setShowPracticeOptions(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                <p className="text-sm text-white/70 mb-3">
                  כמו במשחקי החשבון והגאומטריה, ניתן לבחור כאן מצב אימון מיוחד, חיבור לשגיאות אחרונות או מעבר מדורג בין רמות.
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-white/60 font-semibold">מצב מיקוד</p>
                  {[
                    { value: "normal", label: "ברירת מחדל" },
                    { value: "mistakes", label: "חזרה על טעויות אחרונות" },
                    { value: "graded", label: "תרגול מדורג (קל → בינוני → רמתך)" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="focus-mode"
                        value={opt.value}
                        checked={focusedPracticeMode === opt.value}
                        onChange={(e) => setFocusedPracticeMode(e.target.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-white/60 font-semibold">שאלות תרגום/סיפור</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useStoryQuestions}
                      onChange={(e) => {
                        setUseStoryQuestions(e.target.checked);
                        if (!e.target.checked) setStoryOnly(false);
                      }}
                    />
                    <span>שלב שאלות תרגום בתוך משחקי האוצר מילים/דקדוק</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={storyOnly}
                      disabled={!useStoryQuestions}
                      onChange={(e) => setStoryOnly(e.target.checked)}
                    />
                    <span>הצג רק שאלות תרגום/סיפור</span>
                  </label>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/80">
                  <div className="font-semibold mb-1">סיכום מצב נוכחי</div>
                  <p>מצב תרגול: {MODES[mode].name}</p>
                  <p>פוקוס: {PRACTICE_FOCUS_OPTIONS.find((o) => o.value === practiceFocus)?.label || ""}</p>
                  <p>מיקוד שגיאות: {focusedPracticeMode === "normal" ? "רגיל" : focusedPracticeMode === "mistakes" ? "טעויות אחרונות" : "מדורג"}</p>
                  <p>שאלות תרגום: {storyOnly ? "רק תרגום" : useStoryQuestions ? "מעורב" : "כבוי"}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowPracticeOptions(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                  >
                    סגור
                  </button>
                  <button
                    onClick={() => {
                      setFocusedPracticeMode("normal");
                      setUseStoryQuestions(false);
                      setStoryOnly(false);
                      setPracticeFocus("balanced");
                      setShowPracticeOptions(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold"
                  >
                    איפוס ברירות מחדל
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPlayerProfile && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
              onClick={() => setShowPlayerProfile(false)}
              dir="rtl"
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                style={{ scrollbarGutter: "stable" }}
              >
                <button
                  onClick={() => setShowPlayerProfile(false)}
                  className="absolute left-4 top-4 text-white/80 hover:text-white text-2xl font-bold z-10"
                  style={{ direction: "ltr" }}
                >
                  ✖
                </button>
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-2">
                    👤 פרופיל שחקן
                  </h2>
                </div>

                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{playerAvatar}</div>
                  <div className="text-sm text-white/60 mb-3">בחר אווטר:</div>
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => {
                          setPlayerAvatar(avatar);
                          try {
                            localStorage.setItem("mleo_player_avatar", avatar);
                          } catch {
                            // ignore
                          }
                        }}
                        className={`text-3xl p-2 rounded-lg transition-all ${
                          playerAvatar === avatar
                            ? "bg-yellow-500/40 border-2 border-yellow-400 scale-110"
                            : "bg-black/30 border border-white/10 hover:bg-black/40"
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                    <div className="text-sm text-white/60 mb-1">שם שחקן</div>
                    <div className="text-lg font-bold text-white">{playerName || "שחקן"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">ניקוד שיא</div>
                      <div className="text-xl font-bold text-emerald-400">{bestScore}</div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">רצף שיא</div>
                      <div className="text-xl font-bold text-amber-400">{bestStreak}</div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">כוכבים</div>
                      <div className="text-xl font-bold text-yellow-400">⭐ {stars}</div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">רמה</div>
                      <div className="text-xl font-bold text-purple-400">Lv.{playerLevel}</div>
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                    <div className="text-sm text-white/60 mb-2">דיוק כללי</div>
                    <div className="text-2xl font-bold text-blue-400">{accuracy}%</div>
                    <div className="text-xs text-white/60 mt-1">
                      {correct} נכון מתוך {totalQuestions} שאלות
                    </div>
                  </div>

                  {Object.keys(progress).some((topicKey) => progress[topicKey]?.total > 0) && (
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-sm text-white/60 mb-2">התקדמות לפי נושאים</div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {Object.entries(progress)
                          .filter(([, data]) => (data?.total || 0) > 0)
                          .sort(([, a], [, b]) => (b?.total || 0) - (a?.total || 0))
                          .map(([topicKey, data]) => {
                            const topicAccuracy =
                              data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                            return (
                              <div
                                key={topicKey}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-white/80">{getTopicName(topicKey)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white/60">
                                    {data.correct}/{data.total}
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      topicAccuracy >= 80
                                        ? "text-emerald-400"
                                        : topicAccuracy >= 60
                                        ? "text-yellow-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {topicAccuracy}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-black/30 border border-white/10 rounded-lg p-3 mt-4">
                  <div className="text-sm text-white/60 mb-2">תגים</div>
                  {badges.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {badges.map((badge, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30"
                        >
                          <div className="text-3xl">{badge.split(" ")[0]}</div>
                          <div className="flex-1 text-white font-semibold text-lg">
                            {badge}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-white/60 text-sm py-4">
                      עדיין לא הרווחת תגים. המשך לתרגל!
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowPlayerProfile(false)}
                  className="w-full px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm"
                >
                  סגור
                </button>
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
                  📘 איך לומדים אנגלית כאן?
                </h2>

                <p className="text-white/80 text-xs mb-3 text-center">
                  המטרה היא לתרגל אנגלית בצורה משחקית, עם התאמה לכיתה, נושא ורמת קושי.
                </p>

                <ul className="list-disc pr-4 space-y-1 text-[13px] text-white/90">
                  <li>בחר כיתה, רמת קושי ונושא (אוצר מילים, דקדוק, תרגום, כתיבה ועוד).</li>
                  <li>בחר מצב משחק: למידה, אתגר עם טיימר וחיים, מהירות או מרתון.</li>
                  <li>קרא היטב את השאלה – לפעמים צריך לבחור תשובה, ולפעמים לכתוב באנגלית.</li>
                  <li>לחץ על 💡 Hint כדי לקבל רמז, ועל "📘 הסבר מלא" כדי לראות פתרון צעד־אחר־צעד.</li>
                  <li>ניקוד גבוה, רצף תשובות נכון, כוכבים ו־Badges עוזרים לך לעלות רמה כשחקן.</li>
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

          {/* חלון הסבר מלא - Modal גדול ומרכזי */}
          {showSolution && currentQuestion && (
            <div
              className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center px-4"
              onClick={() => setShowSolution(false)}
            >
              <div
                className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl p-4 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className="text-lg font-bold text-emerald-100"
                    dir="rtl"
                  >
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
                  {/* מציגים שוב את השאלה */}
                  <p
                    className="text-base font-bold text-white mb-3 text-center"
                    style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                  >
                    {currentQuestion.stem || currentQuestion.question}
                  </p>
                  {/* כאן הצעדים */}
                  <div className="space-y-1 text-sm" style={{ direction: "rtl" }}>
                    {getSolutionSteps(
                      currentQuestion,
                      currentQuestion.topic,
                      grade
                    ).map((step, idx) => (
                      <div key={idx}>{step}</div>
                    ))}
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
        </div>
      </div>
    </Layout>
  );
}

