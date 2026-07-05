"""Gmail API integration.

All provider-specific logic lives here so routes stay thin and the provider
can be swapped (e.g. Microsoft Graph) without touching the API surface.
"""

from src.models.schemas import EmailDetail, EmailFilters, EmailSummary, SendEmailRequest


def list_emails(filters: EmailFilters) -> list[EmailSummary]:
    # TODO: users().messages().list with a Gmail query built from filters
    raise NotImplementedError


def get_email(email_id: str) -> EmailDetail:
    # TODO: users().messages().get(format="full") + MIME parsing
    raise NotImplementedError


def send_email(payload: SendEmailRequest) -> str:
    # TODO: build MIME message (set In-Reply-To for replies) and users().messages().send
    raise NotImplementedError


def start_watch() -> None:
    # TODO: users().watch(topicName=...) to enable Pub/Sub push notifications
    raise NotImplementedError
