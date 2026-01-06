"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSettings } from "@/lib/settings";

type LoginData = {
  username: string;
  password: string;
};

const USER_KEY = "hr_login_user";
const DEFAULT_USER = { username: "admin", password: "123456" };

export default function LoginPage() {
  const settings = getSettings();
  const expectedUser = {
    username: settings.loginUsername || DEFAULT_USER.username,
    password: settings.loginPassword || DEFAULT_USER.password,
    role: settings.userRole || "مشرف",
  };
  const router = useRouter();
  const [data, setData] = useState<LoginData>(() => {
    if (typeof window === "undefined")
      return { username: expectedUser.username, password: expectedUser.password };
    const saved = localStorage.getItem(USER_KEY);
    return saved
      ? JSON.parse(saved)
      : { username: expectedUser.username, password: expectedUser.password };
  });
  const [error, setError] = useState("");

  // تحميل وتشغيل tsParticles من CDN مع إعادة محاولة وتنظيف
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let script: HTMLScriptElement | null = null;

    const config = {
      fpsLimit: 60,
      particles: {
        number: { value: 60, density: { enable: true, value_area: 1000 } },
        color: { value: ["#344455", "#ffffff"] },
        shape: {
          type: "edge",
          stroke: { width: 0, color: "#000000" },
          polygon: { nb_sides: 5 },
          image: { src: "img/github.svg", width: 100, height: 100 },
        },
        opacity: {
          value: 0.5,
          random: false,
          anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false },
        },
        size: {
          value: 4,
          random: true,
          anim: { enable: false, speed: 40, size_min: 0.1, sync: false },
        },
        line_linked: {
          enable: true,
          distance: 50,
          color: "#fff",
          opacity: 0.5,
          width: 1,
        },
        move: {
          enable: true,
          speed: 3,
          direction: "none",
          random: false,
          straight: false,
          out_mode: "out",
          bounce: false,
          attract: { enable: false, rotateX: 600, rotateY: 1200 },
        },
      },
      retina_detect: true,
    };

    const loadParticles = (ts: any) => {
      if (!ts || typeof ts.load !== "function") return;
      if (ts.dom && typeof ts.dom === "function") {
        ts.dom().forEach((inst: any) => inst?.destroy?.());
      }
      ts.load("tsparticles", config);
    };

    const ensureAndLoad = () => {
      const ts = (globalThis as any).tsParticles;
      if (ts && typeof ts.load === "function") {
        loadParticles(ts);
        return true;
      }
      return false;
    };

    if (!ensureAndLoad()) {
      script = document.createElement("script");
      script.id = "ts-particles-cdn";
      script.src = "https://cdn.jsdelivr.net/npm/tsparticles@3/tsparticles.bundle.min.js";
      script.async = true;
      script.onload = () => {
        if (!cancelled) ensureAndLoad();
      };
      script.onerror = () => {
        if (script) {
          script.remove();
        }
        script = document.createElement("script");
        script.id = "ts-particles-cdn";
        script.src = "https://unpkg.com/tsparticles@3/tsparticles.bundle.min.js";
        script.async = true;
        script.onload = () => {
          if (!cancelled) ensureAndLoad();
        };
        document.body.appendChild(script);
      };
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      if ((globalThis as any).tsParticles?.dom) {
        (globalThis as any).tsParticles.dom().forEach((inst: any) => inst?.destroy?.());
      }
      script?.remove();
    };
  }, []);

  const handleSubmit = () => {
    if (!data.username || !data.password) {
      setError("اسم المستخدم وكلمة المرور مطلوبان");
      return;
    }
    if (
      settings.requireLogin &&
      (data.username !== expectedUser.username || data.password !== expectedUser.password)
    ) {
      setError("بيانات الدخول غير صحيحة");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(data));
    }
    setError("");
    router.push("/");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 overflow-hidden">
      <div id="tsparticles" className="pointer-events-none absolute inset-0 z-0 opacity-60" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.10),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(100,116,139,0.10),transparent_45%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-600">شركة بنيان الانشائية للمقاولات</p>
            <h1 className="text-3xl font-extrabold text-slate-900">مرحباً بك</h1>
            <p className="text-sm text-slate-600">أدخل بيانات الدخول للمتابعة</p>
            <Link href="/" className="text-blue-700 hover:text-blue-900 text-xs underline">
              العودة للرئيسية
            </Link>
          </div>

          <div className="rounded-2xl bg-white shadow-xl border border-slate-200 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">الوصول الداخلي</p>
                <h2 className="text-xl font-semibold text-slate-900">تسجيل الدخول</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl">
                🔒
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="space-y-1">
                <label className="text-sm text-slate-700">اسم المستخدم</label>
                <input
                  className="w-full rounded-lg bg-white border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  type="text"
                  value={data.username}
                  onChange={(e) => setData({ ...data, username: e.target.value })}
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-700">كلمة المرور</label>
                <input
                  className="w-full rounded-lg bg-white border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  type="password"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold hover:from-blue-400 hover:to-teal-300 transition"
              >
                تسجيل الدخول
              </button>
            </form>

            <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
              <p>
                بيانات الدخول المصرح بها: <span className="font-semibold">{expectedUser.username}</span> /{" "}
                <span className="font-semibold">{expectedUser.password}</span>
              </p>
              <p className="text-[11px] text-slate-500">الصلاحية: {expectedUser.role}</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes particleFloat {
          0% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(12px, -10px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}

