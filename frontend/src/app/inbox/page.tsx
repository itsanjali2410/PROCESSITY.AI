import { Suspense } from "react";
import { EmailList } from "@/components/mail/EmailList";

// Suspense is required because EmailList reads useSearchParams()
export default function InboxPage() {
  return (
    <Suspense>
      <EmailList folder="inbox" />
    </Suspense>
  );
}
