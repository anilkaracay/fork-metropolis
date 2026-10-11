import { ProfileScreen } from "@/components/social/profile-screen";
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  return <ProfileScreen handle={(await params).handle} />;
}
