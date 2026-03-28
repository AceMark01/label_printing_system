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
  transporter?: string;
  godown?: string;
  originalData?: Record<string, any>;
}

export type Language = 'en' | 'hi' | 'od';
export type LanguageKey = Language;

export interface FilterState {
  cities: string[];
  parties: string[];
  items: string[];
  transporters: string[];
  q: string;
  includeProcessed: boolean;
}

export type DataItem = Label;

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
