import { AppShell } from "@/components/app/AppShell";
import { SessionIdentityProvider } from "@/components/profile/useProfile";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const identity = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    company: user.company,
    city: user.city,
    country: user.country,
    acces: user.acces,
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <SessionIdentityProvider user={identity}>
      <AppShell>{children}</AppShell>
    </SessionIdentityProvider>
  );
}
