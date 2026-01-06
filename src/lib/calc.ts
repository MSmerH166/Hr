import {
  EndOfServiceInput,
  EndOfServiceResult,
  LeaveAccrualInput,
  LeaveAccrualResult,
  LeaveEncashmentInput,
  LeaveEncashmentResult,
  ServiceDuration,
  Settings,
  EndOfServiceBreakdown,
  LeaveAccrualCalcResult,
  EOSCalcResult,
  SettlementCalcResult,
} from "./types";
import { getSettings } from "./settings";

const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (num: number, min = 0) => (Number.isFinite(num) ? Math.max(min, num) : min);

const toISO = (d: Date) => d.toISOString().split("T")[0];

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function addYears(date: string, years: number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  d.setFullYear(d.getFullYear() + years);
  return toISO(d);
}

/**
 * Inclusive diff: (end - start) + 1; clamps at 0.
 */
function diffDaysInclusive(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const raw = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  return clamp(raw, 0);
}

/**
 * Calculate the difference in days between two dates
 * If inclusive is true, add 1 day to match some Excel behaviors.
 */
function getDaysDifference(
  startDate: string,
  endDate: string,
  inclusive = false
): number {
  if (inclusive) return diffDaysInclusive(startDate, endDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const base = Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_MS));
  return base;
}

/**
 * Calculate years and remaining days from total days
 */
function calculateYearsAndDays(totalDays: number): {
  years: number;
  remainingDays: number;
} {
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  return { years, remainingDays };
}

/**
 * Calculate service duration between two dates in years, months, and days.
 * Months are approximated as 30 days for a clear breakdown.
 */
export function calculateServiceDuration(
  startDate: string,
  endDate: string
): ServiceDuration {
  const settings = getSettings();
  const totalDays = getDaysDifference(
    startDate,
    endDate,
    settings.dayCountInclusive
  );

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { years: 0, months: 0, days: 0, totalDays: 0 };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // Adjust days using real month lengths (DATEDIF-style)
  if (days < 0) {
    const prevMonthDays = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthDays;
    months -= 1;
  }

  // Adjust months if negative
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays,
  };
}

/**
 * Split a period into first 5 years vs after 5 years using real calendar boundary.
 * Returns inclusive days for each segment.
 */
function splitDaysByFiveYears(params: {
  hireDate: string;
  startDate: string;
  endDate: string;
  fiveYearsDate?: string;
}): { first5Days: number; after5Days: number } {
  const { hireDate, startDate, endDate } = params;
  const boundary = params.fiveYearsDate ?? addYears(hireDate, 5);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const boundaryDate = new Date(boundary);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { first5Days: 0, after5Days: 0 };
  }

  // Segment 1: from start to min(end, boundary)
  const seg1End = end <= boundaryDate ? end : boundaryDate;
  const first5Days =
    seg1End >= start ? diffDaysInclusive(toISO(start), toISO(seg1End)) : 0;

  // Segment 2: from boundary+1 to end
  const seg2StartISO = addDays(toISO(boundaryDate), 1);
  const seg2Start = new Date(seg2StartISO);
  const after5Days =
    end >= seg2Start ? diffDaysInclusive(seg2StartISO, toISO(end)) : 0;

  return { first5Days, after5Days };
}

/**
 * Detailed End of Service breakdown with 5-year split.
 */
export function calculateEndOfServiceBreakdown(
  input: EndOfServiceInput,
  opts?: { paidDays?: number }
): EndOfServiceBreakdown {
  const settings = getSettings();
  const paidDays = opts?.paidDays ?? 0;
  const inclusive = settings.dayCountInclusive;
  const basis = settings.yearDaysBasis ?? 365;
  const firstRate = settings.eosFirst5YearsMonthsPerYear;
  const afterRate = settings.eosAfter5YearsMonthsPerYear;

    const fiveYearsDate = addYears(input.startDate, 5);
  const { first5Days, after5Days } = splitDaysByFiveYears({
    hireDate: input.startDate,
    startDate: input.startDate,
    endDate: input.endDate,
    fiveYearsDate,
  });

  const totalDays = first5Days + after5Days;

  const first5Duration = calculateServiceDuration(input.startDate, fiveYearsDate);
  const afterStart = addDays(fiveYearsDate, 1);
  const after5Duration =
    after5Days > 0
      ? calculateServiceDuration(afterStart, input.endDate)
      : { years: 0, months: 0, days: 0, totalDays: 0 };

  const first5MonthsEntitled = (first5Days / basis) * firstRate;
  const after5MonthsEntitled = (after5Days / basis) * afterRate;

  const first5Amount = first5MonthsEntitled * input.monthlyBasicSalary;
  const after5Amount = after5MonthsEntitled * input.monthlyBasicSalary;

  const totalMonthsEntitled = first5MonthsEntitled + after5MonthsEntitled;
  const finalAmount = first5Amount + after5Amount;

  // Convert months entitlement to days approximation for paid/unpaid split
  const daysEntitledTotal = totalMonthsEntitled * 30;
  const netDays = Math.max(0, daysEntitledTotal - paidDays);
  const netAmount = (netDays / 30) * input.monthlyBasicSalary;

  return {
    totalServiceYears: totalDays / basis,
    totalServiceDays: totalDays,
    first5YearsMonths: first5MonthsEntitled,
    after5YearsMonths: after5MonthsEntitled,
    totalMonthsEntitled,
    finalAmount,
    breakdown: {
      first5Years: {
        years: Math.floor(first5Days / basis),
        months: first5MonthsEntitled,
        amount: first5Amount,
      },
      after5Years: {
        years: Math.floor(after5Days / basis),
        months: after5MonthsEntitled,
        amount: after5Amount,
      },
    },
    first5: {
      days: first5Days,
      duration: first5Duration,
      monthsEntitled: first5MonthsEntitled,
      amount: first5Amount,
    },
    after5: {
      days: after5Days,
      duration: after5Duration,
      monthsEntitled: after5MonthsEntitled,
      amount: after5Amount,
    },
    paidDays,
    netDays,
    netAmount,
    daysEntitledTotal,
  };
}

/**
 * Get leave days per year based on total service years and settings.
 */
export function getLeaveDaysPerYear(
  totalServiceYears: number,
  settings?: Settings
): number {
  const cfg = settings ?? getSettings();
  return totalServiceYears >= 5
    ? cfg.leaveDaysAfter5Years
    : cfg.leaveDaysFirst5Years;
}

/**
 * Calculate daily salary and leave encashment amount.
 */
export function calculateLeaveEncashmentAmount(params: {
  monthlyBasicSalary: number;
  leaveDays: number;
  dailySalaryMethod?: "30" | "26" | "365-12";
}): { dailySalary: number; totalAmount: number } {
  const divisor =
    params.dailySalaryMethod === "26"
      ? 26
      : params.dailySalaryMethod === "365-12"
      ? 365 / 12
      : 30;
  const dailySalary = params.monthlyBasicSalary / divisor;
  const totalAmount = params.leaveDays * dailySalary;
  return { dailySalary, totalAmount };
}

/**
 * Leave accrual core calculation (inclusive days, auto accrual start, expected return).
 */
export function calcLeaveAccrual(params: {
  hireDate: string;
  travelDate: string;
  salaryBase: number;
  paidLeaveDays?: number;
  deductedDays?: number;
  lastSettlementTravelDate?: string;
  accrualStartOverride?: string;
}): LeaveAccrualCalcResult {
  const settings = getSettings();
  const basis = settings.yearDaysBasis ?? 365;
  const dayRateDivisor = settings.dayRateDivisor ?? 30;

  const accrualStart = params.accrualStartOverride
    ? params.accrualStartOverride
    : params.lastSettlementTravelDate
    ? addDays(params.lastSettlementTravelDate, 1)
    : params.hireDate;

  const expectedReturn = addDays(
    params.travelDate,
    settings.defaultLeaveTripDays ?? 60
  );

  const fiveYearsDate = addYears(params.hireDate, 5);

  // Guard invalid or reversed dates
  if (new Date(params.travelDate) < new Date(params.hireDate)) {
    return {
      accrualStart,
      expectedReturn,
      fiveYearsDate,
      totalDays: 0,
      tier1Days: 0,
      tier2Days: 0,
      earnedDaysTier1: 0,
      earnedDaysTier2: 0,
      paidLeaveDays: params.paidLeaveDays ?? 0,
      deductedDays: params.deductedDays ?? 0,
      netEarnedDays: 0,
      dayValue: params.salaryBase / dayRateDivisor,
      leaveAmount: 0,
    };
  }

  // If accrual start is after travel date, no accrual
  if (new Date(accrualStart) > new Date(params.travelDate)) {
    return {
      accrualStart,
      expectedReturn,
      fiveYearsDate,
      totalDays: 0,
      tier1Days: 0,
      tier2Days: 0,
      earnedDaysTier1: 0,
      earnedDaysTier2: 0,
      paidLeaveDays: params.paidLeaveDays ?? 0,
      deductedDays: params.deductedDays ?? 0,
      netEarnedDays: 0,
      dayValue: params.salaryBase / dayRateDivisor,
      leaveAmount: 0,
    };
  }

  const { first5Days: tier1Days, after5Days: tier2Days } = splitDaysByFiveYears({
    hireDate: params.hireDate,
    startDate: accrualStart,
    endDate: params.travelDate,
    fiveYearsDate,
  });

  const totalDays = tier1Days + tier2Days;

  const earnedDaysTier1 =
    (tier1Days * (settings.leaveDaysFirst5Years ?? 21)) / basis;
  const earnedDaysTier2 =
    (tier2Days * (settings.leaveDaysAfter5Years ?? 30)) / basis;

  const paid = params.paidLeaveDays ?? 0;
  const deducted = params.deductedDays ?? 0;

  const netEarnedDays = clamp(
    earnedDaysTier1 + earnedDaysTier2 - paid - deducted,
    0
  );

  const dayValue = params.salaryBase / dayRateDivisor;
  const leaveAmount = netEarnedDays * dayValue;

  return {
    accrualStart,
    expectedReturn,
    fiveYearsDate,
    totalDays,
    tier1Days,
    tier2Days,
    earnedDaysTier1,
    earnedDaysTier2,
    paidLeaveDays: paid,
    deductedDays: deducted,
    netEarnedDays,
    dayValue,
    leaveAmount,
  };
}

/**
 * End of Service calculation with 5-year split (inclusive days).
 */
export function calcEOS(params: {
  hireDate: string;
  travelDate: string;
  salaryBase: number;
}): EOSCalcResult {
  const settings = getSettings();
  const basis = settings.yearDaysBasis ?? 365;
  const fiveYearsDate = addYears(params.hireDate, 5);

  if (new Date(params.travelDate) < new Date(params.hireDate)) {
    return {
      fiveYearsDate,
      totalDays: 0,
      first5Days: 0,
      after5Days: 0,
      first5Years: 0,
      after5Years: 0,
      eosAmount: 0,
    };
  }

  const { first5Days, after5Days } = splitDaysByFiveYears({
    hireDate: params.hireDate,
    startDate: params.hireDate,
    endDate: params.travelDate,
    fiveYearsDate,
  });

  const totalDays = first5Days + after5Days;
  const first5Years = first5Days / basis;
  const after5Years = after5Days / basis;

  const firstFactor = settings.eosFirst5YearsMonthsPerYear ?? 0.5;
  const afterFactor = settings.eosAfter5YearsMonthsPerYear ?? 1;

  const eosAmount =
    params.salaryBase * (first5Years * firstFactor + after5Years * afterFactor);

  return {
    fiveYearsDate,
    totalDays,
    first5Days,
    after5Days,
    first5Years,
    after5Years,
    eosAmount,
  };
}

/**
 * Settlement aggregate: combines leave + EOS + extras.
 */
export function calcSettlement(params: {
  hireDate: string;
  travelDate: string;
  salaryBase: number;
  paidLeaveDays?: number;
  deductedDays?: number;
  lastSettlementTravelDate?: string;
  lastReturnDate?: string;
  extraEarnings?: { label: string; amount: number }[];
  extraDeductions?: { label: string; amount: number }[];
}): SettlementCalcResult {
  const extraEarningsTotal = (params.extraEarnings ?? []).reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0
  );
  const extraDeductionsTotal = (params.extraDeductions ?? []).reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0
  );

  const leave = calcLeaveAccrual({
    hireDate: params.hireDate,
    travelDate: params.travelDate,
    salaryBase: params.salaryBase,
    paidLeaveDays: params.paidLeaveDays,
    deductedDays: params.deductedDays,
    lastSettlementTravelDate: params.lastSettlementTravelDate,
    accrualStartOverride: params.lastReturnDate || undefined,
  });

  const eos = calcEOS({
    hireDate: params.hireDate,
    travelDate: params.travelDate,
    salaryBase: params.salaryBase,
  });

  const totalEarnings = leave.leaveAmount + eos.eosAmount + extraEarningsTotal;
  const totalDeductions = extraDeductionsTotal;
  const netPayable = totalEarnings - totalDeductions;

  return {
    accrualStart: leave.accrualStart,
    expectedReturn: leave.expectedReturn,
    fiveYearsDate: leave.fiveYearsDate,
    leave,
    eos,
    totals: {
      totalEarnings,
      totalDeductions,
      netPayable,
    },
  };
}

/**
 * Format currency with thousands separators (Arabic locale).
 */
export function formatCurrency(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value || 0);
}

/**
 * End of Service Calculation
 * - 0.5 month salary for each of the first 5 years
 * - 1 full month salary for each year after 5 years
 * - Partial years calculated proportionally by days / 365
 */
export function calculateEndOfService(
  input: EndOfServiceInput
): EndOfServiceResult {
  const settings = getSettings();
  const basis = settings.yearDaysBasis ?? 365;
  const fiveYearsDate = addYears(input.startDate, 5);

  const { first5Days, after5Days } = splitDaysByFiveYears({
    hireDate: input.startDate,
    startDate: input.startDate,
    endDate: input.endDate,
    fiveYearsDate,
  });

  const totalDays = first5Days + after5Days;
  const { years, remainingDays } = calculateYearsAndDays(totalDays);
  const totalServiceYears = years + remainingDays / basis;

  const first5YearsProportional = first5Days / basis;
  const first5YearsMonths =
    first5YearsProportional * settings.eosFirst5YearsMonthsPerYear;
  const first5YearsAmount = first5YearsMonths * input.monthlyBasicSalary;
  const first5Years = Math.floor(first5Days / basis);

  const after5YearsProportional = after5Days / basis;
  const after5YearsMonths =
    after5YearsProportional * settings.eosAfter5YearsMonthsPerYear;
  const after5YearsAmount = after5YearsMonths * input.monthlyBasicSalary;
  const after5Years = Math.floor(after5Days / basis);

  const totalMonthsEntitled = first5YearsMonths + after5YearsMonths;
  const finalAmount = first5YearsAmount + after5YearsAmount;

  return {
    totalServiceYears,
    totalServiceDays: totalDays,
    first5YearsMonths,
    after5YearsMonths,
    totalMonthsEntitled,
    finalAmount,
    breakdown: {
      first5Years: {
        years: first5Years,
        months: first5YearsMonths,
        amount: first5YearsAmount,
      },
      after5Years: {
        years: after5Years,
        months: after5YearsMonths,
        amount: after5YearsAmount,
      },
    },
  };
}

/**
 * Leave Accrual Calculation
 * - First 5 years: configurable days per year (default 21)
 * - After 5 years: configurable days per year (default 30)
 * - Accrual is proportional by days worked
 */
export function calculateLeaveAccrual(
  input: LeaveAccrualInput
): LeaveAccrualResult {
  const settings = getSettings();
  const basis = settings.yearDaysBasis ?? 365;
  const totalDays = getDaysDifference(
    input.startDate,
    input.calculationDate,
    settings.dayCountInclusive
  );
  const { years, remainingDays } = calculateYearsAndDays(totalDays);

  // Calculate first 5 years accrual
  const first5YearsTotalDays = Math.min(totalDays, 5 * basis);
  const first5YearsProportional = first5YearsTotalDays / basis;
  const first5YearsAccrued =
    first5YearsProportional * settings.leaveDaysFirst5Years;
  const first5Years = Math.floor(first5YearsTotalDays / basis);

  // Calculate after 5 years accrual
  const after5YearsTotalDays = Math.max(0, totalDays - 5 * basis);
  const after5YearsProportional = after5YearsTotalDays / basis;
  const after5YearsAccrued =
    after5YearsProportional * settings.leaveDaysAfter5Years;
  const after5Years = Math.floor(after5YearsTotalDays / basis);

  const totalAccrued = first5YearsAccrued + after5YearsAccrued;
  const remainingLeaveDays = totalAccrued - input.usedLeaveDays;

  return {
    totalServiceYears: years + remainingDays / basis,
    totalServiceDays: totalDays,
    accruedDays: totalAccrued,
    usedDays: input.usedLeaveDays,
    remainingDays: Math.max(0, remainingLeaveDays),
    breakdown: {
      first5Years: {
        years: first5Years,
        days: first5YearsTotalDays,
        accrued: first5YearsAccrued,
      },
      after5Years: {
        years: after5Years,
        days: after5YearsTotalDays,
        accrued: after5YearsAccrued,
      },
    },
  };
}

/**
 * Leave Encashment Calculation
 * - Remaining leave days × daily salary
 * - Daily salary method is configurable (monthly / 30 or monthly / 26)
 */
export function calculateLeaveEncashment(
  input: LeaveEncashmentInput
): LeaveEncashmentResult {
  const settings = getSettings();
  const divisor =
    settings.dailySalaryMethod === "26"
      ? 26
      : settings.dailySalaryMethod === "365-12"
      ? 365 / 12
      : 30;
  const dailySalary = input.monthlySalary / divisor;
  const totalAmount = input.remainingLeaveDays * dailySalary;

  return {
    remainingDays: input.remainingLeaveDays,
    dailySalary,
    totalAmount,
  };
}

