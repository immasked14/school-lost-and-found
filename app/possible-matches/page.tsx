"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

function safeEqual(a, b) {
  const sa = (a ?? "").toString().toLowerCase();
  const sb = (b ?? "").toString().toLowerCase();
  return sa === sb;
}

function isMatch(lost, found) {
  if (safeEqual(lost.status, "Matched") || safeEqual(lost.status, "No Match")) return false;
  if (safeEqual(found.status, "Matched") || safeEqual(found.status, "No Match")) return false;
  let score = 0;
  if (safeEqual(lost.item_name, found.item_name)) score++;
  if (safeEqual(lost.item_type, found.item_type)) score++;
  if (safeEqual(lost.color, found.color)) score++;
  if (safeEqual(lost.location, found.location)) score++;
  if (safeEqual(lost.description, found.description)) score++;
  return score >= 3;
}

export default function PossibleMatchesPage() {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [matches, setMatches] = useState([]);
  const [reviewed, setReviewed] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState("");

  const fetchData = async () => {
    try {
      const [lostRes, foundRes] = await Promise.all([
        supabase.from("lost_items").select("id, item_name, item_type, color, location, description, date_lost, status"),
        supabase.from("found_items").select("id, item_name, item_type, color, location, description, date_found, status"),
      ]);

      if (lostRes.error) {
        setDbError(lostRes.error.message);
      } else if (foundRes.error) {
        setDbError(foundRes.error.message);
      } else {
        const lost = lostRes.data ?? [];
        const found = foundRes.data ?? [];
        const foundMatches = [];
        for (let i = 0; i < lost.length; i++) {
          for (let j = 0; j < found.length; j++) {
            if (isMatch(lost[i], found[j])) {
              foundMatches.push({ lost: lost[i], found: found[j] });
            }
          }
        }
        setLostItems(lost);
        setFoundItems(found);
        setMatches(foundMatches);
      }
    } catch {
      setDbError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmMatch = async (match) => {
    setIsUpdating(true);
    setNotification("");
    const { error: lostError } = await supabase.from("lost_items").update({ status: "Matched" }).eq("id", match.lost.id);
    const { error: foundError } = await supabase.from("found_items").update({ status: "Matched" }).eq("id", match.found.id);
    setIsUpdating(false);
    if (lostError || foundError) {
      setDbError(lostError?.message ?? foundError?.message);
      return;
    }
    setNotification("Match confirmed successfully");
    fetchData();
  };

  const handleRejectMatch = async (match) => {
    setIsUpdating(true);
    setNotification("");
    const { error: lostError } = await supabase.from("lost_items").update({ status: "No Match" }).eq("id", match.lost.id);
    const { error: foundError } = await supabase.from("found_items").update({ status: "No Match" }).eq("id", match.found.id);
    setIsUpdating(false);
    if (lostError || foundError) {
      setDbError(lostError?.message ?? foundError?.message);
      return;
    }
    setNotification("Match rejected successfully");
    fetchData();
  };

  const renderMatchCard = (match, index) => (
    <div key={index} className="rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-xl text-blue-900">
            &#128270;
          </div>
          <h2 className="text-xl font-black text-blue-400">Possible Match</h2>
        </div>
        <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-semibold text-yellow-400">
          Match #{index + 1}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lost Item */}
        <div className="rounded-2xl border border-slate-600 bg-slate-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">Lost Item</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Item Name</span>
              <span className="font-medium text-slate-100">{match.lost.item_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Item Type</span>
              <span className="font-medium text-slate-100">{match.lost.item_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Color</span>
              <span className="font-medium text-slate-100">{match.lost.color}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Location</span>
              <span className="font-medium text-slate-100">{match.lost.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date</span>
              <span className="font-medium text-slate-100">{match.lost.date_lost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="font-medium text-slate-100">{match.lost.status ?? "Pending Review"}</span>
            </div>
          </div>
        </div>

        {/* Found Item */}
        <div className="rounded-2xl border border-slate-600 bg-slate-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">Found Item</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Item Name</span>
              <span className="font-medium text-slate-100">{match.found.item_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Item Type</span>
              <span className="font-medium text-slate-100">{match.found.item_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Color</span>
              <span className="font-medium text-slate-100">{match.found.color}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Location</span>
              <span className="font-medium text-slate-100">{match.found.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date</span>
              <span className="font-medium text-slate-100">{match.found.date_found}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="font-medium text-slate-100">{match.found.status ?? "Pending Review"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => setReviewed((prev) => ({ ...prev, [index]: "reviewed" }))}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            reviewed[index] === "reviewed"
              ? "bg-yellow-400 text-blue-900"
              : "border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-blue-900"
          }`}
        >
          Review Match
        </button>
        <button
          onClick={() => handleConfirmMatch(match)}
          disabled={isUpdating}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            reviewed[index] === "confirmed"
              ? "bg-green-500 text-white"
              : "bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500 hover:text-white"
          }`}
        >
          {isUpdating ? "Confirming..." : "Confirm Match"}
        </button>
        <button
          onClick={() => handleRejectMatch(match)}
          disabled={isUpdating}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            reviewed[index] === "rejected"
              ? "bg-red-500 text-white"
              : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white"
          }`}
        >
          {isUpdating ? "Rejecting..." : "Reject Match"}
        </button>
      </div>

      {reviewed[index] && (
        <p className="mt-4 text-sm">
          {reviewed[index] === "reviewed" && (
            <span className="text-yellow-400">Match reviewed. Awaiting OSA decision.</span>
          )}
          {reviewed[index] === "confirmed" && (
            <span className="text-green-400">Match confirmed by OSA.</span>
          )}
          {reviewed[index] === "rejected" && (
            <span className="text-red-400">Match rejected by OSA.</span>
          )}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* HEADER */}
      <header className="bg-blue-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-lg font-bold text-blue-900">
              &#128270;
            </div>
            <span className="text-lg font-bold tracking-tight">School Lost &amp; Found</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/" className="transition hover:text-yellow-300">Home</Link>
            <Link href="/found-items" className="transition hover:text-yellow-300">Found Items</Link>
            <Link href="/report-lost" className="transition hover:text-yellow-300">Report Lost</Link>
            <Link href="/report-found" className="transition hover:text-yellow-300">Report Found</Link>
          </nav>
          <a
            href="#"
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-900 transition hover:bg-yellow-400"
          >
            Login
          </a>
        </div>
      </header>

      {/* PAGE TITLE */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-8">
        <h1 className="text-4xl font-black text-blue-400 md:text-5xl">Possible Matches</h1>
        <p className="mt-4 text-lg text-slate-300">
          These are possible matches identified by the system. OSA must review and verify ownership before confirming a match.
        </p>
      </section>

      {/* NOTICE */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="flex items-start gap-4 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xl text-blue-900">
            &#8505;
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-400">Important</p>
            <p className="mt-1 text-slate-300">
              The system only identifies possible matches. OSA must review the actual item and verify ownership before confirming a match.
            </p>
          </div>
        </div>
      </section>

      {/* MATCHES */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {loading ? (
          <p className="py-20 text-center text-lg text-slate-400">Loading possible matches...</p>
        ) : dbError ? (
          <p className="py-20 text-center text-lg text-red-400">{dbError}</p>
        ) : (
          <>
            {notification && (
              <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-center text-green-400">
                {notification}
              </div>
            )}
            {matches.length > 0 ? (
              <div className="space-y-8">
                {matches.map((match, index) => renderMatchCard(match, index))}
              </div>
            ) : (
              <p className="py-20 text-center text-lg text-slate-400">No possible matches found.</p>
            )}
          </>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-lg font-bold">School Lost &amp; Found</p>
              <p className="mt-3 text-sm text-slate-400">
                Helping students recover lost items and reunite them with their belongings.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">Navigation</p>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400">
                <Link href="/" className="transition hover:text-white">Home</Link>
                <Link href="/found-items" className="transition hover:text-yellow-300">Found Items</Link>
                <Link href="/report-lost" className="transition hover:text-yellow-300">Report Lost</Link>
                <Link href="/report-found" className="transition hover:text-yellow-300">Report Found</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">About</p>
              <p className="mt-4 text-sm text-slate-400">For students and OSA</p>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            &copy; 2026 School Lost &amp; Found. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
