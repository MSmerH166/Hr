"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { calculateLeaveAccrual } from "@/lib/calc";
import { LeaveAccrualInput } from "@/lib/types";

export default function LeaveAccrualPage() {
  const [inputs, setInputs] = useState<LeaveAccrualInput>({
    startDate: "",
    calculationDate: "",
    usedLeaveDays: 0,
  });
  const [result, setResult] = useState<ReturnType<typeof calculateLeaveAccrual> | null>(null);

  const handleCalculate = () => {
    if (!inputs.startDate || !inputs.calculationDate || inputs.usedLeaveDays < 0) {
      alert("يرجى إدخال جميع البيانات بشكل صحيح");
      return;
    }

    try {
      const calcResult = calculateLeaveAccrual(inputs);
      setResult(calcResult);
    } catch (error) {
      alert("حدث خطأ في الحساب. يرجى التحقق من البيانات المدخلة.");
      console.error(error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← العودة للصفحة الرئيسية
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            حاسبة الإجازة المستحقة
          </h1>
          <p className="text-gray-600">
            حساب عدد أيام الإجازة المستحقة للموظف بناءً على سنوات الخدمة
          </p>
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <Input
              label="تاريخ بداية الخدمة"
              type="date"
              value={inputs.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputs({ ...inputs, startDate: e.target.value })
              }
            />
            <Input
              label="تاريخ الحساب"
              type="date"
              value={inputs.calculationDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputs({ ...inputs, calculationDate: e.target.value })
              }
            />
            <Input
              label="عدد أيام الإجازة المستخدمة"
              type="number"
              min="0"
              step="0.5"
              value={inputs.usedLeaveDays || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInputs({
                  ...inputs,
                  usedLeaveDays: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Button onClick={handleCalculate} className="w-full">
              حساب
            </Button>
          </div>
        </Card>

        {result && (
          <Card>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              نتائج الحساب
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">إجمالي سنوات الخدمة</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatNumber(result.totalServiceYears)} سنة
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي أيام الخدمة</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {result.totalServiceDays} يوم
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  التفاصيل
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      السنوات الخمس الأولى
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatNumber(result.breakdown.first5Years.years)} سنة (
                      {result.breakdown.first5Years.days} يوم)
                    </p>
                    <p className="text-lg font-semibold text-blue-900 mt-2">
                      {formatNumber(result.breakdown.first5Years.accrued)} يوم
                      مستحق
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      بعد السنوات الخمس الأولى
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatNumber(result.breakdown.after5Years.years)} سنة (
                      {result.breakdown.after5Years.days} يوم)
                    </p>
                    <p className="text-lg font-semibold text-green-900 mt-2">
                      {formatNumber(result.breakdown.after5Years.accrued)} يوم
                      مستحق
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-100 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">إجمالي المستحق</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatNumber(result.accruedDays)} يوم
                    </p>
                  </div>
                  <div className="bg-orange-100 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">المستخدم</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatNumber(result.usedDays)} يوم
                    </p>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">المتبقي</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatNumber(result.remainingDays)} يوم
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

