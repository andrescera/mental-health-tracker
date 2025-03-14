import { redirect } from "next/navigation";

import { auth } from "~/server/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (session?.user) {
    // default dashboard route
    redirect("/dashboard/tracker/daily-tracker");
  }

  return <div />;
}
