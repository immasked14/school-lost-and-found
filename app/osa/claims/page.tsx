"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { getCurrentProfile } from "../../../lib/profile";

type Claim = {
  id: string;
  found_item_id: string | null;
  student_name: string | null;
  item_description: string | null;
  identifying_details: string | null;
  additional_proof: string | null;
  photo_url: string | null;
  status: string | null;
  created_at: string | null;
};

type FoundItem = {
  id: string;
  item_name: string | null;
  color: string | null;
  location: string | null;
  status: string | null;
};

export default function OsaClaimsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setDbError("");
    const [claimsRes, foundRes] = await Promise.all([
      supabase
        .from("claims")
        .select(
          "id, found_item_id, student_name, item_description, identifying_details, additional_proof, photo_url, status, created_at",
        )
        .eq("status", "Pending Verification")
        .order("created_at", { ascending: false }),
      supabase
        .from("found_items")
        .select("id, item_name, color, location, status"),
    ]);
    if (claimsRes.error) {
      setDbError(claimsRes.error.message);
    } else if (foundRes.error) {
      setDbError(foundRes.error.message);
    } else {
      setClaims((claimsRes.data ?? []) as Claim[]);
      setFoundItems((foundRes.data ?? []) as FoundItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const profile = await getCurrentProfile();
      if (!profile.isAuthenticated || profile.role !== "osa") {
        router.push("/login");
        return;
      }
      setIsAuthorized(true);
      fetchData();
    };
    checkAuth();
  }, [router]);

  const findItem = (id: string | null) =>
    foundItems.find((f) => f.id === id) ?? null;
  const handleApprove = async (claim: Claim) => {
    setUpdatingId(claim.id);
    const { error } = await supabase.rpc("osa_review_claim", {
      p_claim_id: claim.id,
      p_status: "Approved",
    });
    setUpdatingId(null);
    if (error) setDbError(error.message);
    else fetchData();
  };

  const handleReject = async (claim: Claim) => {
    setUpdatingId(claim.id);
    const { error } = await supabase.rpc("osa_review_claim", {
      p_claim_id: claim.id,
      p_status: "Rejected",
    });
    setUpdatingId(null);
    if (error) setDbError(error.message);
    else fetchData();
  };

  const handleRelease = async (claim: Claim) => {
    setUpdatingId(claim.id);
    const { error } = await supabase.rpc("osa_release_claim", {
      p_claim_id: claim.id,
    });
    setUpdatingId(null);
    if (error) setDbError(error.message);
    else fetchData();
  };

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100">
        <p className="text-slate-400">Verifying access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-8">
        <h1 className="text-3xl font-black text-blue-400">Pending Claims</h1>
        <p className="mt-2 text-slate-400">
          Review and verify ownership claims submitted by students.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        {loading ? (
          <p className="py-16 text-center text-slate-500">Loading claims…</p>
        ) : dbError ? (
          <p className="py-16 text-center text-red-400">{dbError}</p>
        ) : claims.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 px-6 py-10 text-center text-sm text-slate-500">
            No claims submitted.
          </p>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const item = findItem(claim.found_item_id);
              return (
                <div
                  key={claim.id}
                  className="rounded-2xl border border-slate-700/80 bg-slate-800/60 p-5"
                >
                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">Student</p>
                      <p className="font-medium text-slate-100">
                        {claim.student_name ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Item</p>
                      <p className="font-medium text-slate-100">
                        {item?.item_name ?? claim.item_description ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="font-medium text-slate-100">
                        {claim.status ?? "Pending Verification"}
                      </p>
                    </div>
                  </div>
                  {claim.identifying_details && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500">Identifying details</p>
                      <p className="text-slate-300">{claim.identifying_details}</p>
                    </div>
                  )}
                  {claim.additional_proof && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500">Additional proof</p>
                      <p className="text-slate-300">{claim.additional_proof}</p>
                    </div>
                  )}
                  {claim.photo_url && (
                    <img
                      src={claim.photo_url}
                      alt="Claim photo"
                      className="mt-3 max-h-48 rounded-xl object-contain"
                    />
                  )}
                  <div className="mt-4 flex gap-2">
                    {claim.status === "Pending Verification" && (
                      <>
                        <button
                          onClick={() => handleApprove(claim)}
                          disabled={updatingId === claim.id}
                          className="rounded-full bg-green-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(claim)}
                          disabled={updatingId === claim.id}
                          className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {claim.status === "Approved" && (
                      <button
                        onClick={() => handleRelease(claim)}
                        disabled={updatingId === claim.id}
                        className="rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Release Item
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-slate-500">
          <Link href="/osa" className="hover:text-slate-300">
            Back to Dashboard
          </Link>
        </div>
      </footer>
    </div>
  );
}
