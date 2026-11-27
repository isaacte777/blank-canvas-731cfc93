import communityImageDefault from "@/assets/community.jpg";
import { Heart, Users, Book, Edit3 } from "lucide-react";
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
  onEditField?: (field: 'title' | 'subtitle' | 'content' | 'secondParagraph' | 'value1Title' | 'value1Desc' | 'value2Title' | 'value2Desc' | 'value3Title' | 'value3Desc' | 'stat1Value' | 'stat1Label' | 'stat2Value' | 'stat2Label' | 'stat3Value' | 'stat3Label') => void;
  onEditImage?: () => void;
  onEditGalleryImage?: (image: GalleryImage) => void;
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
  
  // No default gallery images - only show what's in the database
  const images = galleryImages.length > 0 ? galleryImages : [];
  
  const values = [
    {
      icon: Heart,
      title: value1Title || "",
      description: value1Desc || "",
      titleField: 'value1Title' as const,
      descField: 'value1Desc' as const
    },
    {
      icon: Users,
      title: value2Title || "",
      description: value2Desc || "",
      titleField: 'value2Title' as const,
      descField: 'value2Desc' as const
    },
    {
      icon: Book,
      title: value3Title || "",
      description: value3Desc || "",
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
        <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded-full p-1">
          <Edit3 className="w-3 h-3" />
        </span>
        <span className="absolute inset-0 border-2 border-dashed border-primary/50 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
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
      
      {/* Edit button for gallery images */}
      {isEditable && onEditGalleryImage && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditGalleryImage(image);
          }}
          className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 transform duration-200 z-10"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <section className="py-10 sm:py-12 md:py-20 lg:py-24 bg-muted/30" ref={ref}>
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-start max-w-7xl mx-auto">
          {/* Left side - Text content */}
          <div className={`space-y-4 sm:space-y-6 md:space-y-8 ${isVisible ? 'animate-slide-left-wow' : 'opacity-0'}`}>
            <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display text-foreground tracking-wide">
              <EditableText field="title">{title || ''}</EditableText>{' '}
              <EditableText field="subtitle"><span className="text-purple">{subtitle || ''}</span></EditableText>
            </h2>
            <EditableText field="content">
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed font-body">
                {content || ''}
              </p>
            </EditableText>
            <EditableText field="secondParagraph">
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground leading-relaxed font-body">
                {secondParagraph || ''}
              </p>
            </EditableText>

            {/* Values */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 pt-3 sm:pt-4 md:pt-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="text-center space-y-1.5 sm:space-y-2 md:space-y-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 mx-auto bg-turquoise/20 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center transform hover:rotate-6 transition-transform border border-turquoise/30">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-turquoise" />
                    </div>
                    <EditableText field={value.titleField}>
                      <div className="font-heading text-foreground uppercase text-[10px] sm:text-xs md:text-sm lg:text-base tracking-wider">
                        {value.title}
                      </div>
                    </EditableText>
                    <EditableText field={value.descField}>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground font-body hidden sm:block">
                        {value.description}
                      </div>
                    </EditableText>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 pt-3 sm:pt-4 md:pt-6 border-t border-turquoise/30">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <EditableText field={stat.valueField}>
                    <div className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading ${stat.color} mb-0.5 sm:mb-1 md:mb-2`}>{stat.value}</div>
                  </EditableText>
                  <EditableText field={stat.labelField}>
                    <div className="text-[9px] sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wider font-body">{stat.label}</div>
                  </EditableText>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side - Mondrian-style Image Gallery */}
          <div className={`relative ${isVisible ? 'animate-slide-right-wow' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            {/* Mondrian Grid Layout */}
            <div className="grid grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2 md:gap-3 h-[280px] xs:h-[320px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
              {/* Large image - spans 2 cols, 2 rows (top left) */}
              {images[0] && (
                <GalleryItem 
                  image={images[0]} 
                  className="col-span-2 row-span-2 rounded-2xl border-2 border-primary/20" 
                  delay="0.4s"
                />
              )}
              
              {/* Medium image - spans 2 cols, 1 row (top right) */}
              {images[1] && (
                <GalleryItem 
                  image={images[1]} 
                  className="col-span-2 row-span-1 rounded-xl border-2 border-secondary/20" 
                  delay="0.5s"
                />
              )}
              
              {/* Small square - 1 col, 1 row */}
              {images[2] && (
                <GalleryItem 
                  image={images[2]} 
                  className="col-span-1 row-span-1 rounded-lg border-2 border-pink/20" 
                  delay="0.6s"
                />
              )}
              
              {/* Tall image - 1 col, 2 rows (right side) */}
              {images[3] && (
                <GalleryItem 
                  image={images[3]} 
                  className="col-span-1 row-span-2 rounded-xl border-2 border-purple/20" 
                  delay="0.7s"
                />
              )}
              
              {/* Wide image - 2 cols, 1 row (bottom left) */}
              {images[4] && (
                <GalleryItem 
                  image={images[4]} 
                  className="col-span-2 row-span-1 rounded-xl border-2 border-turquoise/20" 
                  delay="0.8s"
                />
              )}
              
              {/* Medium square - 1 col, 1 row (bottom middle) */}
              {images[5] && (
                <GalleryItem 
                  image={images[5]} 
                  className="col-span-1 row-span-1 rounded-lg border-2 border-primary/20" 
                  delay="0.9s"
                />
              )}
              
              {/* Fill remaining space with primary image if less than 6 gallery images */}
              {images.length < 6 && (
                <div 
                  className={`col-span-1 row-span-1 relative overflow-hidden rounded-lg border-2 border-muted group ${isVisible ? 'animate-card-wow' : 'opacity-0'}`}
                  style={{ animationDelay: '0.9s' }}
                >
                  <img 
                    src={communityImage} 
                    alt="Comunidad de fe" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {isEditable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditImage?.();
                      }}
                      className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 transform duration-200 z-10"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Decorative glow behind gallery */}
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-purple/10 to-pink/10 blur-3xl rounded-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};