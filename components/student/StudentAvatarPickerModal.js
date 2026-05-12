import { useCallback, useEffect, useRef, useState } from "react";
import { patchStudentLearningProfile } from "../../lib/learning-client/studentLearningProfileClient";

/** Same palette as learning master pages (math / hebrew / …). */
export const STUDENT_AVATAR_EMOJI_OPTIONS = [
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

/**
 * Avatar picker overlay aligned with game pages: emoji grid + optional custom image (localStorage only).
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} [props.playerName]
 * @param {string | null | undefined} props.serverAvatarEmoji from learning profile (e.g. home-profile `profile.avatarEmoji`)
 * @param {(emoji: string | null) => void} [props.onAvatarEmojiPersisted] parent may merge into dashboard payload
 * @param {() => void} [props.onAvatarChanged] called after any local avatar change (e.g. refresh hero from localStorage)
 */
export default function StudentAvatarPickerModal({
  open,
  onClose,
  playerName = "",
  serverAvatarEmoji = null,
  onAvatarEmojiPersisted,
  onAvatarChanged,
}) {
  const fileInputRef = useRef(null);
  const [playerAvatar, setPlayerAvatar] = useState("👤");
  const [playerAvatarImage, setPlayerAvatarImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const syncFromBrowser = useCallback(() => {
    if (typeof window === "undefined") return;
    const savedImage = localStorage.getItem("mleo_player_avatar_image");
    const savedEmoji = localStorage.getItem("mleo_player_avatar");
    const server =
      serverAvatarEmoji != null && String(serverAvatarEmoji).trim() !== ""
        ? String(serverAvatarEmoji).trim().slice(0, 8)
        : "";

    if (savedImage) {
      setPlayerAvatarImage(savedImage);
      setPlayerAvatar("👤");
      return;
    }
    setPlayerAvatarImage(null);
    if (savedEmoji && String(savedEmoji).trim()) {
      setPlayerAvatar(String(savedEmoji).trim().slice(0, 8));
      return;
    }
    setPlayerAvatar(server || "👤");
  }, [serverAvatarEmoji]);

  useEffect(() => {
    if (!open) return;
    setSaveError("");
    syncFromBrowser();
  }, [open, syncFromBrowser]);

  const persistEmojiToServer = useCallback(
    async (emoji, hasCustomImage) => {
      setSaving(true);
      setSaveError("");
      try {
        await patchStudentLearningProfile({
          profile: {
            avatarEmoji: hasCustomImage ? undefined : emoji && emoji.trim() ? emoji.trim().slice(0, 8) : undefined,
          },
        });
        onAvatarEmojiPersisted?.(hasCustomImage ? null : emoji && emoji.trim() ? emoji.trim().slice(0, 8) : null);
      } catch (e) {
        setSaveError(e && typeof e === "object" && "message" in e ? String(e.message) : "שמירה נכשלה");
      } finally {
        setSaving(false);
      }
    },
    [onAvatarEmojiPersisted],
  );

  const handleAvatarImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      window.alert("התמונה גדולה מדי. נא לבחור תמונה עד 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      window.alert("נא לבחור קובץ תמונה בלבד");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result;
      setPlayerAvatarImage(typeof imageUrl === "string" ? imageUrl : null);
      setPlayerAvatar("👤");
      if (typeof window !== "undefined") {
        localStorage.setItem("mleo_player_avatar_image", imageUrl);
        localStorage.removeItem("mleo_player_avatar");
      }
      onAvatarChanged?.();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveAvatarImage = () => {
    setPlayerAvatarImage(null);
    const defaultAvatar = "👤";
    setPlayerAvatar(defaultAvatar);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mleo_player_avatar_image");
      localStorage.setItem("mleo_player_avatar", defaultAvatar);
    }
    onAvatarChanged?.();
    void persistEmojiToServer(defaultAvatar, false);
  };

  const selectEmoji = (avatar) => {
    setPlayerAvatar(avatar);
    setPlayerAvatarImage(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("mleo_player_avatar", avatar);
      localStorage.removeItem("mleo_player_avatar_image");
    }
    onAvatarChanged?.();
    void persistEmojiToServer(avatar, false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
      onClick={() => onClose()}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-avatar-modal-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-white/20 bg-gradient-to-br from-[#080c16] to-[#0a0f1d] p-6 shadow-2xl"
        onClick={(ev) => ev.stopPropagation()}
        style={{ scrollbarGutter: "stable", scrollbarWidth: "thin" }}
      >
        <button
          type="button"
          onClick={() => onClose()}
          className="absolute left-4 top-4 z-10 text-2xl font-bold text-white/80 hover:text-white"
          style={{ direction: "ltr" }}
          aria-label="סגור"
        >
          ✖
        </button>

        <h2 id="student-avatar-modal-title" className="mb-4 text-center text-2xl font-extrabold text-white">
          👤 פרופיל שחקן
        </h2>

        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="text-4xl">
              {playerAvatarImage ? (
                <img src={playerAvatarImage} alt="אווטר" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-16 w-16 items-center justify-center text-5xl leading-none" aria-hidden>
                  {playerAvatar}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="mb-1 text-xs text-white/60">שם שחקן</div>
              <div className="truncate text-lg font-bold text-white">{playerName || "שחקן"}</div>
            </div>
          </div>

          <div className="text-xs text-white/60 mb-2">בחר אווטר:</div>

          <div className="mb-3">
            <label className="block w-full cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarImageUpload}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 rounded-lg bg-blue-500/80 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-blue-500"
                >
                  📷 בחר תמונה
                </button>
                {playerAvatarImage ? (
                  <button
                    type="button"
                    onClick={() => void handleRemoveAvatarImage()}
                    disabled={saving}
                    className="rounded-lg bg-red-500/80 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-red-500 disabled:opacity-50"
                  >
                    🗑️ מחק תמונה
                  </button>
                ) : null}
              </div>
            </label>
            {playerAvatarImage ? (
              <div className="mt-2 text-center text-xs text-white/60">תמונה נבחרה ✓</div>
            ) : null}
          </div>

          <div className="grid grid-cols-6 gap-2">
            {STUDENT_AVATAR_EMOJI_OPTIONS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                disabled={saving}
                onClick={() => selectEmoji(avatar)}
                className={`rounded-lg p-1.5 text-2xl transition-all ${
                  !playerAvatarImage && playerAvatar === avatar
                    ? "scale-110 border-2 border-yellow-400 bg-yellow-500/40"
                    : "border border-white/10 bg-black/30 hover:bg-black/40"
                } disabled:opacity-50`}
              >
                {avatar}
              </button>
            ))}
          </div>

          {saveError ? <p className="mt-3 text-center text-sm text-rose-300">{saveError}</p> : null}
        </div>

        <button
          type="button"
          onClick={() => onClose()}
          className="mt-4 w-full rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
        >
          סגור
        </button>
      </div>
    </div>
  );
}
