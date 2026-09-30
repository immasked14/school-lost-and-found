"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { Claim, FoundItem, LostItem } from "@/lib/types";

function safeEqual(a: unknown, b: string) {
  return (a ?? "").toString().toLowerCase() === b.toLowerCase();
}

function isMatch(
  lost: {
    status?: string;
    item_name?: string;
    item_type?: string;
    color?: string;
    location?: string;
  },
  found: {
    status?: string;
    item_name?: string;
    item_type?: string;
    color?: string;
    location?: string;
  },
) {
  if (safeEqual(lost.status, "Matched") || safeEqual(lost.status, "No Match"))
    return false;
  if (safeEqual(found.status, "Matched") || safeEqual(found.status, "No Match"))
    return false;

  let score = 0;
  if (safeEqual(lost.item_name, found.item_name ?? "")) score++;
  if (safeEqual(lost.item_type, found.item_type ?? "")) score++;
  if (safeEqual(lost.color, found.color ?? "")) score++;
  if (safeEqual(lost.location, found.location ?? "")) score++;
  return score >= 3;
}

function statusColor(status?: string) {
  if (!status) return "bg-yellow-400/20 text-yellow-400";
  if (["Closed", "Claimed", "Matched", "Approved"].includes(status)) {
    return "bg-green-500/20 text-green-400";
  }
  if (["At OSA", "Possible Match"].includes(status)) {
    return "bg-blue-500/20 text-blue-400";
  }
  if (status === "Rejected") return "bg-red-500/20 text-red-400";
  return "bg-yellow-400/20 text-yellow-400";
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function OsaDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [selectedItem, setSelectedItem] = useState<LostItem | FoundItem | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<"lost" | "found" | null>(
    null,
  );
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingClaimId, setUpdatingClaimId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setDbError("");
      const [lostRes, foundRes, claimsRes] = await Promise.all([
        supabase
          .from("lost_items")
          .select(
            "id, item_name, item_type, color, location, date_lost, status",
          ),
        supabase
          .from("found_items")
          .select(
            "id, item_name, item_type, color, location, date_found, status",
          ),
        supabase
          .from("claims")
          .select(
            "id, found_item_id, student_name, item_description, identifying_details, additional_proof, photo_url, status, created_at",
          ),
      ]);

      if (lostRes.error) {
        setDbError(lostRes.error.message);
        return;
      }
      if (foundRes.error) {
        setDbError(foundRes.error.message);
        return;
      }
      if (claimsRes.error) {
        setDbError(claimsRes.error.message);
        return;
      }

      const lost = lostRes.data ?? [];
      const found = foundRes.data ?? [];
      const claimsData = claimsRes.data ?? [];

      let matchCount = 0;
      for (const l of lost) {
        for (const f of found) {
          if (isMatch(l, f)) matchCount++;
        }
      }
      setMatchesCount(matchCount);

      setPendingClaimsCount(
        claimsData.filter((c) => safeEqual(c.status, "Pending Verification"))
          .length,
      );
      setLostItems(lost);
      setFoundItems(found);
      setClaims(claimsData);
    } catch {
      setDbError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.user_metadata?.role !== "osa") {
        router.push("/");
        return;
      }
      setIsAuthorized(true);
      fetchData();
    };
    checkAuth();
  }, [router]);

  const pendingClaims = useMemo(
    () => claims.filter((c) => safeEqual(c.status, "Pending Verification")),
    [claims],
  );

  const pendingLostItems = useMemo(
    () => lostItems.filter((i) => safeEqual(i.status, "Pending Review")),
    [lostItems],
  );
  const reviewedLostItems = useMemo(
    () => lostItems.filter((i) => !safeEqual(i.status, "Pending Review")),
    [lostItems],
  );

  const pendingFoundItems = useMemo(
    () => foundItems.filter((i) => safeEqual(i.status, "Pending Review")),
    [foundItems],
  );
  const reviewedFoundItems = useMemo(
    () => foundItems.filter((i) => !safeEqual(i.status, "Pending Review")),
    [foundItems],
  );

  const handleApprove = async () => {
    if (!selectedItem || !selectedType) return;
    setIsUpdating(true);
    const table = selectedType === "lost" ? "lost_items" : "found_items";
    const { error } = await supabase
      .from(table)
      .update({ status: "Approved" })
      .eq("id", selectedItem.id);
    setIsUpdating(false);
    if (!error) {
      setSelectedItem(null);
      setSelectedType(null);
      fetchData();
    } else {
      setDbError(error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !selectedType) return;
    setIsUpdating(true);
    const table = selectedType === "lost" ? "lost_items" : "found_items";
    const { error } = await supabase
      .from(table)
      .update({ status: "Rejected" })
      .eq("id", selectedItem.id);
    setIsUpdating(false);
    if (!error) {
      setSelectedItem(null);
      setSelectedType(null);
      fetchData();
    } else {
      setDbError(error.message);
    }
  };

  const handleClaimApprove = async (claim: Claim) => {
    setUpdatingClaimId(claim.id);
    const { error } = await supabase
      .from("claims")
      .update({ status: "Approved" })
      .eq("id", claim.id);
    setUpdatingClaimId(null);
    if (!error) fetchData();
    else setDbError(error.message);
  };

  const handleClaimReject = async (claim: Claim) => {
    setUpdatingClaimId(claim.id);
    const { error } = await supabase
      .from("claims")
      .update({ status: "Rejected" })
      .eq("id", claim.id);
    setUpdatingClaimId(null);
    if (!error) fetchData();
    else setDbError(error.message);
  };

  const handleReviewLost = (item: LostItem) => {
    setSelectedItem(item);
    setSelectedType("lost");
  };

  const handleReviewFound = (item: FoundItem) => {
    setSelectedItem(item);
    setSelectedType("found");
  };

  const handleViewClaim = (claim: Claim) => setSelectedClaim(claim);
  const handleCloseClaim = () => setSelectedClaim(null);
  const handleCloseDetail = () => {
    setSelectedItem(null);
    setSelectedType(null);
  };

  useEffect(() => {
    const isModalOpen = Boolean(selectedItem) || Boolean(selectedClaim);
    if (!isModalOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedItem, selectedClaim]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-400 text-xl font-bold text-blue-900">
            🔍
          </div>
          <p className="mt-4 text-slate-400">Verifying access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* PAGE TITLE */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-8">
        <h1 className="text-3xl font-black tracking-tight text-blue-400 md:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Review lost reports, found items, possible matches, and ownership
          claims.
        </p>
      </section>

      {/* SUMMARY CARDS */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Lost Reports",
              value: lostItems.length,
              accent: "text-blue-400",
            },
            {
              label: "Found Items",
              value: foundItems.length,
              accent: "text-yellow-400",
            },
            {
              label: "Possible Matches",
              value: matchesCount,
              accent: "text-blue-400",
            },
            {
              label: "Pending Claims",
              value: pendingClaimsCount,
              accent: "text-yellow-400",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
              <p
                className={`mt-2 text-3xl font-black tabular-nums ${card.accent}`}
              >
                {loading ? "—" : card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* OSA NOTICE */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-4 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-lg text-blue-900">
              ℹ
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-400">
                OSA review required
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Verify ownership before releasing found items.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-400 text-lg text-blue-900">
              ⏱
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-400">
                Working hours
              </p>
              <p className="mt-1 text-sm text-slate-300">8:00 AM – 5:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* TABLES + CLAIMS */}
      {loading ? (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <p className="py-16 text-center text-slate-500">Loading dashboard…</p>
        </section>
      ) : dbError ? (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <p className="py-16 text-center text-red-400">{dbError}</p>
        </section>
      ) : (
        <>
          {/* PENDING LOST */}
          <section className="mx-auto max-w-6xl px-6 pb-10">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-bold text-blue-400">
                Pending Lost Reports
              </h2>
              <span className="text-sm tabular-nums text-slate-500">
                {pendingLostItems.length}
              </span>
            </div>
            {pendingLostItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 px-6 py-10 text-center text-sm text-slate-500">
                No pending lost reports
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-700/80">
                <table className="w-full min-w-160 text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Date Lost</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pendingLostItems.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium text-slate-100">
                          {report.item_name ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {report.item_type ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {report.color ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {report.location ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {formatDate(report.date_lost)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(report.status)}`}
                          >
                            {report.status ?? "Pending Review"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleReviewLost(report)}
                            className="rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 hover:cursor-pointer"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* REVIEWED LOST */}
          {reviewedLostItems.length > 0 && (
            <section className="mx-auto max-w-6xl px-6 pb-10">
              <h2 className="mb-4 text-xl font-bold text-slate-400">
                Reviewed Lost Reports
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-700/60">
                <table className="w-full min-w-160 text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/40 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Date Lost</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {reviewedLostItems.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {report.item_name ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {report.item_type ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {report.color ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {report.location ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(report.date_lost)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(report.status)}`}
                          >
                            {report.status ?? "Pending Review"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleReviewLost(report)}
                            className="rounded-full bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-600 hover:cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* PENDING FOUND */}
          <section className="mx-auto max-w-6xl px-6 pb-10">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-bold text-blue-400">
                Pending Found Items
              </h2>
              <span className="text-sm tabular-nums text-slate-500">
                {pendingFoundItems.length}
              </span>
            </div>
            {pendingFoundItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 px-6 py-10 text-center text-sm text-slate-500">
                No pending found items
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-700/80">
                <table className="w-full min-w-140 text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Date Found</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pendingFoundItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium text-slate-100">
                          {item.item_name ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {item.item_type ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {item.location ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {formatDate(item.date_found)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(item.status)}`}
                          >
                            {item.status ?? "Pending Review"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleReviewFound(item)}
                            className="rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 hover:cursor-pointer"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* REVIEWED FOUND */}
          {reviewedFoundItems.length > 0 && (
            <section className="mx-auto max-w-6xl px-6 pb-10">
              <h2 className="mb-4 text-xl font-bold text-slate-400">
                Reviewed Found Items
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-700/60">
                <table className="w-full min-w-140 text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/40 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Date Found</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {reviewedFoundItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {item.item_name ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {item.item_type ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {item.location ?? "N/A"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(item.date_found)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(item.status)}`}
                          >
                            {item.status ?? "Pending Review"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleReviewFound(item)}
                            className="rounded-full bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-600 hover:cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* PENDING CLAIMS */}
          <section className="mx-auto max-w-6xl px-6 pb-20">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-bold text-blue-400">
                Pending Claims
              </h2>
              <span className="text-sm tabular-nums text-slate-500">
                {pendingClaims.length}
              </span>
            </div>

            {pendingClaims.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 px-6 py-10 text-center text-sm text-slate-500">
                No pending claims
              </p>
            ) : (
              <div className="space-y-3">
                {pendingClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-700/80 bg-slate-800/60 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="grid flex-1 gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-500">Item</p>
                        <p className="font-medium text-slate-100">
                          {claim.item_description ?? "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Student</p>
                        <p className="font-medium text-slate-100">
                          {claim.student_name ?? "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Submitted</p>
                        <p className="font-medium text-slate-100">
                          {formatDate(claim.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(claim.status)}`}
                      >
                        {claim.status ?? "Pending Verification"}
                      </span>
                      <button
                        onClick={() => handleViewClaim(claim)}
                        className="rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 hover:cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleClaimApprove(claim)}
                        disabled={updatingClaimId === claim.id}
                        className="rounded-full border border-green-500/40 bg-green-500/15 px-3.5 py-1.5 text-xs font-semibold text-green-400 transition hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingClaimId === claim.id ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => handleClaimReject(claim)}
                        disabled={updatingClaimId === claim.id}
                        className="rounded-full border border-red-500/40 bg-red-500/15 px-3.5 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingClaimId === claim.id ? "…" : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ITEM DETAIL MODAL */}
      {selectedItem && selectedType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={handleCloseDetail}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                  {selectedType === "lost" ? "Lost Item" : "Found Item"} ·
                  Detail
                </p>
                <h2 className="mt-0.5 text-lg font-bold text-blue-400">
                  {selectedItem.item_name ?? "Untitled item"}
                </h2>
              </div>
              <button
                onClick={handleCloseDetail}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-300 transition hover:bg-slate-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Type</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-100">
                    {selectedItem.item_type ?? "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Color</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-100">
                    {selectedItem.color ?? "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Location</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-100">
                    {selectedItem.location ?? "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Date</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-100">
                    {selectedType === "lost"
                      ? formatDate((selectedItem as LostItem).date_lost)
                      : formatDate((selectedItem as FoundItem).date_found)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(selectedItem.status)}`}
                    >
                      {selectedItem.status ?? "Pending Review"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Only show actions while still pending */}
            {safeEqual(selectedItem.status, "Pending Review") && (
              <div className="flex flex-wrap gap-3 border-t border-slate-700 px-6 py-4">
                <button
                  onClick={handleApprove}
                  disabled={isUpdating}
                  className="flex-1 rounded-full bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? "Approving…" : "Approve"}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isUpdating}
                  className="flex-1 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? "Rejecting…" : "Reject"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLAIM MODAL */}
      {selectedClaim && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={handleCloseClaim}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-bold text-blue-400">Claim Details</h2>
              <button
                onClick={handleCloseClaim}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-300 transition hover:bg-slate-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {selectedClaim.photo_url && (
                <img
                  src={selectedClaim.photo_url}
                  alt="Claim photo"
                  className="mb-5 max-h-56 w-full rounded-xl object-contain bg-slate-900"
                />
              )}

              <dl className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Student</dt>
                  <dd className="text-right font-medium text-slate-100">
                    {selectedClaim.student_name ?? "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Item</dt>
                  <dd className="text-right font-medium text-slate-100">
                    {selectedClaim.item_description ?? "N/A"}
                  </dd>
                </div>
                {selectedClaim.identifying_details && (
                  <div>
                    <dt className="text-slate-500">Identifying details</dt>
                    <dd className="mt-1 text-slate-300">
                      {selectedClaim.identifying_details}
                    </dd>
                  </div>
                )}
                {selectedClaim.additional_proof && (
                  <div>
                    <dt className="text-slate-500">Additional proof</dt>
                    <dd className="mt-1 text-slate-300">
                      {selectedClaim.additional_proof}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(selectedClaim.status)}`}
                    >
                      {selectedClaim.status ?? "Pending Verification"}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Submitted</dt>
                  <dd className="text-slate-300">
                    {formatDate(selectedClaim.created_at)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-slate-700 px-6 py-4">
              <button
                onClick={handleCloseClaim}
                className="w-full rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-semibold text-slate-100">
                School Lost & Found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Helping students recover lost items.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-yellow-500/90">
                Navigation
              </p>
              <div className="mt-3 flex flex-col gap-1.5 text-sm text-slate-500">
                <Link href="/" className="transition hover:text-slate-200">
                  Home
                </Link>
                <a href="/found" className="transition hover:text-slate-200">
                  Found Items
                </a>
                <a
                  href="/report-lost"
                  className="transition hover:text-slate-200"
                >
                  Report Lost
                </a>
                <a
                  href="/report-found"
                  className="transition hover:text-slate-200"
                >
                  Report Found
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-yellow-500/90">
                About
              </p>
              <p className="mt-3 text-sm text-slate-500">
                For students and OSA staff
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
            © 2026 School Lost & Found
          </div>
        </div>
      </footer>
    </div>
  );
}
