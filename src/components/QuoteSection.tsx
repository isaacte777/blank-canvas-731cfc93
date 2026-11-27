import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { EditableWrapper } from "@/components/admin/EditableWrapper";

interface QuoteSectionProps {
  imageUrl?: string;
  quote?: string;
  author?: string;
  isEditable?: boolean;
  onEdit?: () => void;
}

export const QuoteSection = ({
  imageUrl = "",
  quote = "",
  author = "",
  isEditable = false,
  onEdit
}: QuoteSectionProps) => {
  const { ref, isVisible } = useScrollAnimation();

  const content = (
    <section 
      ref={ref}
      className="py-16 sm:py-20 md:py-24 lg:py-32 bg-white shadow-xl relative z-10"
    >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 lg:gap-20 max-w-5xl mx-auto">
            {/* Circular Image */}
            <div className="shrink-0">
              <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src={imageUrl} 
                  alt={author}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Quote Text */}
            <div className="text-center md:text-left max-w-xl">
              <blockquote 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-800 leading-relaxed mb-4 md:mb-6"
                style={{ 
                  fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                  fontStyle: 'italic'
                }}
              >
                "{quote}".
              </blockquote>
              <cite 
                className="text-base sm:text-lg md:text-xl text-gray-600 not-italic"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {author}
              </cite>
            </div>
          </div>
        </div>
      </section>
  );

  if (isEditable && onEdit) {
    return (
      <EditableWrapper onClick={onEdit} label="Editar Cita">
        {content}
      </EditableWrapper>
    );
  }

  return content;
};
