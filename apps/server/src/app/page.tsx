import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionToken } from "@/lib/auth";
import { getAllAccounts } from "@/lib/queries";
import { getAllLabels } from "@/lib/queries";
import { ServerDataProvider } from "@/hooks/server-data-provider";
import { AppShell } from "@howmanyat/ui/components/layout/app-shell";
import type { AccountWithDetails, LabelSimple } from "@howmanyat/ui/types";

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session || !validateSessionToken(session)) {
    redirect("/login");
  }

  const accounts: AccountWithDetails[] = getAllAccounts();
  const labels: LabelSimple[] = getAllLabels();

  return (
    <ServerDataProvider initialAccounts={accounts} initialLabels={labels}>
      <AppShell />
    </ServerDataProvider>
  );
}
