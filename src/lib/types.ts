export interface Settings {
  leaveDaysFirst5Years: number;
  leaveDaysAfter5Years: number;
  dailySalaryMethod: "30" | "26" | "365-12";
  yearDaysBasis: number;
  dayCountInclusive: boolean;
  dayRateDivisor?: number;
  defaultLeaveTripDays?: number;
  graceDays?: number;
  eosFirst5YearsMonthsPerYear: number;
  eosAfter5YearsMonthsPerYear: number;
  currency?: string;
  requireLogin?: boolean;
  accessCode?: string;
  loginUsername?: string;
  loginPassword?: string;
  userRole?: string;
}

export interface EndOfServiceInput {
  startDate: string;
  endDate: string;
  monthlyBasicSalary: number;
}

export interface EndOfServiceResult {
  totalServiceYears: number;
  totalServiceDays: number;
  first5YearsMonths: number;
  after5YearsMonths: number;
  totalMonthsEntitled: number;
  finalAmount: number;
  breakdown: {
    first5Years: {
      years: number;
      months: number;
      amount: number;
    };
    after5Years: {
      years: number;
      months: number;
      amount: number;
    };
  };
}

export interface LeaveAccrualInput {
  startDate: string;
  calculationDate: string;
  usedLeaveDays: number;
}

export interface LeaveAccrualResult {
  totalServiceYears: number;
  totalServiceDays: number;
  accruedDays: number;
  usedDays: number;
  remainingDays: number;
  breakdown: {
    first5Years: {
      years: number;
      days: number;
      accrued: number;
    };
    after5Years: {
      years: number;
      days: number;
      accrued: number;
    };
  };
}

export interface LeaveEncashmentInput {
  remainingLeaveDays: number;
  monthlySalary: number;
}

export interface LeaveEncashmentResult {
  remainingDays: number;
  dailySalary: number;
  totalAmount: number;
}

export interface LeaveAccrualCalcResult {
  accrualStart: string;
  expectedReturn: string;
  fiveYearsDate: string;
  totalDays: number;
  tier1Days: number;
  tier2Days: number;
  earnedDaysTier1: number;
  earnedDaysTier2: number;
  paidLeaveDays: number;
  deductedDays: number;
  netEarnedDays: number;
  dayValue: number;
  leaveAmount: number;
}

export interface EOSCalcResult {
  fiveYearsDate: string;
  totalDays: number;
  first5Days: number;
  after5Days: number;
  first5Years: number;
  after5Years: number;
  eosAmount: number;
}

export interface SettlementTotals {
  totalEarnings: number;
  totalDeductions: number;
  netPayable: number;
}

export interface SettlementCalcResult {
  accrualStart: string;
  expectedReturn: string;
  fiveYearsDate: string;
  leave: LeaveAccrualCalcResult;
  eos: EOSCalcResult;
  totals: SettlementTotals;
}

export interface ServiceDuration {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export interface EndOfServiceSegment {
  days: number;
  duration: ServiceDuration;
  monthsEntitled: number;
  amount: number;
}

export interface EndOfServiceBreakdown extends EndOfServiceResult {
  first5: EndOfServiceSegment;
  after5: EndOfServiceSegment;
  paidDays: number;
  netDays: number;
  netAmount: number;
  daysEntitledTotal: number;
}

