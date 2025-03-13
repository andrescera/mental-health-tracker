import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (session?.user) {
    // default dashboard route
    redirect("/dashboard/tracker/daily-tracker");
  }
  return <></>;
}
