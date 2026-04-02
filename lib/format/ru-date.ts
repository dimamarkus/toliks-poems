import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function formatRuDate(isoDate: string | undefined | null): string | undefined {
  if (!isoDate) return undefined;
  try {
    return format(parseISO(isoDate), "d MMMM yyyy", { locale: ru });
  } catch {
    return isoDate ?? undefined;
  }
}


