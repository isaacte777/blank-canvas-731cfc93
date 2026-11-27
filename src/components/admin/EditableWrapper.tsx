import { useState, useRef, ReactNode } from 'react';
import { Edit3 } from 'lucide-react';

interface EditableWrapperProps {
  children: ReactNode;
  onClick: () => void;
  label?: string;
  className?: string;
  inline?: boolean; // For inline text elements like titles
}

export const EditableWrapper = ({ 
  children, 
  onClick, 
  label = "Editar",
  className = "",
  inline = false
}: EditableWrapperProps) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer group/editable ${inline ? 'inline-block' : ''} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      {children}
      
      {/* Hover border effect */}
      <div className={`absolute inset-0 border-2 border-dashed border-transparent group-hover/editable:border-primary/50 ${inline ? 'rounded' : 'rounded-lg'} transition-colors pointer-events-none z-20`} />
      
      {/* Highlight background on hover */}
      <div className={`absolute inset-0 bg-primary/0 group-hover/editable:bg-primary/5 ${inline ? 'rounded' : 'rounded-lg'} transition-colors pointer-events-none z-10`} />
      
      {/* Following tooltip */}
      {isHovering && (
        <div
          className="absolute z-50 pointer-events-none transition-opacity duration-150"
          style={{
            left: mousePos.x,
            top: mousePos.y,
          }}
        >
          <div className="bg-primary text-primary-foreground text-xs px-2.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-fade-in">
            <Edit3 className="w-3 h-3" />
            {label}
          </div>
        </div>
      )}
    </div>
  );
};
