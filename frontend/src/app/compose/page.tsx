import { Suspense } from "react";
import { ComposeForm } from "@/components/mail/ComposeForm";

// Suspense is required because ComposeForm reads useSearchParams()
export default function ComposePage() {
  return (
    <Suspense>
      <ComposeForm />
    </Suspense>
  );
}
