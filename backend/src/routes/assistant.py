from fastapi import APIRouter

from src.models.schemas import AssistantRequest, AssistantResponse

router = APIRouter()


@router.post("/chat", response_model=AssistantResponse)
def chat(payload: AssistantRequest):
    # TODO: call ai_service.run(payload)
    return AssistantResponse(message="Not implemented yet", actions=[])
