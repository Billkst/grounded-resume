from __future__ import annotations

from grounded_resume.core.models import (
    EvidenceMappingResult,
    JDParsedResult,
    MaterialParseResult,
    ResumeDraft,
    StrictModel,
    UserInput,
)


class WorkflowState(StrictModel):
    user_input: UserInput
    jd_result: JDParsedResult | None = None
    material_result: MaterialParseResult | None = None
    mapping_result: EvidenceMappingResult | None = None
    draft: ResumeDraft | None = None

    def to_dict(self) -> dict[str, object]:
        return self.model_dump(mode="python", by_alias=False)

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> "WorkflowState":
        return cls.model_validate(data)
