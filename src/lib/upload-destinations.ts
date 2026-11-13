export const UPLOAD_DESTINATIONS = [
  { value: "case", labelAr: "القضية", labelEn: "Case file", sectionSlug: "case", tags: "__upload_case" },
  { value: "laws", labelAr: "القوانين", labelEn: "Laws", sectionSlug: "laws", tags: "__upload_laws" },
  { value: "references", labelAr: "المراجع", labelEn: "References", sectionSlug: "books", tags: "__upload_references مرجع reference" },
  { value: "books", labelAr: "الكتب", labelEn: "Books", sectionSlug: "books", tags: "__upload_books" },
  { value: "memoranda", labelAr: "أفضل المذكرات", labelEn: "Best memoranda", sectionSlug: "books", tags: "__upload_memoranda مذكرة مذكرات memorial memorandum" },
] as const;

export type UploadDestination = (typeof UPLOAD_DESTINATIONS)[number]["value"];

export function uploadDestination(value: string) {
  return UPLOAD_DESTINATIONS.find((destination) => destination.value === value) ?? null;
}
