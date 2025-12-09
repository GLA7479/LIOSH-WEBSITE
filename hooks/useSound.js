import { useState, useEffect, useRef, useCallback } from "react";

// Hook לניהול צלילים ומוזיקה במשחקים
export function useSound() {
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.3); // 30% volume
  const [soundVolume, setSoundVolume] = useState(0.7); // 70% volume

  const audioRefs = useRef({});
  const backgroundMusicRef = useRef(null);

  // טעינת הגדרות מ-localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem("mleo_sound_settings") || "{}");
      setSoundsEnabled(saved.soundsEnabled !== false); // default true
      setMusicEnabled(saved.musicEnabled !== false); // default true
      setMusicVolume(saved.musicVolume ?? 0.3);
      setSoundVolume(saved.soundVolume ?? 0.7);
    } catch {}
  }, []);

  // שמירת הגדרות ל-localStorage
  const saveSettings = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "mleo_sound_settings",
        JSON.stringify({
          soundsEnabled,
          musicEnabled,
          musicVolume,
          soundVolume,
        })
      );
    } catch {}
  }, [soundsEnabled, musicEnabled, musicVolume, soundVolume]);

  // עדכון volume של מוזיקת רקע
  useEffect(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = musicEnabled ? musicVolume : 0;
    }
  }, [musicEnabled, musicVolume]);

  // פונקציה לנגן צליל
  const playSound = useCallback(
    (soundName, options = {}) => {
      if (!soundsEnabled) return null;

      const {
        volume = soundVolume,
        loop = false,
        onEnded = null,
      } = options;

      try {
        // בדיקה אם יש כבר audio instance
        let audio = audioRefs.current[soundName];

        if (!audio) {
          audio = new Audio(`/sounds/${soundName}.mp3`);
          audioRefs.current[soundName] = audio;
        }

        // אם הצליל כבר מתנגן, נעצור אותו וננגן מחדש
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }

        audio.volume = volume;
        audio.loop = loop;

        if (onEnded) {
          audio.onended = onEnded;
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // משתמש כנראה לא לחץ על האלמנט, או שהדפדפן חוסם autoplay
            // זה בסדר, נמשיך בלי צליל
            console.log("Sound play blocked:", error);
          });
        }

        return audio;
      } catch (error) {
        // אם הקובץ לא קיים או יש בעיה, נמשיך בלי צליל
        console.log("Sound file not found or error:", soundName);
        return null;
      }
    },
    [soundsEnabled, soundVolume]
  );

  // פונקציה לעצור צליל
  const stopSound = useCallback((soundName) => {
    const audio = audioRefs.current[soundName];
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // פונקציה לעצור את כל הצלילים
  const stopAllSounds = useCallback(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, []);

  // פונקציה להתחיל מוזיקת רקע
  const playBackgroundMusic = useCallback(() => {
    if (!musicEnabled) return;

    try {
      if (!backgroundMusicRef.current) {
        backgroundMusicRef.current = new Audio("/sounds/background-music.mp3");
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.volume = musicVolume;
      }

      if (backgroundMusicRef.current.paused) {
        const playPromise = backgroundMusicRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Background music play blocked:", error);
          });
        }
      }
    } catch (error) {
      console.log("Background music file not found or error");
    }
  }, [musicEnabled, musicVolume]);

  // פונקציה לעצור מוזיקת רקע
  const stopBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
  }, []);

  // פונקציה לעצור את כל הצלילים והמוזיקה
  const stopAll = useCallback(() => {
    stopAllSounds();
    stopBackgroundMusic();
  }, [stopAllSounds, stopBackgroundMusic]);

  // עדכון הגדרות
  const toggleSounds = useCallback(() => {
    setSoundsEnabled((prev) => {
      const newValue = !prev;
      if (!newValue) {
        stopAllSounds();
      }
      return newValue;
    });
  }, [stopAllSounds]);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const newValue = !prev;
      if (!newValue) {
        stopBackgroundMusic();
      } else {
        playBackgroundMusic();
      }
      return newValue;
    });
  }, [stopBackgroundMusic, playBackgroundMusic]);

  const setMusicVol = useCallback((vol) => {
    setMusicVolume(Math.max(0, Math.min(1, vol)));
  }, []);

  const setSoundVol = useCallback((vol) => {
    setSoundVolume(Math.max(0, Math.min(1, vol)));
  }, []);

  // שמירה אוטומטית כשההגדרות משתנות
  useEffect(() => {
    saveSettings();
  }, [saveSettings]);

  // ניקוי כשהקומפוננטה נסגרת
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  return {
    // State
    soundsEnabled,
    musicEnabled,
    musicVolume,
    soundVolume,

    // Actions
    playSound,
    stopSound,
    stopAllSounds,
    playBackgroundMusic,
    stopBackgroundMusic,
    stopAll,

    // Settings
    toggleSounds,
    toggleMusic,
    setMusicVol,
    setSoundVol,
  };
}

