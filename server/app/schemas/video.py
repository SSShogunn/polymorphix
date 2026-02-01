from pydantic import BaseModel


class DeleteAllResponse(BaseModel):
    deleted: int
    message: str

