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
                className="group flex flex-col h-full bg-card border border-border/50 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-primary/30"
              >
                {/* Ministry image */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
                  {ministry.image_url ? (
                    <img
                      src={ministry.image_url}
                      alt={ministry.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Icon
                        className="w-12 h-12 sm:w-14 sm:h-14 text-foreground/70 group-hover:text-foreground transition-colors duration-300"
                        strokeWidth={1.5}
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Card content */}
                <div className="flex flex-col flex-grow p-4 sm:p-5">
                  <h3 className="text-base sm:text-lg font-bold text-foreground uppercase tracking-wide leading-snug">
                    {ministry.title}
                  </h3>
                  {ministry.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1.5 sm:mt-2 line-clamp-2 flex-grow">
                      {ministry.description}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider mt-3 sm:mt-4">
                    Conocer más
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
