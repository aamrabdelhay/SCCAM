import { BookMarked, Search } from "lucide-react";
import { getLang } from "@/lib/server-lang";

export const metadata = { title: "References" };

const arbitrationReferences = [
  "محسن شفيق، التحكيم التجاري الدولي: دراسة في قانون التجارة الدولية (دار النهضة العربية، القاهرة، 1997).",
  "سامية راشد، التحكيم في العلاقات الدولية الخاصة (دار النهضة العربية، القاهرة، 1998).",
  "فتحي والي، قانون التحكيم في النظرية والتطبيق (منشأة المعارف، الإسكندرية، 2007).",
  "فتحي والي، التحكيم في المنازعات الوطنية والتجارية الدولية: علمًا وعملاً (منشأة المعارف، الإسكندرية، 2014).",
  "أحمد عبد الكريم سلامة، قانون التحكيم التجاري الدولي والداخلي: تنظير وتطبيق مقارن (دار النهضة العربية، القاهرة، 2004).",
  "أحمد عبد الكريم سلامة، التحكيم في المعاملات المالية الداخلية والدولية المدنية والتجارية والإدارية والجمركية: دراسة مقارنة (دار النهضة العربية، القاهرة، 2006).",
  "أحمد عبد الكريم سلامة، نظرية العقد الدولي الطليق بين القانون الدولي الخاص وقانون التجارة الدولية: دراسة تأصيلية انتقادية (دار النهضة العربية، القاهرة، 1989).",
  "أحمد قسمت الجداوي، التحكيم في مواجهة الاختصاص القضائي الدولي: تنازع الاختصاص وتنازع القوانين (دار النهضة العربية، القاهرة، 1982).",
  "أحمد شرف الدين، دراسات في التحكيم في منازعات العقود الدولية (القاهرة، 1993).",
  "أحمد شرف الدين، المرشد إلى قواعد التحكيم: إرشادات للمحكمين والمحامين (نادي القضاة، القاهرة، الطبعة الثانية، 2010).",
  "هشام خالد، أوليات التحكيم التجاري الدولي: دراسة مقارنة (دار الفكر الجامعي، الإسكندرية، 2004).",
  "هشام خالد، جدوى اللجوء إلى التحكيم التجاري الدولي (منشأة المعارف، الإسكندرية، 2006).",
  "هشام خالد، تنفيذ الأحكام القضائية والتحكيمية الأجنبية في قوانين دول مجلس التعاون الخليجي (منشأة المعارف، الإسكندرية، 2009).",
  "عصام الدين القصبي، النفاذ الدولي لأحكام التحكيم (دار النهضة العربية، 1993).",
  "عاشور مبروك، النظام الإجرائي لخصومة التحكيم: دراسة تحليلية مقارنة (مكتبة الجلاء الجديدة، المنصورة، 1996).",
  "عاشور مبروك، التحكيم (دار الفكر والقانون، المنصورة، 2014).",
  "عاشور مبروك، الوسيط في النظام القانوني لتنفيذ أحكام التحكيم: دراسة تحليلية وفقًا لأحدث التشريعات والنظم المعاصرة (دار الفكر والقانون، المنصورة، 2011).",
  "أحمد أبو الوفا، التحكيم في قوانين البلاد العربية (منشأة المعارف، الإسكندرية، الطبعة الأولى، 1987).",
  "أحمد أبو الوفا، التحكيم الاختياري والإجباري (منشأة المعارف، الإسكندرية، الطبعة الخامسة، 2001).",
  "أحمد أبو الوفا، عقد التحكيم وإجراءاته (منشأة المعارف، الإسكندرية، الطبعة الثانية، 1974).",
  "جمال الكردي، القانون الواجب التطبيق في دعوى التحكيم (دار النهضة العربية، القاهرة، 2005).",
  "حسني المصري، التحكيم التجاري الدولي: دراسة مقارنة (دار الكتب القانونية، 2006).",
  "حسين الماحي، التحكيم النظامي في التجارة الدولية (دار النهضة العربية، القاهرة، 2003).",
  "أحمد محمد حشيش، القوة التنفيذية لحكم التحكيم (دار الفكر الجامعي، الإسكندرية، 2001).",
  "أحمد محمد حشيش، طبيعة المهمة التحكيمية (شركة الجلال للطباعة، الإسكندرية، 2000).",
  "أبو زيد رضوان، الأسس العامة في التحكيم التجاري الدولي (دار الفكر العربي، القاهرة، 1981).",
  "أشرف عبد العليم الرفاعي، النظام العام والقانون الواجب التطبيق على إجراءات التحكيم في العلاقات ذات العنصر الأجنبي (دار الفكر الجامعي، الإسكندرية، 2002).",
  "أشرف عبد العليم الرفاعي، القانون الواجب التطبيق على موضوع التحكيم والنظام العام في العلاقات الخاصة الدولية (شركة الجلال للطباعة، الإسكندرية، الطبعة الأولى، 2003).",
  "أحمد محمد عبد الصادق، المرجع العام في التحكيم: المصري والعربي والدولي (دار أبو المجد للطباعة، مصر، الطبعة الثانية، 2008).",
  "إسماعيل إبراهيم الزيادي، في التحكيم واجتهاد القضاء (مطابع آمون، القاهرة، 2007).",
  "حفيظة السيد الحداد، الاتجاهات المعاصرة بشأن اتفاق التحكيم (دار الفكر الجامعي، الإسكندرية، 2001).",
  "حفيظة السيد الحداد، الطعن بالبطلان على أحكام التحكيم الصادرة في المنازعات الخاصة الدولية (دار الفكر الجامعي، الإسكندرية، 1997).",
  "حمد الله محمد حمد الله، النظام القانوني لشرط التحكيم في المنازعات التجارية (دار النهضة العربية، القاهرة، 2008).",
  "خالد محمد القاضي، موسوعة التحكيم التجاري الدولي في منازعات المشروعات الدولية المشتركة مع إشارة خاصة لأحدث أحكام القضاء المصري (دار الشروق، القاهرة، الطبعة الأولى، 2002).",
  "عبد المنعم الدسوقي، التحكيم التجاري الدولي والداخلي (مكتبة مدبولي، القاهرة، 1995).",
  "عبد المنعم الدسوقي، موسوعة قضاء النقض في المواد المدنية (القاهرة، 1993).",
  "عبد الحميد المنشاوي، التحكيم الدولي والداخلي (مطبعة القدس، 2007).",
  "عبد الحميد الشواربي، التحكيم والتصالح (دار المعارف، الإسكندرية، 1996).",
  "عبد الحميد الأحدب، التحكيم في البلاد العربية: موسوعة التحكيم - الجزء الأول (مطبعة دار المعارف، جمهورية مصر العربية، 1998).",
  "عبد الحميد الأحدب، التحكيم الدولي: موسوعة التحكيم - الجزء الثاني (دار المعارف، جمهورية مصر العربية، 1998).",
  "علي عوض حسن، التحكيم الاختياري والإجباري في المنازعات المدنية والتجارية (دار الفكر الجامعي، الإسكندرية، 2001).",
  "عيد محمد قصاص، حكم التحكيم: دراسة تحليلية في قانون التحكيم المصري والمقارن (دار النهضة العربية، القاهرة، 2007).",
  "عبد الله عيسى علي الرمح، حكم التحكيم (دار الفتح للطباعة والنشر، الإسكندرية، 2009).",
  "علي سالم إبراهيم، ولاية القضاء على التحكيم (دار النهضة العربية، القاهرة، 1997).",
  "عزت محمد البحيري، تنفيذ أحكام التحكيم الأجنبية (دار النهضة العربية، القاهرة، 1997).",
  "محمود السيد عمر التحيوي، التحكيم الحر والتحكيم المقيد (مطبعة عصام جابر، 2001).",
  "محمود السيد عمر التحيوي، الطبيعة القانونية لنظام التحكيم (منشأة المعارف، الإسكندرية، 2003).",
  "مصطفى الجمال وعكاشة عبد العال، التحكيم في العلاقات الخاصة الدولية والداخلية (الطبعة الأولى، بيروت، 1998).",
  "منير عبد المجيد، قضاء التحكيم في منازعات التجارة الدولية (دار المطبوعات الجامعية، الإسكندرية، 1995).",
  "منير عبد المجيد، الأسس العامة للتحكيم الدولي والداخلي (منشأة المعارف، الإسكندرية، 2000).",
  "منير عبد المجيد، التنظيم القانوني للتحكيم الدولي والداخلي في ضوء الفقه وقضاء التحكيم (منشأة المعارف، الإسكندرية، 1995).",
  "محمود مختار البريري، التحكيم التجاري الدولي (دار النهضة العربية، القاهرة، الطبعة الرابعة، 2014).",
  "معوض عبد التواب، المستحدث في التحكيم التجاري الدولي (دار الفكر الجامعي، الإسكندرية، الطبعة الأولى، 1997).",
  "معوض عبد التواب، الموسوعة الشاملة في التحكيم في مصر والدول العربية (دار شادي للإصدارات القانونية، القاهرة، الطبعة الأولى، 2009).",
  "منصور رجب عبد العليم منصور، الموسوعة القانونية الشاملة في أحكام التحكيم (الطبعة الأولى، 2010).",
  "ناريمان عبد القادر، اتفاق التحكيم وفقًا لقانون التحكيم في المواد المدنية والتجارية (دار النهضة العربية، القاهرة، الطبعة الأولى، 1996).",
  "نبيل إسماعيل عمر، التحكيم في المواد المدنية والتجارية، الوطنية والدولية (دار الجامعة الجديدة، الإسكندرية، 2011).",
  "رضا السيد عبد الحميد، مسائل في التحكيم (دار النهضة العربية، القاهرة، 2003).",
  "صادق محمد الجبران، التحكيم التجاري الدولي (منشورات الحلبي الحقوقية، بيروت، الطبعة الأولى، 2006).",
  "وائل أنور البندق، الاتفاقيات الدولية وقوانين الدول العربية: موسوعة التحكيم (دار الفكر الجامعي، الإسكندرية، 2004).",
];

const referenceSources: Record<string, { label: string; url: string; note?: string }[]> = {
  "a-0": [
    { label: "Google Books", url: "https://books.google.com/books/about/%D8%A7%D9%84%D8%AA%D8%AD%D9%83%D9%8A%D9%85_%D8%A7%D9%84%D8%AA%D8%AC%D8%A7%D8%B1%D9%8A_%D8%A7%D9%84%D8%AF%D9%88%D9%84.html?id=pV-kPQAACAAJ" },
    { label: "فهرس مكتبة ديوان الجريدة الرسمية", url: "https://library.ogb.gov.ps/records/index/1/986" },
  ],
  "a-1": [
    { label: "فهرس مكتبة CRCICA", url: "https://library.crcica.org/cgi-bin/koha/opac-detail.pl?biblionumber=1818", note: "السجل المتاح يثبت طبعة 1984، لا بيانات 1998 الواردة في القائمة." },
  ],
  "a-2": [{ label: "Google Books — سجل ببليوغرافي", url: "https://books.google.com/books/about/%D9%82%D8%A7%D9%86%D9%88%D9%86_%D8%A7%D9%84%D8%AA%D8%AD%D9%83%D9%8A%D9%85_%D9%81%D9%8A_%D8%A7%D9%84%D9%86%D8%B8.html?id=u-LtQwAACAAJ" }],
  "a-3": [{ label: "WorldCat", url: "https://search.worldcat.org/title/874158113" }],
  "a-4": [{ label: "فهرس جامعة باتنة 1", url: "https://pmb.univ-batna.dz/opac_bcu/index.php?id=36353&lvl=notice_display" }],
  "a-5": [{ label: "فهرس مكتبة كلية الحقوق — جامعة القاهرة", url: "https://fll.law.cu.edu.eg/cgi-bin/koha/opac-detail.pl?biblionumber=28069" }],
  "a-6": [{ label: "صفحة الناشر – دار النهضة العربية", url: "https://www.daralnahda.com/book/32339/%D9%86%D8%B8%D8%B1%D9%8A%D8%A9-%D8%A7%D9%84%D8%B9%D9%82%D8%AF-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A-%D8%A7%D9%84%D8%B7%D9%84%D9%8A%D9%82-%D8%A8%D9%8A%D9%86-%D8%A7%D9%84%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A-%D8%A7%D9%84%D8%AE%D8%A7%D8%B5-%D9%88%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%A7%D9%84%D8%AA%D8%AC%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A%D8%A9-%D8%AF%D8%B1%D8%A7%D8%B3%D8%A9-%D8%AA%D8%A7%D8%B5%D9%8A%D9%84%D9%8A%D8%A9-%D8%A7%D9%86%D8%AA%D9%82%D8%A7%D8%AF%D9%8A%D8%A9", note: "صفحة الناشر تعرض بيانات إصدار أحدث من سنة 1989 المذكورة." }],
  "a-8": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=185304" }],
  "a-13": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=209779&shelfbrowse_itemnumber=345485" }],
  "a-18": [
    { label: "فهرس مكتبة CRCICA", url: "https://library.crcica.org/cgi-bin/koha/opac-detail.pl?biblionumber=2129", note: "السجل المتاح يذكر طبعة 1987؛ راجع اختلاف الطبعة عن القائمة." },
    { label: "فهرس معهد التخطيط القومي", url: "https://catalog.inp.edu.eg/cgi-bin/koha/opac-detail.pl?biblionumber=13125&shelfbrowse_itemnumber=13842" },
  ],
  "a-19": [
    { label: "دار الكتب والوثائق العراقية", url: "https://www.iraqnla.gov.iq/opac/fullrecr.php?hl=ara&nid=62961" },
    { label: "WorldCat", url: "https://search.worldcat.org/title/aqd-althkym-wajraaath/oclc/11420523" },
  ],
  "a-23": [{ label: "Google Books", url: "https://books.google.com/books/about/%D8%A7%D9%84%D9%82%D9%88%D8%A9_%D8%A7%D9%84%D8%AA%D9%86%D9%81%D9%8A%D8%B0%D9%8A%D8%A9_%D9%84%D8%AD%D9%83%D9%85.html?id=WX3RAAAACAAJ" }],
  "a-24": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=146197", note: "السجل المتاح يذكر سنة 2001؛ القائمة تذكر 2000." }],
  "a-26": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=135905&query_desc=", note: "بيانات الطبعة المسجلة 2003." }],
  "a-31": [{ label: "فهرس مكتبة كلية الحقوق – جامعة القاهرة", url: "https://fll.law.cu.edu.eg/cgi-bin/koha/opac-detail.pl?biblionumber=28028", note: "الفهرس يعرض طبعة 1994؛ القائمة تذكر 1997." }],
  "a-43": [{ label: "فهرس مكتبة ديوان الجريدة الرسمية", url: "https://library.ogb.gov.ps/records/index/1/756" }],
  "a-47": [
    { label: "تحميل PDF مباشر — مكتبة كلية الحقوق، جامعة القاهرة", url: "https://fll.law.cu.edu.eg/fulltext/bks/B12-00010.pdf", note: "ملف PDF متاح من رابط إلكتروني مسجل في الفهرس الرسمي لجامعة القاهرة." },
    { label: "سجل الفهرسة الرسمي — جامعة القاهرة", url: "https://fll.law.cu.edu.eg/cgi-bin/koha/opac-MARCdetail.pl?biblionumber=28402", note: "السجل يثبت المؤلفين والطبعة الأولى وسنة 1998، لكنه يذكر الإسكندرية ودار الفتح للطباعة والنشر؛ راجع اختلاف مكان النشر عن بيانات القائمة." },
  ],
  "a-48": [{ label: "فهرس مكتبة ديوان الجريدة الرسمية", url: "https://library.ogb.gov.ps/records/index/1/1131" }],
  "a-50": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=132146&shelfbrowse_itemnumber=182939", note: "السجل المتاح يذكر إصدار 1997." }],
  "a-59": [{ label: "صفحة الناشر – منشورات الحلبي الحقوقية", url: "https://halabi-lp.com/arabic/books/ShowBook.aspx?BookID=564" }],
  "p-0": [
    { label: "فهرس جامعة الإمارات للطيران — طبعة أقدم", url: "https://catalog.aue.ae/cgi-bin/koha/opac-detail.pl?biblionumber=25973", note: "السجل المتاح يذكر طبعة 1995." },
    { label: "فهرس المكتبة المركزية — جامعة غليزان", url: "https://catalogue.univ-relizane.dz/bc/opac_css/index.php?dcote=&id=27&lcote=0&location=1&lvl=section_see&main=&nb_per_page_custom=200&nbr_lignes=10089&nc=0&page=27&plettreaut=&ssub=0", note: "يعرض سجل الطبعة الثانية الصادرة عام 2001 عن دار الفكر الجامعي." },
  ],
  "p-3": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=135907&query_desc=" }],
  "p-1": [{ label: "فهرس مكتبة المحكمة الدستورية — الأردن", url: "https://library.cco.gov.jo/cgi-bin/koha/opac-detail.pl?biblionumber=2085", note: "السجل يثبت العنوان والمؤلفين، لكنه يسجل طبعة 2010 لا 2012 المذكورة في القائمة." }],
  "p-5": [{ label: "فهرس مكتبة كلية الحقوق — جامعة القاهرة", url: "https://fll.law.cu.edu.eg/cgi-bin/koha/opac-detail.pl?biblionumber=43321" }],
  "p-6": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=133012" }],
  "a-10": [{ label: "فهرس المكتبة البرلمانية الجزائرية", url: "https://bibliotheque.apn.dz/index.php?id=97&lvl=etagere_see&nb_per_page_custom=25&nbr_lignes=530&page=14" }],
  "a-11": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=147171", note: "الفهرس يسجل طبعة 2005؛ القائمة الواردة هنا تذكر 2006." }],
  "a-12": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=169226" }],
  "a-20": [{ label: "فهرس مكتبة كلية الحقوق — جامعة المسيلة", url: "https://fac.umc.edu.dz/droit/bib/pagesbib/livre.php?id_livre=6582", note: "سجل ببليوغرافي للكتاب؛ راجع بيانات السنة في السجل عند المقارنة بالطبعة المذكورة في القائمة." }],
  "a-22": [{ label: "فهرس مكتبة اتحاد الإمارات", url: "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=135941" }],
  "a-25": [{ label: "فهرس مكتبة عبد الحميد شومان", url: "https://library.shoman.org.jo/bib/69748" }],
  "a-53": [{ label: "فهرس مكتبة CRCICA", url: "https://library.crcica.org/cgi-bin/koha/opac-detail.pl?biblionumber=3260" }],
  "p-4": [{ label: "صفحة الناشر – دار النهضة العربية", url: "https://www.daralnahda.com/book/4072/%D9%85%D8%AF%D9%88%D9%86%D8%A9-%D8%A7%D8%A8%D8%AD%D8%A7%D8%AB-%D9%81%D9%8A-%D8%A7%D9%84%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A-%D8%A7%D9%84%D8%AE%D8%A7%D8%B5" }],
};

const privateInternationalLawReferences = [
  "هشام علي صادق، القانون الواجب التطبيق على عقود التجارة الدولية (منشأة المعارف، الإسكندرية، 2001).",
  "هشام صادق وعكاشة محمد عبد العال، القانون الدولي الخاص: تنازع القوانين - الاختصاص القضائي الدولي - الجنسية (دار المطبوعات الجامعية، 2012).",
  "هشام خالد، القانون الدولي الخاص (دار الفكر الجامعي، الإسكندرية، 2014).",
  "هشام خالد، المدخل للقانون الدولي الخاص العربي: نشأته، مباحثه، مصادره، طبيعته - دراسة مقارنة في القوانين العربية (دار الفكر الجامعي، الإسكندرية، 2003).",
  "أحمد عبد الكريم سلامة، مدونة أبحاث في القانون الدولي الخاص (دار النهضة العربية، القاهرة، 2012).",
  "إبراهيم أحمد إبراهيم، التحكيم الدولي الخاص (دار النهضة العربية، القاهرة، الطبعة الثانية، 1997).",
  "نادر محمد إبراهيم، مركز القواعد عبر الدولية أمام التحكيم الاقتصادي الدولي (دار الفكر الجامعي، الإسكندرية، 2002).",
];

export default async function ReferencesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const lang = await getLang();
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q.trim().toLowerCase() : "");
  const ar = lang === "ar";
  const arbitration = arbitrationReferences.filter((item) => !q || item.toLowerCase().includes(q));
  const privateLaw = privateInternationalLawReferences.filter((item) => !q || item.toLowerCase().includes(q));

  return (
    <div className="container-x py-10">
      <header className="max-w-3xl">
        <p className="eyebrow">{ar ? "مكتبة الباحث" : "Research library"}</p>
        <h1 className="font-display mt-2 flex items-center gap-2 text-[28px] font-extrabold sm:text-[36px]">
          <BookMarked className="h-7 w-7 text-[var(--accent)]" aria-hidden="true" />
          {ar ? "المراجع" : "References"}
        </h1>
        <p className="mt-3 text-[13.5px] leading-8 text-[var(--muted)]">
          {ar
            ? "قائمة مراجع متخصصة في التحكيم والقانون الدولي الخاص، مع روابط للفهرسة والمصادر المؤسسية والنسخ الرقمية المتاحة."
            : "A specialist bibliography on arbitration and private international law, with links to library catalogues, institutional sources and available digital copies."}
        </p>
      </header>

      <form action="/references" method="get" role="search" className="relative mt-6 max-w-xl">
        <label htmlFor="reference-search" className="sr-only">{ar ? "ابحث في قائمة المراجع" : "Search references"}</label>
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
        <input id="reference-search" name="q" defaultValue={q} className="field ps-9" placeholder={ar ? "ابحث باسم المؤلف أو عنوان الكتاب..." : "Search author or book title..."} />
        <button type="submit" className="btn btn-primary btn-sm absolute end-1 top-1/2 -translate-y-1/2">{ar ? "بحث" : "Search"}</button>
      </form>

      <p className="mt-5 text-[12px] leading-7 text-[var(--muted)]">
        {ar
          ? "روابط المصادر بجانب العناوين تقود إلى فهارس مكتبات أو صفحات الناشرين أو سجلات ببليوغرافية للتحقق من بيانات الطبعة."
          : "Source links beside titles lead to library catalogues, publisher pages or bibliographic records for edition verification."}
      </p>

      <section className="mt-9">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="section-title">{ar ? "أولًا: التحكيم" : "I. Arbitration"}</h2>
          <span className="text-[12px] font-semibold text-[var(--muted)]">{arbitration.length} / {arbitrationReferences.length}</span>
        </div>
        <ol className="grid gap-2">
          {arbitration.map((item) => {
            const sourceLinks = referenceSources["a-" + arbitrationReferences.indexOf(item)] ?? [];
            return (
              <li key={item} className="card flex items-start gap-3 p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-[11px] font-extrabold text-[var(--primary)]">{arbitrationReferences.indexOf(item) + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-8 text-[var(--text)]" dir="rtl">{item}</p>
                  {sourceLinks.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold text-[var(--secondary)] hover:border-[var(--secondary)]">{source.label} ↗</a>)}</div>}
                  {sourceLinks.some((source) => source.note) && <p className="mt-2 text-[10.5px] leading-6 text-[var(--muted)]">{sourceLinks.filter((source) => source.note).map((source) => source.note).join(" · ")}</p>}
                </div>
              </li>
            );
          })}
        </ol>
        {arbitration.length === 0 && <p className="card mt-3 p-5 text-sm text-[var(--muted)]">{ar ? "لا توجد نتائج مطابقة." : "No matching references."}</p>}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="section-title">{ar ? "ثانيًا: القانون الدولي الخاص" : "II. Private international law"}</h2>
          <span className="text-[12px] font-semibold text-[var(--muted)]">{privateLaw.length} / {privateInternationalLawReferences.length}</span>
        </div>
        <ol className="grid gap-2">
          {privateLaw.map((item) => {
            const sourceLinks = referenceSources["p-" + privateInternationalLawReferences.indexOf(item)] ?? [];
            return (
              <li key={item} className="card flex items-start gap-3 p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-[11px] font-extrabold text-[var(--primary)]">{privateInternationalLawReferences.indexOf(item) + 61}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-8 text-[var(--text)]" dir="rtl">{item}</p>
                  {sourceLinks.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{sourceLinks.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold text-[var(--secondary)] hover:border-[var(--secondary)]">{source.label} ↗</a>)}</div>}
                  {sourceLinks.some((source) => source.note) && <p className="mt-2 text-[10.5px] leading-6 text-[var(--muted)]">{sourceLinks.filter((source) => source.note).map((source) => source.note).join(" · ")}</p>}
                </div>
              </li>
            );
          })}
        </ol>
        {privateLaw.length === 0 && <p className="card mt-3 p-5 text-sm text-[var(--muted)]">{ar ? "لا توجد نتائج مطابقة." : "No matching references."}</p>}
      </section>
    </div>
  );
}
