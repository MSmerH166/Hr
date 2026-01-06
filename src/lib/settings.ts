import { Settings } from "./types";

const SETTINGS_KEY = "hr_calculators_settings";

const defaultSettings: Settings = {
  leaveDaysFirst5Years: 21,
  leaveDaysAfter5Years: 30,
  dailySalaryMethod: "30",
  yearDaysBasis: 365,
  dayCountInclusive: true,
  dayRateDivisor: 30,
  defaultLeaveTripDays: 60,
  graceDays: 0,
  eosFirst5YearsMonthsPerYear: 0.5,
  eosAfter5YearsMonthsPerYear: 1,
  currency: "SAR",
  requireLogin: true,
  accessCode: "",
  loginUsername: "admin",
  loginPassword: "123456",
  userRole: "مشرف",
};

export function getSettings(): Settings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }

  return defaultSettings;
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

export function resetSettings(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error("Error resetting settings:", error);
  }
}

