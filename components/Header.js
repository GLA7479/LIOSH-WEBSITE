import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n } = useTranslation();

  const menuItems = [
    { key: "home", href: "/" },
    { key: "about", href: "/about" },
    { key: "contact", href: "/contact" },
  ];

  const languages = [
    { code: "en", label: "EN" },
    { code: "he", label: "HE" },
  ];

  return (
    <header
      className="fixed w-full z-50 text-yellow-400"
      style={{
        background:
          "linear-gradient(90deg, rgba(11,29,54,0.9) 0%, rgba(18,39,70,0.9) 50%, rgba(11,29,54,0.9) 100%)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center relative z-20">
        {/* לוגו */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="LIOSH Logo"
            width={70}
            height={70}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-extrabold tracking-wide text-yellow-400">
              LIOSH Token
            </span>
            <span className="text-xs text-gray-300 italic">
              Powered by LIO – The Real Shiba Inu
            </span>
          </div>
        </Link>

        {/* כפתור שפה ותפריט */}
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            value={i18n.language}
            className="bg-gray-900 bg-opacity-60 text-yellow-400 px-2 py-0.5 rounded-md text-xs sm:text-sm"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>

          <button
            className="text-yellow-400 text-2xl"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* תפריט נפתח */}
      {isOpen && (
        <div
          className="fixed right-0 top-20 w-80 flex flex-col items-end py-6 space-y-4 z-50 overflow-hidden"
          style={{ borderRadius: "8px" }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>

          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="relative text-xl font-semibold pr-5"
              style={{
                color: "#fff",
                textShadow:
                  "0 0 6px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.6)",
              }}
              onClick={() => setIsOpen(false)}
            >
              {item.key}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
