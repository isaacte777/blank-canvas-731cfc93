import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { useScheduledContent, ScheduledContent, ContentSnapshot } from '@/hooks/useScheduledContent';
import { cn } from '@/lib/utils';

interface ScheduledContentCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getCurrentSnapshot: () => ContentSnapshot;
  externalScheduledItems?: ScheduledContent[];
  onRefetch?: () => Promise<void>;
}

export const ScheduledContentCalendar = ({
  open,
  onOpenChange,
  getCurrentSnapshot,
  externalScheduledItems,
  onRefetch
}: ScheduledContentCalendarProps) => {
  const {
    scheduledItems: internalScheduledItems,
    loading,
    createScheduledContent,
    updateScheduledContent,
    deleteScheduledContent,
    refetch,
    getPendingItems: internalGetPendingItems,
    getPublishedItems: internalGetPublishedItems
  } = useScheduledContent();

  // Use external items if provided, otherwise use internal
  const scheduledItems = externalScheduledItems ?? internalScheduledItems;
  
  // Compute pending/published from the items we're using
  const getPendingItems = () => scheduledItems.filter(item => !item.is_published);
  const getPublishedItems = () => scheduledItems.filter(item => item.is_published);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduledContent | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for new scheduled content
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '09:00'
  });

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getItemsForDay = (date: Date) => {
    return scheduledItems.filter(item => 
      isSameDay(new Date(item.scheduled_at), date)
    );
  };

  const handleCreateScheduled = async () => {
    if (!selectedDate || !formData.title.trim()) return;

    setSaving(true);
    try {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const snapshot = getCurrentSnapshot();
      const success = await createScheduledContent(
        formData.title.trim(),
        formData.description.trim(),
        scheduledAt,
        snapshot
      );

      if (success) {
        // Refresh the list
        if (onRefetch) {
          await onRefetch();
        } else {
          await refetch();
        }
        setShowNewForm(false);
        setFormData({ title: '', description: '', time: '09:00' });
        setSelectedDate(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setSaving(true);
    try {
      await deleteScheduledContent(id);
      // Refresh the list
      if (onRefetch) {
        await onRefetch();
      } else {
        await refetch();
      }
      setSelectedItem(null);
    } finally {
      setSaving(false);
    }
  };

  const pendingItems = getPendingItems();
  const publishedItems = getPublishedItems();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Publicaciones Programadas
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Programa cambios para que se publiquen automáticamente en una fecha futura
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-[70vh]">
          {/* Calendar */}
          <div className="flex-1 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-border">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold text-base capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {days.map(day => {
                const dayItems = getItemsForDay(day);
                const hasPending = dayItems.some(i => !i.is_published);
                const hasPublished = dayItems.some(i => i.is_published);
                const isPast = isBefore(day, startOfDay(new Date()));
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isPast && setSelectedDate(day)}
                    disabled={isPast}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-all",
                      !isSameMonth(day, currentMonth) && "text-muted-foreground/50",
                      isToday(day) && "bg-primary/10 font-bold",
                      isPast && "opacity-40 cursor-not-allowed",
                      !isPast && "hover:bg-accent cursor-pointer",
                      isSelected && "ring-2 ring-primary bg-primary/20"
                    )}
                  >
                    <span>{format(day, 'd')}</span>
                    {dayItems.length > 0 && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {hasPending && (
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        )}
                        {hasPublished && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Publicado</span>
              </div>
            </div>

            {/* Selected Date Actions */}
            {selectedDate && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {format(selectedDate, "d 'de' MMMM", { locale: es })}
                  </span>
                  <Button size="sm" onClick={() => setShowNewForm(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Programar
                  </Button>
                </div>

                {/* Items for selected date */}
                {getItemsForDay(selectedDate).length > 0 && (
                  <div className="space-y-2">
                    {getItemsForDay(selectedDate).map(item => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="p-2 bg-background rounded border cursor-pointer hover:border-primary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.scheduled_at), 'HH:mm')}
                          </span>
                          {item.is_published ? (
                            <Badge variant="default" className="text-xs bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Publicado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Pendiente
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm mt-1 truncate">{item.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Upcoming Items */}
          <div className="w-full lg:w-80 flex flex-col">
            <div className="p-4 border-b border-border">
              <h4 className="font-semibold text-sm">Próximas Publicaciones</h4>
            </div>
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay publicaciones programadas
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="p-3 rounded-lg border bg-card hover:border-primary cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(item.scheduled_at), "d MMM, HH:mm", { locale: es })}
                      </div>
                      <p className="font-medium text-sm">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* New Schedule Form Dialog */}
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Programar Publicación
              </DialogTitle>
              <DialogDescription>
                {selectedDate && (
                  <>
                    Los cambios actuales se publicarán el{' '}
                    <strong>{format(selectedDate, "d 'de' MMMM", { locale: es })}</strong>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Actualización de Navidad"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe los cambios que se publicarán..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Hora de publicación
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">hrs</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Los cambios se publicarán automáticamente a esta hora
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">📸 Se guardará:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Contenido del Hero, About, Contacto</li>
                  <li>Servicios y sus horarios</li>
                  <li>Anuncios actuales</li>
                  <li>Ministerios</li>
                  <li>Galería de fotos</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowNewForm(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateScheduled}
                  disabled={!formData.title.trim() || saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CalendarIcon className="w-4 h-4 mr-2" />
                  )}
                  Programar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View/Edit Item Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalles de Programación
              </DialogTitle>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Título</Label>
                  <p className="font-medium">{selectedItem.title}</p>
                </div>

                {selectedItem.description && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Descripción</Label>
                    <p className="text-sm">{selectedItem.description}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Fecha programada</Label>
                    <p className="text-sm">
                      {format(new Date(selectedItem.scheduled_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Hora</Label>
                    <p className="text-sm">
                      {format(new Date(selectedItem.scheduled_at), 'HH:mm')}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Estado</Label>
                  {selectedItem.is_published ? (
                    <Badge className="mt-1 bg-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Publicado el {format(new Date(selectedItem.published_at || ''), "d MMM, HH:mm", { locale: es })}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                </div>

                {!selectedItem.is_published && (
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteItem(selectedItem.id)}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
