import { ExploreScreen } from "@/components/social/explore-screen";
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string; tag?: string }>;
}) {
  const p = await searchParams;
  return (
    <ExploreScreen initialMarket={p.market ?? ""} initialTag={p.tag ?? ""} />
  );
}
