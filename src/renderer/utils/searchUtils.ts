export const normalizeText = (text: string): string => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export const fuzzySearch = (source: string, query: string): boolean => {
  if (!query) return true;
  if (!source) return false;
  return normalizeText(source).includes(normalizeText(query));
};
