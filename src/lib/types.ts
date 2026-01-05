export interface Settings {
  leaveDaysFirst5Years: number;
  leaveDaysAfter5Years: number;
  dailySalaryMethod: "30" | "26";
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

