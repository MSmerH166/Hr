"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { getSettings, saveSettings, resetSettings } from "@/lib/settings";
import { Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    leaveDaysFirst5Years: 21,
    leaveDaysAfter5Years: 30,
    dailySalaryMethod: "30",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
  }, []);

  const handleSave = () => {
    if (
      settings.leaveDaysFirst5Years < 0 ||
      settings.leaveDaysAfter5Years < 0
    ) {
      alert("يرجى إدخال قيم صحيحة لأيام الإجازة");
      return;
    }

    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("هل أنت متأكد من إعادة تعيين الإعدادات إلى القيم الافتراضية؟")) {
      resetSettings();
      const defaultSettings = getSettings();
      setSettings(defaultSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
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
            إعدادات السياسات
          </h1>
          <p className="text-gray-600">
            تعديل إعدادات أيام الإجازة وطريقة حساب الراتب اليومي
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                إعدادات أيام الإجازة
              </h2>
              <div className="space-y-4">
                <Input
                  label="عدد أيام الإجازة للسنوات الخمس الأولى (يوم/سنة)"
                  type="number"
                  min="0"
                  step="0.5"
                  value={settings.leaveDaysFirst5Years}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      leaveDaysFirst5Years: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  label="عدد أيام الإجازة بعد السنوات الخمس الأولى (يوم/سنة)"
                  type="number"
                  min="0"
                  step="0.5"
                  value={settings.leaveDaysAfter5Years}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      leaveDaysAfter5Years: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                طريقة حساب الراتب اليومي
              </h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input
                    type="radio"
                    name="dailySalaryMethod"
                    value="30"
                    checked={settings.dailySalaryMethod === "30"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dailySalaryMethod: e.target.value as "30" | "26",
                      })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-gray-700">
                    الراتب الشهري ÷ 30 (الطريقة الافتراضية)
                  </span>
                </label>
                <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                  <input
                    type="radio"
                    name="dailySalaryMethod"
                    value="26"
                    checked={settings.dailySalaryMethod === "26"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dailySalaryMethod: e.target.value as "30" | "26",
                      })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-gray-700">
                    الراتب الشهري ÷ 26 (أيام العمل الفعلية)
                  </span>
                </label>
              </div>
            </div>

            {saved && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                تم حفظ الإعدادات بنجاح
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} className="flex-1">
                حفظ الإعدادات
              </Button>
              <Button
                onClick={handleReset}
                variant="secondary"
                className="flex-1"
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </Card>

        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ملاحظات
          </h2>
          <ul className="space-y-2 text-gray-600 text-sm list-disc list-inside">
            <li>
              سيتم تطبيق الإعدادات على جميع الحاسبات فور حفظها
            </li>
            <li>
              الإعدادات محفوظة محلياً في المتصفح ولن تُفقد عند إغلاق الصفحة
            </li>
            <li>
              يمكنك إعادة تعيين الإعدادات إلى القيم الافتراضية في أي وقت
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

