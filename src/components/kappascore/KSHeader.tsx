import { useState, useRef, useEffect } from "react";

const languages = [
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "pt", label: "PT", flag: "🇧🇷" },
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "de", label: "DE", flag: "🇩🇪" },
];

const navLinks = [
  { label: "Results", icon: "☰", href: "#results" },
  { label: "Statistics", icon: "📊", href: "#statistics" },
  { label: "Live Score", icon: "🖥", href: "#live-score" },
];

const topLinks = [
  { label: "Sports", href: "https://kappascore.com", active: true },
  { label: "Games", href: "https://kappaslot.com", active: false },
  { label: "Top Lists", href: "https://kappatop.com", active: false },
];

interface KSHeaderProps {
  activeNav: number;
  onNavChange: (index: number) => void;
}

export default function KSHeader({ activeNav, onNavChange }: KSHeaderProps) {
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="ks-header">
      <div className="ks-header__row">
        <a href="/" className="ks-header__logo">
          Kappa<span>score</span>
        </a>

        <ul className="ks-header__toplinks">
          {topLinks.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className={l.active ? "active" : ""}
                target="_blank"
                rel="noopener noreferrer"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <nav className="ks-header__nav ks-header__nav--desktop">
          {navLinks.map((link, i) => (
            <button
              key={link.label}
              className={activeNav === i ? "active" : ""}
              onClick={() => onNavChange(i)}
            >
              <span className="ks-header__nav-icon">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>

        <div className="ks-header__lang" ref={langRef}>
          <button
            className="ks-header__lang-btn"
            onClick={() => setLangOpen(!langOpen)}
          >
            <span>{currentLang.flag}</span>
            <span>{currentLang.label}</span>
          </button>
          {langOpen && (
            <ul className="ks-header__lang-dropdown">
              {languages.map((lang) => (
                <li
                  key={lang.code}
                  onClick={() => {
                    setCurrentLang(lang);
                    setLangOpen(false);
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <nav className="ks-header__nav ks-header__nav--mobile">
        {navLinks.map((link, i) => (
          <button
            key={link.label}
            className={activeNav === i ? "active" : ""}
            onClick={() => onNavChange(i)}
          >
            <span className="ks-header__nav-icon">{link.icon}</span>
            {link.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
