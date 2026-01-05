"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { calculateLeaveEncashment } from "@/lib/calc";
import { LeaveEncashmentInput } from "@/lib/types";
import { getSettings } from "@/lib/settings";

export default function LeaveEncashmentPage() {
  const [inputs, setInputs] = useState<LeaveEncashmentInput>({
    remainingLeaveDays: 0,
    monthlySalary: 0,
  });
  const [result, setResult] = useState<ReturnType<typeof calculateLeaveEncashment> | null>(null);
  const settings = getSettings();

  const handleCalculate = () => {
    if (inputs.remainingLeaveDays <= 0 || inputs.monthlySalary <= 0) {
      alert("يرجى إدخال جميع البيانات بشكل صحيح");
      return;
    }

    try {
      const calcResult = calculateLeaveEncashment(inputs);
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
            صرف مستحقات الإجازة
          </h1>
          <p className="text-gray-600">
            حساب قيمة الأيام المتبقية من الإجازة
          </p>
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <Input
              label="عدد أيام الإجازة المتبقية"
              type="number"
              min="0"
              step="0.5"
              value={inputs.remainingLeaveDays || ""}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  remainingLeaveDays: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Input
              label="الراتب الشهري"
              type="number"
              min="0"
              step="0.01"
              value={inputs.monthlySalary || ""}
              onChange={(e) =>
                setInputs({
                  ...inputs,
                  monthlySalary: parseFloat(e.target.value) || 0,
                })
              }
            />
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                طريقة حساب الراتب اليومي
              </p>
              <p className="text-sm font-medium text-gray-900">
                الراتب الشهري ÷ {settings.dailySalaryMethod} = الراتب اليومي
              </p>
            </div>
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
                  <p className="text-sm text-gray-600">عدد أيام الإجازة المتبقية</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatNumber(result.remainingDays)} يوم
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الراتب اليومي</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatNumber(result.dailySalary)} ريال
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="bg-yellow-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    المبلغ الإجمالي المستحق
                  </p>
                  <p className="text-3xl font-bold text-yellow-900">
                    {formatNumber(result.totalAmount)} ريال
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  طريقة الحساب: {formatNumber(result.remainingDays)} يوم ×{" "}
                  {formatNumber(result.dailySalary)} ريال ={" "}
                  {formatNumber(result.totalAmount)} ريال
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

