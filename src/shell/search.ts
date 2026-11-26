// Search text folding: lower case, no diacritics (ł has no decomposition, so it is mapped by hand).
export const fold = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");
