import { Edit3 } from "lucide-react";

interface EditableTextProps {
  children: React.ReactNode;
  onClick?: () => void;
  enabled?: boolean;
}

/**
 * Texto del preview del admin que al hacer hover muestra el borde punteado
 * y el lápiz; al hacer clic abre el diálogo de edición correspondiente.
 * Los sitios públicos lo reciben con enabled=false y renderiza children tal cual.
 */
export const EditableText = ({ children, onClick, enabled = false }: EditableTextProps) => {
  if (!enabled || !onClick) return <>{children}</>;
  return (
    <span
      className="relative group cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
      <span className="pointer-events-none absolute inset-0 border-2 border-dashed border-foreground/40 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="pointer-events-none absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background rounded-full p-1 shadow-md">
        <Edit3 className="w-3 h-3" />
      </span>
    </span>
  );
};
