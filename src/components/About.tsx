import communityImageDefault from "@/assets/community.jpg";
import { Heart, Users, Book, Edit3 } from "lucide-react";
import { DEFAULT_ABOUT, DEFAULT_ABOUT_FIELDS } from "@/lib/contentDefaults";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export interface GalleryImage {
  id: string;
  image_url: string;
  position: number;
  alt_text: string | null;
  is_visible?: boolean;
}

interface AboutProps {
  title?: string | null;
  subtitle?: string | null;
  content?: string | null;
  image_url?: string | null;
  galleryImages?: GalleryImage[];
  isEditable?: boolean;
  onEditField?: (field: 'title' | 'subtitle' | 'content' | 'secondParagraph' | 'value1Title' | 'value1Desc' | 'value2Title' | 'value2Desc' | 'value3Title' | 'value3Desc' | 'stat1Value' | 'stat1Label' | 'stat2Value' | 'stat2Label' | 'stat3Value' | 'stat3Label' | 'marqueeText') => void;
  onEditImage?: () => void;
  onEditGalleryImage?: (image: GalleryImage) => void;
  marqueeText?: string | null;
  secondParagraph?: string | null;
  value1Title?: string | null;
  value1Desc?: string | null;
  value2Title?: string | null;
  value2Desc?: string | null;
  value3Title?: string | null;
  value3Desc?: string | null;
  stat1Value?: string | null;
  stat1Label?: string | null;
  stat2Value?: string | null;
  stat2Label?: string | null;
  stat3Value?: string | null;
  stat3Label?: string | null;
}

export const About = ({ 
  title, 
  subtitle, 
  content, 
  image_url,
  galleryImages = [],
  isEditable = false,
  onEditField,
  onEditImage,
  onEditGalleryImage,
  marqueeText,
  secondParagraph,
  value1Title,
  value1Desc,
  value2Title,
  value2Desc,
  value3Title,
  value3Desc,
  stat1Value,
  stat1Label,
  stat2Value,
  stat2Label,
  stat3Value,
  stat3Label
}: AboutProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const communityImage = image_url || communityImageDefault;
  
  // Galería de respaldo (imágenes sembradas en las migraciones) para que la
  // sección siempre muestre el mosaico completo aunque la base esté vacía.
  const SEED_GALLERY: GalleryImage[] = [
    { id: "seed-1", image_url: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800", alt_text: "Adoración en la iglesia", position: 0 },
    { id: "seed-2", image_url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600", alt_text: "Comunidad unida", position: 1 },
    { id: "seed-3", image_url: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600", alt_text: "Estudio bíblico", position: 2 },
    { id: "seed-4", image_url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600", alt_text: "Oración comunitaria", position: 3 },
    { id: "seed-5", image_url: "https://pcubjmgstfqdfpftkvuu.supabase.co/storage/v1/object/public/images/images/1768847052033-4kbkxr.jpeg", alt_text: "Ministerio de jóvenes", position: 4 },
  ];
  const images = galleryImages.length > 0 ? galleryImages : SEED_GALLERY;
  const isSeedImage = (image: GalleryImage) => image.id.startsWith("seed-");

  // Fallbacks: si la base no tiene valores, mostramos la información histórica
  const displayTitle = title || DEFAULT_ABOUT.title;

  // Texto de la banda marquee: "CREE., PERTENECE., TRANSFORMA., BIENVENIDOS A CFA"
  // separado por comas. Cada palabra queda envuelta en EditableText en el preview.
  const marqueeWords = (marqueeText || DEFAULT_ABOUT_FIELDS.marqueeText)
    .split(',')
    .map(w => w.trim())
    .filter(Boolean);
  const displaySubtitle = subtitle || DEFAULT_ABOUT.subtitle;
  const displayContent = content || DEFAULT_ABOUT_FIELDS.firstParagraph;
  const displaySecond = secondParagraph || DEFAULT_ABOUT_FIELDS.secondParagraph;
  const hasStats = Boolean(stat1Value || stat2Value || stat3Value);

  // Gallery layout: single featured image (0–1), Mondrian-style varied blocks (2+)
  const galleryMode = images.length <= 1 ? 'single' : 'mondrian';
  const galleryHeight = 'h-[240px] sm:h-[320px] md:h-[400px] lg:h-[460px]';
  // Flex weights create blocks of different sizes, like a Mondrian painting
  const LEFT_WEIGHTS = ['flex-[3]', 'flex-[1]', 'flex-[2]'];
  const RIGHT_WEIGHTS = ['flex-[2]', 'flex-[1]', 'flex-[3]'];
  const midIndex = Math.ceil(images.length / 2);
  const leftImages = images.slice(0, midIndex);
  const rightImages = images.slice(midIndex);
  
  const values = [
    {
      icon: Heart,
      title: value1Title || DEFAULT_ABOUT_FIELDS.value1Title,
      description: value1Desc || DEFAULT_ABOUT_FIELDS.value1Desc,
      titleField: 'value1Title' as const,
      descField: 'value1Desc' as const
    },
    {
      icon: Users,
      title: value2Title || DEFAULT_ABOUT_FIELDS.value2Title,
      description: value2Desc || DEFAULT_ABOUT_FIELDS.value2Desc,
      titleField: 'value2Title' as const,
      descField: 'value2Desc' as const
    },
    {
      icon: Book,
      title: value3Title || DEFAULT_ABOUT_FIELDS.value3Title,
      description: value3Desc || DEFAULT_ABOUT_FIELDS.value3Desc,
      titleField: 'value3Title' as const,
      descField: 'value3Desc' as const
    }
  ];

  const stats = [
    { value: stat1Value || "", label: stat1Label || "", valueField: 'stat1Value' as const, labelField: 'stat1Label' as const, color: "text-turquoise" },
    { value: stat2Value || "", label: stat2Label || "", valueField: 'stat2Value' as const, labelField: 'stat2Label' as const, color: "text-pink" },
    { value: stat3Value || "", label: stat3Label || "", valueField: 'stat3Value' as const, labelField: 'stat3Label' as const, color: "text-purple" }
  ];

  const EditableText = ({ children, field, className = "" }: { children: React.ReactNode; field: Parameters<NonNullable<typeof onEditField>>[0]; className?: string }) => {
    if (!isEditable) return <>{children}</>;
    return (
      <span 
        className={`relative group cursor-pointer ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          onEditField?.(field);
        }}
      >
        {children}
        <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background rounded-full p-1">
          <Edit3 className="w-3 h-3" />
        </span>
        <span className="absolute inset-0 border-2 border-dashed border-foreground/40 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    );
  };

  // Mondrian-style gallery grid item component
  const GalleryItem = ({ image, className, delay }: { image: GalleryImage; className: string; delay: string }) => (
    <div 
      className={`relative overflow-hidden group ${className} ${isVisible ? 'animate-card-wow' : 'opacity-0'}`}
      style={{ animationDelay: delay }}
    >
      <img 
        src={image.image_url} 
        alt={image.alt_text || 'Historia de la iglesia'} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Edit button for gallery images (hidden on fallback seed images) */}
      {isEditable && onEditGalleryImage && !isSeedImage(image) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditGalleryImage(image);
          }}
          className="absolute top-2 right-2 bg-foreground text-background rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 transform duration-200 z-10"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-8 md:gap-12 lg:gap-16 items-start max-w-7xl mx-auto">
          {/* Left side - Text content */}
          <div className={`space-y-5 sm:space-y-6 md:space-y-8 ${isVisible ? 'animate-slide-left-wow' : 'opacity-0'}`}>
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-foreground tracking-wide">
                <EditableText field="title">{displayTitle}</EditableText>{' '}
                <EditableText field="subtitle"><span className="text-purple">{displaySubtitle}</span></EditableText>
              </h2>
              <div className="w-16 h-1 bg-purple rounded-full mt-2 sm:mt-3" />
            </div>
            <EditableText field="content">
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed font-body">
                {displayContent}
              </p>
            </EditableText>
            <EditableText field="secondParagraph">
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed font-body">
                {displaySecond}
              </p>
            </EditableText>

            {/* Values — en móvil: filas icono + texto; desde sm:3 columnas centradas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3 md:gap-4 lg:gap-6 pt-2 sm:pt-3 md:pt-4">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="flex items-center gap-3 sm:block sm:text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 sm:mx-auto flex items-center justify-center transform hover:rotate-6 transition-transform">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-foreground" />
                    </div>
                    <div className="min-w-0 sm:mt-2 md:mt-3">
                      <EditableText field={value.titleField}>
                        <div className="font-heading text-foreground uppercase text-[11px] sm:text-xs md:text-sm lg:text-base tracking-wider text-left sm:text-center">
                          {value.title}
                        </div>
                      </EditableText>
                      <EditableText field={value.descField}>
                        <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground font-body leading-snug text-left sm:text-center mt-0.5">
                          {value.description}
                        </div>
                      </EditableText>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats (ocultos si no hay valores cargados) */}
            {hasStats && (
              <div className="grid grid-cols-3 gap-3 sm:gap-3 md:gap-4 lg:gap-6 pt-4 sm:pt-5 md:pt-6 border-t border-turquoise/30">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <EditableText field={stat.valueField}>
                      <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading ${stat.color} mb-0.5 sm:mb-1 md:mb-2`}>{stat.value}</div>
                    </EditableText>
                    <EditableText field={stat.labelField}>
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wider font-body">{stat.label}</div>
                    </EditableText>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Right side - Image Gallery */}
          <div className={`relative ${isVisible ? 'animate-slide-right-wow' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            {/* Single featured image (0 or 1 gallery images) */}
            {galleryMode === 'single' && (
              <div className={`relative overflow-hidden group rounded-2xl border-2 border-primary/20 ${galleryHeight}`}>
                <img 
                  src={images[0]?.image_url || communityImage} 
                  alt={images[0]?.alt_text || 'Comunidad de fe'} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isEditable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (images[0]) onEditGalleryImage?.(images[0]);
                      else onEditImage?.();
                    }}
                    className="absolute top-3 right-3 bg-foreground text-background rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 transform duration-200 z-10"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Mondrian-style layout: blocks of different sizes, like the painting */}
            {galleryMode === 'mondrian' && (
              <div className={`flex gap-1.5 sm:gap-2 md:gap-3 ${galleryHeight}`}>
                {/* Left pane - larger blocks */}
                <div className="flex-[3] flex flex-col gap-1.5 sm:gap-2 md:gap-3 min-h-0">
                  {leftImages.map((image, index) => (
                    <GalleryItem 
                      key={image.id}
                      image={image} 
                      className={`${LEFT_WEIGHTS[index % LEFT_WEIGHTS.length]} min-h-0 rounded-lg`} 
                      delay={`${0.4 + index * 0.08}s`}
                    />
                  ))}
                </div>

                {/* Right pane - smaller blocks + solid color accent */}
                <div className="flex-[2] flex flex-col gap-1.5 sm:gap-2 md:gap-3 min-h-0">
                  {rightImages.map((image, index) => (
                    <GalleryItem 
                      key={image.id}
                      image={image} 
                      className={`${RIGHT_WEIGHTS[index % RIGHT_WEIGHTS.length]} min-h-0 rounded-lg`} 
                      delay={`${0.4 + (leftImages.length + index) * 0.08}s`}
                    />
                  ))}
                  {/* Solid color block - Mondrian accent (bottom right) */}
                  {images.length <= 6 && (
                    <div className="flex-[1] min-h-0 rounded-lg bg-purple/70 border border-black/20" />
                  )}
                </div>
              </div>
            )}
            
            {/* Decorative glow behind gallery */}
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-purple/10 to-pink/10 blur-3xl rounded-3xl -z-10" />
          </div>
        </div>
      </div>

      {/* Marquee cinético (estilo Mosaic): tipografía en movimiento continuo */}
      <div
        className="marquee-band mt-10 sm:mt-14 border-y border-border/50 py-3 sm:py-4 overflow-hidden select-none"
        aria-hidden="true"
      >
        <div className="flex w-max animate-marquee">
          {[0, 1].map((group) => (
            <div key={group} className="flex shrink-0 items-center">
              {marqueeWords.map((text, i) => (
                <span key={`${group}-${i}`} className="flex items-center whitespace-nowrap">
                  <span className="px-5 sm:px-7 text-sm sm:text-base md:text-lg font-heading font-semibold uppercase tracking-[0.3em] text-foreground/70">
                    <EditableText field="marqueeText">{text}</EditableText>
                  </span>
                  <span className="text-foreground/30 text-xs sm:text-sm">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};