/**
 * Contenido de respaldo para las secciones principales del sitio.
 *
 * Se muestra cuando la base de datos no tiene valores guardados, para que la
 * página (y el editor) siempre muestren la información histórica en lugar de
 * quedar vacías. La próxima vez que se guarde desde el panel de
 * administración, estos valores quedan persistidos en la base.
 */

export const DEFAULT_ABOUT = {
  title: 'Nuestra',
  subtitle: 'Historia',
};

export const DEFAULT_ABOUT_FIELDS = {
  firstParagraph:
    'Somos una iglesia comprometida con llevar el mensaje de esperanza y amor de Jesucristo a nuestra comunidad. Desde hace más de 30 años, hemos sido un refugio de fe donde familias encuentran propósito y transformación.',
  secondParagraph:
    'Nuestras puertas están abiertas para todos. Ven como eres, experimenta el amor de Dios, crece espiritualmente y descubre tu propósito en un ambiente de aceptación y transformación.',
  value1Title: 'FE',
  value1Desc: 'Fortalecemos nuestra relación con Dios',
  value2Title: 'COMUNIDAD',
  value2Desc: 'Unidos como familia en Cristo',
  value3Title: 'PALABRA',
  value3Desc: 'Cimentados en las Escrituras',
  stat1Value: '30+',
  stat1Label: 'AÑOS',
  stat2Value: '500+',
  stat2Label: 'MIEMBROS',
  stat3Value: '15',
  stat3Label: 'MINISTERIOS',
  marqueeText: 'CREE., PERTENECE., TRANSFORMA., BIENVENIDOS A CFA',
};

// Encabezados editables de las secciones de la página principal.
// Se guardan como filas de page_content ('ministries' / 'services' / 'announcements')
// y se leen desde usePageContent en el sitio público.
export const DEFAULT_SECTION_HEADERS = {
  ministries: {
    title: 'Nuestros Ministerios',
    subtitle: 'Conoce las diferentes áreas donde servimos y crece junto a nosotros',
  },
  services: {
    title: 'Nuestros Servicios',
    subtitle: 'Te invitamos a ser parte de nuestra comunidad de fe',
  },
  announcements: {
    title: 'ANUNCIOS',
    subtitle: 'Entérate de las actividades y novedades de nuestra comunidad',
  },
} as const;

export type SectionHeaderKey = keyof typeof DEFAULT_SECTION_HEADERS;

export const DEFAULT_CONTACT = {
  title: 'Contáctanos',
  subtitle: 'Estamos aquí para ti',
};

export const DEFAULT_CONTACT_CONTENT = 'Visítanos o escríbenos para más información.';

export const DEFAULT_CONTACT_FIELDS = {
  addressLabel: 'Dirección',
  addressLine1: 'Capitan caballero',
  addressLine2: 'Caacupé, Paraguay',
  phoneLabel: 'Teléfono',
  phoneLine1: '+595 (0981) 560224',
  phoneLine2: 'Lun - Vie: 07:00 AM - 11:00 AM',
  emailLabel: '',
  emailLine1: '',
  emailLine2: '',
  mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5097.6266408767715!2d-57.15050429693884!3d-25.38584574520421!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945c336e5d4e1c9b%3A0x66e35560580b64b0!2sCFA%20CAACUPE!5e0!3m2!1ses-419!2spy!4v1768581252361!5m2!1ses-419!2spy',
};

export const DEFAULT_FOOTER_FIELDS = {
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  emailUrl: '',
  liveStreamUrl: 'https://www.youtube.com/@iglesiacfacaacupe1180',
  whatsappNumber: 'https://wa.me/595981560224?text=Hola!%20Quiero%20participar%20a%20la%20oracion%20congregacional!',
};

export const DEFAULT_PRAYER_FIELDS = {
  title: 'ORACIÓN',
  subtitle: 'CONGREGACIONAL',
  schedule: 'Lunes a Viernes',
  time: '05:31 hs',
  buttonText: 'PARTICIPAR',
  buttonUrl: 'https://wa.me/595981560224?text=Hola!%20Quiero%20participar%20a%20la%20oracion%20congregacional!',
  backgroundImage: '',
};

export const DEFAULT_QUOTE_FIELDS = {
  quote: 'Dios quiere hacer algo importante en tu vida, solo escucha su voz siempre',
  author: 'Ptr. Alejo',
  imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop&crop=face',
};

// Listas restauradas desde la base anterior (se omiten filas de prueba)
export const DEFAULT_SERVICES = [
  {
    id: '370de036-e287-4015-9b2e-a12ba0256ff8',
    title: 'Servicio Dominical',
    description: 'Culto principal de adoración',
    day: 'Domingo',
    time: '10:00 AM',
    icon: 'Church',
    is_visible: true,
    display_order: 1,
  },
  {
    id: 'b5e88362-4ef4-4cd6-891d-233e20438529',
    title: 'Escuela Dominical',
    description: null,
    day: 'Domingo',
    time: '10:00 AM',
    icon: 'Church',
    is_visible: true,
    display_order: 3,
  },
  {
    id: 'b7096315-9990-422e-a3d5-c1a0a737bedf',
    title: 'jovenes',
    description: null,
    day: 'domingo',
    time: '10:00 AM',
    icon: 'PartyPopper',
    is_visible: true,
    display_order: 3,
  },
];

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: '18d807fd-bc67-44a1-a645-a81d585adde7',
    title: 'Vigilia de adoracion',
    description: 'Viernes 21:00 hs en la Sala de Oración congregacional.',
    image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=600&fit=crop',
    is_visible: true,
    display_order: 2,
  },
];

export const DEFAULT_MINISTRIES = [
  {
    id: 'df0c4d64-953f-430b-89bd-ea96fb0a7a84',
    slug: 'ninos',
    title: 'Ministerio de Niños',
    description: 'Un lugar donde los más pequeños aprenden sobre el amor de Dios de manera divertida y segura.',
    content: 'Nuestro ministerio de niños está dedicado a sembrar las semillas de la fe en los corazones de los más pequeños.',
    image_url: null,
    icon: 'Heart',
    schedule: 'Domingos 10:00 AM',
    leader: 'Por asignar',
    is_visible: true,
    display_order: 1,
  },
  {
    id: '7eda29c6-3096-4241-a8fa-4e7677ed5887',
    slug: 'jovenes',
    title: 'Ministerio de Jóvenes',
    description: 'Conectando a la nueva generación con su propósito en Cristo.',
    content: 'El ministerio de jóvenes es un espacio vibrante donde los adolescentes y jóvenes adultos pueden crecer en su fe.',
    image_url: null,
    icon: 'Users',
    schedule: 'Sábados 6:00 PM',
    leader: 'Por asignar',
    is_visible: true,
    display_order: 2,
  },
  {
    id: '7e7f183a-54d9-459d-83e0-ff8692ef2b26',
    slug: 'adultos',
    title: 'Ministerio de Adultos',
    description: 'Fortaleciendo familias y vidas a través de la Palabra de Dios.',
    content: 'Nuestro ministerio de adultos se enfoca en el crecimiento espiritual continuo.',
    image_url: null,
    icon: 'BookOpen',
    schedule: 'Miércoles 7:00 PM',
    leader: 'Por asignar',
    is_visible: true,
    display_order: 3,
  },
  {
    id: '20232a63-8d1e-4800-9b85-b95d86c19fb9',
    slug: 'musica',
    title: 'Ministerio de Música',
    description: 'Adorando a Dios con todo nuestro ser a través de la música.',
    content: 'El ministerio de música lidera a la congregación en la adoración a través de canciones que exaltan a Dios.',
    image_url: null,
    icon: 'Music',
    schedule: 'Ensayos: Viernes 7:00 PM',
    leader: 'Por asignar',
    is_visible: true,
    display_order: 4,
  },
];
