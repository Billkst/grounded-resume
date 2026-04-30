from __future__ import annotations

from grounded_resume.core.generation import ConstrainedGenerator
from grounded_resume.core.mapping import EvidenceMapper
from grounded_resume.core.parsing import JDParser, MaterialParser

from .state import WorkflowState


def parse_jd_node(state: WorkflowState) -> WorkflowState:
    jd_result = JDParser().parse(state.user_input.target_job.job_description)
    return state.model_copy(update={"jd_result": jd_result})


def parse_materials_node(state: WorkflowState) -> WorkflowState:
    material_result = MaterialParser().parse(state.user_input.materials)
    return state.model_copy(update={"material_result": material_result})


def map_evidence_node(state: WorkflowState) -> WorkflowState:
    if state.jd_result is None or state.material_result is None:
        raise ValueError("jd_result and material_result are required")

    mapping_result = EvidenceMapper().map(state.jd_result, state.material_result)
    return state.model_copy(update={"mapping_result": mapping_result})


def generate_draft_node(state: WorkflowState) -> WorkflowState:
    if state.mapping_result is None:
        raise ValueError("mapping_result is required")

    draft = ConstrainedGenerator().generate(state.mapping_result, state.user_input)
    return state.model_copy(update={"draft": draft})
