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
  stat1Value: '',
  stat1Label: '',
  stat2Value: '',
  stat2Label: '',
  stat3Value: '',
  stat3Label: '',
};

export const DEFAULT_CONTACT = {
  title: 'Contáctanos',
  subtitle: 'Estamos aquí para ti',
};

export const DEFAULT_CONTACT_CONTENT = 'Visítanos o escríbenos para más información.';

export const DEFAULT_CONTACT_FIELDS = {
  addressLabel: '',
  addressLine1: '',
  addressLine2: '',
  phoneLabel: '',
  phoneLine1: '',
  phoneLine2: '',
  emailLabel: '',
  emailLine1: '',
  emailLine2: '',
  mapUrl: '',
};
