export interface Zone {
  id: number;
  name: string;
  district: string;
  lat: number;
  lon: number;
  historical_count?: number;
  score: number;
  level: string;
  icon?: string;
  rainfall: number;
  moisture: number;
  slope: number;
  elevation: number;
  updated?: string;
}

export interface AlertItem {
  zone: string;
  score: number;
  level: string;
  time: string;
  sms: {
    en: string;
    as: string;
    hi: string;
  };
}

export interface FieldReport {
  id: number;
  type: string;
  loc: string;
  time: string;
  icon: string;
  reporter?: string;
  notes?: string;
  photo_url?: string;
}

export interface Road {
  name: string;
  status: "BLOCKED" | "RISK" | "CLEAR";
  lat: number;
  lon: number;
}

export type Lang = "en" | "as" | "hi";
