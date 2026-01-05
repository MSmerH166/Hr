import {
  EndOfServiceInput,
  EndOfServiceResult,
  LeaveAccrualInput,
  LeaveAccrualResult,
  LeaveEncashmentInput,
  LeaveEncashmentResult,
  Settings,
} from "./types";
import { getSettings } from "./settings";

/**
 * Calculate the difference in days between two dates
 */
function getDaysDifference(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
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
 * End of Service Calculation
 * - 0.5 month salary for each of the first 5 years
 * - 1 full month salary for each year after 5 years
 * - Partial years calculated proportionally by days / 365
 */
export function calculateEndOfService(
  input: EndOfServiceInput
): EndOfServiceResult {
  const totalDays = getDaysDifference(input.startDate, input.endDate);
  const { years, remainingDays } = calculateYearsAndDays(totalDays);
  const totalServiceYears = years + remainingDays / 365;

  // Calculate first 5 years (0.5 month per year)
  // If total service <= 5 years, all goes to first 5 years
  const first5YearsTotalDays = Math.min(totalDays, 5 * 365);
  const first5YearsProportional = first5YearsTotalDays / 365;
  const first5YearsMonths = first5YearsProportional * 0.5;
  const first5YearsAmount = first5YearsMonths * input.monthlyBasicSalary;
  const first5Years = Math.floor(first5YearsTotalDays / 365);

  // Calculate after 5 years (1 month per year)
  // Only count days beyond 5 years
  const after5YearsTotalDays = Math.max(0, totalDays - 5 * 365);
  const after5YearsProportional = after5YearsTotalDays / 365;
  const after5YearsMonths = after5YearsProportional * 1;
  const after5YearsAmount = after5YearsMonths * input.monthlyBasicSalary;
  const after5Years = Math.floor(after5YearsTotalDays / 365);

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
  const totalDays = getDaysDifference(input.startDate, input.calculationDate);
  const { years, remainingDays } = calculateYearsAndDays(totalDays);

  // Calculate first 5 years accrual
  const first5YearsTotalDays = Math.min(totalDays, 5 * 365);
  const first5YearsProportional = first5YearsTotalDays / 365;
  const first5YearsAccrued =
    first5YearsProportional * settings.leaveDaysFirst5Years;
  const first5Years = Math.floor(first5YearsTotalDays / 365);

  // Calculate after 5 years accrual
  const after5YearsTotalDays = Math.max(0, totalDays - 5 * 365);
  const after5YearsProportional = after5YearsTotalDays / 365;
  const after5YearsAccrued =
    after5YearsProportional * settings.leaveDaysAfter5Years;
  const after5Years = Math.floor(after5YearsTotalDays / 365);

  const totalAccrued = first5YearsAccrued + after5YearsAccrued;
  const remainingLeaveDays = totalAccrued - input.usedLeaveDays;

  return {
    totalServiceYears: years + remainingDays / 365,
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
  const divisor = settings.dailySalaryMethod === "30" ? 30 : 26;
  const dailySalary = input.monthlySalary / divisor;
  const totalAmount = input.remainingLeaveDays * dailySalary;

  return {
    remainingDays: input.remainingLeaveDays,
    dailySalary,
    totalAmount,
  };
}

