export interface LabelNames {
  [key: string]: string;
}

export interface Label {
  id: string;
  city: string;
  party: string;
  partyNames?: LabelNames;
  item: string;
  itemNames?: LabelNames;
  cityNames?: LabelNames;
  quantity: number;
  remark?: string;
  bdlQty?: string | number;
  date?: string;
  originalData?: Record<string, any>;
}

export type Language = 'en' | 'hi' | 'od';
export type LanguageKey = Language;

export interface LabelTranslations {
  party: string;
  item: string;
  qty: string;
}

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}
