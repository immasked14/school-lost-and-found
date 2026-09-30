"use client";

import Link from "next/link";

export default function Home() {
  

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* HERO SECTION */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-black leading-tight text-blue-400 md:text-5xl">
              Lost Something? Let&apos;s Help You Find It.
            </h1>
            <p className="mt-5 text-lg text-slate-300">
              Report your lost item and check items that have been returned to the Office of Student Affairs.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/report-lost"
                className="rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-blue-500"
              >
                Report Lost Item
              </Link>
              <Link
                href="/found-items"
                className="rounded-full border-2 border-yellow-400 bg-slate-800 px-6 py-3 text-base font-semibold text-yellow-400 transition hover:bg-yellow-400 hover:text-blue-900"
              >
                View Found Items
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex h-56 w-56 flex-col items-center justify-center rounded-3xl border-4 border-yellow-400 bg-slate-800 shadow-xl">
                <div className="text-6xl">&#128271;</div>
                <p className="mt-3 text-sm font-bold text-blue-400">Lost &amp; Found</p>
              </div>
              <div className="absolute -left-8 top-8 rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-lg">
                <div className="text-2xl">&#128091;</div>
                <p className="text-xs text-slate-400">Backpack</p>
              </div>
              <div className="absolute -right-4 bottom-4 rounded-xl border border-slate-700 bg-slate-800 p-3 shadow-lg">
                <div className="text-2xl">&#128209;</div>
                <p className="text-xs text-slate-400">Water Bottle</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTION CARDS */}
      <section className="bg-slate-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-black text-blue-400">Quick Actions</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Link href="/report-lost" className="block rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/20 text-2xl text-yellow-400">
                &#128337;
              </div>
              <h3 className="mt-5 text-xl font-bold text-blue-400">Report Lost Item</h3>
              <p className="mt-3 text-slate-300">Tell us what you lost and where you last saw it.</p>
            </Link>
            <Link href="/report-found" className="block rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-2xl text-blue-400">
                &#128206;
              </div>
              <h3 className="mt-5 text-xl font-bold text-blue-400">Report Found Item</h3>
              <p className="mt-3 text-slate-300">Submit information about an item you found so OSA can review it.</p>
            </Link>
            <Link href="/found-items" className="block rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/20 text-2xl text-yellow-400">
                &#128270;
              </div>
              <h3 className="mt-5 text-xl font-bold text-blue-400">Browse Found Items</h3>
              <p className="mt-3 text-slate-300">Check items that have been reviewed and listed by OSA.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-black text-blue-400">How It Works</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white">1</div>
            <h3 className="mt-4 text-lg font-bold text-blue-400">Report</h3>
            <p className="mt-2 text-sm text-slate-300">Submit details about your lost item.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-lg font-black text-blue-900">2</div>
            <h3 className="mt-4 text-lg font-bold text-blue-400">OSA Review</h3>
            <p className="mt-2 text-sm text-slate-300">OSA reviews returned items and submitted information.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white">3</div>
            <h3 className="mt-4 text-lg font-bold text-blue-400">Possible Match</h3>
            <p className="mt-2 text-sm text-slate-300">The system helps identify possible matches.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-lg font-black text-blue-900">4</div>
            <h3 className="mt-4 text-lg font-bold text-blue-400">Claim &amp; Verify</h3>
            <p className="mt-2 text-sm text-slate-300">Verify ownership before claiming the item.</p>
          </div>
        </div>
      </section>

      {/* RECENT FOUND ITEMS */}
      <section className="bg-slate-950 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-black text-blue-400">Recently Found Items</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/20 text-3xl">
                &#128092;
              </div>
              <h3 className="mt-4 text-lg font-bold text-blue-400">Black Wallet</h3>
              <p className="mt-1 text-sm text-slate-300">Leather wallet with cards inside</p>
              <p className="mt-3 text-xs text-slate-400">Found: Sep 16, 2026 &middot; Library</p>
              <span className="mt-4 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
                At OSA
              </span>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/20 text-3xl">
                &#128545;
              </div>
              <h3 className="mt-4 text-lg font-bold text-blue-400">Blue Umbrella</h3>
              <p className="mt-1 text-sm text-slate-300">Compact folding umbrella, blue</p>
              <p className="mt-3 text-xs text-slate-400">Found: Sep 17, 2026 &middot; Main Hall</p>
              <span className="mt-4 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
                At OSA
              </span>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/20 text-3xl">
                &#128190;
              </div>
              <h3 className="mt-4 text-lg font-bold text-blue-400">USB Flash Drive</h3>
              <p className="mt-1 text-sm text-slate-300">32GB USB-C flash drive</p>
              <p className="mt-3 text-xs text-slate-400">Found: Sep 18, 2026 &middot; Computer Lab</p>
              <span className="mt-4 inline-block rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-semibold text-yellow-400">
                Pending Review
              </span>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/20 text-3xl">
                &#128466;
              </div>
              <h3 className="mt-4 text-lg font-bold text-blue-400">Water Bottle</h3>
              <p className="mt-1 text-sm text-slate-300">Stainless steel, blue label</p>
              <p className="mt-3 text-xs text-slate-400">Found: Sep 18, 2026 &middot; Gym</p>
              <span className="mt-4 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
                At OSA
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* OSA NOTICE */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-start gap-4 rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-8 shadow-sm md:gap-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xl text-blue-900">
            &#8505;
          </div>
          <div>
            <h2 className="text-2xl font-black text-blue-400">Reviewed by OSA</h2>
            <p className="mt-2 text-slate-300">
              Found-item submissions are reviewed by OSA before they become visible to students.
            </p>
          </div>
        </div>
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
