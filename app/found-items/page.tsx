"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

function stringContains(str, sub) {
  const safeStr = (str ?? "").toString();
  const safeSub = (sub ?? "").toString();
  const lowerStr = safeStr.toLowerCase();
  const lowerSub = safeSub.toLowerCase();
  for (let i = 0; i <= lowerStr.length - lowerSub.length; i++) {
    let match = true;
    for (let j = 0; j < lowerSub.length; j++) {
      if (lowerStr[i + j] !== lowerSub[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

function linearSearch(items, searchTerm) {
  const results = [];
  if (searchTerm.trim() === "") return items;
  const lowerTerm = searchTerm.toLowerCase();
  for (let i = 0; i < items.length; i++) {
    if (stringContains(items[i].name, lowerTerm)) {
      results.push(items[i]);
    }
  }
  return results;
}

export default function FoundItemsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from("found_items")
          .select("id, item_name, item_type, description, color, date_found, location, status, photo_url, returned_by");
        if (error) {
          setDbError(error.message);
        } else {
          setItems(data ?? []);
        }
      } catch {
        setDbError("Failed to load found items.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const searchedItems = linearSearch(items, searchTerm);

  const handleViewDetails = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* PAGE TITLE */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-8">
        <h1 className="text-4xl font-black text-blue-400 md:text-5xl">Found Items</h1>
        <p className="mt-4 text-lg text-slate-300">
          Items reviewed and listed by the Office of Student Affairs (OSA).
        </p>
      </section>

      {/* SEARCH AND FILTERS */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
          {/* Search bar */}
          <div className="mb-6">
            <label htmlFor="search" className="mb-2 block text-sm font-semibold text-slate-300">
              Search Items
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by item name..."
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          {/* Filters */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="type" className="mb-2 block text-sm font-semibold text-slate-300">
                Item Type
              </label>
              <select
                id="type"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Types</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="supplies">School Supplies</option>
              </select>
            </div>
            <div>
              <label htmlFor="color" className="mb-2 block text-sm font-semibold text-slate-300">
                Color
              </label>
              <select
                id="color"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Colors</option>
                <option value="black">Black</option>
                <option value="blue">Blue</option>
                <option value="red">Red</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="location" className="mb-2 block text-sm font-semibold text-slate-300">
                Location
              </label>
              <select
                id="location"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Locations</option>
                <option value="library">Library</option>
                <option value="gym">Gym</option>
                <option value="classroom">Classroom</option>
                <option value="hall">Main Hall</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-semibold text-slate-300">
                Status
              </label>
              <select
                id="status"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Statuses</option>
                <option value="osa">At OSA</option>
                <option value="claimed">Claimed</option>
                <option value="pending">Pending Review</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* FOUND ITEMS GRID */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {loading ? (
          <p className="py-20 text-center text-lg text-slate-400">Loading found items...</p>
        ) : dbError ? (
          <p className="py-20 text-center text-lg text-red-400">{dbError}</p>
        ) : searchedItems.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {searchedItems.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm transition hover:shadow-md">
                <h3 className="text-xl font-bold text-blue-400">{item.item_name}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>{item.date_found}</span>
                  <span>{item.location}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color || "#94a3b8" }} />
                  <span className="text-xs text-slate-400">{item.color}</span>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
                    {item.status}
                  </span>
                  <button
                    onClick={() => handleViewDetails(item)}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-lg text-slate-400">No found items match your search.</p>
        )}
      </section>

      {/* DETAILS MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-blue-400">Item Details</h2>
              <button
                onClick={handleCloseDetail}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-300 transition hover:bg-slate-600"
              >
                &#10005;
              </button>
            </div>
            {selectedItem.photo_url && (
              <img
                src={selectedItem.photo_url}
                alt={selectedItem.item_name}
                className="mb-6 max-h-64 w-full rounded-xl object-contain"
              />
            )}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Item Name</span>
                <span className="text-slate-100">{selectedItem.item_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Item Type</span>
                <span className="text-slate-100">{selectedItem.item_type || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Color</span>
                <span className="text-slate-100">{selectedItem.color || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Location</span>
                <span className="text-slate-100">{selectedItem.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Date Found</span>
                <span className="text-slate-100">{selectedItem.date_found}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-400">Status</span>
                <span className="text-slate-100">{selectedItem.status}</span>
              </div>
              {selectedItem.returned_by && (
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Returned By</span>
                  <span className="text-slate-100">{selectedItem.returned_by}</span>
                </div>
              )}
              <div className="pt-2">
                <span className="font-semibold text-slate-400">Description</span>
                <p className="mt-1 text-slate-300">{selectedItem.description}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/claim?itemId=${selectedItem.id}`}
                className="block w-full rounded-full bg-yellow-400 py-3 text-center text-base font-bold text-blue-900 transition hover:bg-yellow-300"
              >
                Claim This Item
              </Link>
              <button
                onClick={handleCloseDetail}
                className="w-full rounded-full bg-blue-600 py-3 text-base font-bold text-white transition hover:bg-blue-500"
              >
                Close
              </button>
            </div>
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
                Helping students recover lost items and reunite them with their belongings.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-yellow-400">Navigation</p>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400">
                <Link href="/" className="transition hover:text-white">Home</Link>
                <Link href="/found-items" className="transition hover:text-white">Found Items</Link>
                <Link href="/report-lost" className="transition hover:text-white">Report Lost</Link>
                <Link href="/report-found" className="transition hover:text-white">Report Found</Link>
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
