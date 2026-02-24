interface KSFooterProps {
  onNavigateToLive: () => void;
}

export default function KSFooter({ onNavigateToLive }: KSFooterProps) {
  const handleFooterLink = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigateToLive();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="ks-footer">
      <div className="ks-footer__top">
        <div className="ks-footer__container">
          <div className="ks-footer__brand">
            <div className="ks-footer__logo">
              <a href="/">Kappa<span>score</span></a>
            </div>
            <p className="ks-footer__tagline">
              Live sports statistics, results and historical data.
            </p>
          </div>
          <div className="ks-footer__links">
            <div className="ks-footer__link-list">
              <h5>Others</h5>
              <ul>
                <li>
                  <a href="/" onClick={handleFooterLink}>Advertising</a>
                </li>
                <li>
                  <a href="/" onClick={handleFooterLink}>Contact us</a>
                </li>
              </ul>
            </div>
            <div className="ks-footer__link-list">
              <h5>Legal documents</h5>
              <ul>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
                <li><a href="/cookie-policy">Cookie Policy</a></li>
                <li><a href="/terms-conditions">Terms &amp; Conditions</a></li>
                <li><a href="/gdpr">GDPR &amp; Journalism</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="ks-footer__bottom">
        <div className="ks-footer__container">
          Copyright © {new Date().getFullYear()}{" "}
          <span className="ks-footer__logo-sm">
            Kappa<span>score</span>
          </span>{" "}
          - All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
