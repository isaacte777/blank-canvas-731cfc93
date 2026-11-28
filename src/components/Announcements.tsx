import { useEffect, useRef } from "react";
import { Edit3, Plus } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { DEFAULT_ANNOUNCEMENTS } from "@/lib/contentDefaults";
import { Button } from "@/components/ui/button";
import { EditableText } from "@/components/admin/EditableText";

export interface Announcement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_visible: boolean;
  display_order?: number;
}

interface AnnouncementsProps {
  announcements?: Announcement[];
  isEditable?: boolean;
  onEditAnnouncement?: (announcement: Announcement) => void;
  onAddAnnouncement?: () => void;
  title?: string | null;
  subtitle?: string | null;
  onEditHeader?: (field: 'title' | 'subtitle') => void;
}

export const Announcements = ({ 
  announcements: propAnnouncements, 
  isEditable = false, 
  onEditAnnouncement,
  onAddAnnouncement,
  title,
  subtitle,
  onEditHeader
}: AnnouncementsProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const bgRef = useRef<HTMLDivElement>(null);

  // Distant parallax: the background moves slower than the section,
  // giving the impression of depth (like a far-away mountain).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const section = ref.current;
      const bg = bgRef.current;
      if (!section || !bg) return;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < -300 || rect.top > window.innerHeight + 300) return;
      const raw = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const progress = Math.min(1, Math.max(0, raw));
      const offset = (progress - 0.5) * 18;
      bg.style.transform = `translate3d(0, ${offset.toFixed(2)}%, 0)`;
    };
    const requestUpdate = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);

  // Fallback único (contentDefaults): el preview del admin y el sitio público
  // deben renderizar exactamente lo mismo cuando no hay filas visibles.
  const announcements = propAnnouncements && propAnnouncements.length > 0
    ? propAnnouncements
    : DEFAULT_ANNOUNCEMENTS;

  // Grid columns adapt to the number of announcements so they always look centered
  const gridClass = announcements.length === 1
    ? 'grid-cols-1 max-w-md mx-auto'
    : announcements.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
      : announcements.length === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section 
      className="relative py-12 sm:py-16 md:py-20 overflow-hidden" 
      ref={ref}
    >
      {/* Distant background layer - slow parallax + subtle continuous movement */}
      <div 
        ref={bgRef}
        className="absolute inset-x-0 -top-[15%] h-[130%] will-change-transform"
        aria-hidden="true"
      >
        <img
          src="https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover animate-kenburns"
        />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-14">
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-hero)' }}
          >
            <EditableText enabled={isEditable} onClick={() => onEditHeader?.('title')}>
              {title || 'ANUNCIOS'}
            </EditableText>
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-3 sm:mt-4 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-white/70 mt-3 sm:mt-4 max-w-2xl mx-auto">
            <EditableText enabled={isEditable} onClick={() => onEditHeader?.('subtitle')}>
              {subtitle || 'Entérate de las actividades y novedades de nuestra comunidad'}
            </EditableText>
          </p>
        </div>

        {/* Add Button for Admin */}
        {isEditable && onAddAnnouncement && (
          <div className="absolute top-4 right-4 z-20">
            <Button 
              size="sm" 
              onClick={onAddAnnouncement}
              className="bg-primary hover:bg-primary/80"
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar
            </Button>
          </div>
        )}

        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">No hay anuncios disponibles</p>
          </div>
        ) : (
          <div className={`grid gap-4 sm:gap-5 md:gap-6 ${gridClass}`}>
            {announcements.map((announcement, index) => (
              <div 
                key={announcement.id} 
                className="relative group overflow-hidden rounded-xl sm:rounded-2xl h-[240px] sm:h-[280px] md:h-[320px] lg:h-[340px]"
                style={{ animationDelay: `${index * 0.1 + 0.4}s` }}
              >
                {/* Background Image */}
                {announcement.image_url ? (
                  <img 
                    src={announcement.image_url} 
                    alt={announcement.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/40 to-primary/80" />
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 p-4 sm:p-5 md:p-6 flex flex-col justify-end">
                  <h3 
                    className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 leading-tight"
                    style={{ fontFamily: 'var(--font-hero)' }}
                  >
                    {announcement.title}
                  </h3>
                  {announcement.description && (
                    <p className="text-xs sm:text-sm text-white/80 line-clamp-3">
                      {announcement.description}
                    </p>
                  )}
                </div>

                {/* Edit Button for Admin */}
                {isEditable && onEditAnnouncement && (
                  <button
                    onClick={() => onEditAnnouncement(announcement)}
                    className="absolute top-3 right-3 z-10 p-2.5 bg-foreground/90 hover:bg-foreground text-background rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                    title="Editar anuncio"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
