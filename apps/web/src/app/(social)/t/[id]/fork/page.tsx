import { Composer } from "@/components/social/composer";
export default async function ForkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ challenge?: string }>;
}) {
  return (
    <Composer
      parentId={(await params).id}
      challenge={(await searchParams).challenge === "1"}
    />
  );
}
