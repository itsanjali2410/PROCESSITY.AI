from fastapi import APIRouter, Depends

from src.core.deps import require_credentials
from src.models.schemas import AssistantRequest, AssistantResponse
from src.services import ai_service

router = APIRouter()


@router.post("/chat", response_model=AssistantResponse)
def chat(payload: AssistantRequest, creds=Depends(require_credentials)):
    """Chat with the assistant; returns a message plus UI actions to execute."""
    return ai_service.run(creds, payload)
