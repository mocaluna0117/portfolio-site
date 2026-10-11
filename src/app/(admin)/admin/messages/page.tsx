import { MessagesAdmin } from "@/components/admin/messages-admin";

/** Behind the admin layout's session check; see there. */
export const instant = false;

export default function AdminMessagesPage() {
  return <MessagesAdmin />;
}
