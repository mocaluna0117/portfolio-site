import { WorkEditor } from "@/components/admin/work-editor";

/** Reads its id from the URL in the browser; see the admin layout. */
export const instant = false;

export default function AdminWorkPage({ params }: PageProps<"/admin/works/[id]">) {
  return <WorkEditor params={params} />;
}
