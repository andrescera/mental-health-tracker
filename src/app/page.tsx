import Link from "next/link";

import {auth} from "~/server/auth";
import {api, HydrateClient} from "~/trpc/server";
import {redirect} from "next/navigation";

export default async function Home() {
    const session = await auth();

    if (session?.user) {
        void api.post.getLatest.prefetch();
        redirect("/dashboard");
    } else {
        redirect("/login")
    }

    return (
        <HydrateClient>
            <main
                className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">

            </main>
        </HydrateClient>
    );
}
