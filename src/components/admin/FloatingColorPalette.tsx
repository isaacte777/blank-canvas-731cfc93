import { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, X, Save, RotateCcw, Loader2, GripVertical, Calendar, Eye, Upload, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
}

interface FloatingColorPaletteProps {
  pendingColors: ColorPalette;
  onColorChange: (key: keyof ColorPalette, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  hasUnsavedChanges: boolean;
  saving: boolean;
  onOpenScheduleCalendar?: () => void;
  // Scheduled mode props
  isScheduledMode?: boolean;
  onToggleScheduledMode?: (checked: boolean) => void;
  scheduledDateTime?: Date | null;
  onScheduledDateTimeChange?: (date: Date | null) => void;
  scheduledTitle?: string;
  onScheduledTitleChange?: (title: string) => void;
  // Logo props
  logoUrl?: string;
  onLogoUpload?: (file: File) => Promise<void>;
  onLogoRemove?: () => void;
  uploadingLogo?: boolean;
}

export const FloatingColorPalette = ({
  pendingColors,
  onColorChange,
  onSave,
  onReset,
  hasUnsavedChanges,
  saving,
  onOpenScheduleCalendar,
  isScheduledMode = false,
  onToggleScheduledMode,
  scheduledDateTime,
  onScheduledDateTimeChange,
  scheduledTitle = '',
  onScheduledTitleChange,
  logoUrl,
  onLogoUpload,
  onLogoRemove,
  uploadingLogo = false
}: FloatingColorPaletteProps) => {
  // Button state
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [buttonPosition, setButtonPosition] = useState({ x: -28, y: 300 });
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Window state
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [isWindowVisible, setIsWindowVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 20, y: 120 });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Drag start position
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  // Handle logo file selection
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLogoUpload) {
      await onLogoUpload(file);
    }
    // Reset input
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Auto-hide button after inactivity
  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setIsButtonVisible(true);
    hideTimeoutRef.current = setTimeout(() => {
      if (!isWindowOpen && !isDraggingButton) {
        setIsButtonVisible(false);
      }
    }, 3000);
  }, [isWindowOpen, isDraggingButton]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [resetHideTimer]);

  // Button drag handlers with pointer events for better mobile support
  const handleButtonPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingButton(true);
    setHasDragged(false);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { ...buttonPosition };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resetHideTimer();
  };

  const handleButtonPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingButton) return;
    e.preventDefault();
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    // Check if user has moved enough to be considered a drag
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setHasDragged(true);
    }
    
    const newX = elementStartPos.current.x + deltaX;
    const newY = elementStartPos.current.y + deltaY;
    
    // Constrain to screen bounds
    const maxX = window.innerWidth - 28;
    const maxY = window.innerHeight - 56;
    
    setButtonPosition({
      x: Math.max(-28, Math.min(maxX, newX)),
      y: Math.max(80, Math.min(maxY, newY))
    });
  };

  const handleButtonPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingButton) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDraggingButton(false);
    
    // Snap to nearest edge
    const centerX = buttonPosition.x + 28;
    if (centerX < window.innerWidth / 2) {
      setButtonPosition(prev => ({ ...prev, x: -28 }));
    } else {
      setButtonPosition(prev => ({ ...prev, x: window.innerWidth - 28 }));
    }
    
    // Only open window if it wasn't a drag
    if (!hasDragged) {
      setIsWindowOpen(true);
      // Trigger animation after mount
      setTimeout(() => setIsWindowVisible(true), 10);
    }
    
    resetHideTimer();
  };

  // Window drag handlers - optimized for smooth performance
  const handleWindowPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingWindow(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { ...windowPosition };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleWindowPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingWindow) return;
    e.preventDefault();
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    const newX = elementStartPos.current.x + deltaX;
    const newY = elementStartPos.current.y + deltaY;
    
    // Constrain to screen bounds
    const windowWidth = windowRef.current?.offsetWidth || 280;
    const windowHeight = windowRef.current?.offsetHeight || 300;
    const maxX = window.innerWidth - windowWidth;
    const maxY = window.innerHeight - windowHeight;
    
    const constrainedX = Math.max(0, Math.min(maxX, newX));
    const constrainedY = Math.max(60, Math.min(maxY, newY));
    
    // Use direct DOM manipulation for smooth dragging
    if (windowRef.current) {
      windowRef.current.style.left = `${constrainedX}px`;
      windowRef.current.style.top = `${constrainedY}px`;
    }
  }, [isDraggingWindow]);

  const handleWindowPointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Sync React state with final position
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setWindowPosition({ x: rect.left, y: rect.top });
    }
    
    setIsDraggingWindow(false);
  };

  return (
    <>
      {/* Floating Button - Partially hidden on edge */}
      <div
        ref={buttonRef}
        className={`lg:hidden fixed z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-opacity duration-300 cursor-grab active:cursor-grabbing ${
          isButtonVisible ? 'opacity-100' : 'opacity-30'
        } ${isDraggingButton ? 'scale-110' : 'scale-100'} bg-gradient-to-br from-primary via-secondary to-accent`}
        style={{
          left: buttonPosition.x,
          top: buttonPosition.y,
          touchAction: 'none',
          transition: isDraggingButton ? 'none' : 'left 0.3s ease-out, opacity 0.3s'
        }}
        onPointerDown={handleButtonPointerDown}
        onPointerMove={handleButtonPointerMove}
        onPointerUp={handleButtonPointerUp}
        onPointerCancel={handleButtonPointerUp}
        onMouseEnter={resetHideTimer}
      >
        <Palette className="w-6 h-6 text-white drop-shadow-lg pointer-events-none" />
        {hasUnsavedChanges && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Floating Window */}
      {isWindowOpen && (
        <div
          ref={windowRef}
          className={`lg:hidden fixed z-[9999] bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 overflow-hidden w-[280px] ${
            isWindowVisible && !isClosing
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
          style={{
            left: windowPosition.x,
            top: windowPosition.y,
            touchAction: 'none',
            willChange: isDraggingWindow ? 'left, top' : 'auto',
            transition: isDraggingWindow ? 'none' : 'opacity 0.3s ease-out, transform 0.3s ease-out'
          }}
        >
          {/* Window Header - Draggable */}
          <div
            className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b border-border/30 cursor-grab active:cursor-grabbing select-none"
            onPointerDown={handleWindowPointerDown}
            onPointerMove={handleWindowPointerMove}
            onPointerUp={handleWindowPointerUp}
            onPointerCancel={handleWindowPointerUp}
            style={{ touchAction: 'none' }}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <Palette className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Paleta de Colores</span>
            </div>
            <button
              onClick={() => {
                setIsClosing(true);
                setIsWindowVisible(false);
                setTimeout(() => {
                  setIsWindowOpen(false);
                  setIsClosing(false);
                }, 300);
              }}
              className="p-1.5 rounded-lg hover:bg-destructive/20 hover:text-destructive transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Window Content */}
          <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'primary' as const, label: 'Principal', icon: '🎨' },
                { key: 'secondary' as const, label: 'Secundario', icon: '✨' },
                { key: 'accent' as const, label: 'Acento', icon: '💫' },
                { key: 'background' as const, label: 'Fondo', icon: '🌙' },
                { key: 'headerBg' as const, label: 'Fondo Header', icon: '🔲' },
                { key: 'headerBorder' as const, label: 'Borde Header', icon: '📐' },
                { key: 'headerText' as const, label: 'Texto Header', icon: '📝' },
              ].map(({ key, label, icon }) => (
                <div key={key} className="p-2 rounded-lg bg-muted/30 border border-border/30">
                  <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                    <span className="text-xs">{icon}</span> {label}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="color" 
                      value={pendingColors[key] || '#1a1a1a'}
                      onChange={(e) => onColorChange(key, e.target.value)}
                      className="w-7 h-7 rounded-md border border-border/50 cursor-pointer shadow-sm"
                      style={{ backgroundColor: pendingColors[key] || '#1a1a1a' }}
                    />
                    <Input 
                      value={pendingColors[key] || ''}
                      onChange={(e) => onColorChange(key, e.target.value)}
                      className="flex-1 text-[9px] font-mono h-7 bg-background/50 border-border/30 px-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Logo Section */}
            {onLogoUpload && (
              <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
                <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <ImageIcon className="w-3 h-3" /> Logo de la Página
                </Label>
                <input 
                  type="file" 
                  ref={logoInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border/50 bg-muted/30 shrink-0">
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg border border-dashed border-border/50 bg-muted/20 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[9px] w-full"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3 mr-1" />
                      )}
                      {logoUrl ? 'Cambiar' : 'Subir'}
                    </Button>
                    {logoUrl && onLogoRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[9px] w-full text-destructive hover:text-destructive"
                        onClick={onLogoRemove}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Scheduled Mode Toggle */}
            {onToggleScheduledMode && (
              <div className={`p-2 rounded-lg border transition-all ${isScheduledMode ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border/30'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Calendar className={`w-3 h-3 ${isScheduledMode ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-[9px] font-medium">Modo Programado</span>
                  </div>
                  <Switch
                    checked={isScheduledMode}
                    onCheckedChange={(checked) => {
                      onToggleScheduledMode(checked);
                      if (!checked && onScheduledDateTimeChange) {
                        onScheduledDateTimeChange(null);
                      }
                    }}
                    className="scale-[0.6]"
                  />
                </div>
                
                {isScheduledMode && onScheduledDateTimeChange && (
                  <div className="space-y-1.5 pt-1.5 border-t border-border/30">
                    {onScheduledTitleChange && (
                      <div>
                        <Label className="text-[8px] text-muted-foreground">Título</Label>
                        <Input
                          value={scheduledTitle}
                          onChange={(e) => onScheduledTitleChange(e.target.value)}
                          placeholder="Ej: Navidad"
                          className="h-6 text-[9px] mt-0.5"
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-[8px] text-muted-foreground">Fecha y hora</Label>
                      <Input
                        type="datetime-local"
                        value={scheduledDateTime ? format(scheduledDateTime, "yyyy-MM-dd'T'HH:mm") : ''}
                        onChange={(e) => onScheduledDateTimeChange(e.target.value ? new Date(e.target.value) : null)}
                        min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                        className="h-6 text-[9px] mt-0.5"
                      />
                    </div>
                    {scheduledDateTime && (
                      <p className="text-[8px] text-primary">
                        📅 {format(scheduledDateTime, "EEE d MMM, HH:mm", { locale: es })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <Button 
                className={`w-full h-9 rounded-lg hover:opacity-90 text-xs font-medium ${
                  isScheduledMode 
                    ? 'bg-gradient-to-r from-primary to-accent' 
                    : 'bg-gradient-to-r from-primary to-secondary'
                }`}
                onClick={onSave}
                disabled={!hasUnsavedChanges || saving || (isScheduledMode && !scheduledDateTime)}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : isScheduledMode ? (
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isScheduledMode 
                  ? (scheduledDateTime ? 'Programar' : 'Selecciona fecha')
                  : (hasUnsavedChanges ? 'Guardar' : 'Sin cambios')
                }
              </Button>

              <Button 
                variant="ghost" 
                className="w-full h-8 rounded-lg text-xs text-muted-foreground hover:text-foreground" 
                onClick={onReset}
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Resetear Colores
              </Button>

              {onOpenScheduleCalendar && (
                <Button 
                  variant="outline"
                  className="w-full h-8 rounded-lg border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground text-xs"
                  onClick={() => {
                    onOpenScheduleCalendar();
                    // Close the palette window
                    setIsClosing(true);
                    setIsWindowVisible(false);
                    setTimeout(() => {
                      setIsWindowOpen(false);
                      setIsClosing(false);
                    }, 300);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1.5" />
                  Ver Programaciones
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
