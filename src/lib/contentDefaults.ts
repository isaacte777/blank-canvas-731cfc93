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
};

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
