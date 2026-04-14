/**
 * Build 1 — נגינת stem (לא SFX של useSound).
 */

/**
 * @param {import("./audio-task-contract.js").AudioStemV1} stem
 * @param {{ onEnded?: () => void }} [opts]
 */
export function createStemPlaybackController(stem, opts = {}) {
  let audioEl = null;
  let replayCount = 0;

  function stopTts() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
  }

  function stopAll() {
    stopTts();
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.removeAttribute("src");
        audioEl.load();
      } catch {
        /* ignore */
      }
      audioEl = null;
    }
  }

  /**
   * @returns {Promise<void>}
   */
  function play() {
    stopAll();
    if (stem.playback_kind === "static_url" && stem.stem_audio_url) {
      audioEl = new Audio(stem.stem_audio_url);
      audioEl.onended = () => {
        opts.onEnded?.();
      };
      return audioEl.play().catch(() => {
        opts.onEnded?.();
      });
    }
    if (stem.playback_kind === "tts" && stem.tts_text && typeof window !== "undefined" && window.speechSynthesis) {
      return new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(stem.tts_text);
        u.lang = stem.locale || "he-IL";
        u.rate = 0.92;
        u.onend = () => {
          opts.onEnded?.();
          resolve();
        };
        u.onerror = () => {
          opts.onEnded?.();
          resolve();
        };
        window.speechSynthesis.speak(u);
      });
    }
    return Promise.resolve();
  }

  function bumpReplay() {
    replayCount += 1;
    return replayCount;
  }

  function getReplayCount() {
    return replayCount;
  }

  function dispose() {
    stopAll();
  }

  return { play, bumpReplay, getReplayCount, dispose, stopAll };
}
