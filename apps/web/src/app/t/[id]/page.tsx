import { DetailScreen } from "@/components/social/detail-screen";
export default async function ThesisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <DetailScreen id={(await params).id} />;
}
