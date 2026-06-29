import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import cs from '@/locales/cs.json';
import sk from '@/locales/sk.json';
import de from '@/locales/de.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';
import it from '@/locales/it.json';
import pl from '@/locales/pl.json';
import nl from '@/locales/nl.json';
import pt from '@/locales/pt.json';
import ro from '@/locales/ro.json';
import hu from '@/locales/hu.json';
import hr from '@/locales/hr.json';
import bg from '@/locales/bg.json';
import sv from '@/locales/sv.json';
import da from '@/locales/da.json';
import fi from '@/locales/fi.json';
import el from '@/locales/el.json';

export const SUPPORTED_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'cs', label: 'Čeština' },
  { code: 'sk', label: 'Slovenčina' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pl', label: 'Polski' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pt', label: 'Português' },
  { code: 'ro', label: 'Română' },
  { code: 'hu', label: 'Magyar' },
  { code: 'hr', label: 'Hrvatski' },
  { code: 'bg', label: 'Български' },
  { code: 'sv', label: 'Svenska' },
  { code: 'da', label: 'Dansk' },
  { code: 'fi', label: 'Suomi' },
  { code: 'el', label: 'Ελληνικά' },
];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    cs: { translation: cs },
    sk: { translation: sk },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
    pl: { translation: pl },
    nl: { translation: nl },
    pt: { translation: pt },
    ro: { translation: ro },
    hu: { translation: hu },
    hr: { translation: hr },
    bg: { translation: bg },
    sv: { translation: sv },
    da: { translation: da },
    fi: { translation: fi },
    el: { translation: el },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
