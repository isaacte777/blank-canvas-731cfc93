import { Link } from 'react-router-dom';
import { Users, Music, Heart, BookOpen, Church, Baby, GraduationCap, Flame, ArrowRight } from 'lucide-react';
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
  const { ref, isVisible } = useScrollAnimation();

  // Don't render if no ministries
  if (!ministries || ministries.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className={`text-center mb-8 sm:mb-10 md:mb-14 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-foreground tracking-wide uppercase font-bold">
            Nuestros <span className="text-primary">Ministerios</span>
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-3 sm:mt-4 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-3 sm:mt-4 max-w-2xl mx-auto">
            Conoce las diferentes áreas donde servimos y crece junto a nosotros
          </p>
        </div>

        {/* Responsive grid of ministry cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {ministries.map((ministry) => {
            const Icon = iconMap[ministry.icon || 'Users'] || Users;

            return (
              <Link
                key={ministry.id}
                to={`/ministerios/${ministry.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-muted via-background to-muted transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)]"
              >
                {/* Full-bleed media: the image covers the whole portrait rectangle */}
                {ministry.image_url ? (
                  <img
                    src={ministry.image_url}
                    alt={ministry.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      className="w-16 h-16 sm:w-20 sm:h-20 text-foreground/40 group-hover:text-foreground/60 transition-all duration-700 ease-out group-hover:scale-105"
                      strokeWidth={1}
                    />
                  </div>
                )}

                {/* Gradient for text readability — no borders, no frame */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Bottom content: simple clear title + clear "Más información" button */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <h3 className="text-white font-bold uppercase tracking-wide text-lg sm:text-xl leading-snug">
                    {ministry.title}
                  </h3>
                  <span className="mt-3 sm:mt-4 inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-300 group-hover:bg-white/90 group-hover:-translate-y-0.5">
                    Más información
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
