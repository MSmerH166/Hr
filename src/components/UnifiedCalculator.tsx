"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import {
  calculateServiceDuration,
  calcSettlement,
} from "@/lib/calc";
import { LeaveEncashmentInput } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { appendRecord, loadRecords } from "@/lib/records";
import { AuthGuard } from "@/components/AuthGuard";

export default function UnifiedCalculator() {
  const [settlementType, setSettlementType] = useState<"leave" | "eos">("leave");

  const [employeeInfo, setEmployeeInfo] = useState({
    name: "",
    employeeId: "",
    jobTitle: "",
    workLocation: "",
    nationality: "",
  });

  const [contractInfo, setContractInfo] = useState({
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    foodAllowance: 0,
    otherAllowances: 0,
    leaveDaysFirst5Years: 21,
    leaveDaysAfter5Years: 30,
  });

  const [dates, setDates] = useState({
    hireDate: "",
    travelDate: "",
    lastReturnDate: "",
    expectedReturnDate: "",
  });

  const [encashmentInput, setEncashmentInput] =
    useState<LeaveEncashmentInput>({
      remainingLeaveDays: 0,
      monthlySalary: 0,
    });

  const [earnings, setEarnings] = useState({
    ticketAllowance: 0,
    monthLabel1: "راتب شهر",
    monthAmount1: 0,
    monthLabel2: "راتب شهر آخر",
    monthAmount2: 0,
  });

  const [deductions, setDeductions] = useState({
    advance: 0,
    equipmentSettlement: 0,
    extraAccommodation: 0,
    extraVisa: 0,
  });

  // آخر تسوية (نستخدم actionDate كسقف للسفر السابق)
  const lastSettlementTravelDate = useMemo(() => {
    if (!employeeInfo.employeeId) return undefined;
    const records = loadRecords().filter(
      (r) => r.employeeId === employeeInfo.employeeId
    );
    if (!records.length) return undefined;
    // الأحدث حسب التاريخ
    const sorted = [...records].sort((a, b) =>
      (b.actionDate || "").localeCompare(a.actionDate || "")
    );
    return sorted[0]?.actionDate;
  }, [employeeInfo.employeeId]);
  const [paidLeaveDays, setPaidLeaveDays] = useState(0);
  const [deductedDays, setDeductedDays] = useState(0);

  const settings = getSettings();
  const router = useRouter();

  const totalSalary = useMemo(
    () =>
      contractInfo.basicSalary +
      contractInfo.housingAllowance +
      contractInfo.transportAllowance +
      contractInfo.foodAllowance +
      contractInfo.otherAllowances,
    [contractInfo]
  );

  const formatNumber = (num: number, fractionDigits = 2) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(num);
  };

  const serviceTotals =
    dates.hireDate && dates.travelDate
      ? calculateServiceDuration(dates.hireDate, dates.travelDate)
      : null;

  const sinceLastLeave =
    dates.travelDate && (dates.lastReturnDate || dates.hireDate)
      ? calculateServiceDuration(
          dates.lastReturnDate || dates.hireDate,
          dates.travelDate
        )
      : null;

  // استخدم الراتب الأساسي فقط لحساب الإجازة/نهاية الخدمة ما لم يحدد المستخدم بديل
  const salaryBaseForCalc =
    encashmentInput.monthlySalary > 0
      ? encashmentInput.monthlySalary
      : contractInfo.basicSalary || 0;

  const settlementCalc = calcSettlement({
    hireDate: dates.hireDate,
    travelDate: dates.travelDate,
    salaryBase: salaryBaseForCalc,
    paidLeaveDays,
    deductedDays,
    lastSettlementTravelDate: lastSettlementTravelDate,
    lastReturnDate: dates.lastReturnDate,
    extraEarnings: [
      { label: "بدل تذكرة سفر", amount: earnings.ticketAllowance || 0 },
      { label: earnings.monthLabel1, amount: earnings.monthAmount1 || 0 },
      { label: earnings.monthLabel2, amount: earnings.monthAmount2 || 0 },
    ],
    extraDeductions: [
      { label: "سلفة", amount: deductions.advance || 0 },
      { label: "تسوية عهدة/معدات", amount: deductions.equipmentSettlement || 0 },
      { label: "سكن إضافي", amount: deductions.extraAccommodation || 0 },
      { label: "تأشيرة/إقامة إضافية", amount: deductions.extraVisa || 0 },
    ],
  });

  const dailySalary = settlementCalc.leave.dayValue;
  const leaveEncashAmount = settlementCalc.leave.leaveAmount;
  const eosAmount = settlementCalc.eos.eosAmount;
  const eosBasis = settings.yearDaysBasis ?? 365;
  const eosFactorFirst = settings.eosFirst5YearsMonthsPerYear ?? 0.5;
  const eosFactorAfter = settings.eosAfter5YearsMonthsPerYear ?? 1;
  const eosAmountFirst =
    (settlementCalc.eos.first5Days / eosBasis) * eosFactorFirst * salaryBaseForCalc;
  const eosAmountAfter =
    (settlementCalc.eos.after5Days / eosBasis) * eosFactorAfter * salaryBaseForCalc;
  const workDays =
    (settlementCalc.leave.tier1Days || 0) + (settlementCalc.leave.tier2Days || 0);
  const grossEligibleDays =
    (settlementCalc.leave.earnedDaysTier1 || 0) +
    (settlementCalc.leave.earnedDaysTier2 || 0);
  const netEligibleDays = settlementCalc.leave.netEarnedDays || 0;
  const eosFirstSegmentEnd =
    dates.hireDate && dates.travelDate
      ? new Date(dates.travelDate) < new Date(settlementCalc.eos.fiveYearsDate)
        ? dates.travelDate
        : settlementCalc.eos.fiveYearsDate
      : "";
  const eosDurationFirst =
    dates.hireDate && eosFirstSegmentEnd
      ? calculateServiceDuration(dates.hireDate, eosFirstSegmentEnd)
      : null;
  const eosDurationAfter =
    dates.travelDate &&
    new Date(dates.travelDate) > new Date(settlementCalc.eos.fiveYearsDate)
      ? calculateServiceDuration(settlementCalc.eos.fiveYearsDate, dates.travelDate)
      : null;

  const extraEarningsTotal =
    (earnings.ticketAllowance || 0) +
    (earnings.monthAmount1 || 0) +
    (earnings.monthAmount2 || 0);
  const extraDeductionsTotal =
    (deductions.advance || 0) +
    (deductions.equipmentSettlement || 0) +
    (deductions.extraAccommodation || 0) +
    (deductions.extraVisa || 0);

  const primaryEarning =
    settlementType === "leave" ? leaveEncashAmount : eosAmount;
  const totalEarnings = primaryEarning + extraEarningsTotal;
  const totalDeductions = extraDeductionsTotal;
  const netPay = totalEarnings - totalDeductions;

  const saveToRecords = () => {
    if (
      !employeeInfo.name ||
      !employeeInfo.employeeId ||
      !dates.hireDate ||
      !dates.travelDate ||
      !contractInfo.basicSalary
    ) {
      alert("يرجى تعبئة الحقول المطلوبة: الاسم، الرقم الوظيفي، تاريخ التعيين، تاريخ السفر، الراتب الأساسي.");
      return;
    }

    const { newRecord } = appendRecord({
      actionType: settlementType === "leave" ? "صرف إجازة" : "نهاية خدمة",
      name: employeeInfo.name,
      employeeId: employeeInfo.employeeId,
      project: employeeInfo.workLocation,
      nationality: employeeInfo.nationality,
      role: employeeInfo.jobTitle,
      amount: netPay,
      actionDate: dates.travelDate || new Date().toISOString().split("T")[0],
      notes: settlementType === "leave" ? "صرف مستحقات الإجازة" : "مستحقات نهاية خدمة",
    });

    // الانتقال مباشرة لصفحة السجل مع التركيز على التسوية المحفوظة
    const params = new URLSearchParams({ focus: newRecord.id });
    window.location.href = `/records?${params.toString()}`;
  };

  // Placeholder for future DB save
  const saveToDatabase = () => {
    alert("حفظ قاعدة البيانات يتطلب ربط خارجي (غير متاح في النسخة الحالية).");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hr_login_user");
    }
    router.replace("/login");
  };

  // اختصارات لوحة المفاتيح: Ctrl+S للحفظ، Ctrl+A للانتقال للسجلات
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveToRecords();
      }
      if (e.ctrlKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        window.location.href = "/records";
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    saveToRecords,
  ]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-3">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="mb-4 flex flex-col items-center text-center space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-wide">
              صرف مستحقات الإجازة
            </h1>
            <p className="text-lg font-semibold text-sky-700">
              شركة بنيان الإنشائية للمقاولات
            </p>
            <div className="flex gap-2">
              <Link
                href="/records"
                className="px-5 py-2.5 text-sm font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition"
              >
                سجل التسويات
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 text-sm font-semibold rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>

          {/* شريط معلومات سريع */}
          <Card className="bg-white/90 border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <p className="text-xs text-slate-500">اسم الموظف</p>
                <p className="text-sm font-semibold text-slate-900">
                  {employeeInfo.name || "—"}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                <p className="text-xs text-blue-600">تاريخ التعيين</p>
                <p className="text-sm font-semibold text-slate-900">
                  {dates.hireDate || "—"}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                <p className="text-xs text-amber-700">تاريخ السفر/التسوية</p>
                <p className="text-sm font-semibold text-slate-900">
                  {dates.travelDate || "—"}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                <p className="text-xs text-emerald-700">صافي المستحق</p>
                <p className="text-sm font-bold text-emerald-900">
                  {formatNumber(netPay, 2)} ريال
                </p>
              </div>
            </div>
          </Card>

          {/* شريط أفقي موحّد لبطاقات الأساس */}
          <div className="grid grid-cols-1 gap-4 items-start">
            <Card className="h-full shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                بيانات الموظف
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <Input
                  label="الاسم (مطلوب)"
                  required
                  value={employeeInfo.name}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, name: e.target.value })}
                />
                <Input
                  label="رقم الموظف (مطلوب)"
                  required
                  value={employeeInfo.employeeId}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, employeeId: e.target.value })}
                />
                <Input
                  label="الوظيفة"
                  value={employeeInfo.jobTitle}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, jobTitle: e.target.value })}
                />
                <Input
                  label="موقع العمل (مطلوب)"
                  required
                  value={employeeInfo.workLocation}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, workLocation: e.target.value })}
                />
                <Input
                  label="الجنسية"
                  value={employeeInfo.nationality}
                  onChange={(e) => setEmployeeInfo({ ...employeeInfo, nationality: e.target.value })}
                />
              </div>
            </Card>

            <Card className="h-full shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                بيانات العقد
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <Input label="الراتب الأساسي (مطلوب)" required type="number" min="0" step="0.01" value={contractInfo.basicSalary || ""} onChange={(e) => setContractInfo({ ...contractInfo, basicSalary: parseFloat(e.target.value) || 0 })} />
                <Input label="بدل السكن" type="number" min="0" step="0.01" value={contractInfo.housingAllowance || ""} onChange={(e) => setContractInfo({ ...contractInfo, housingAllowance: parseFloat(e.target.value) || 0 })} />
                <Input label="بدل النقل" type="number" min="0" step="0.01" value={contractInfo.transportAllowance || ""} onChange={(e) => setContractInfo({ ...contractInfo, transportAllowance: parseFloat(e.target.value) || 0 })} />
                <Input label="بدل الطعام" type="number" min="0" step="0.01" value={contractInfo.foodAllowance || ""} onChange={(e) => setContractInfo({ ...contractInfo, foodAllowance: parseFloat(e.target.value) || 0 })} />
                <Input label="بدلات أخرى" type="number" min="0" step="0.01" value={contractInfo.otherAllowances || ""} onChange={(e) => setContractInfo({ ...contractInfo, otherAllowances: parseFloat(e.target.value) || 0 })} />
                <Input label="إجمالي الراتب (محسوب)" value={formatNumber(totalSalary)} readOnly />
              </div>
            </Card>

            <Card className="h-full shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                التواريخ الأساسية
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <Input
                  label="تاريخ التعيين (مطلوب)"
                  type="date"
                  required
                  value={dates.hireDate}
                  onChange={(e) => setDates({ ...dates, hireDate: e.target.value })}
                />
                <Input
                  label="تاريخ السفر للإجازة (مطلوب)"
                  type="date"
                  required
                  value={dates.travelDate}
                  onChange={(e) => setDates({ ...dates, travelDate: e.target.value })}
                />
                <Input
                  label="عودة من آخر إجازة"
                  type="date"
                  value={dates.lastReturnDate}
                  onChange={(e) => setDates({ ...dates, lastReturnDate: e.target.value })}
                />
                <Input
                  label="تاريخ العودة المتوقع (عرض فقط)"
                  value={settlementCalc.leave.expectedReturn || ""}
                  readOnly
                />
                <Input
                  label="تاريخ بداية الاحتساب (آلي من آخر تسوية +1 أو التعيين)"
                  value={settlementCalc.leave.accrualStart || ""}
                  readOnly
                />
                <Input
                  label="تاريخ نهاية أول خمس سنوات"
                  value={settlementCalc.leave.fiveYearsDate || ""}
                  readOnly
                />
                <div className="text-xs text-slate-500 leading-relaxed">
                  جميع الفروق بالحساب الشامل للأيام حتى تاريخ السفر، والعودة المتوقعة للعرض فقط.
                </div>
              </div>
            </Card>

            <Card className="h-full shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                ملخص المدد (حساب آلي)
              </h2>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 mb-1">إجمالي مدة الخدمة</p>
                  {serviceTotals ? (
                    <p className="font-semibold text-slate-900">
                      {serviceTotals.totalDays} يوم / {serviceTotals.years} سنة{" "}
                      {serviceTotals.months} شهر {serviceTotals.days} يوم
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      أدخل تاريخ التعيين وتاريخ السفر
                    </p>
                  )}
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                  <p className="text-sm text-emerald-700 mb-1">
                    مدة الخدمة منذ آخر إجازة
                  </p>
                  {sinceLastLeave ? (
                    <p className="font-semibold text-slate-900">
                      {sinceLastLeave.totalDays} يوم / {sinceLastLeave.years} سنة{" "}
                      {sinceLastLeave.months} شهر {sinceLastLeave.days} يوم
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      أدخل عودة آخر إجازة وتاريخ السفر
                    </p>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  جميع الفروق بالحساب الشامل للأيام (inclusive) حتى تاريخ السفر، والعودة
                  المتوقعة للعرض فقط.
                </div>
              </div>
            </Card>
            <Card className="h-full md:col-span-2 xl:col-span-1 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                نوع التسوية
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={settlementType === "leave" ? "primary" : "secondary"}
                  onClick={() => setSettlementType("leave")}
                  className="flex-1 min-w-[140px] justify-center rounded-lg shadow-sm"
                >
                  صرف إجازة
                </Button>
                <Button
                  variant={settlementType === "eos" ? "primary" : "secondary"}
                  onClick={() => setSettlementType("eos")}
                  className="flex-1 min-w-[140px] justify-center rounded-lg shadow-sm"
                >
                  نهاية خدمة
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-sm">
                <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-slate-500">النوع الحالي</p>
                  <p className="font-semibold text-slate-900">
                    {settlementType === "leave" ? "صرف إجازة" : "نهاية خدمة"}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <p className="text-blue-600">تاريخ التسوية</p>
                  <p className="font-semibold text-slate-900">
                    {dates.travelDate || "—"}
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <p className="text-emerald-600">صافي المستحق</p>
                  <p className="font-semibold text-emerald-900">
                    {formatNumber(netPay, 2)} ريال
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                يتم عرض الحسابات حسب الاختيار، وباقي الإعدادات تُحسب آلياً من المحرك الموحد.
              </p>
            </Card>
          </div>

          <div className="space-y-3">
            {settlementType === "leave" && (
              <Card>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">
                  بيان الإجازة المستحقة
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <Input
                    label="الأيام المستحقة منذ آخر عودة (محسوبة)"
                    value={formatNumber(
                      settlementCalc.leave.earnedDaysTier1 +
                        settlementCalc.leave.earnedDaysTier2,
                      2
                    )}
                    readOnly
                  />
                  <Input
                    label="الأيام المسددة (إن وجدت)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidLeaveDays || ""}
                    onChange={(e) => setPaidLeaveDays(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="أيام مستقطعة (غياب/خصم)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductedDays || ""}
                    onChange={(e) => setDeductedDays(parseFloat(e.target.value) || 0)}
                  />
                  <Input
                    label="راتب شهري بديل للاحتساب (اختياري)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={encashmentInput.monthlySalary || ""}
                    onChange={(e) =>
                      setEncashmentInput({
                        ...encashmentInput,
                        monthlySalary: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="قيمة اليوم (محسوبة)"
                    value={formatNumber(dailySalary)}
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div>
                    <p className="font-semibold text-slate-800">الفترة المحتسبة</p>
                    <p>
                      من: {settlementCalc.leave.accrualStart || "—"}<br />
                      إلى: {dates.travelDate || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">تفصيل الأيام</p>
                    <p>أقل من خمس سنوات (21/سنة): {formatNumber(settlementCalc.leave.earnedDaysTier1, 2)} يوم</p>
                    <p>أكثر من خمس سنوات (30/سنة): {formatNumber(settlementCalc.leave.earnedDaysTier2, 2)} يوم</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm bg-white border border-slate-200 rounded-lg p-3">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-slate-600">أيام العمل (من آخر عودة → السفر)</p>
                    <p className="font-semibold text-slate-900">
                      {formatNumber(workDays, 2)} يوم
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-blue-700">الأيام المستحقة بعد المسدد/المستقطع</p>
                    <p className="font-semibold text-slate-900">
                      {formatNumber(netEligibleDays, 2)} يوم
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <p className="text-emerald-700">مستحقات الإجازة (صافي)</p>
                    <p className="font-bold text-emerald-900">
                      {formatNumber(leaveEncashAmount || 0, 2)} ريال
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-2">حساب خمس سنوات أو أقل</p>
                    <p className="text-sm text-gray-700">
                      إجمالي أيام العمل: {formatNumber(settlementCalc.leave.tier1Days, 2)}
                    </p>
                    <p className="text-sm text-gray-700">
                      أيام الإجازة المستحقة: {formatNumber(settlementCalc.leave.earnedDaysTier1, 2)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-2">حساب ما يزيد عن خمس سنوات</p>
                    <p className="text-sm text-gray-700">
                      إجمالي أيام العمل: {formatNumber(settlementCalc.leave.tier2Days, 2)}
                    </p>
                    <p className="text-sm text-gray-700">
                      أيام الإجازة المستحقة: {formatNumber(settlementCalc.leave.earnedDaysTier2, 2)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">إجمالي الأيام المستحقة</p>
                    <p className="text-xl font-bold text-blue-900">
                      {formatNumber(
                        settlementCalc.leave.earnedDaysTier1 + settlementCalc.leave.earnedDaysTier2,
                        2
                      )}{" "}
                      يوم
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">الأيام المسددة</p>
                    <p className="text-xl font-bold text-orange-900">
                      {formatNumber(settlementCalc.leave.paidLeaveDays, 2)} يوم
                    </p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">الأيام المستقطعة</p>
                    <p className="text-xl font-bold text-amber-900">
                      {formatNumber(settlementCalc.leave.deductedDays || 0, 2)} يوم
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">صافي الأيام المستحقة</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatNumber(settlementCalc.leave.netEarnedDays, 2)} يوم
                    </p>
                  </div>
                </div>
                <div className="mt-3 bg-blue-100 p-3 rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-slate-900">مستحقات الإجازة</span>
                  <span className="text-2xl font-bold text-blue-900">
                    {formatNumber(leaveEncashAmount || 0)} ريال
                  </span>
                </div>
              </Card>
            )}

            {settlementType === "eos" && (
              <Card>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">
                  بيان نهاية الخدمة
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="bg-indigo-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">أيام أول 5 سنوات</p>
                    <p className="text-xl font-bold text-indigo-900">
                      {formatNumber(settlementCalc.eos.first5Days, 0)} يوم
                    </p>
                    <p className="text-xs text-indigo-800 mt-1">
                      {eosDurationFirst
                        ? `${eosDurationFirst.years} سنة / ${eosDurationFirst.months} شهر / ${eosDurationFirst.days} يوم`
                        : "—"}
                    </p>
                    <p className="text-xs text-indigo-800 mt-1">
                      قيمة الجزء: {formatNumber(eosAmountFirst, 2)} ريال
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">أيام بعد 5 سنوات</p>
                    <p className="text-xl font-bold text-purple-900">
                      {formatNumber(settlementCalc.eos.after5Days, 0)} يوم
                    </p>
                    <p className="text-xs text-purple-800 mt-1">
                      {eosDurationAfter
                        ? `${eosDurationAfter.years} سنة / ${eosDurationAfter.months} شهر / ${eosDurationAfter.days} يوم`
                        : "—"}
                    </p>
                    <p className="text-xs text-purple-800 mt-1">
                      قيمة الجزء: {formatNumber(eosAmountAfter, 2)} ريال
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">مستحق نهاية الخدمة</p>
                    <p className="text-xl font-bold text-emerald-900">
                      {formatNumber(eosAmount, 2)} ريال
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3">
                  يحسب أول 5 سنوات بمعدل نصف شهر لكل سنة، وما يزيد بمعدل شهر لكل سنة.
                </p>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  بيان الاستحقاقات
                </h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 mb-1">
                      {settlementType === "leave" ? "مستحقات الإجازة" : "مستحقات نهاية الخدمة"}
                    </p>
                    <p className="text-xl font-semibold text-blue-900">
                      {formatNumber(primaryEarning || 0)} ريال
                    </p>
                    {settlementType === "leave" ? (
                      <p className="text-xs text-blue-700 mt-1">
                        {formatNumber(settlementCalc.leave.netEarnedDays, 2)} يوم ×{" "}
                        {formatNumber(dailySalary)} ريال/يوم
                      </p>
                    ) : (
                      <div className="text-xs text-blue-700 mt-1 space-y-1">
                        <p>
                          أول 5 سنوات: {formatNumber(settlementCalc.eos.first5Days, 0)} يوم ={" "}
                          {formatNumber(eosAmountFirst, 2)} ريال
                        </p>
                        <p>
                          بعد 5 سنوات: {formatNumber(settlementCalc.eos.after5Days, 0)} يوم ={" "}
                          {formatNumber(eosAmountAfter, 2)} ريال
                        </p>
                        <p>إجمالي خدمة {formatNumber(settlementCalc.eos.totalDays, 0)} يوم</p>
                      </div>
                    )}
                  </div>
                  <Input
                    label="بدل تذكرة سفر (ذهاب وعودة)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={earnings.ticketAllowance || ""}
                    onChange={(e) =>
                      setEarnings({
                        ...earnings,
                        ticketAllowance: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="راتب أيام عمل شهر (وصف)"
                    value={earnings.monthLabel1}
                    onChange={(e) => setEarnings({ ...earnings, monthLabel1: e.target.value })}
                  />
                  <Input
                    label="قيمة الراتب (شهر/سنة)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={earnings.monthAmount1 || ""}
                    onChange={(e) =>
                      setEarnings({
                        ...earnings,
                        monthAmount1: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="راتب آخر (وصف)"
                    value={earnings.monthLabel2}
                    onChange={(e) => setEarnings({ ...earnings, monthLabel2: e.target.value })}
                  />
                  <Input
                    label="قيمة الراتب الآخر"
                    type="number"
                    min="0"
                    step="0.01"
                    value={earnings.monthAmount2 || ""}
                    onChange={(e) =>
                      setEarnings({
                        ...earnings,
                        monthAmount2: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <div className="bg-blue-100 p-3 rounded-lg flex justify-between">
                    <span className="font-semibold text-slate-900">إجمالي الاستحقاقات</span>
                    <span className="text-2xl font-bold text-blue-900">
                      {formatNumber(totalEarnings, 2)} ريال
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  بيان الاستقطاعات
                </h2>
                <div className="space-y-4">
                  <Input
                    label="سلفة"
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductions.advance || ""}
                    onChange={(e) =>
                      setDeductions({
                        ...deductions,
                        advance: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="تسوية عهدة/معدات"
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductions.equipmentSettlement || ""}
                    onChange={(e) =>
                      setDeductions({
                        ...deductions,
                        equipmentSettlement: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="فرق تكلفة الإقامة الزائدة"
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductions.extraAccommodation || ""}
                    onChange={(e) =>
                      setDeductions({
                        ...deductions,
                        extraAccommodation: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    label="تأشيرة/إقامة إضافية"
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductions.extraVisa || ""}
                    onChange={(e) =>
                      setDeductions({
                        ...deductions,
                        extraVisa: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg flex justify-between">
                    <span className="font-semibold text-slate-900">إجمالي الاستقطاعات</span>
                    <span className="text-2xl font-bold text-rose-700">
                      {formatNumber(totalDeductions, 2)} ريال
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">الملخص النهائي</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">إجمالي الاستحقاقات</p>
                <p className="text-xl font-bold text-blue-900">
                  {formatNumber(totalEarnings, 2)} ريال
                </p>
              </div>
              <div className="bg-rose-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">إجمالي الاستقطاعات</p>
                <p className="text-xl font-bold text-rose-700">
                  {formatNumber(totalDeductions, 2)} ريال
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">صافي المستحق</p>
                <p className="text-xl font-bold text-emerald-900">
                  {formatNumber(netPay, 2)} ريال
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-4">
              السيد المدير العام آمل اعتماد مبلغ وقدره ({formatNumber(netPay, 2)}) ريال فقط لا غير.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button onClick={saveToRecords} className="flex-1">
                حفظ في الأرشيف
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => window.print()}
              >
                طباعة
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => (window.location.href = "/records")}
              >
                فتح سجل التسويات
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={saveToDatabase}
              >
                حفظ في قاعدة البيانات
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

