import type { ReactNode } from "react";
import { ProductProviders } from "@/components/social/session";
import { AppShell } from "@/components/app-shell";
import { clientEnv } from "@/lib/env/client";
import { testMode } from "@/server/runtime";

export default function SocialLayout({ children }: { children: ReactNode }) {
  return (
    <ProductProviders
      test={testMode()}
      appId={clientEnv.NEXT_PUBLIC_PRIVY_APP_ID}
    >
      <AppShell>{children}</AppShell>
    </ProductProviders>
  );
}
