"use client";

import Link from "next/link";
import { Card } from "@/components/Card";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            حاسبات الموارد البشرية
          </h1>
          <p className="text-gray-600">
            اختر الحاسبة المناسبة لحساب مستحقات الموظفين
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/leave-encashment">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">💰</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  صرف مستحقات الإجازة
                </h2>
                <p className="text-gray-600 text-sm">
                  حساب قيمة الأيام المتبقية من الإجازة
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/leave-accrual">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">📅</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  حاسبة الإجازة المستحقة
                </h2>
                <p className="text-gray-600 text-sm">
                  حساب عدد أيام الإجازة المستحقة للموظف
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/end-of-service">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">🏢</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  حاسبة نهاية الخدمة
                </h2>
                <p className="text-gray-600 text-sm">
                  حساب مكافأة نهاية الخدمة للموظف
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/settings" className="md:col-span-2 lg:col-span-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <div className="text-3xl mb-3">⚙️</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  إعدادات السياسات
                </h2>
                <p className="text-gray-600 text-sm">
                  تعديل إعدادات أيام الإجازة وطريقة حساب الراتب اليومي
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

