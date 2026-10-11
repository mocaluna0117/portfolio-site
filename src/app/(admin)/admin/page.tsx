import { WorksAdmin } from "@/components/admin/works-admin";

/** Behind the admin layout's session check; see there. */
export const instant = false;

export default function AdminWorksPage() {
  return <WorksAdmin />;
}
