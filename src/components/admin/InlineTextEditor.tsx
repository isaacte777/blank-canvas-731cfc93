import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Edit3, Check, X } from 'lucide-react';

interface InlineTextEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

export const InlineTextEditor = ({
  value,
  onChange,
  className = '',
  placeholder = 'Haz clic para editar...',
  multiline = false,
  as: Component = 'span'
}: InlineTextEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleConfirm = () => {
    const trimmed = editValue.trim();
    onChange(trimmed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="relative inline-flex items-center gap-2 w-full">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full bg-primary/10 border-2 border-primary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none ${className}`}
            rows={3}
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full bg-primary/10 border-2 border-primary rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}
            placeholder={placeholder}
          />
        )}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleConfirm}
            className="p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/80 transition-colors"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative cursor-pointer group/inline inline"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      <Component className={`${className} ${!value ? 'text-muted-foreground italic' : ''}`}>
        {value || placeholder}
      </Component>
      
      {/* Hover indicator */}
      <div className="absolute inset-0 border-2 border-dashed border-transparent group-hover/inline:border-primary/50 rounded transition-colors pointer-events-none" />
      
      {/* Edit icon on hover */}
      {isHovering && (
        <span className="absolute -right-6 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-1 rounded-full shadow-lg animate-fade-in">
          <Edit3 className="w-3 h-3" />
        </span>
      )}
    </div>
  );
};
