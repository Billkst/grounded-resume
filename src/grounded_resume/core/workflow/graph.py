from __future__ import annotations

from typing import Callable

from langgraph.graph import END, StateGraph

from grounded_resume.core.workflow.nodes import (
    generate_draft_node,
    map_evidence_node,
    parse_jd_node,
    parse_materials_node,
)
from grounded_resume.core.workflow.state import WorkflowState


StateDict = dict[str, object]
WorkflowNode = Callable[[WorkflowState], WorkflowState]


def build_workflow_graph() -> object:
    graph: StateGraph = StateGraph(StateDict)

    def _wrap(node_fn: WorkflowNode) -> Callable[[StateDict], StateDict]:
        def _runner(state_dict: StateDict) -> StateDict:
            state = WorkflowState.from_dict(state_dict)
            return node_fn(state).to_dict()

        return _runner

    _ = graph.add_node("parse_jd", _wrap(parse_jd_node))  # pyright: ignore[reportUnknownMemberType]
    _ = graph.add_node("parse_materials", _wrap(parse_materials_node))  # pyright: ignore[reportUnknownMemberType]
    _ = graph.add_node("map_evidence", _wrap(map_evidence_node))  # pyright: ignore[reportUnknownMemberType]
    _ = graph.add_node("generate_draft", _wrap(generate_draft_node))  # pyright: ignore[reportUnknownMemberType]

    _ = graph.set_entry_point("parse_jd")
    _ = graph.add_edge("parse_jd", "parse_materials")
    _ = graph.add_edge("parse_materials", "map_evidence")
    _ = graph.add_edge("map_evidence", "generate_draft")
    _ = graph.add_edge("generate_draft", END)

    return graph.compile()  # pyright: ignore[reportUnknownMemberType]
