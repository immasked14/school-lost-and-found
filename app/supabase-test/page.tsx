"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<string>("Testing...");

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(() => {
        setStatus("success");
      })
      .catch(() => {
        setStatus("failed");
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center">
      <header className="bg-blue-900 text-white w-full">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-lg font-bold text-blue-900">
              &#128270;
            </div>
            <span className="text-lg font-bold tracking-tight">
              School Lost &amp; Found
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center flex-1">
        <div className="rounded-3xl border border-slate-700 bg-slate-800 p-10 shadow-sm text-center">
          <h1 className="text-3xl font-black text-blue-400">
            Supabase Connection Test
          </h1>
          <div className="mt-6">
            {status === "success" && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <p className="text-2xl font-black text-emerald-400">
                  Supabase connection successful
                </p>
              </div>
            )}
            {status === "failed" && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
                <p className="text-2xl font-black text-red-400">
                  Supabase connection failed
                </p>
              </div>
            )}
            {status === "Testing..." && (
              <p className="text-lg text-slate-400">Testing connection...</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
