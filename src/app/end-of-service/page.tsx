"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { calculateEndOfService } from "@/lib/calc";
import { EndOfServiceInput } from "@/lib/types";

export default function EndOfServicePage() {
  const [inputs, setInputs] = useState<EndOfServiceInput>({
    startDate: "",
    endDate: "",
    monthlyBasicSalary: 0,
  });
  const [result, setResult] = useState<ReturnType<typeof calculateEndOfService> | null>(null);

  const handleCalculate = () => {
    if (!inputs.startDate || !inputs.endDate || inputs.monthlyBasicSalary <= 0) {
      alert("يرجى إدخال جميع البيانات بشكل صحيح");
      return;
    }

    try {
      const calcResult = calculateEndOfService(inputs);
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
            حاسبة نهاية الخدمة
          </h1>
          <p className="text-gray-600">
            حساب مكافأة نهاية الخدمة بناءً على سنوات الخدمة
          </p>
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <Input
              label="تاريخ بداية الخدمة"
              type="date"
              value={inputs.startDate}
              onChange={(e) =>
                setInputs({ ...inputs, startDate: e.target.value })
              }
            />
            <Input
              label="تاريخ نهاية الخدمة"
              type="date"
              value={inputs.endDate}
              onChange={(e) =>
                setInputs({ ...inputs, endDate: e.target.value })
              }
            />
            <Input
              label="الراتب الأساسي الشهري"
              type="number"
              min="0"
              step="0.01"
              value={inputs.monthlyBasicSalary || ""}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  monthlyBasicSalary: parseFloat(e.target.value) || 0,
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
                      {formatNumber(result.breakdown.first5Years.years)} سنة ={" "}
                      {formatNumber(result.breakdown.first5Years.months)} شهر
                    </p>
                    <p className="text-lg font-semibold text-blue-900 mt-2">
                      {formatNumber(result.breakdown.first5Years.amount)} ريال
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      بعد السنوات الخمس الأولى
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatNumber(result.breakdown.after5Years.years)} سنة ={" "}
                      {formatNumber(result.breakdown.after5Years.months)} شهر
                    </p>
                    <p className="text-lg font-semibold text-green-900 mt-2">
                      {formatNumber(result.breakdown.after5Years.amount)} ريال
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    إجمالي الأشهر المستحقة
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(result.totalMonthsEntitled)} شهر
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="bg-yellow-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    المبلغ الإجمالي المستحق
                  </p>
                  <p className="text-3xl font-bold text-yellow-900">
                    {formatNumber(result.finalAmount)} ريال
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

