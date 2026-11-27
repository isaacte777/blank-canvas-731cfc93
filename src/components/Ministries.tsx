import { Link } from 'react-router-dom';
import { Users, Music, Heart, BookOpen, Church, Baby, GraduationCap, Flame } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export interface Ministry {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  is_visible: boolean;
  display_order: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Music,
  Heart,
  BookOpen,
  Church,
  Baby,
  GraduationCap,
  Flame
};

interface MinistriesProps {
  ministries: Ministry[];
}

export const Ministries = ({ ministries }: MinistriesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [prevTranslate, setPrevTranslate] = useState(0);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { ref, isVisible } = useScrollAnimation();

  // Calculate item width based on showing 3 items
  const getItemWidth = () => {
    if (!containerRef.current) return 100;
    const containerWidth = containerRef.current.offsetWidth;
    const gap = 16; // gap-4 = 16px
    return (containerWidth - gap * 2) / 3;
  };

  // Calculate max translate (how far left we can go)
  const getMaxTranslate = () => {
    const itemWidth = getItemWidth();
    const gap = 16;
    const totalItems = ministries.length;
    const visibleItems = 3;
    const extraItems = totalItems - visibleItems;
    if (extraItems <= 0) return 0;
    return -(extraItems * (itemWidth + gap));
  };

  // Update scroll indicators
  useEffect(() => {
    setCanScrollRight(ministries.length > 3 && currentTranslate > getMaxTranslate());
  }, [currentTranslate, ministries.length]);

  // Clamp translate within bounds
  const clampTranslate = (value: number) => {
    const maxTranslate = getMaxTranslate();
    return Math.max(maxTranslate, Math.min(0, value));
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (ministries.length <= 3) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setPrevTranslate(currentTranslate);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const diff = e.clientX - startX;
    const newTranslate = clampTranslate(prevTranslate + diff);
    setCurrentTranslate(newTranslate);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToNearestItem();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      snapToNearestItem();
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (ministries.length <= 3) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setPrevTranslate(currentTranslate);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    const newTranslate = clampTranslate(prevTranslate + diff);
    setCurrentTranslate(newTranslate);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToNearestItem();
  };

  // Snap to nearest item for smooth feel
  const snapToNearestItem = () => {
    const itemWidth = getItemWidth();
    const gap = 16;
    const step = itemWidth + gap;
    const snappedIndex = Math.round(Math.abs(currentTranslate) / step);
    const maxIndex = ministries.length - 3;
    const clampedIndex = Math.max(0, Math.min(snappedIndex, maxIndex));
    const snappedTranslate = -(clampedIndex * step);
    setCurrentTranslate(snappedTranslate);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCurrentTranslate(clampTranslate(currentTranslate));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentTranslate]);

  // Don't render if no ministries
  if (!ministries || ministries.length === 0) {
    return null;
  }

  const hasMoreItems = ministries.length > 3;

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground font-heading mb-2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Nuestros Ministerios
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Conoce las diferentes áreas donde servimos y crece junto a nosotros
          </p>
        </div>

        {/* Slider container - clips overflow */}
        <div 
          ref={containerRef}
          className="relative overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Track that moves */}
          <div 
            ref={trackRef}
            className={`
              flex gap-4 py-4
              ${isDragging ? 'cursor-grabbing' : hasMoreItems ? 'cursor-grab' : 'cursor-default'}
            `}
            style={{
              transform: `translateX(${currentTranslate}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {ministries.map((ministry) => {
              const Icon = iconMap[ministry.icon || 'Users'] || Users;
              
              return (
                <div
                  key={ministry.id}
                  className="flex-shrink-0"
                  style={{
                    width: 'calc((100% - 32px) / 3)', // 3 items with 2 gaps of 16px
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    {/* Ministry image - floating style 1:1 square */}
                    <Link
                      to={`/ministerios/${ministry.slug}`}
                      className="group block"
                      onClick={(e) => isDragging && e.preventDefault()}
                      draggable={false}
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-muted flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                        {ministry.image_url ? (
                          <img
                            src={ministry.image_url}
                            alt={ministry.title}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                        )}
                      </div>
                    </Link>
                    {/* Ministry title - not clickable */}
                    <span className="text-xs sm:text-sm font-medium text-foreground/80 text-center line-clamp-2 px-1">
                      {ministry.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right fade gradient - indicates more content */}
          {hasMoreItems && canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none bg-gradient-to-l from-muted/50 via-muted/30 to-transparent flex items-center justify-end pr-2">
              <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center animate-pulse">
                <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Swipe hint */}
        {hasMoreItems && (
          <p className="text-center text-xs text-muted-foreground/60 mt-2">
            Desliza para ver más →
          </p>
        )}
      </div>
    </section>
  );
};
