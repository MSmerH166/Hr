"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { formatCurrency } from "@/lib/calc";
import { EmployeeRecord, loadRecords, saveRecords } from "@/lib/records";
import { AuthGuard } from "@/components/AuthGuard";

export default function RecordsPage() {
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [filters, setFilters] = useState({
    text: "",
    actionType: "الكل" as "الكل" | EmployeeRecord["actionType"],
    from: "",
    to: "",
  });
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus") || "";
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  useEffect(() => {
    saveRecords(records);
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const textMatch =
        !filters.text ||
        [r.serialNumber, r.name, r.employeeId, r.project, r.role, r.nationality]
          .join(" ")
          .toLowerCase()
          .includes(filters.text.toLowerCase());

      const typeMatch =
        filters.actionType === "الكل" || r.actionType === filters.actionType;

      const fromOk = !filters.from || r.actionDate >= filters.from;
      const toOk = !filters.to || r.actionDate <= filters.to;

      return textMatch && typeMatch && fromOk && toOk;
    });
  }, [records, filters]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, r) => sum + (r.amount || 0), 0),
    [filtered]
  );

  const focusedRecord = useMemo(() => {
    if (focusId) {
      const found = records.find(
        (r) => r.id === focusId || r.serialNumber === focusId
      );
      if (found) return found;
    }
    return records[0];
  }, [focusId, records]);

  const removeRecord = (id: string) => {
    const next = records.filter((r) => r.id !== id);
    setRecords(next);
    saveRecords(next);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hr_login_user");
    }
    router.replace("/login");
  };

  const printRecords = () => {
    window.print();
  };

  const saveToDatabase = () => {
    alert("حفظ في قاعدة بيانات يتطلب ربط خارجي (غير متاح في النسخة الحالية).");
  };

  const exportJson = () => {
    const stamp = new Date().toISOString().replace(/[:T\-]/g, "").slice(0, 14);
    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `records-backup-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as EmployeeRecord[];
        const merged = [...records];
        let added = 0;
        parsed.forEach((r) => {
          const id = r.id || crypto.randomUUID();
          if (!merged.some((m) => m.id === id)) {
            merged.push({
              serialNumber: r.serialNumber || "",
              name: r.name || "",
              employeeId: r.employeeId || "",
              project: r.project || "",
              nationality: r.nationality || "",
              role: r.role || "",
              actionType: r.actionType || "مستحقات أخرى",
              amount: r.amount || 0,
              actionDate: r.actionDate || "",
              notes: r.notes || "",
              id,
            });
            added += 1;
          }
        });
        setRecords(merged);
        alert(`تم استيراد ${added} سجل جديد. المجموع الآن ${merged.length}`);
      } catch (err) {
        alert("ملف غير صالح. يرجى اختيار ملف JSON تم تصديره من النظام.");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
        <div className="relative flex items-center justify-center text-center">
          <Link
            href="/"
            className="absolute right-0 md:right-auto md:left-0 text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            ← العودة للصفحة الرئيسية
          </Link>
          <button
            onClick={handleLogout}
            className="absolute left-0 md:left-auto md:right-0 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            تسجيل الخروج
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              سجل تسوية الموظفين
            </h1>
          </div>
        </div>

        <Card className="bg-white border border-amber-100">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                ملخص التسوية الحالية
              </h2>
              <p className="text-sm text-gray-600">
                {focusId
                  ? "تم تحويلك تلقائياً بعد الحفظ. هذا ملخص سريع لأهم البيانات."
                  : "أحدث تسوية محفوظة تظهر هنا لسهولة المراجعة."}
              </p>
            </div>
          </div>
          {focusedRecord ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">الاسم</p>
                <p className="font-semibold text-gray-900">
                  {focusedRecord.name || "—"}
                </p>
                <p className="text-sm text-gray-500">الرقم الوظيفي</p>
                <p className="font-semibold text-gray-900">
                  {focusedRecord.employeeId || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">قيمة التسوية</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatCurrency(focusedRecord.amount || 0)}
                </p>
                <p className="text-sm text-gray-500">تاريخ التسوية</p>
                <p className="font-semibold text-gray-900">
                  {focusedRecord.actionDate || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">نوع الإجراء</p>
                <p className="font-semibold text-gray-900">
                  {focusedRecord.actionType}
                </p>
                <p className="text-sm text-gray-500">المشروع / التسلسل</p>
                <p className="font-semibold text-gray-900">
                  {focusedRecord.project || "—"}{" "}
                  {focusedRecord.serialNumber ? `(${focusedRecord.serialNumber})` : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">لا توجد سجلات للعرض.</p>
          )}
        </Card>

        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-gray-900 text-center md:text-right">الفلاتر</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-center">
              <Button
                variant="secondary"
                onClick={() => setFilters({ text: "", actionType: "الكل", from: "", to: "" })}
                className="w-full"
              >
                مسح الفلاتر
              </Button>
              <Button variant="secondary" onClick={printRecords} className="w-full">
                طباعة / PDF
              </Button>
              <Button onClick={saveToDatabase} className="w-full">
                حفظ في قاعدة البيانات
              </Button>
              <Button onClick={exportJson} className="w-full">
                تصدير نسخة JSON
              </Button>
              <Button variant="secondary" onClick={handleImportClick} className="w-full">
                استيراد نسخة JSON
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
            <Input
              label="بحث نصي"
              value={filters.text}
              placeholder="اكتب للبحث..."
              onChange={(e) => setFilters({ ...filters, text: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الإجراء
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-gray-900"
                value={filters.actionType}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    actionType: e.target.value as typeof filters.actionType,
                  })
                }
              >
                <option value="الكل">الكل</option>
                <option value="نهاية خدمة">نهاية خدمة</option>
                <option value="صرف إجازة">صرف إجازة</option>
                <option value="مستحقات أخرى">مستحقات أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                من تاريخ
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-gray-900"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إلى تاريخ
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-gray-900"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border border-gray-200 text-center">
            <p className="text-sm text-gray-600">عدد السجلات</p>
            <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
          </Card>
          <Card className="bg-white border border-gray-200 text-center">
            <p className="text-sm text-gray-600">إجمالي المبالغ</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </p>
          </Card>
          <Card className="bg-white border border-gray-200 text-center">
            <p className="text-sm text-gray-600">آخر تسوية محفوظة</p>
            {filtered.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  {filtered[0].name || "—"}
                </p>
                <p className="text-xs text-slate-600">
                  رقم وظيفي: {filtered[0].employeeId || "—"}
                </p>
                <p className="text-xs text-slate-600">
                  النوع: {filtered[0].actionType}
                </p>
                <p className="text-xs text-slate-600">
                  التاريخ: {filtered[0].actionDate || "—"}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-500">لا توجد بيانات</p>
            )}
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              السجلات المحفوظة ({filtered.length})
            </h2>
            <Button
              variant="secondary"
              onClick={() => {
                if (confirm("سيتم حذف جميع السجلات. هل أنت متأكد؟")) {
                  setRecords([]);
                  saveRecords([]);
                }
              }}
            >
              حذف كل السجلات
            </Button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full border text-sm text-slate-900">
              <thead className="bg-slate-700 text-white">
                <tr className="text-center">
                  <th className="border px-3 py-2 font-semibold">التسلسل</th>
                  <th className="border px-3 py-2 font-semibold">التاريخ</th>
                  <th className="border px-3 py-2 font-semibold">الاسم</th>
                  <th className="border px-3 py-2 font-semibold">الرقم الوظيفي</th>
                  <th className="border px-3 py-2 font-semibold">المشروع</th>
                  <th className="border px-3 py-2 font-semibold">الوظيفة</th>
                  <th className="border px-3 py-2 font-semibold">الجنسية</th>
                  <th className="border px-3 py-2 font-semibold">النوع</th>
                  <th className="border px-3 py-2 font-semibold">المبلغ</th>
                  <th className="border px-3 py-2 font-semibold">ملاحظات</th>
                  <th className="border px-3 py-2 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="text-center align-middle">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-gray-500">
                      لا توجد سجلات مطابقة
                    </td>
                  </tr>
                )}
                {filtered.map((r, idx) => {
                  const isFocused =
                    focusId && (r.id === focusId || r.serialNumber === focusId);
                  const zebra = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
                  return (
                  <tr
                    key={r.id}
                    className={`hover:bg-gray-100 ${zebra} ${
                      isFocused ? "bg-amber-50" : ""
                    }`}
                  >
                    <td className="border px-3 py-2 whitespace-nowrap font-semibold text-slate-900">
                      {r.serialNumber}
                    </td>
                    <td className="border px-3 py-2 whitespace-nowrap">
                      {r.actionDate || "—"}
                    </td>
                    <td className="border px-3 py-2 font-semibold text-indigo-900">
                      {r.name}
                    </td>
                    <td className="border px-3 py-2 whitespace-nowrap">
                      {r.employeeId}
                    </td>
                    <td className="border px-3 py-2 text-slate-800">{r.project}</td>
                    <td className="border px-3 py-2 text-slate-800">{r.role}</td>
                    <td className="border px-3 py-2 text-slate-800">{r.nationality}</td>
                    <td className="border px-3 py-2 text-slate-900 font-medium">
                      {r.actionType}
                    </td>
                    <td className="border px-3 py-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-bold text-emerald-800">
                        {formatCurrency(r.amount)}
                      </span>
                    </td>
                    <td className="border px-3 py-2 text-slate-700 italic">
                      {r.notes || "—"}
                    </td>
                    <td className="border px-3 py-2">
                      <button
                        onClick={() => removeRecord(r.id)}
                        className="px-3 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        </div>
        <input
          type="file"
          accept="application/json"
          ref={importInputRef}
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </AuthGuard>
  );
}

