import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./KappaScore.css";

const sports = [
  { id: 1, name: "Soccer", icon: "fa-futbol-o" },
  { id: 2, name: "Basketball", icon: "fa-dribbble" },
  { id: 3, name: "Tennis", icon: "fa-circle-o" },
  { id: 4, name: "Ice Hockey", icon: "fa-trophy" },
  { id: 5, name: "Volleyball", icon: "fa-volleyball-ball" },
  { id: 6, name: "Handball", icon: "fa-hand-rock-o" },
  { id: 7, name: "Baseball", icon: "fa-baseball" },
  { id: 8, name: "Table Tennis", icon: "fa-table-tennis" },
  { id: 9, name: "American Football", icon: "fa-football" },
  { id: 10, name: "Rugby", icon: "fa-shield" },
  { id: 11, name: "Cricket", icon: "fa-ticket" },
];

const countries = [
  { name: "Spain", flag: "es" },
  { name: "England", flag: "gb-eng" },
  { name: "Germany", flag: "de" },
  { name: "Italy", flag: "it" },
  { name: "France", flag: "fr" },
  { name: "Portugal", flag: "pt" },
  { name: "Netherlands", flag: "nl" },
  { name: "Brazil", flag: "br" },
  { name: "Argentina", flag: "ar" },
  { name: "Turkey", flag: "tr" },
  { name: "Belgium", flag: "be" },
  { name: "Scotland", flag: "gb-sct" },
  { name: "Greece", flag: "gr" },
  { name: "Austria", flag: "at" },
  { name: "Switzerland", flag: "ch" },
  { name: "Denmark", flag: "dk" },
  { name: "Sweden", flag: "se" },
  { name: "Norway", flag: "no" },
];

interface MockEvent {
  home: string;
  away: string;
  score?: string;
  time: string;
  tab: "results" | "live" | "next";
}

interface MockLeague {
  country: string;
  league: string;
  events: MockEvent[];
}

const mockResults: MockLeague[] = [
  {
    country: "SPAIN", league: "La Liga",
    events: [
      { home: "Real Madrid", away: "Barcelona", score: "2:1", time: "Finished", tab: "results" },
      { home: "Atletico Madrid", away: "Sevilla", score: "1:0", time: "Finished", tab: "results" },
      { home: "Real Sociedad", away: "Villarreal", score: "3:2", time: "Finished", tab: "results" },
    ]
  },
  {
    country: "ENGLAND", league: "Premier League",
    events: [
      { home: "Manchester City", away: "Arsenal", score: "1:1", time: "Finished", tab: "results" },
      { home: "Liverpool", away: "Chelsea", score: "2:0", time: "Finished", tab: "results" },
      { home: "Tottenham", away: "Manchester United", score: "3:1", time: "Finished", tab: "results" },
    ]
  },
  {
    country: "GERMANY", league: "Bundesliga",
    events: [
      { home: "Bayern Munich", away: "Borussia Dortmund", score: "4:2", time: "Finished", tab: "results" },
      { home: "RB Leipzig", away: "Bayer Leverkusen", score: "1:1", time: "Finished", tab: "results" },
    ]
  },
  {
    country: "ITALY", league: "Serie A",
    events: [
      { home: "Inter Milan", away: "AC Milan", score: "2:1", time: "Finished", tab: "results" },
      { home: "Juventus", away: "Napoli", score: "0:1", time: "Finished", tab: "results" },
      { home: "AS Roma", away: "Lazio", score: "2:2", time: "Finished", tab: "results" },
    ]
  },
  {
    country: "FRANCE", league: "Ligue 1",
    events: [
      { home: "Paris Saint-Germain", away: "Marseille", score: "3:0", time: "Finished", tab: "results" },
      { home: "Lyon", away: "Monaco", score: "1:2", time: "Finished", tab: "results" },
    ]
  },
];

const mockLiveEvents: MockLeague[] = [
  {
    country: "SPAIN", league: "La Liga",
    events: [
      { home: "Real Betis", away: "Athletic Bilbao", score: "1:0", time: "34'", tab: "live" },
    ]
  },
  {
    country: "ENGLAND", league: "Premier League",
    events: [
      { home: "Everton", away: "Wolves", score: "0:2", time: "67'", tab: "live" },
      { home: "Fulham", away: "Crystal Palace", score: "1:1", time: "45+2'", tab: "live" },
    ]
  },
];

const mockNextEvents: MockLeague[] = [
  {
    country: "SPAIN", league: "La Liga",
    events: [
      { home: "Valencia", away: "Getafe", time: "18/02/2026 20:00", tab: "next" },
      { home: "Celta Vigo", away: "Mallorca", time: "19/02/2026 18:30", tab: "next" },
    ]
  },
  {
    country: "ENGLAND", league: "Premier League",
    events: [
      { home: "Aston Villa", away: "Newcastle", time: "18/02/2026 21:00", tab: "next" },
      { home: "Brighton", away: "West Ham", time: "19/02/2026 20:45", tab: "next" },
    ]
  },
  {
    country: "GERMANY", league: "Bundesliga",
    events: [
      { home: "Wolfsburg", away: "Stuttgart", time: "19/02/2026 18:30", tab: "next" },
    ]
  },
];

const fixedLeagues = [
  "La Liga", "Premier League", "Bundesliga", "Serie A", "Ligue 1",
  "Champions League", "Europa League"
];

const langs = [
  { code: "es", flag: "es", label: "ES" },
  { code: "en", flag: "us", label: "US" },
  { code: "it", flag: "it", label: "IT" },
  { code: "fr", flag: "fr", label: "FR" },
  { code: "de", flag: "de", label: "DE" },
  { code: "pt", flag: "pt", label: "PT" },
];

// Generate a unique key for each event
const eventKey = (home: string, away: string) => `${home}__${away}`;

const KappaScore = () => {
  const [activeTab, setActiveTab] = useState<"results" | "live" | "next">("results");
  const [selectedSport, setSelectedSport] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ks_fav_events") || "[]");
      return new Set(stored);
    } catch { return new Set(); }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(langs[0]);
  const langRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem("ks_fav_events", JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

  const scrollSports = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Get data for current tab, or ALL data if favorites filter is active
  const getDisplayData = (): MockLeague[] => {
    if (showFavoritesOnly) {
      // Merge all sources and filter only favorited events
      const allSources = [...mockResults, ...mockLiveEvents, ...mockNextEvents];
      const filtered: MockLeague[] = [];
      for (const league of allSources) {
        const favEvents = league.events.filter(ev => favorites.has(eventKey(ev.home, ev.away)));
        if (favEvents.length > 0) {
          filtered.push({ ...league, events: favEvents });
        }
      }
      return filtered;
    }

    if (activeTab === "results") return mockResults;
    if (activeTab === "live") return mockLiveEvents;
    if (activeTab === "next") return mockNextEvents;
    return [];
  };

  const displayData = getDisplayData();
  const favCount = favorites.size;

  const currentFilter = showFavoritesOnly ? "favorites" : activeTab;

  return (
    <div className="ks">
      {/* ─── UNIFIED HEADER ─── */}
      <header className="ks-header">
        <div className="ks-container">
          <div className="ks-header__inner">
            <a href="#" className="ks-header__logo">
              Kappa<span>score</span>
            </a>

            <div className="ks-header__top-links">
              <a href="#" className="ks-header__top-link ks-header__top-link--active">Sports</a>
              <a href="#" className="ks-header__top-link">Games</a>
              <a href="#" className="ks-header__top-link">Top Lists</a>
            </div>

            <nav className="ks-header__nav">
              <a href="#" className="ks-header__nav-link ks-header__nav-link--active">
                <i className="fa fa-bars"></i> Results
              </a>
              <a href="#" className="ks-header__nav-link">
                <i className="fa fa-line-chart"></i> Statistics
              </a>
              <a href="#" className="ks-header__nav-link">
                <i className="fa fa-desktop"></i> Live Score
              </a>
            </nav>

            <div className="ks-header__lang" ref={langRef}>
              <button className="ks-header__lang-btn" onClick={() => setLangOpen(!langOpen)}>
                <span className={`fi fi-${selectedLang.flag}`}></span>
                <span>{selectedLang.label}</span>
                <i className={`fa fa-chevron-${langOpen ? "up" : "down"}`} style={{ fontSize: 10 }}></i>
              </button>
              {langOpen && (
                <div className="ks-header__lang-dropdown">
                  {langs.map(l => (
                    <button
                      key={l.code}
                      className={`ks-header__lang-option ${l.code === selectedLang.code ? "active" : ""}`}
                      onClick={() => { setSelectedLang(l); setLangOpen(false); }}
                    >
                      <span className={`fi fi-${l.flag}`}></span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          <nav className="ks-header__mobile-nav-bar">
            <a href="#" className="ks-header__nav-link ks-header__nav-link--active">
              <i className="fa fa-bars"></i> Results
            </a>
            <a href="#" className="ks-header__nav-link">
              <i className="fa fa-line-chart"></i> Statistics
            </a>
            <a href="#" className="ks-header__nav-link">
              <i className="fa fa-desktop"></i> Live Score
            </a>
          </nav>
        </div>
      </header>

      {/* ─── SPORTS BAR ─── */}
      <div className="ks-sports-bar">
        <div className="ks-container">
          <div className="ks-sports-bar__wrapper">
            {canScrollLeft && (
              <button className="ks-sports-bar__arrow ks-sports-bar__arrow--left" onClick={() => scrollSports("left")}>
                <ChevronLeft size={18} />
              </button>
            )}
            <div className="ks-sports-bar__scroll" ref={scrollRef}>
              {sports.map(sport => (
                <button
                  key={sport.id}
                  className={`ks-sports-bar__item ${selectedSport === sport.id ? "ks-sports-bar__item--active" : ""}`}
                  onClick={() => setSelectedSport(sport.id)}
                >
                  <i className={`fa ${sport.icon}`}></i>
                  <span>{sport.name}</span>
                </button>
              ))}
            </div>
            {canScrollRight && (
              <button className="ks-sports-bar__arrow ks-sports-bar__arrow--right" onClick={() => scrollSports("right")}>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <main className="ks-main">
        <div className="ks-container">
          <div className="ks-layout">
            {/* SIDEBAR */}
            <aside className="ks-sidebar">
              <div className="ks-sidebar__section">
                <h3 className="ks-sidebar__title">
                  <i className="fa fa-thumb-tack"></i> Fixed Leagues
                </h3>
                <ul className="ks-sidebar__list">
                  {fixedLeagues.map((league, i) => (
                    <li key={i}>
                      <a href="#" className="ks-sidebar__link">
                        <i className="fa fa-futbol-o ks-sidebar__link-icon"></i>
                        {league}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ks-sidebar__section">
                <h3 className="ks-sidebar__title">
                  <i className="fa fa-globe"></i> Countries
                </h3>
                <ul className="ks-sidebar__list ks-sidebar__countries">
                  {countries.map((country, i) => (
                    <li key={i}>
                      <a href="#" className="ks-sidebar__link">
                        <span className={`fi fi-${country.flag} ks-sidebar__link-icon`}></span>
                        {country.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* CONTENT */}
            <div className="ks-content">
              {/* TABS + FILTER */}
              <div className="ks-tabs">
                <button
                  className={`ks-tabs__btn ${currentFilter === "results" ? "ks-tabs__btn--active" : ""}`}
                  onClick={() => { setActiveTab("results"); setShowFavoritesOnly(false); }}
                >
                  <i className="fa fa-check-circle"></i> Results
                </button>
                <button
                  className={`ks-tabs__btn ks-tabs__btn--live ${currentFilter === "live" ? "ks-tabs__btn--active" : ""}`}
                  onClick={() => { setActiveTab("live"); setShowFavoritesOnly(false); }}
                >
                  <span className="ks-tabs__live-dot"></span>
                  Live <span className="ks-tabs__live-count">{mockLiveEvents.reduce((a, l) => a + l.events.length, 0)}</span>
                </button>
                <button
                  className={`ks-tabs__btn ${currentFilter === "next" ? "ks-tabs__btn--active" : ""}`}
                  onClick={() => { setActiveTab("next"); setShowFavoritesOnly(false); }}
                >
                  <i className="fa fa-clock-o"></i> Next Events
                </button>

                {/* Filter dropdown */}
                <div className="ks-tabs__filter-wrapper" ref={filterRef}>
                  <button
                    className={`ks-tabs__filter-btn ${filterDropdownOpen ? "open" : ""} ${showFavoritesOnly ? "has-filter" : ""}`}
                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  >
                    <i className="fa fa-filter"></i> Filter
                    {showFavoritesOnly && <span className="ks-tabs__filter-dot"></span>}
                  </button>
                  {filterDropdownOpen && (
                    <div className="ks-tabs__filter-dropdown">
                      <button
                        className={`ks-tabs__filter-option ${!showFavoritesOnly ? "active" : ""}`}
                        onClick={() => { setShowFavoritesOnly(false); setFilterDropdownOpen(false); }}
                      >
                        <i className="fa fa-list"></i> All
                      </button>
                      <button
                        className={`ks-tabs__filter-option ${showFavoritesOnly ? "active" : ""}`}
                        onClick={() => { setShowFavoritesOnly(true); setFilterDropdownOpen(false); }}
                      >
                        <i className="fa fa-star"></i> Favorites
                        {favCount > 0 && <span className="ks-tabs__fav-badge">{favCount}</span>}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* EVENTS */}
              <div className="ks-events">
                {displayData.length === 0 ? (
                  <div className="ks-events__empty">
                    <i className={`fa ${showFavoritesOnly ? "fa-star-o" : "fa-signal"}`}></i>
                    <p>{showFavoritesOnly ? "No favorite events yet. Click the star on any event to add it." : "No live events at the moment"}</p>
                  </div>
                ) : (
                  displayData.map((league, i) => (
                    <div key={i} className="ks-league">
                      <div className="ks-league__header">
                        <span className="ks-league__country">{league.country}</span>
                        <span className="ks-league__separator">›</span>
                        <span className="ks-league__name">{league.league}</span>
                        {showFavoritesOnly && league.events[0] && (
                          <span className={`ks-league__source-badge ks-league__source-badge--${league.events[0].tab}`}>
                            {league.events[0].tab === "live" ? "LIVE" : league.events[0].tab === "results" ? "FT" : "NEXT"}
                          </span>
                        )}
                      </div>
                      <div className="ks-league__events">
                        {league.events.map((event, j) => {
                          const key = eventKey(event.home, event.away);
                          const isFav = favorites.has(key);
                          const tabSource = showFavoritesOnly ? event.tab : activeTab;
                          return (
                            <a href="#" key={j} className="ks-match">
                              <div
                                className={`ks-match__fav ${isFav ? "ks-match__fav--active" : ""}`}
                                onClick={(e) => toggleFavorite(key, e)}
                              >
                                <i className={`fa ${isFav ? "fa-star" : "fa-star-o"}`}></i>
                              </div>
                              <div className="ks-match__time">
                                {tabSource === "results" ? (
                                  <span className="ks-match__status ks-match__status--finished">FT</span>
                                ) : tabSource === "live" ? (
                                  <span className="ks-match__status ks-match__status--live">{event.time}</span>
                                ) : (
                                  <span className="ks-match__datetime">{event.time}</span>
                                )}
                              </div>
                              <div className="ks-match__teams">
                                <div className="ks-match__team">
                                  <span className="ks-match__team-name">{event.home}</span>
                                  {event.score && (
                                    <span className="ks-match__team-score">
                                      {event.score.split(":")[0]}
                                    </span>
                                  )}
                                </div>
                                <div className="ks-match__team">
                                  <span className="ks-match__team-name">{event.away}</span>
                                  {event.score && (
                                    <span className="ks-match__team-score">
                                      {event.score.split(":")[1]}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ks-match__action">
                                <i className="fa fa-chevron-right"></i>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="ks-footer">
        <div className="ks-container">
          <div className="ks-footer__inner">
            <div className="ks-footer__brand">
              <a href="#" className="ks-footer__logo">
                Kappa<span>score</span>
              </a>
              <p className="ks-footer__tagline">Live sports statistics, results and historical data.</p>
            </div>
            <div className="ks-footer__columns">
              <div className="ks-footer__col">
                <h4 className="ks-footer__col-title">Company</h4>
                <ul className="ks-footer__col-list">
                  <li><a href="#">Advertising</a></li>
                  <li><a href="#">Contact us</a></li>
                </ul>
              </div>
              <div className="ks-footer__col">
                <h4 className="ks-footer__col-title">Legal</h4>
                <ul className="ks-footer__col-list">
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Cookie Policy</a></li>
                  <li><a href="#">Terms &amp; Conditions</a></li>
                  <li><a href="#">GDPR &amp; Journalism</a></li>
                </ul>
              </div>
              <div className="ks-footer__col">
                <h4 className="ks-footer__col-title">Sports</h4>
                <ul className="ks-footer__col-list">
                  <li><a href="#">Soccer</a></li>
                  <li><a href="#">Basketball</a></li>
                  <li><a href="#">Tennis</a></li>
                  <li><a href="#">Ice Hockey</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="ks-footer__bottom">
            <span>© 2026 <strong>Kappa<span className="ks-footer__accent">score</span></strong> — All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KappaScore;
