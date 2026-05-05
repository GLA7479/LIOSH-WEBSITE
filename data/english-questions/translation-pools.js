// Metadata enrichment (safe pass): difficulty, cognitiveLevel, expectedErrorTypes, skillId (when no diagnostic), subtype (pool bucket when taxonomy-valid), prerequisiteSkillIds (gated). See reports/question-metadata-qa/english-metadata-apply-report.json.
export const TRANSLATION_POOLS = {
  "classroom": [
    {
      "en": "Please sit down",
      "he": "בבקשה שבו",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "translation_classroom_g1",
      "difficulty": "basic"
    },
    {
      "en": "Open your notebook",
      "he": "פתחו את המחברת",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "translation_classroom_g1",
      "difficulty": "basic"
    },
    {
      "en": "Thank you, teacher",
      "he": "תודה, מורה",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "translation_classroom_g1_p28a",
      "difficulty": "basic"
    },
    {
      "en": "Good morning, class",
      "he": "בוקר טוב, כיתה",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "translation_classroom_g1_p28b",
      "difficulty": "basic"
    },
    {
      "en": "I have a pencil",
      "he": "יש לי עפרון",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "translation_classroom_g1_p28c",
      "difficulty": "basic"
    },
    {
      "en": "This is my bag",
      "he": "זה התיק שלי",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "translation_classroom_g1_p28d",
      "difficulty": "basic"
    },
    {
      "en": "Look at the board",
      "he": "הסתכלו על הלוח",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "translation_classroom_g1_p28e",
      "difficulty": "basic"
    },
    {
      "en": "We like our school",
      "he": "אנחנו אוהבים את בית הספר שלנו",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "translation_classroom_g1_p28f",
      "difficulty": "basic"
    },
    {
      "en": "Raise your hand",
      "he": "הרימו את היד",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_classroom_g2",
      "difficulty": "basic"
    },
    {
      "en": "Listen carefully",
      "he": "הקשיבו היטב",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_classroom_g2",
      "difficulty": "basic"
    },
    {
      "en": "Please open your book",
      "he": "בבקשה פתחו את הספר",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_classroom_g2_p28a",
      "difficulty": "basic"
    },
    {
      "en": "Work with a partner",
      "he": "עבדו עם בן זוג",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_classroom_g2_p28b",
      "difficulty": "basic"
    },
    {
      "en": "Put your things away",
      "he": "סידרו את הדברים",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_classroom_g2_p28c",
      "difficulty": "basic"
    },
    {
      "en": "Write the date",
      "he": "כתבו את התאריך",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "translation_classroom_g3",
      "difficulty": "standard"
    },
    {
      "en": "Close the door softly",
      "he": "סגרו את הדלת בעדינות",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "translation_classroom_g3",
      "difficulty": "standard"
    }
  ],
  "routines": [
    {
      "en": "I brush my teeth at night",
      "he": "אני מצחצח שיניים בלילה",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_routines_g2",
      "difficulty": "basic"
    },
    {
      "en": "She drinks milk every morning",
      "he": "היא שותה חלב בכל בוקר",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_routines_g2",
      "difficulty": "basic"
    },
    {
      "en": "I wash my hands before lunch",
      "he": "אני שוטף ידיים לפני ארוחת צהריים",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_routines_g2_p28d",
      "difficulty": "basic"
    },
    {
      "en": "We turn off the lights at night",
      "he": "אנחנו מכבים את האורות בלילה",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_routines_g2_p28e",
      "difficulty": "basic"
    },
    {
      "en": "We walk the dog after school",
      "he": "אנחנו מטיילים עם הכלב אחרי בית הספר",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "translation_routines_g3",
      "difficulty": "standard"
    },
    {
      "en": "My brother cleans his room on Friday",
      "he": "אחי מנקה את החדר שלו ביום שישי",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "translation_routines_g3",
      "difficulty": "standard"
    },
    {
      "en": "They read a story before bed",
      "he": "הם קוראים סיפור לפני השינה",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "translation_routines_g4",
      "difficulty": "standard"
    },
    {
      "en": "Dad cooks dinner on Sundays",
      "he": "אבא מבשל ארוחת ערב בימי ראשון",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "translation_routines_g4",
      "difficulty": "standard"
    }
  ],
  "hobbies": [
    {
      "en": "We play basketball after school",
      "he": "אנחנו משחקים כדורסל אחרי בית הספר",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "translation_hobbies_g3",
      "difficulty": "standard"
    },
    {
      "en": "My sister paints colorful pictures",
      "he": "אחותי מציירת ציורים צבעוניים",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "translation_hobbies_g3",
      "difficulty": "standard"
    },
    {
      "en": "It is windy, so we fly a kite",
      "he": "יש רוח, אז אנחנו מעיפים עפיפון",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "translation_hobbies_g4",
      "difficulty": "standard"
    },
    {
      "en": "He collects stickers of animals",
      "he": "הוא אוסף מדבקות של חיות",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "translation_hobbies_g5",
      "difficulty": "advanced"
    },
    {
      "en": "They practice piano every Tuesday",
      "he": "הם מתרגלים פסנתר בכל יום שלישי",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "translation_hobbies_g5",
      "difficulty": "advanced"
    },
    {
      "en": "I like to build Lego cities",
      "he": "אני אוהב לבנות ערי לגו",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "translation_hobbies_g6",
      "difficulty": "advanced"
    }
  ],
  "community": [
    {
      "en": "The library is next to the park",
      "he": "הספרייה נמצאת ליד הפארק",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "translation_community_g3",
      "difficulty": "standard"
    },
    {
      "en": "We visited the science museum",
      "he": "ביקרנו במוזיאון המדע",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "translation_community_g3",
      "difficulty": "standard"
    },
    {
      "en": "Please recycle the bottles in the bin",
      "he": "בבקשה ממחזרו את הבקבוקים בפח",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "translation_community_g4",
      "difficulty": "standard"
    },
    {
      "en": "The market is crowded on Fridays",
      "he": "השוק עמוס בימי שישי",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "translation_community_g4",
      "difficulty": "standard"
    },
    {
      "en": "Our town celebrates a music festival",
      "he": "העיר שלנו חוגגת פסטיבל מוזיקה",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "translation_community_g5",
      "difficulty": "advanced"
    },
    {
      "en": "The nurse helps people feel better",
      "he": "האחות עוזרת לאנשים להרגיש טוב יותר",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "translation_community_g5",
      "difficulty": "advanced"
    }
  ],
  "technology": [
    {
      "en": "She is coding a friendly robot",
      "he": "היא כותבת קוד לרובוט ידידותי",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "translation_technology_g4",
      "difficulty": "standard"
    },
    {
      "en": "We use tablets for digital art",
      "he": "אנחנו משתמשים בטאבלטים לאמנות דיגיטלית",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "translation_technology_g4",
      "difficulty": "standard"
    },
    {
      "en": "The drone takes photos of the field",
      "he": "הרחפן מצלם את השדה",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "translation_technology_g5",
      "difficulty": "advanced"
    },
    {
      "en": "He uploads a podcast every week",
      "he": "הוא מעלה פודקאסט בכל שבוע",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "translation_technology_g5",
      "difficulty": "advanced"
    },
    {
      "en": "Our class designs a smart garden",
      "he": "הכיתה שלנו מתכננת גינה חכמה",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "translation_technology_g6",
      "difficulty": "advanced"
    },
    {
      "en": "They research clean energy online",
      "he": "הם חוקרים אנרגיה נקייה באינטרנט",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "translation_technology_g6",
      "difficulty": "advanced"
    }
  ],
  "global": [
    {
      "en": "If we save water, rivers stay clean",
      "he": "אם אנחנו חוסכים במים, הנהרות נשארים נקיים",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "translation_global_g5",
      "difficulty": "advanced"
    },
    {
      "en": "Planting trees helps our planet breathe",
      "he": "נטיעת עצים עוזרת לכדור הארץ לנשום",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "translation_global_g5",
      "difficulty": "advanced"
    },
    {
      "en": "We write about cultures around the world",
      "he": "אנחנו כותבים על תרבויות ברחבי העולם",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "translation_global_g6",
      "difficulty": "advanced"
    },
    {
      "en": "She reads news about space missions",
      "he": "היא קוראת חדשות על משימות חלל",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "translation_global_g6",
      "difficulty": "advanced"
    },
    {
      "en": "They discuss how communities share water",
      "he": "הם דנים כיצד קהילות חולקות מים",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "translation_global_g6b",
      "difficulty": "advanced"
    },
    {
      "en": "Working together keeps the ocean blue",
      "he": "עבודה משותפת שומרת על האוקיינוס כחול",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "translation_global_g6c",
      "difficulty": "advanced"
    }
  ],
  "simulator_translation_mcq": [
    {
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "translation_mcq_g2_matrix",
      "question": "מה התרגום הנכון למשפט: \"She has a red bag\"?",
      "options": [
        "יש לה תיק אדום",
        "יש לה תיק כחול",
        "היא רואה תיק ירוק",
        "היא שוכחת את התיק"
      ],
      "correct": "יש לה תיק אדום",
      "explanation": "She has — יש לה; red bag — תיק אדום.",
      "difficulty": "basic",
      "cognitiveLevel": "application",
      "expectedErrorTypes": [
        "translation_error",
        "vocabulary_confusion",
        "reading_comprehension_error"
      ],
      "skillId": "translation_mcq_g2_matrix",
      "subtype": "simulator_translation_mcq"
    },
    {
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "translation_mcq_g3_matrix",
      "question": "מה התרגום הנכון למשפט: \"We eat lunch at school every day\"?",
      "options": [
        "אנחנו אוכלים ארוחת צהריים בבית הספר כל יום",
        "אנחנו שוכחים ארוחת צהריים בבית הספר",
        "אנחנו קונים ארוחת צהריים רק בסופי שבוע",
        "אנחנו לא אוכלים בבית הספר מעולם"
      ],
      "correct": "אנחנו אוכלים ארוחת צהריים בבית הספר כל יום",
      "explanation": "משפט שגרתי בהווה — כל יום מציין תדירות.",
      "difficulty": "standard",
      "cognitiveLevel": "application",
      "expectedErrorTypes": [
        "translation_error",
        "vocabulary_confusion",
        "reading_comprehension_error"
      ],
      "skillId": "translation_mcq_g3_matrix",
      "subtype": "simulator_translation_mcq"
    },
    {
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "translation_mcq_g4_matrix",
      "question": "מה התרגום הנכון למשפט: \"Turn off the light when you leave the room\"?",
      "options": [
        "כבו את האור כשאתם יוצאים מהחדר",
        "הדליקו את האור כשאתם נכנסים לחדר",
        "השאירו את האור דולק תמיד",
        "סגרו את החלון כשאתם יוצאים מהחדר"
      ],
      "correct": "כבו את האור כשאתם יוצאים מהחדר",
      "explanation": "משפט הוראה — לכבות את האור בעת יציאה מהחדר.",
      "difficulty": "standard",
      "cognitiveLevel": "application",
      "expectedErrorTypes": [
        "translation_error",
        "vocabulary_confusion",
        "reading_comprehension_error"
      ],
      "skillId": "translation_mcq_g4_matrix",
      "subtype": "simulator_translation_mcq"
    },
    {
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "translation_mcq_g5_matrix",
      "question": "מה התרגום הנכון למשפט: \"The teacher explained the new topic slowly\"?",
      "options": [
        "המורה הסבירה את הנושא החדש לאט",
        "המורה שכחה את הנושא החדש",
        "המורה רצה מהר בלי להסביר",
        "התלמידים הסבירו למורה את הנושא"
      ],
      "correct": "המורה הסבירה את הנושא החדש לאט",
      "explanation": "explained — הסבירה; slowly — לאט.",
      "difficulty": "advanced",
      "cognitiveLevel": "application",
      "expectedErrorTypes": [
        "translation_error",
        "vocabulary_confusion",
        "reading_comprehension_error"
      ],
      "skillId": "translation_mcq_g5_matrix",
      "subtype": "simulator_translation_mcq"
    },
    {
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "translation_mcq_g6_matrix",
      "question": "מה התרגום הנכון למשפט: \"Clean energy can help protect our planet\"?",
      "options": [
        "אנרגיה נקייה יכולה לעזור להגן על כדור הארץ שלנו",
        "אנרגיה נקייה תמיד מזיקה לכדור הארץ",
        "כדור הארץ לא צריך הגנה כלל",
        "אנחנו לא יכולים להגן על הסביבה בעתיד"
      ],
      "correct": "אנרגיה נקייה יכולה לעזור להגן על כדור הארץ שלנו",
      "explanation": "clean energy — אנרגיה נקייה; protect our planet — להגן על כדור הארץ.",
      "difficulty": "advanced",
      "cognitiveLevel": "application",
      "expectedErrorTypes": [
        "translation_error",
        "vocabulary_confusion",
        "reading_comprehension_error"
      ],
      "skillId": "translation_mcq_g6_matrix",
      "subtype": "simulator_translation_mcq"
    }
  ]
};
