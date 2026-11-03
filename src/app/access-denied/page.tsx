import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { signOut } from "@/app/auth/actions";

export default function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <ShieldAlert className="mx-auto text-amber-300" size={36} />
        <h1 className="mt-5 text-2xl font-semibold">Superadmin access required</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Your account is signed in, but it is not authorized to use this tool.
          Ask an administrator to verify the profile's superadmin flag.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Home</Link>
          <form action={signOut}><button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm" type="submit">Sign out</button></form>
        </div>
      </section>
    </main>
  );
}
