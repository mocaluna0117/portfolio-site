import { ProfileForm } from "@/components/admin/profile-form";

/** Behind the admin layout's session check; see there. */
export const instant = false;

export default function AdminProfilePage() {
  return <ProfileForm />;
}
