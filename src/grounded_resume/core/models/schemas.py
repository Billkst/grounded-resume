# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false, reportUntypedBaseClass=false, reportUntypedFunctionDecorator=false, reportUnannotatedClassAttribute=false
from __future__ import annotations

from pydantic import BaseModel, ConfigDict


def to_camel(snake: str) -> str:
    parts = snake.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class StrictModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        alias_generator=to_camel,
        serialize_by_alias=True,
    )
