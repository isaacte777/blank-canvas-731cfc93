import { useState, useEffect, useCallback } from "react";
import { Edit3, Plus } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";

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
}

export const Announcements = ({ 
  announcements: propAnnouncements, 
  isEditable = false, 
  onEditAnnouncement,
  onAddAnnouncement
}: AnnouncementsProps) => {
  const { ref, isVisible } = useScrollAnimation();

  // Default announcements if no data
  const defaultAnnouncements: Announcement[] = [
    {
      id: '1',
      title: "Compartí Tu Dolor",
      description: "Grupo de apoyo en tiempo de duelo. Reuniones semanales todos los miércoles.",
      image_url: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=600&h=600&fit=crop",
      is_visible: true,
      display_order: 0
    },
    {
      id: '2',
      title: "Oración Congregacional",
      description: "Lunes a Viernes 05:30 hs (Presencial/Zoom). Lunes a Jueves 19:30 hs.",
      image_url: "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=600&h=600&fit=crop",
      is_visible: true,
      display_order: 1
    },
    {
      id: '3',
      title: "Vigilia de Oración",
      description: "Viernes 21:00 hs en la Sala de Oración congregacional.",
      image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=600&fit=crop",
      is_visible: true,
      display_order: 2
    },
    {
      id: '4',
      title: "Sé parte de una Célula",
      description: "Escanea el código y escríbenos. Más información al WhatsApp.",
      image_url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&h=600&fit=crop",
      is_visible: true,
      display_order: 3
    }
  ];

  const announcements = propAnnouncements && propAnnouncements.length > 0 
    ? propAnnouncements 
    : defaultAnnouncements;

  return (
    <section 
      className="relative py-16 sm:py-20 md:py-24 overflow-hidden" 
      ref={ref}
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1478147427282-58a87a120781?w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-14">
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-hero)' }}
          >
            ANUNCIOS
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-3 sm:mt-4 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-white/70 mt-3 sm:mt-4 max-w-2xl mx-auto">
            Entérate de las actividades y novedades de nuestra comunidad
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {announcements.map((announcement, index) => (
              <div 
                key={announcement.id} 
                className="relative group overflow-hidden rounded-xl sm:rounded-2xl aspect-square sm:aspect-[4/5]"
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
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
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
                    className="absolute top-3 right-3 z-10 p-2.5 bg-primary/90 hover:bg-primary text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
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
