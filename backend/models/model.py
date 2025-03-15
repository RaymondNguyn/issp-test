from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
import uuid

from pydantic import BaseModel, Field, constr
from bson import ObjectId

class MongoBaseModel(BaseModel):
    id: Optional[constr(min_length=24, max_length=24)] = Field(alias="_id")

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}