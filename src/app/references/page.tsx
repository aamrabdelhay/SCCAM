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

const privateInternationalLawReferences = [
  "هشام علي صادق، القانون الواجب التطبيق على عقود التجارة الدولية (منشأة المعارف، الإسكندرية، 2001).",
  "هشام صادق وعكاشة محمد عبد العال، القانون الدولي الخاص: تنازع القوانين - الاختصاص القضائي الدولي - الجنسية (دار المطبوعات الجامعية، 2012).",
  "هشام خالد، القانون الدولي الخاص (دار الفكر الجامعي، الإسكندرية، 2014).",
  "هشام خالد، المدخل للقانون الدولي الخاص العربي: نشأته، مباحثه، مصادره، طبيعته - دراسة مقارنة في القوانين العربية (دار الفكر الجامعي، الإسكندرية، 2003).",
  "أحمد عبد الكريم سلامة، مدونة أبحاث في القانون الدولي الخاص (دار النهضة العربية، القاهرة، 2012).",
  "إبراهيم أحمد إبراهيم، التحكيم الدولي الخاص (دار النهضة العربية، القاهرة، الطبعة الثانية، 1997).",
  "نادر محمد إبراهيم، مركز القواعد عبر الدولية أمام التحكيم الاقتصادي الدولي (دار الفكر الجامعي، الإسكندرية، 2002).",
];

const referenceSources: Record<number, { url: string; labelAr: string; labelEn: string; noteAr?: string; noteEn?: string }[]> = {
  "1": [
    {
      "url": "https://library.ogb.gov.ps/Records/IndexToPrint?libId=1&recordNo=986",
      "labelAr": "فهرس مكتبة ديوان الجريدة الرسمية",
      "labelEn": "Official Gazette Library catalogue"
    },
    {
      "url": "https://books.google.com/books?id=pV-kPQAACAAJ",
      "labelAr": "بيانات Google Books",
      "labelEn": "Google Books record"
    }
  ],
  "2": [
    {
      "url": "https://fll.law.cu.edu.eg/cgi-bin/koha/opac-MARCdetail.pl?biblionumber=27989",
      "labelAr": "فهرس مكتبة حقوق القاهرة",
      "labelEn": "Cairo University Law Library record",
      "noteAr": "السجل يذكر سنة 1984، بينما القائمة المقدمة تذكر 1998؛ تحقّق من الطبعة المقصودة.",
      "noteEn": "This catalogue record lists 1984, while the supplied bibliography says 1998; verify the intended edition."
    },
    {
      "url": "https://library.univ-alger3.dz/bib/36544",
      "labelAr": "فهرس جامعة الجزائر 3",
      "labelEn": "University of Algiers 3 catalogue",
      "noteAr": "هذا السجل يثبت العنوان والمؤلفة، لكنه يسجل بيانات نشر أقدم (1973).",
      "noteEn": "This record confirms the title and author but lists an earlier publication record (1973)."
    }
  ],
  "3": [
    {
      "url": "https://books.google.com/books?id=u-LtQwAACAAJ",
      "labelAr": "بيانات Google Books",
      "labelEn": "Google Books record"
    },
    {
      "url": "https://fac.umc.edu.dz/droit/bib/pagesbib/livre.php?id_livre=8096",
      "labelAr": "فهرس جامعة قسنطينة – 2007",
      "labelEn": "Constantine University catalogue – 2007"
    }
  ],
  "4": [
    {
      "url": "https://search.worldcat.org/title/874158113",
      "labelAr": "فهرس WorldCat",
      "labelEn": "WorldCat catalogue"
    }
  ],
  "5": [
    {
      "url": "https://library.crcica.org/bib/3304",
      "labelAr": "فهرس مكتبة مركز القاهرة الإقليمي للتحكيم التجاري الدولي",
      "labelEn": "CRCICA Library catalogue"
    },
    {
      "url": "https://pmb.univ-batna.dz/opac_bcu/index.php?id=36353&lvl=notice_display",
      "labelAr": "فهرس جامعة باتنة",
      "labelEn": "University of Batna catalogue"
    }
  ],
  "6": [
    {
      "url": "https://fll.law.cu.edu.eg/cgi-bin/koha/opac-detail.pl?biblionumber=28069",
      "labelAr": "فهرس مكتبة الحقوق – جامعة القاهرة",
      "labelEn": "Cairo University Law Library catalogue"
    },
    {
      "url": "https://www.daralnahda.com/book/4079/%D8%A7%D9%84%D8%AA%D8%AD%D9%83%D9%8A%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D9%85%D8%B9%D8%A7%D9%85%D9%84%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AF%D8%A7%D8%AE%D9%84%D9%8A%D8%A9-%D9%88%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D9%85%D8%AF%D9%86%D9%8A%D8%A9-%D9%88%D8%A7%D9%84%D8%AA%D8%AC%D8%A7%D8%B1%D9%8A%D8%A9-%D9%88%D8%A7%D9%84%D8%A7%D8%AF%D8%A7%D8%B1%D9%8A%D8%A9-%D9%88%D8%A7%D9%84%D8%AC%D9%85%D8%B1%D9%83%D9%8A%D8%A9-%D8%AF%D8%B1%D8%A7%D8%B3%D8%A9-%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9",
      "labelAr": "صفحة الكتاب لدى دار النهضة",
      "labelEn": "Dar Al-Nahda publisher page"
    }
  ],
  "9": [
    {
      "url": "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=185304",
      "labelAr": "فهرس مكتبة اتحاد الإمارات",
      "labelEn": "UAE Federation Library catalogue"
    }
  ],
  "11": [
    {
      "url": "https://bibliotheque.apn.dz/index.php?id=97&lvl=etagere_see&nb_per_page_custom=25&nbr_lignes=530&page=14",
      "labelAr": "فهرس المكتبة البرلمانية الجزائرية",
      "labelEn": "Algerian Parliament Library catalogue"
    }
  ],
  "12": [
    {
      "url": "https://fac.umc.edu.dz/droit/bib/pagesbib/livre.php?id_livre=6314",
      "labelAr": "فهرس جامعة قسنطينة",
      "labelEn": "Constantine University catalogue",
      "noteAr": "الفهرس يسجل سنة 2005؛ راجع سنة الطبعة قبل الاستشهاد.",
      "noteEn": "The catalogue records 2005; verify the edition year before citing."
    }
  ],
  "14": [
    {
      "url": "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=209779",
      "labelAr": "فهرس مكتبة اتحاد الإمارات",
      "labelEn": "UAE Federation Library catalogue"
    }
  ],
  "19": [
    {
      "url": "https://ism.biblio.ma/ar/index.php?id=6852&lvl=notice_display",
      "labelAr": "فهرس المعهد العالي للقضاء بالمغرب",
      "labelEn": "Morocco Higher Institute of Judiciary catalogue"
    }
  ],
  "24": [
    {
      "url": "https://books.google.com/books?id=WX3RAAAACAAJ",
      "labelAr": "بيانات Google Books",
      "labelEn": "Google Books record"
    }
  ],
  "25": [
    {
      "url": "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=146197",
      "labelAr": "فهرس مكتبة اتحاد الإمارات",
      "labelEn": "UAE Federation Library catalogue",
      "noteAr": "السجل المتاح يسجل سنة 2001، بينما القائمة الأصلية تذكر 2000.",
      "noteEn": "The catalogue record lists 2001, while the supplied list says 2000."
    }
  ],
  "26": [
    {
      "url": "https://www.iraqnla.gov.iq/opac/fullrecr.php?hl=ara&nid=3697",
      "labelAr": "فهرس دار الكتب والوثائق العراقية",
      "labelEn": "Iraqi National Library and Archives catalogue"
    }
  ],
  "32": [
    {
      "url": "https://cbc.univ-setif2.dz/opac_css/index.php?id=52328&lvl=author_see",
      "labelAr": "فهرس جامعة سطيف",
      "labelEn": "Setif University catalogue"
    }
  ],
  "39": [
    {
      "url": "https://torath.gov.eg/book/Book_Dar-Al-Maaref_mwswEp-AltHkym-AltHkym-fY-AlblAd-AlErbyp-jzC-1_1998?isSmartSearch=false&searchText=%D8%A7%D9%84%D9%85%D8%AD%D8%A7%D9%83%D9%85%D9%87+%D8%A7%D9%84%D8%AA%D8%AD%D9%83%D9%8A%D9%85%D9%8A%D9%87",
      "labelAr": "بطاقة الكتاب على منصة تراث مصر الرقمي",
      "labelEn": "Egypt Digital Heritage record",
      "noteAr": "البطاقة تؤكد بيانات الكتاب، لكن المحتوى الرقمي غير متاح حاليًا على المنصة.",
      "noteEn": "The record confirms the book details, but its digital content is currently unavailable."
    }
  ],
  "48": [
    {
      "url": "https://halabi-lp.com/Arabic/Books/ShowBook.aspx?bookid=767",
      "labelAr": "بيانات الكتاب لدى الحلبي",
      "labelEn": "Al-Halabi book listing"
    }
  ],
  "56": [
    {
      "url": "https://bu.umc.edu.dz/catalogue/index.php?lvl=notice_display&id=8178",
      "labelAr": "فهرس جامعة قسنطينة",
      "labelEn": "Constantine University catalogue"
    },
    {
      "url": "https://books.google.com/books?id=_AXWxgEACAAJ",
      "labelAr": "بيانات Google Books",
      "labelEn": "Google Books record"
    }
  ],
  "57": [
    {
      "url": "https://lib.cihanuniversity.edu.iq/index.php?id=7015&keywords=&p=show_detail",
      "labelAr": "فهرس جامعة جيهان – سجل لطبعة موسعة",
      "labelEn": "Cihan University – related edition record",
      "noteAr": "السجل يصف عنوانًا موسعًا وطبعة 2011؛ تحقق من تطابق الطبعة.",
      "noteEn": "This record is for an expanded title and 2011 edition; verify the edition."
    }
  ],
  "61": [
    {
      "url": "https://sqaps.edu.om/lms/search/standard/results/opac?searchKeyword%5B0%5D=%D9%87%D8%B4%D8%A7%D9%85+%D8%B9%D9%84%D9%8A+%D8%B5%D8%A7%D8%AF%D9%82&searchTarget%5B0%5D=TENxdWM5WCtEdFpnTkNuUlRyS0lZQT09&targetAllBranches=on",
      "labelAr": "فهرس أكاديمية السلطان قابوس لعلوم الشرطة",
      "labelEn": "Sultan Qaboos Academy Library catalogue",
      "noteAr": "السجل يعرض طبعة ثانية سنة 2001، وهو قريب من بيانات المرجع الواردة في القائمة.",
      "noteEn": "This catalogue lists a second edition from 2001, close to the supplied bibliography."
    },
    {
      "url": "https://catalog.aue.ae/cgi-bin/koha/opac-detail.pl?biblionumber=25973",
      "labelAr": "فهرس مكتبة جامعة أبوظبي – طبعة 1995",
      "labelEn": "Abu Dhabi University catalogue – 1995 edition"
    }
  ],
  "62": [
    {
      "url": "https://library.cco.gov.jo/cgi-bin/koha/opac-detail.pl?biblionumber=2085",
      "labelAr": "فهرس مكتبة المحكمة الدستورية الأردنية",
      "labelEn": "Jordan Constitutional Court Library catalogue",
      "noteAr": "السجل يذكر نشر 2010، بينما القائمة المقدمة تذكر 2012. توجد أيضًا نسخة/طبعة مسجلة لدى المحكمة العليا الجزائرية سنة 2005؛ تحقّق من الطبعة قبل الاستشهاد.",
      "noteEn": "The Jordanian catalogue lists 2010, while the supplied list says 2012. The Algerian Supreme Court also lists a 2005 edition; verify the edition before citing."
    },
    {
      "url": "https://coursupreme.dz/book/%D8%A7%D9%84%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A-%D8%A7%D9%84%D8%AE%D8%A7%D8%B5-%D8%AA%D9%86%D8%A7%D8%B2%D8%B9-%D8%A7%D9%84%D9%82%D9%88%D8%A7%D9%86%D9%8A%D9%86/",
      "labelAr": "فهرس المحكمة العليا الجزائرية",
      "labelEn": "Algerian Supreme Court Library catalogue"
    },
    {
      "url": "https://fll.law.cu.edu.eg/cgi-bin/koha/opac-detail.pl?biblionumber=38326",
      "labelAr": "فهرس جامعة القاهرة – طبعة أخرى",
      "labelEn": "Cairo University catalogue – another edition"
    }
  ],
  "64": [
    {
      "url": "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=135907",
      "labelAr": "فهرس مكتبة اتحاد الإمارات",
      "labelEn": "UAE Federation Library catalogue"
    }
  ],
  "65": [
    {
      "url": "https://www.daralnahda.com/book/4072/%D9%85%D8%AF%D9%88%D9%86%D8%A9-%D8%A7%D8%A8%D8%AD%D8%A7%D8%AB-%D9%81%D9%8A-%D8%A7%D9%84%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A-%D8%A7%D9%84%D8%AE%D8%A7%D8%B5",
      "labelAr": "صفحة الكتاب لدى دار النهضة",
      "labelEn": "Dar Al-Nahda publisher page"
    }
  ],
  "66": [
    {
      "url": "https://fll.law.cu.edu.eg/cgi-bin/koha/opac-detail.pl?biblionumber=43321&shelfbrowse_itemnumber=54214",
      "labelAr": "فهرس مكتبة الحقوق – جامعة القاهرة",
      "labelEn": "Cairo University Faculty of Law catalogue"
    }
  ],
  "67": [
    {
      "url": "https://library.ecssr.ae/cgi-bin/koha/opac-detail.pl?biblionumber=133012",
      "labelAr": "فهرس مكتبة اتحاد الإمارات",
      "labelEn": "UAE Federation Library catalogue"
    }
  ]
};

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
            ? "قائمة المراجع الإضافية المتخصصة في التحكيم والقانون الدولي الخاص، مع بيان واضح لحالة روابط النسخ الرقمية."
            : "A specialist bibliography on arbitration and private international law, with a clear indication of verified digital-copy availability."}
        </p>
      </header>

      <form action="/references" method="get" role="search" className="relative mt-6 max-w-xl">
        <label htmlFor="reference-search" className="sr-only">{ar ? "ابحث في قائمة المراجع" : "Search references"}</label>
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
        <input id="reference-search" name="q" defaultValue={q} className="field ps-9" placeholder={ar ? "ابحث باسم المؤلف أو عنوان الكتاب..." : "Search author or book title..."} />
        <button type="submit" className="btn btn-primary btn-sm absolute end-1 top-1/2 -translate-y-1/2">{ar ? "بحث" : "Search"}</button>
      </form>

      <section className="mt-9">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="section-title">{ar ? "أولًا: التحكيم" : "I. Arbitration"}</h2>
          <span className="text-[12px] font-semibold text-[var(--muted)]">{arbitration.length} / {arbitrationReferences.length}</span>
        </div>
        <ol className="grid gap-2">
          {arbitration.map((item) => {
            const number = arbitrationReferences.indexOf(item) + 1;
            const sources = referenceSources[number] ?? [];
            return (
              <li key={item} className="card flex items-start gap-3 p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-[11px] font-extrabold text-[var(--primary)]">{number}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-8 text-[var(--text)]" dir="rtl">{item}</p>
                  {sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sources.map((source) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-[var(--sky-soft)] bg-[var(--sky-soft)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--secondary)] hover:border-[var(--sky)]">
                          {ar ? source.labelAr : source.labelEn}
                        </a>
                      ))}
                    </div>
                  )}
                  {sources.some((source) => ar ? source.noteAr : source.noteEn) && (
                    <p className="mt-2 text-[10.5px] leading-6 text-[var(--muted)]">
                      {sources.filter((source) => ar ? source.noteAr : source.noteEn).map((source) => ar ? source.noteAr : source.noteEn).join(" ")}
                    </p>
                  )}
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
            const number = privateInternationalLawReferences.indexOf(item) + 61;
            const sources = referenceSources[number] ?? [];
            return (
              <li key={item} className="card flex items-start gap-3 p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-[11px] font-extrabold text-[var(--primary)]">{number}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-8 text-[var(--text)]" dir="rtl">{item}</p>
                  {sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sources.map((source) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg border border-[var(--sky-soft)] bg-[var(--sky-soft)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--secondary)] hover:border-[var(--sky)]">
                          {ar ? source.labelAr : source.labelEn}
                        </a>
                      ))}
                    </div>
                  )}
                  {sources.some((source) => ar ? source.noteAr : source.noteEn) && (
                    <p className="mt-2 text-[10.5px] leading-6 text-[var(--muted)]">
                      {sources.filter((source) => ar ? source.noteAr : source.noteEn).map((source) => ar ? source.noteAr : source.noteEn).join(" ")}
                    </p>
                  )}
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
