import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.png";

interface NavigationProps {
  liveStreamUrl?: string;
  customLogoUrl?: string;
}

export const Navigation = ({ liveStreamUrl, customLogoUrl }: NavigationProps) => {
  const [searchParams] = useSearchParams();
  const isMobilePreview = searchParams.get('preview') === 'mobile';
  const isMobile = useIsMobile();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hide admin access in preview mode to avoid infinite loops
  const showAdminButton = isAdmin && !isMobilePreview;

  // Detect scroll to show/hide backdrop (only for desktop)
  useEffect(() => {
    if (isMobile) {
      setIsScrolled(false);
      return;
    }
    
    const handleScroll = () => {
      // Show backdrop after scrolling 100px (past the hero section start)
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Helper to open external URLs safely
  const openExternalUrl = (url: string | undefined) => {
    if (!url) return;
    
    // Ensure URL has protocol
    let finalUrl = url.trim();
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    // Use window.open with noopener for security
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isAdmin) return;
    
    clickCountRef.current += 1;
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    if (clickCountRef.current >= 3) {
      e.preventDefault();
      clickCountRef.current = 0;
      navigate('/auth');
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 500);
    }
  };

  // Handle menu close with animation
  const handleCloseMenu = () => {
    setIsMenuClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }, 350);
  };

  const navItems = [
    { label: "Iglesia CFA", href: "#inicio" },
    { label: "Anuncios", href: "#anuncios" },
    { label: "Primeros Pasos", href: "#servicios" },
    { label: "Quienes Somos", href: "#nosotros" },
    { label: "Ministerios", href: "#ministerios" },
  ];

  // Desktop only: transparent at top, blur/shadow/colors on scroll
  // Mobile: always transparent, white text (original style)
  const showDesktopEffects = !isMobile && isScrolled;

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showDesktopEffects ? 'backdrop-blur-md shadow-lg' : ''
      }`} 
      style={{
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        backgroundColor: showDesktopEffects ? 'hsl(var(--header-bg) / 0.85)' : 'transparent',
        borderBottom: showDesktopEffects ? '1px solid hsl(var(--header-border))' : 'none'
      }}
    >
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4" style={{
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="flex items-center justify-between w-full min-w-0">
          {/* Logo - z-60 to appear above mobile menu */}
          <a 
            href="#inicio" 
            className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative z-[60]"
            onClick={handleLogoClick}
          >
            <img src={customLogoUrl || logo} alt="CFA" className="h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 w-auto object-contain" />
            <span 
              className="hidden md:block text-[10px] md:text-xs lg:text-sm font-bold tracking-widest uppercase transition-colors duration-300"
              style={{
                fontFamily: 'var(--font-hero)',
                color: showDesktopEffects ? 'hsl(var(--header-text))' : 'white'
              }}
            >CFA</span>
            {/* Mobile CFA text - shows configured color when menu is open */}
            {isMenuOpen && (
              <span 
                className="md:hidden text-[10px] font-bold tracking-widest uppercase"
                style={{
                  fontFamily: 'var(--font-hero)',
                  color: 'hsl(var(--header-text))'
                }}
              >CFA</span>
            )}
          </a>

          {/* Navigation - Visible from tablet (md) and up */}
          <div className="hidden md:flex items-center justify-center flex-1 px-2 lg:px-4 xl:px-6">
            <div className="flex items-center gap-3 lg:gap-5 xl:gap-7">
              {navItems.map(item => (
                <a 
                  key={item.label} 
                  href={item.href} 
                  className="relative text-[10px] lg:text-xs xl:text-sm font-bold transition-colors duration-300 tracking-wide lg:tracking-wider uppercase pb-0.5 whitespace-nowrap hover:opacity-80"
                  style={{ 
                    fontFamily: 'var(--font-hero)',
                    color: isScrolled ? 'hsl(var(--header-text))' : 'white'
                  }}
                >
                  {item.label}
                  <span 
                    className="absolute bottom-0 left-0 w-full h-px transition-colors duration-300"
                    style={{
                      backgroundColor: isScrolled ? 'hsl(var(--header-text) / 0.3)' : 'rgba(255,255,255,0.5)'
                    }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 xl:gap-4 shrink-0">
            {/* Contacto - Only on lg+ */}
            <a 
              href="#contacto"
              className="hidden lg:block font-bold text-[10px] xl:text-xs 2xl:text-sm tracking-wide xl:tracking-wider uppercase transition-all duration-300 whitespace-nowrap hover:opacity-80"
              style={{ 
                fontFamily: 'var(--font-hero)',
                color: showDesktopEffects ? 'hsl(var(--header-text))' : 'white'
              }}
            >
              Contacto
            </a>
            
            {/* Donaciones */}
            <Button 
              variant="outline" 
              className="hidden sm:flex md:border-2 font-bold text-[9px] md:text-[10px] lg:text-xs xl:text-sm tracking-wide uppercase px-2 md:px-3 lg:px-4 xl:px-5 h-7 md:h-8 lg:h-9 xl:h-10 rounded transition-all duration-300 bg-transparent whitespace-nowrap hover:opacity-80"
              style={{ 
                fontFamily: 'var(--font-hero)',
                borderColor: showDesktopEffects ? 'hsl(var(--header-border))' : 'white',
                color: showDesktopEffects ? 'hsl(var(--header-text))' : 'white'
              }}
              asChild
            >
              <Link to="/donaciones">Donaciones</Link>
            </Button>
            
            {/* En Vivo - hide when menu is open */}
            {!isMenuOpen && (
              <Button 
                className="bg-liveRed hover:bg-liveRed/90 text-white font-bold text-[9px] md:text-[10px] lg:text-xs xl:text-sm tracking-wide uppercase px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 h-7 md:h-8 lg:h-9 xl:h-10 rounded transition-all duration-300 whitespace-nowrap" 
                style={{ fontFamily: 'var(--font-hero)' }}
                onClick={() => openExternalUrl(liveStreamUrl)}
              >
                En Vivo
              </Button>
            )}
            
            {/* Admin Button - hide when menu is open or in preview mode */}
            {showAdminButton && !isMenuOpen && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 rounded-full shrink-0 transition-colors duration-300 hover:opacity-80"
                style={{
                  color: showDesktopEffects ? 'hsl(var(--header-text) / 0.7)' : 'rgba(255,255,255,0.7)'
                }}
                asChild
              >
                <Link to="/admin">
                  <Settings className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Link>
              </Button>
            )}

            {/* Mobile Menu Button - Only on small screens, z-[60] to appear above menu */}
            <button 
              className="md:hidden p-1.5 rounded-full transition-colors shrink-0 relative z-[60] hover:opacity-80"
              style={{
                color: isMenuOpen ? 'hsl(var(--header-text))' : 'white'
              }}
              onClick={() => isMenuOpen ? handleCloseMenu() : setIsMenuOpen(true)} 
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay - Full screen width with angled bottom */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className={`fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity duration-300 ${isMenuClosing ? 'opacity-0' : 'opacity-100'}`}
              onClick={handleCloseMenu}
            />
            
            {/* Menu Panel - Smooth slide animation */}
            <div 
              className="fixed left-0 right-0 z-50 md:hidden"
              style={{ 
                top: '-15vh',
                height: '70vh',
                animation: `${isMenuClosing ? 'menuSlideUp' : 'menuSlideDown'} 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards`
              }}
            >
              {/* Background with configured color + angled bottom edge */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundColor: 'hsl(var(--header-bg))',
                  clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 5vh), 0 100%)'
                }}
              />
              
              
              {/* Content container - two column layout */}
              <div 
                className="relative z-10 flex items-center justify-between px-6"
                style={{ 
                  position: 'absolute',
                  top: '20vh',
                  left: 0,
                  right: 0,
                  bottom: '14vh'
                }}
              >
                
                {/* Left side - Navigation Links */}
                <div className="flex flex-col items-start justify-center gap-2.5">
                {navItems.map((item, index) => (
                    <a 
                      key={item.label} 
                      href={item.href} 
                      className="font-semibold transition-colors tracking-wider uppercase text-[11px]"
                      style={{
                        fontFamily: 'var(--font-hero)',
                        color: 'hsl(var(--header-text) / 0.85)',
                        animation: `fadeSlideIn 0.3s ease-out ${0.08 + index * 0.03}s forwards`,
                        opacity: 0
                      }} 
                      onClick={handleCloseMenu}
                    >
                      {item.label}
                    </a>
                  ))}
                  <a 
                    href="#contacto" 
                    className="font-semibold transition-colors tracking-wider uppercase text-[11px]" 
                    style={{ 
                      fontFamily: 'var(--font-hero)',
                      color: 'hsl(var(--header-text) / 0.85)',
                      animation: 'fadeSlideIn 0.3s ease-out 0.23s forwards',
                      opacity: 0
                    }} 
                    onClick={handleCloseMenu}
                  >
                    Contacto
                  </a>
                  {showAdminButton && (
                    <Link 
                      to="/admin" 
                      className="font-semibold transition-colors tracking-wider uppercase text-[11px] flex items-center gap-1.5"
                      style={{ 
                        fontFamily: 'var(--font-hero)',
                        color: 'hsl(var(--header-text) / 0.85)',
                        animation: 'fadeSlideIn 0.3s ease-out 0.26s forwards',
                        opacity: 0
                      }} 
                      onClick={handleCloseMenu}
                    >
                      <Settings className="h-3 w-3" />
                      Admin
                    </Link>
                  )}
                </div>
                
                {/* Right side - Action Buttons stacked and centered */}
                <div 
                  className="flex flex-col gap-3 items-center"
                  style={{
                    animation: 'fadeSlideIn 0.3s ease-out 0.2s forwards',
                    opacity: 0
                  }}
                >
                  <Button 
                    variant="outline" 
                    className="w-28 rounded-md bg-transparent font-semibold tracking-wider uppercase text-[10px] h-9" 
                    style={{ 
                      fontFamily: 'var(--font-hero)',
                      borderColor: 'hsl(var(--header-border) / 0.4)',
                      color: 'hsl(var(--header-text) / 0.9)'
                    }}
                    asChild
                  >
                    <Link to="/donaciones" onClick={handleCloseMenu}>Donaciones</Link>
                  </Button>
                  <Button 
                    className="w-28 bg-liveRed hover:bg-liveRed/90 text-white rounded-md font-semibold tracking-wider uppercase text-[10px] h-9" 
                    style={{ fontFamily: 'var(--font-hero)' }}
                    onClick={() => {
                      handleCloseMenu();
                      openExternalUrl(liveStreamUrl);
                    }}
                  >
                    En Vivo
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};
