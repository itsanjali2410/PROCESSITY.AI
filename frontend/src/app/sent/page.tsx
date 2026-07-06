import { Suspense } from "react";
import { EmailList } from "@/components/mail/EmailList";

// Suspense is required because EmailList reads useSearchParams()
export default function SentPage() {
  return (
    <Suspense>
      <EmailList folder="sent" />
    </Suspense>
  );
}
