export interface Translations {
  postNotFound: string;
  blog: string;
  blogDescription: string;
  backToSite: string;
  backToBlog: string;
  backToHome: string;
  insights: string;
  previous: string;
  next: string;
  pageXofY: string;
  noArticles: string;
  noArticlesFilter: string;
  privacy: string;
  terms: string;
  home: string;
  allRightsReserved: string;
  share: string;
  fallbackBanner: string;
  readIn: string;
  selectLanguage: string;
  filterByLanguage: string;
  all: string;
  languageNames: Record<string, string>;
}

function replacePlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

export function formatPageXofY(t: Translations, current: number, total: number): string {
  return replacePlaceholders(t.pageXofY, { current: String(current), total: String(total) });
}

export function formatAllRightsReserved(t: Translations, year: number): string {
  return replacePlaceholders(t.allRightsReserved, { year: String(year) });
}

export function formatFallbackBanner(t: Translations, requested: string, fallback: string): string {
  return replacePlaceholders(t.fallbackBanner, { requested, fallback });
}

export function formatReadIn(t: Translations, lang: string): string {
  return replacePlaceholders(t.readIn, { lang });
}

export const translations: Record<string, Translations> = {
  en: {
    postNotFound: "Post Not Found",
    blog: "Blog",
    blogDescription:
      "Expert insights on sales commission management, plan design, rep motivation, and revenue operations.",
    backToSite: "commissionk.it",
    backToBlog: "Back to Blog",
    backToHome: "Back to CommissionKit",
    insights: "Insights",
    previous: "Previous",
    next: "Next",
    pageXofY: "Page {current} of {total}",
    noArticles: "No articles available in this language yet.",
    noArticlesFilter: "No articles found for this language.",
    privacy: "Privacy",
    terms: "Terms",
    home: "Home",
    allRightsReserved: "© {year} COMMISSIONKIT. ALL RIGHTS RESERVED.",
    share: "Share",
    fallbackBanner:
      "This article is not available in {requested}. Showing the {fallback} version.",
    readIn: "Read in {lang} →",
    selectLanguage: "Select language",
    filterByLanguage: "Filter by language",
    all: "All",
    languageNames: {
      en: "English",
      ar: "العربية",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      pt: "Português",
      hi: "हिन्दी",
    },
  },
  ar: {
    postNotFound: "المقال غير موجود",
    blog: "المدونة",
    blogDescription:
      "رؤى الخبراء حول إدارة عمولات المبيعات، تصميم خطط العمولات، تحفيز المندوبين، وعمليات الإيرادات.",
    backToSite: "commissionk.it",
    backToBlog: "العودة إلى المدونة",
    backToHome: "العودة إلى CommissionKit",
    insights: "رؤى",
    previous: "السابق",
    next: "التالي",
    pageXofY: "الصفحة {current} من {total}",
    noArticles: "لا توجد مقالات متاحة بهذه اللغة بعد.",
    noArticlesFilter: "لم يُعثر على مقالات بهذه اللغة.",
    privacy: "الخصوصية",
    terms: "الشروط",
    home: "الرئيسية",
    allRightsReserved: "© {year} COMMISSIONKIT. جميع الحقوق محفوظة.",
    share: "مشاركة",
    fallbackBanner:
      "هذا المقال غير متاح باللغة {requested}. يتم عرض النسخة باللغة {fallback}.",
    readIn: "اقرأ باللغة {lang} →",
    selectLanguage: "اختر اللغة",
    filterByLanguage: "تصفية حسب اللغة",
    all: "الكل",
    languageNames: {
      en: "English",
      ar: "العربية",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      pt: "Português",
      hi: "हिन्दी",
    },
  },
  es: {
    postNotFound: "Publicación no encontrada",
    blog: "Blog",
    blogDescription:
      "Perspectivas de expertos sobre gestión de comisiones de ventas, diseño de planes, motivación de representantes y operaciones de ingresos.",
    backToSite: "commissionk.it",
    backToBlog: "Volver al Blog",
    backToHome: "Volver a CommissionKit",
    insights: "Perspectivas",
    previous: "Anterior",
    next: "Siguiente",
    pageXofY: "Página {current} de {total}",
    noArticles: "Aún no hay artículos disponibles en este idioma.",
    noArticlesFilter: "No se encontraron artículos para este idioma.",
    privacy: "Privacidad",
    terms: "Términos",
    home: "Inicio",
    allRightsReserved: "© {year} COMMISSIONKIT. TODOS LOS DERECHOS RESERVADOS.",
    share: "Compartir",
    fallbackBanner:
      "Este artículo no está disponible en {requested}. Se muestra la versión en {fallback}.",
    readIn: "Leer en {lang} →",
    selectLanguage: "Seleccionar idioma",
    filterByLanguage: "Filtrar por idioma",
    all: "Todos",
    languageNames: {
      en: "English",
      ar: "العربية",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      pt: "Português",
      hi: "हिन्दी",
    },
  },
  fr: {
    postNotFound: "Article introuvable",
    blog: "Blog",
    blogDescription:
      "Perspectives d'experts sur la gestion des commissions de vente, la conception des plans, la motivation des commerciaux et les opérations de revenus.",
    backToSite: "commissionk.it",
    backToBlog: "Retour au Blog",
    backToHome: "Retour à CommissionKit",
    insights: "Perspectives",
    previous: "Précédent",
    next: "Suivant",
    pageXofY: "Page {current} sur {total}",
    noArticles: "Aucun article disponible dans cette langue pour le moment.",
    noArticlesFilter: "Aucun article trouvé pour cette langue.",
    privacy: "Confidentialité",
    terms: "Conditions",
    home: "Accueil",
    allRightsReserved: "© {year} COMMISSIONKIT. TOUS DROITS RÉSERVÉS.",
    share: "Partager",
    fallbackBanner:
      "Cet article n'est pas disponible en {requested}. Affichage de la version en {fallback}.",
    readIn: "Lire en {lang} →",
    selectLanguage: "Choisir la langue",
    filterByLanguage: "Filtrer par langue",
    all: "Tout",
    languageNames: {
      en: "English",
      ar: "العربية",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      pt: "Português",
      hi: "हिन्दी",
    },
  },
  de: {
    postNotFound: "Beitrag nicht gefunden",
    blog: "Blog",
    blogDescription:
      "Experteneinblicke zu Vertriebsprovisionen, Plangestaltung, Vertriebsmotivation und Revenue Operations.",
    backToSite: "commissionk.it",
    backToBlog: "Zurück zum Blog",
    backToHome: "Zurück zu CommissionKit",
    insights: "Einblicke",
    previous: "Zurück",
    next: "Weiter",
    pageXofY: "Seite {current} von {total}",
    noArticles: "Noch keine Artikel in dieser Sprache verfügbar.",
    noArticlesFilter: "Keine Artikel für diese Sprache gefunden.",
    privacy: "Datenschutz",
    terms: "Nutzungsbedingungen",
    home: "Startseite",
    allRightsReserved: "© {year} COMMISSIONKIT. ALLE RECHTE VORBEHALTEN.",
    share: "Teilen",
    fallbackBanner:
      "Dieser Artikel ist nicht auf {requested} verfügbar. Es wird die {fallback}-Version angezeigt.",
    readIn: "Auf {lang} lesen →",
    selectLanguage: "Sprache auswählen",
    filterByLanguage: "Nach Sprache filtern",
    all: "Alle",
    languageNames: {
      en: "English",
      ar: "العربية",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      pt: "Português",
      hi: "हिन्दी",
    },
  },
  pt: {
    postNotFound: "Publicação não encontrada",
    blog: "Blog",
    blogDescription:
      "Insights de especialistas sobre gestão de comissões de vendas, design de planos, motivação de representantes e operações de receita.",
    backToSite: "commissionk.it",
    backToBlog: "Voltar ao Blog",
    backToHome: "Voltar ao CommissionKit",
    insights: "Insights",
    previous: "Anterior",
    next: "Próximo",
    pageXofY: "Página {current} de {total}",
    noArticles: "Ainda não há artículos disponíveis neste idioma.",
    noArticlesFilter: "Nenhum artigo encontrado para este idioma.",
    privacy: "Privacidade",
    terms: "Termos",
    home: "Início",
    allRightsReserved: "© {year} COMMISSIONKIT. TODOS OS DIREITOS RESERVADOS.",
    share: "Compartilhar",
    fallbackBanner:
      "Este artigo não está disponível em {requested}. Exibindo a versão em {fallback}.",
    readIn: "Ler em {lang} →",
    selectLanguage: "Selecionar idioma",
    filterByLanguage: "Filtrar por idioma",
    all: "Todos",
    languageNames: {
      en: "English",
      ar: "العربية",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      pt: "Português",
      hi: "हिन्दी",
    },
  },
  hi: {
    postNotFound: "पोस्ट नहीं मिली",
    blog: "ब्लॉग",
    blogDescription:
      "सेल्स कमीशन मैनेजमेंट, प्लान डिज़ाइन, रिप प्रेरणा और रेवेन्यू ऑपरेशंस पर विशेषज्ञ जानकारी।",
    backToSite: "commissionk.it",
    backToBlog: "ब्लॉग पर वापस जाएँ",
    backToHome: "CommissionKit पर वापस जाएँ",
    insights: "जानकारी",
    previous: "पिछला",
    next: "अगला",
    pageXofY: "{total} में से पृष्ठ {current}",
    noArticles: "इस भाषा में अभी तक कोई लेख उपलब्ध नहीं है।",
    noArticlesFilter: "इस भाषा के लिए कोई लेख नहीं मिले।",
    privacy: "गोपनीयता",
    terms: "नियम",
    home: "होम",
    allRightsReserved: "© {year} COMMISSIONKIT. सर्वाधिकार सुरक्षित।",
    share: "साझा करें",
    fallbackBanner:
      "यह लेख {requested} में उपलब्ध नहीं है। {fallback} संस्करण दिखाया जा रहा है।",
    readIn: "{lang} में पढ़ें →",
    selectLanguage: "भाषा चुनें",
    filterByLanguage: "भाषा के अनुसार फ़िल्टर करें",
    all: "सभी",
    languageNames: {
      en: "English",
      ar: "العربية",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      pt: "Português",
      hi: "हिन्दी",
    },
  },
};

export function t(lang: string): Translations {
  return translations[lang] ?? translations.en;
}
