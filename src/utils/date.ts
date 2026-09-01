export const formatDateForDisplay = (
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
) => {
  if (!dateStr) return "";
  let d: Date;
  if (dateStr.includes("T")) {
    d = new Date(dateStr);
  } else {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed month
      const day = parseInt(parts[2], 10);
      d = new Date(year, month, day);
    } else {
      d = new Date(dateStr);
    }
  }
  return d.toLocaleDateString("pt-BR", options);
};

export const formatDateBR = (date: Date | string | number | undefined): string => {
  if (!date) return "";
  const d = typeof date === "object" ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
};
