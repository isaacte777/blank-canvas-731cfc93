import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  /** Extra classes (e.g. to offset the fixed position inside the admin preview) */
  className?: string;
}

export const WhatsAppButton = ({ phoneNumber = "", className = "" }: WhatsAppButtonProps) => {
  const defaultMessage = "Hola, me gustaría obtener más información sobre la iglesia.";
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 100px down
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    // Check initial scroll position
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    if (!phoneNumber) return;
    
    let url: string;
    
    // Check if it's already a full WhatsApp URL
    if (phoneNumber.startsWith('https://wa.me/') || phoneNumber.startsWith('http://wa.me/')) {
      url = phoneNumber;
    } else if (phoneNumber.startsWith('wa.me/')) {
      url = `https://${phoneNumber}`;
    } else {
      // It's just a phone number, build the URL
      // Remove any non-numeric characters except +
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(defaultMessage)}`;
    }
    
    window.open(url, '_blank');
  };

  // Don't render if no phone number is configured
  if (!phoneNumber) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 bg-[#25D366] hover:bg-[#20BA5A] rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${className} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
    </button>
  );
};
