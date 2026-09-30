"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.push("/");
  };

  // OSA Admin navbar
  if (pathname?.startsWith("/osa")) {
    return (
      <header className="bg-blue-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-lg font-bold text-blue-900">
              &#128270;
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">
                OSA Lost &amp; Found Dashboard
              </span>
              <span className="ml-3 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-bold text-blue-900">
                OSA Admin
              </span>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/" className="transition hover:text-yellow-300">
              Home
            </Link>
            <Link
              href="/found-items"
              className="transition hover:text-yellow-300"
            >
              Found Items
            </Link>
            <Link
              href="/possible-matches"
              className="transition hover:text-yellow-300"
            >
              Possible Matches
            </Link>
            <Link href="/claim" className="transition hover:text-yellow-300">
              Pending Claims
            </Link>
          </nav>
          <button
            onClick={handleLogout}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-900 transition hover:bg-yellow-400"
          >
            Log Out
          </button>
        </div>
      </header>
    );
  }

  // Default school navbar
  return (
    <header className="bg-blue-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-lg font-bold text-blue-900">
            &#128270;
          </div>
          <span className="text-lg font-bold tracking-tight">
            School Lost &amp; Found
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className="transition hover:text-yellow-300">
            Home
          </Link>
          <Link
            href="/found-items"
            className="transition hover:text-yellow-300"
          >
            Found Items
          </Link>
          <Link
            href="/report-lost"
            className="transition hover:text-yellow-300"
          >
            Report Lost
          </Link>
          <Link
            href="/report-found"
            className="transition hover:text-yellow-300"
          >
            Report Found
          </Link>
        </nav>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-900 transition hover:bg-yellow-400"
          >
            Log Out
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-900 transition hover:bg-yellow-400"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
