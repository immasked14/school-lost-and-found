"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ClaimPage() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get("itemId");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState("");
  const [foundItems, setFoundItems] = useState([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    studentName: "",
    foundItem: "",
    description: "",
    identifyingDetails: "",
    additionalProof: "",
  });

  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from("found_items")
          .select("id, item_name, color, location, status")
          .order("id", { ascending: true });

        if (dbError) {
          setItemsError(dbError.message);
        } else {
          setFoundItems(data ?? []);
        }
      } catch {
        setItemsError("Failed to load found items.");
      } finally {
        setItemsLoading(false);
      }
    };

    fetchFoundItems();
  }, []);

  useEffect(() => {
    if (!itemId || itemsLoading || foundItems.length === 0) return;
    const matched = foundItems.find((item) => String(item.id) === String(itemId));
    if (matched) {
      setForm((prev) => ({ ...prev, foundItem: String(matched.id) }));
    }
  }, [itemId, itemsLoading, foundItems]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhoto(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { error: dbError } = await supabase.from("claims").insert({
      found_item_id: form.foundItem,
      student_name: form.studentName,
      item_description: form.description,
      identifying_details: form.identifyingDetails,
      additional_proof: form.additionalProof,
    });

    setIsLoading(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      setSubmitted(true);
      setPhoto(null);
      setPhotoPreview("");
      setForm({
        studentName: "",
        foundItem: "",
        description: "",
        identifyingDetails: "",
        additionalProof: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* PAGE TITLE */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-8">
        <h1 className="text-4xl font-black text-blue-400 md:text-5xl">Claim &amp; Ownership Verification</h1>
        <p className="mt-4 text-lg text-slate-300">
          Provide information that can help OSA verify that the found item belongs to you.
        </p>
      </section>

      {/* CLAIM FLOW */}
      <section className="mx-auto max-w-3xl px-6 pb-8">
        <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">Claim Flow</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span>Lost Report</span>
            <span className="text-blue-400">&#8594;</span>
            <span>Possible Match</span>
            <span className="text-blue-400">&#8594;</span>
            <span className="font-bold text-yellow-400">Ownership Verification</span>
            <span className="text-blue-400">&#8594;</span>
            <span>OSA Decision</span>
            <span className="text-blue-400">&#8594;</span>
            <span>Returned</span>
          </div>
        </div>
      </section>

      {/* FORM OR SUCCESS */}
      <section className="mx-auto max-w-3xl px-6 pb-20">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-red-400">
            {error}
          </div>
        )}
        {submitted ? (
          <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-3xl text-blue-900">
              &#10003;
            </div>
            <h2 className="mt-4 text-2xl font-black text-blue-400">Claim Request Submitted</h2>
            <p className="mt-2 text-slate-300">
              Your request is now waiting for OSA verification.
            </p>
            <div className="mt-4 inline-block rounded-full bg-yellow-400/20 px-4 py-1.5 text-sm font-semibold text-yellow-400">
              Status: Pending Verification
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 block w-full rounded-full bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500 sm:w-auto sm:px-8"
            >
              Submit Another Claim
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-sm"
          >
            {/* Student Name */}
            <div className="mb-6">
              <label htmlFor="studentName" className="mb-2 block text-sm font-semibold text-slate-300">
                Student Name
              </label>
              <input
                id="studentName"
                name="studentName"
                type="text"
                required
                value={form.studentName}
                onChange={handleChange}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Found Item */}
            <div className="mb-6">
              <label htmlFor="foundItem" className="mb-2 block text-sm font-semibold text-slate-300">
                Found Item
              </label>
              {itemsLoading ? (
                <div className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-400">
                  Loading found items...
                </div>
              ) : itemsError ? (
                <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
                  {itemsError}
                </div>
              ) : foundItems.length === 0 ? (
                <div className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-400">
                  No found items are currently available for claiming.
                </div>
              ) : (
                <select
                  id="foundItem"
                  name="foundItem"
                  required
                  value={form.foundItem}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Select an item to claim</option>
                  {foundItems.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.item_name} ({item.color}, {item.location}, {item.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Item Description */}
            <div className="mb-6">
              <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-300">
                Item Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the item (brand, size, color, markings, etc.)"
                className="w-full resize-none rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Identifying Details */}
            <div className="mb-6">
              <label htmlFor="identifyingDetails" className="mb-2 block text-sm font-semibold text-slate-300">
                Identifying Details
              </label>
              <textarea
                id="identifyingDetails"
                name="identifyingDetails"
                required
                rows={4}
                value={form.identifyingDetails}
                onChange={handleChange}
                placeholder="Share private details only the owner would know (e.g., wallet contents, unique markings, stickers, scratches)"
                className="w-full resize-none rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Additional Proof */}
            <div className="mb-6">
              <label htmlFor="additionalProof" className="mb-2 block text-sm font-semibold text-slate-300">
                Additional Proof
              </label>
              <textarea
                id="additionalProof"
                name="additionalProof"
                rows={3}
                value={form.additionalProof}
                onChange={handleChange}
                placeholder="Any other information that can help prove ownership (optional)"
                className="w-full resize-none rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Photo Upload */}
            <div className="mb-8">
              <label htmlFor="photo" className="mb-2 block text-sm font-semibold text-slate-300">
                Photo Upload (Optional)
              </label>
              <div
                onClick={() => photoInputRef.current?.click()}
                className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-900 py-8 text-slate-400 transition hover:border-blue-500 hover:text-blue-400"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Selected photo preview"
                    className="max-h-64 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-4xl">&#128444;</div>
                    <p className="mt-2 text-sm">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                className="hidden"
                ref={photoInputRef}
                onChange={handlePhotoChange}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Submit Claim Request"}
            </button>

            {/* Notice */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex-shrink-0 text-xl">&#8505;</div>
              <p className="text-sm text-slate-300">
                OSA will review your claim and verify the information before releasing the item. Do not include passwords, PINs, or other sensitive account credentials.
              </p>
            </div>
          </form>
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
                <a href="#" className="transition hover:text-white">Home</a>
                <a href="#" className="transition hover:text-white">Found Items</a>
                <a href="#" className="transition hover:text-white">Report Lost</a>
                <a href="#" className="transition hover:text-white">Report Found</a>
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
