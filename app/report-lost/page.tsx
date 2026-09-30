"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ReportLostPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    itemName: "",
    itemType: "",
    description: "",
    color: "",
    locationLost: "",
    dateLost: "",
    additionalDetails: "",
    floor: "",
    room: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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

    const { error: dbError } = await supabase.from("lost_items").insert({
      item_name: form.itemName,
      item_type: form.itemType,
      color: form.color,
      description: form.description,
      location: form.locationLost,
      floor: form.floor,
      room_code: form.room,
      date_lost: form.dateLost,
      additional_details: form.additionalDetails,
    });

    setIsLoading(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      setSubmitted(true);
      setForm({
        itemName: "",
        itemType: "",
        description: "",
        color: "",
        locationLost: "",
        dateLost: "",
        additionalDetails: "",
        floor: "",
        room: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* PAGE TITLE */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-8">
        <h1 className="text-4xl font-black text-blue-400 md:text-5xl">
          Report Lost Item
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Provide enough details so OSA can help identify a possible match.
        </p>
      </section>

      {/* FORM */}
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
            <h2 className="mt-4 text-2xl font-black text-blue-400">
              Report Submitted
            </h2>
            <p className="mt-2 text-slate-300">
              Your lost item report has been received. OSA will review it and
              update you soon.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Submit Another Report
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-sm"
          >
            {/* Item Name */}
            <div className="mb-6">
              <label
                htmlFor="itemName"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Item Name
              </label>
              <input
                id="itemName"
                name="itemName"
                type="text"
                required
                value={form.itemName}
                onChange={handleChange}
                placeholder="e.g. Black Wallet"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Item Type and Color */}
            <div className="mb-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="itemType"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Item Type
                </label>
                <select
                  id="itemType"
                  name="itemType"
                  required
                  value={form.itemType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Select Type</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="accessories">Accessories</option>
                  <option value="school-supplies">School Supplies</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="color"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Color
                </label>
                <select
                  id="color"
                  name="color"
                  required
                  value={form.color}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Select Color</option>
                  <option value="black">Black</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="white">White</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the item in detail (brand, size, markings, etc.)"
                className="w-full resize-none rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Location Lost and Date Lost */}
            <div className="mb-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="locationLost"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Location Lost
                </label>
                <select
                  id="locationLost"
                  name="locationLost"
                  required
                  value={form.locationLost}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Select Location</option>
                  <option value="canteen">Canteen</option>
                  <option value="cr">CR</option>
                  <option value="gym">Gym</option>
                  <option value="clinic">Clinic</option>
                  <option value="laboratory">Laboratory Room</option>
                  <option value="classroom">Classroom</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="dateLost"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Date Lost
                </label>
                <input
                  id="dateLost"
                  name="dateLost"
                  type="date"
                  required
                  value={form.dateLost}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Floor and Room - only shown when Classroom is selected */}
            {form.locationLost === "classroom" && (
              <div className="mb-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="floor"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                  >
                    Floor
                  </label>
                  <select
                    id="floor"
                    name="floor"
                    value={form.floor}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="">Select Floor</option>
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                    <option value="4">4th Floor</option>
                    <option value="5">5th Floor</option>
                    <option value="6">6th Floor</option>
                    <option value="7">7th Floor</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="room"
                    className="mb-2 block text-sm font-semibold text-slate-300"
                  >
                    Room
                  </label>
                  <input
                    id="room"
                    name="room"
                    type="text"
                    value={form.room}
                    onChange={handleChange}
                    placeholder="e.g. D42"
                    className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="mb-6">
              <label
                htmlFor="additionalDetails"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Additional Details
              </label>
              <textarea
                id="additionalDetails"
                name="additionalDetails"
                rows={3}
                value={form.additionalDetails}
                onChange={handleChange}
                placeholder="Anything else that might help identify the item (optional)"
                className="w-full resize-none rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Photo Upload */}
            <div className="mb-8">
              <label
                htmlFor="photo"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Photo (Optional)
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
                    <p className="mt-2 text-sm">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">
                      PNG, JPG up to 10MB
                    </p>
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
              className="w-full rounded-full bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500"
            >
              Submit Lost Item Report
            </button>

            {/* Notice */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex-shrink-0 text-xl">&#8505;</div>
              <p className="text-sm text-slate-300">
                Your report will be reviewed by OSA. Submitting a report does
                not guarantee that a match will be found.
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
                Helping students recover lost items and reunite them with their
                belongings.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
                Navigation
              </p>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400">
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>
                <Link
                  href="/found-items"
                  className="transition hover:text-white"
                >
                  Found Items
                </Link>
                <Link
                  href="/report-lost"
                  className="transition hover:text-white"
                >
                  Report Lost
                </Link>
                <Link
                  href="/report-found"
                  className="transition hover:text-white"
                >
                  Report Found
                </Link>
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
