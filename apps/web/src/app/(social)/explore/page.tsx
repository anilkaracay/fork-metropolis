import { ExploreScreen } from "@/components/social/explore-screen";
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string; tag?: string; q?: string }>;
}) {
  const p = await searchParams;
  return (
    <ExploreScreen
      key={p.q ?? ""}
      initialMarket={p.market ?? ""}
      initialTag={p.tag ?? ""}
      initialSearch={p.q ?? ""}
    />
  );
}
