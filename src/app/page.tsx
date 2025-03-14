import { redirect } from "next/navigation";

import { HydrateClient } from "~/trpc/server";

import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <main />
    </HydrateClient>
  );
}
