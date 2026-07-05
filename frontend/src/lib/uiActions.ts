import type { useRouter } from "next/navigation";
import type { UIAction } from "./types";

type Router = ReturnType<typeof useRouter>;

/**
 * Executes the actions returned by the assistant so it visibly drives the UI.
 * Compose pre-fill and filters travel via query params, which the pages read.
 */
export function executeUIActions(actions: UIAction[], router: Router) {
  for (const action of actions) {
    switch (action.type) {
      case "navigate":
        router.push(action.payload.path);
        break;

      case "open_email":
        router.push(`/email/${action.payload.email_id}`);
        break;

      case "fill_compose": {
        const params = new URLSearchParams();
        if (action.payload.to) params.set("to", action.payload.to);
        if (action.payload.subject) params.set("subject", action.payload.subject);
        if (action.payload.body) params.set("body", action.payload.body);
        router.push(`/compose?${params}`);
        break;
      }

      case "apply_filters": {
        const { folder = "inbox", ...rest } = action.payload;
        const params = new URLSearchParams(
          Object.entries(rest).filter(([, v]) => v !== undefined && v !== false) as [
            string,
            string,
          ][]
        );
        router.push(`/${folder}?${params}`);
        break;
      }

      case "send_email":
        // TODO: trigger the compose form submit (human-in-the-loop: prefer
        // letting the user click Send after confirmation)
        break;
    }
  }
}
