"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

function safeEqual(a, b) {
  const sa = (a ?? "").toString().toLowerCase();
  const sb = (b ?? "").toString().toLowerCase();
  return sa === sb;
}

function isMatch(lost, found) {
  if (safeEqual(lost.status, "Matched") || safeEqual(lost.status, "No Match"))
    return false;
  if (safeEqual(found.status, "Matched") || safeEqual(found.status, "No Match"))
    return false;
  let score = 0;
  if (safeEqual(lost.item_name, found.item_name)) score++;
  if (safeEqual(lost.item_type, found.item_type)) score++;
  if (safeEqual(lost.color, found.color)) score++;
  if (safeEqual(lost.location, found.location)) score++;
  if (safeEqual(lost.description, found.description)) score++;
  return score >= 3;
}

function statusColor(status) {
  if (
    status === "Closed" ||
    status === "Claimed" ||
    status === "Matched" ||
    status === "Approved"
  ) {
    return "bg-green-500/20 text-green-400";
  }
  if (status === "At OSA" || status === "Possible Match") {
    return "bg-blue-500/20 text-blue-400";
  }
  if (status === "Rejected") {
    return "bg-red-500/20 text-red-400";
  }
  return "bg-yellow-400/20 text-yellow-400";
}

export default function OsaDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingClaimId, setUpdatingClaimId] = useState(null);

  const fetchData = async () => {
    try {
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
      } else if (foundRes.error) {
        setDbError(foundRes.error.message);
      } else if (claimsRes.error) {
        setDbError(claimsRes.error.message);
      } else {
        const lost = lostRes.data ?? [];
        const found = foundRes.data ?? [];
        const claimsData = claimsRes.data ?? [];

        let matchCount = 0;
        for (let i = 0; i < lost.length; i++) {
          for (let j = 0; j < found.length; j++) {
            if (isMatch(lost[i], found[j])) {
              matchCount++;
            }
          }
        }
        setMatchesCount(matchCount);

        let pendingCount = 0;
        for (let i = 0; i < claimsData.length; i++) {
          if (safeEqual(claimsData[i].status, "Pending Verification")) {
            pendingCount++;
          }
        }
        setPendingClaimsCount(pendingCount);

        setLostItems(lost);
        setFoundItems(found);
        setClaims(claimsData);
      }
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
  }, []);

  const pendingClaims = [];
  for (let i = 0; i < claims.length; i++) {
    if (safeEqual(claims[i].status, "Pending Verification")) {
      pendingClaims.push(claims[i]);
    }
  }

  const pendingLostItems = [];
  const reviewedLostItems = [];
  for (let i = 0; i < lostItems.length; i++) {
    if (safeEqual(lostItems[i].status, "Pending Review")) {
      pendingLostItems.push(lostItems[i]);
    } else {
      reviewedLostItems.push(lostItems[i]);
    }
  }

  const pendingFoundItems = [];
  const reviewedFoundItems = [];
  for (let i = 0; i < foundItems.length; i++) {
    if (safeEqual(foundItems[i].status, "Pending Review")) {
      pendingFoundItems.push(foundItems[i]);
    } else {
      reviewedFoundItems.push(foundItems[i]);
    }
  }

  const handleApprove = async () => {
    if (!selectedItem || !selectedType) return;
    setIsUpdating(true);
    let error;
    if (selectedType === "lost") {
      const { error: err } = await supabase
        .from("lost_items")
        .update({ status: "Approved" })
        .eq("id", selectedItem.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("found_items")
        .update({ status: "Approved" })
        .eq("id", selectedItem.id);
      error = err;
    }
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
    let error;
    if (selectedType === "lost") {
      const { error: err } = await supabase
        .from("lost_items")
        .update({ status: "Rejected" })
        .eq("id", selectedItem.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("found_items")
        .update({ status: "Rejected" })
        .eq("id", selectedItem.id);
      error = err;
    }
    setIsUpdating(false);
    if (!error) {
      setSelectedItem(null);
      setSelectedType(null);
      fetchData();
    } else {
      setDbError(error.message);
    }
  };

  const handleClaimApprove = async (claim) => {
    setUpdatingClaimId(claim.id);
    const { error } = await supabase
      .from("claims")
      .update({ status: "Approved" })
      .eq("id", claim.id);
    setUpdatingClaimId(null);
    if (!error) {
      fetchData();
    } else {
      setDbError(error.message);
    }
  };

  const handleClaimReject = async (claim) => {
    setUpdatingClaimId(claim.id);
    const { error } = await supabase
      .from("claims")
      .update({ status: "Rejected" })
      .eq("id", claim.id);
    setUpdatingClaimId(null);
    if (!error) {
      fetchData();
    } else {
      setDbError(error.message);
    }
  };

  const handleReviewLost = (item) => {
    setSelectedItem(item);
    setSelectedType("lost");
  };

  const handleReviewFound = (item) => {
    setSelectedItem(item);
    setSelectedType("found");
  };

  const handleViewClaim = (claim) => {
    setSelectedClaim(claim);
  };

  const handleCloseClaim = () => {
    setSelectedClaim(null);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
    setSelectedType(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-400 text-xl font-bold text-blue-900">
            &#128270;
          </div>
          <p className="mt-4 text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* PAGE TITLE */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-8">
        <h1 className="text-4xl font-black text-blue-400 md:text-5xl">
          Dashboard
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Manage lost reports, found items, possible matches, and claim
          requests.
        </p>
      </section>

      {/* SUMMARY CARDS */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Lost Reports
            </p>
            <p className="mt-2 text-4xl font-black text-blue-400">
              {loading ? "..." : lostItems.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Found Items
            </p>
            <p className="mt-2 text-4xl font-black text-yellow-400">
              {loading ? "..." : foundItems.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Possible Matches
            </p>
            <p className="mt-2 text-4xl font-black text-blue-400">
              {loading ? "..." : matchesCount}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Pending Claims
            </p>
            <p className="mt-2 text-4xl font-black text-yellow-400">
              {loading ? "..." : pendingClaimsCount}
            </p>
          </div>
        </div>
      </section>

      {/* ITEM DETAIL VIEW */}
      {selectedItem && selectedType && (
        <section className="mx-auto max-w-6xl px-6 pb-10">
          <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                  {selectedType === "lost" ? "Lost Item" : "Found Item"} —
                  Detail View
                </p>
                <h2 className="mt-1 text-2xl font-black text-blue-400">
                  {selectedItem.item_name ?? "N/A"}
                </h2>
              </div>
              <button
                onClick={handleCloseDetail}
                className="rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-600"
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <div>
                <p className="text-xs text-slate-400">Type</p>
                <p className="text-sm font-medium text-slate-100">
                  {selectedItem.item_type ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Color</p>
                <p className="text-sm font-medium text-slate-100">
                  {selectedItem.color ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Location</p>
                <p className="text-sm font-medium text-slate-100">
                  {selectedItem.location ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Date</p>
                <p className="text-sm font-medium text-slate-100">
                  {selectedType === "lost"
                    ? (selectedItem.date_lost ?? "N/A")
                    : (selectedItem.date_found ?? "N/A")}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <p className="text-sm font-medium text-slate-100">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(selectedItem.status)}`}
                  >
                    {selectedItem.status ?? "Pending Review"}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleApprove}
                disabled={isUpdating}
                className="rounded-full bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? "Approving..." : "Approve"}
              </button>
              <button
                onClick={handleReject}
                disabled={isUpdating}
                className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* OSA NOTICE */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6 shadow-sm">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xl text-blue-900">
              &#8505;
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-400">
                OSA Review Required
              </p>
              <p className="mt-1 text-slate-300">
                OSA reviews submitted reports and verifies ownership before
                releasing found items.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 shadow-sm">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-400 text-xl text-blue-900">
              &#9201;
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-400">
                Working Hours
              </p>
              <p className="mt-1 text-slate-300">
                OSA working hours: 8:00 AM – 5:00 PM
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT LOST REPORTS */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        {loading ? (
          <p className="py-10 text-center text-lg text-slate-400">
            Loading dashboard data...
          </p>
        ) : dbError ? (
          <p className="py-10 text-center text-lg text-red-400">{dbError}</p>
        ) : (
          <>
            <h2 className="text-2xl font-black text-blue-400">
              Recent Lost Reports
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-sm font-semibold text-slate-400">
                    <th className="py-3 pr-4">Item</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Color</th>
                    <th className="py-3 pr-4">Location</th>
                    <th className="py-3 pr-4">Date Lost</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLostItems.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-slate-800 text-sm"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-100">
                        {report.item_name ?? "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {report.item_type ?? "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {report.color ?? "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {report.location ?? "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {report.date_lost ?? "N/A"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(report.status)}`}
                        >
                          {report.status ?? "Pending Review"}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleReviewLost(report)}
                          className="inline-block rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* REVIEWD LOST REPORTS */}
      {reviewedLostItems.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-10">
          <h2 className="text-2xl font-black text-slate-400">
            Reviewed Lost Reports
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-slate-700 text-sm font-semibold text-slate-400">
                  <th className="py-3 pr-4">Item</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Color</th>
                  <th className="py-3 pr-4">Location</th>
                  <th className="py-3 pr-4">Date Lost</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviewedLostItems.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-slate-800 text-sm"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-100">
                      {report.item_name ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {report.item_type ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {report.color ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {report.location ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {report.date_lost ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(report.status)}`}
                      >
                        {report.status ?? "Pending Review"}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleReviewLost(report)}
                        className="inline-block rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* RECENT FOUND ITEMS */}
      <section className="mx-auto max-w-6xl pb-10">
        {loading ? null : dbError ? null : (
          <>
            <h2 className="text-2xl font-black text-blue-400">
              Recent Found Items
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-sm font-semibold text-slate-400">
                    <th className="py-3 pr-4">Item</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Location Found</th>
                    <th className="py-3 pr-4">Date Found</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFoundItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800 text-sm"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-100">
                        {item.item_name ?? "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {item.item_type ?? "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {item.location ?? "N/A"}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">
                        {item.date_found ?? "N/A"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(item.status)}`}
                        >
                          {item.status ?? "Pending Review"}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleReviewFound(item)}
                          className="inline-block rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* REVIEWD FOUND ITEMS */}
      {reviewedFoundItems.length > 0 && (
        <section className="mx-auto max-w-6xl pb-10">
          <h2 className="text-2xl font-black text-slate-400">
            Reviewed Found Items
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-slate-700 text-sm font-semibold text-slate-400">
                  <th className="py-3 pr-4">Item</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Location Found</th>
                  <th className="py-3 pr-4">Date Found</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviewedFoundItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-800 text-sm"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-100">
                      {item.item_name ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {item.item_type ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {item.location ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {item.date_found ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(item.status)}`}
                      >
                        {item.status ?? "Pending Review"}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleReviewFound(item)}
                        className="inline-block rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                      >
                        Review
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
      <section className="mx-auto max-w-6xl pb-20">
        {loading ? (
          <p className="py-10 text-center text-lg text-slate-400">
            Loading claims...
          </p>
        ) : dbError ? (
          <p className="py-10 text-center text-lg text-red-400">{dbError}</p>
        ) : (
          <>
            <h2 className="text-2xl font-black text-blue-400">
              Pending Claims
            </h2>
            <div className="mt-4 space-y-4">
              {pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-400">Item</p>
                      <p className="font-medium text-slate-100">
                        {claim.item_description ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Student</p>
                      <p className="font-medium text-slate-100">
                        {claim.student_name ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Date</p>
                      <p className="font-medium text-slate-100">
                        {claim.created_at ?? "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(claim.status)}`}
                    >
                      {claim.status ?? "Pending Verification"}
                    </span>
                    <button
                      onClick={() => handleViewClaim(claim)}
                      className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                    >
                      View Claim
                    </button>
                    <button
                      onClick={() => handleClaimApprove(claim)}
                      disabled={updatingClaimId === claim.id}
                      className="rounded-full bg-green-500/20 px-4 py-2 text-xs font-semibold text-green-400 border border-green-500/40 transition hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingClaimId === claim.id
                        ? "Approving..."
                        : "Approve"}
                    </button>
                    <button
                      onClick={() => handleClaimReject(claim)}
                      disabled={updatingClaimId === claim.id}
                      className="rounded-full bg-red-500/20 px-4 py-2 text-xs font-semibold text-red-400 border border-red-500/40 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingClaimId === claim.id ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* CLAIM DETAILS MODAL */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-blue-400">
                Claim Details
              </h2>
              <button
                onClick={handleCloseClaim}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-300 transition hover:bg-slate-600"
              >
                &#10005;
              </button>
            </div>
            {selectedClaim.photo_url && (
              <img
                src={selectedClaim.photo_url}
                alt="Claim photo"
                className="mb-6 max-h-64 w-full rounded-xl object-contain"
              />
            )}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">
                  Student Name
                </span>
                <span className="text-slate-100">
                  {selectedClaim.student_name ?? "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">
                  Item Description
                </span>
                <span className="text-slate-100">
                  {selectedClaim.item_description ?? "N/A"}
                </span>
              </div>
              {selectedClaim.identifying_details && (
                <div className="pt-2">
                  <span className="font-semibold text-slate-400">
                    Identifying Details
                  </span>
                  <p className="mt-1 text-slate-300">
                    {selectedClaim.identifying_details}
                  </p>
                </div>
              )}
              {selectedClaim.additional_proof && (
                <div className="pt-2">
                  <span className="font-semibold text-slate-400">
                    Additional Proof
                  </span>
                  <p className="mt-1 text-slate-300">
                    {selectedClaim.additional_proof}
                  </p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Status</span>
                <span className="text-slate-100">
                  {selectedClaim.status ?? "Pending Verification"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">
                  Date Submitted
                </span>
                <span className="text-slate-100">
                  {selectedClaim.created_at ?? "N/A"}
                </span>
              </div>
            </div>
            <button
              onClick={handleCloseClaim}
              className="mt-6 w-full rounded-full bg-blue-600 py-3 text-base font-bold text-white transition hover:bg-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="text-lg font-bold">School Lost &amp; Found</p>
              <p className="mt-3 text-sm text-slate-400">
                Helping students recover lost items and reunite them with their
                belongings.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                Navigation
              </p>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400">
                <a href="#" className="transition hover:text-white">
                  Home
                </a>
                <a href="#" className="transition hover:text-white">
                  Found Items
                </a>
                <a href="#" className="transition hover:text-white">
                  Report Lost
                </a>
                <a href="#" className="transition hover:text-white">
                  Report Found
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                About
              </p>
              <p className="mt-4 text-sm text-slate-400">
                For students and OSA
              </p>
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
