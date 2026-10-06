import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { PrivyProof } from "@/components/social/privy-proof";

export const dynamic = "force-dynamic";
export default async function PrivyDevelopmentCheck() {
  const host = (await headers()).get("host");
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.FORK_TEST_MODE ||
    !host ||
    !["localhost", "127.0.0.1"].includes(new URL(`http://${host}`).hostname)
  )
    notFound();
  return <PrivyProof />;
}
