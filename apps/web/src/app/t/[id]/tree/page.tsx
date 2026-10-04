import { TreeScreen } from "@/components/social/tree-screen";
export default async function TreePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TreeScreen id={(await params).id} />;
}
