import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { getCalendarTasks } from "@/app/lib/queries";
import CalendarView from "@/app/ui/calendar-view";

export const metadata: Metadata = {
  title: "Week",
  description: "Weekly task schedule",
};

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  const tasks = session?.user ? await getCalendarTasks(session.user.id) : [];

  return <CalendarView tasks={tasks} view="week" />;
}
