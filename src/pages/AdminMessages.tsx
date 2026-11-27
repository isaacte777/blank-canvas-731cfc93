import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { 
  Loader2, 
  LogOut, 
  Church, 
  Home,
  ArrowLeft,
  Mail,
  MailOpen,
  Trash2,
  X,
  Phone,
  Calendar,
  User,
  MessageSquare,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminMessages = () => {
  const { user, isAdmin, isPastor, loading, rolesLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Auto-logout after 5 minutes of inactivity
  const handleIdleLogout = useCallback(async () => {
    toast({
      title: "Sesión expirada",
      description: "Se cerró la sesión por inactividad",
    });
    await signOut();
    navigate('/auth');
  }, [signOut, navigate, toast]);

  useIdleTimeout({
    timeout: 5 * 60 * 1000, // 5 minutos
    onIdle: handleIdleLogout,
    enabled: !!user && isAdmin
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchMessages();
    }
  }, [user, isAdmin]);

  const fetchMessages = async () => {
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
      });
    }
    setDataLoading(false);
  };

  const openMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    
    // Mark as read if not already
    if (!message.is_read) {
      try {
        const { error } = await supabase
          .from('contact_messages')
          .update({ is_read: true })
          .eq('id', message.id);
        
        if (!error) {
          setMessages(prev => prev.map(m => 
            m.id === message.id ? { ...m, is_read: true } : m
          ));
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setSelectedMessage(null);
      toast({
        title: "Eliminado",
        description: "El mensaje ha sido eliminado"
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive"
      });
    }
    setDeleting(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <Link to="/"><Home className="mr-2 h-4 w-4" />Inicio</Link>
            </Button>
            <Button variant="destructive" onClick={handleSignOut} className="flex-1">
              <LogOut className="mr-2 h-4 w-4" />Salir
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          {/* Mobile Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                <Link to="/admin">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 flex-shrink-0">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-heading text-foreground truncate">Mensajes</h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {messages.length} • {unreadCount} sin leer
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button variant="outline" size="icon" onClick={fetchMessages} disabled={dataLoading} className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
                <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Actualizar</span>
              </Button>
              <Button variant="outline" size="icon" asChild className="hidden sm:flex h-9 w-auto px-3">
                <Link to="/admin">
                  <Church className="h-4 w-4 mr-2" />
                  Panel
                </Link>
              </Button>
              <Button variant="destructive" size="icon" onClick={handleSignOut} className="h-8 w-8 sm:h-9 sm:w-9">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {dataLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No hay mensajes</h3>
              <p className="text-muted-foreground">Aún no has recibido mensajes de contacto.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {messages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`cursor-pointer transition-colors ${!message.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => openMessage(message)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div className="relative flex-shrink-0 mt-0.5">
                          {message.is_read ? (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <>
                              <Mail className="h-4 w-4 text-primary" />
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            </>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {!message.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                            <span className={`text-sm truncate ${!message.is_read ? 'font-semibold' : 'font-medium'}`}>
                              {message.full_name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{message.email}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{message.message}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDate(message.created_at)}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(message.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <Card className="hidden sm:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                      <TableHead className="hidden xl:table-cell">Mensaje</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow 
                        key={message.id} 
                        className={`cursor-pointer hover:bg-muted/50 ${!message.is_read ? 'bg-primary/5' : ''}`}
                        onClick={() => openMessage(message)}
                      >
                        <TableCell>
                          <div className="relative">
                            {message.is_read ? (
                              <MailOpen className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <>
                                <Mail className="h-4 w-4 text-primary" />
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {!message.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                            <span className={!message.is_read ? 'font-semibold' : ''}>{message.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{message.email}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {message.phone || '-'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground max-w-xs truncate">
                          {message.message}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(message.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMessage(message);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(message.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Message Detail Modal */}
      <Dialog open={selectedMessage !== null} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Detalle del Mensaje
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Nombre</p>
                      <p className="font-medium text-foreground">{selectedMessage.full_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                      <a 
                        href={`mailto:${selectedMessage.email}`} 
                        className="font-medium text-primary hover:underline"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>
                  
                  {selectedMessage.phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Teléfono</p>
                        <a 
                          href={`tel:${selectedMessage.phone}`} 
                          className="font-medium text-primary hover:underline"
                        >
                          {selectedMessage.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha</p>
                      <p className="font-medium text-foreground">{formatDate(selectedMessage.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Message Content */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Mensaje</h4>
                  <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-foreground whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 justify-between pt-4 border-t border-border">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => deleteMessage(selectedMessage.id)}
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                    Eliminar
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                    >
                      <a href={`mailto:${selectedMessage.email}`}>
                        <Mail className="w-4 h-4 mr-1" />
                        Responder
                      </a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedMessage(null)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cerrar
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMessages;
