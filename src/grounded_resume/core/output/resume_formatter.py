from __future__ import annotations

from datetime import UTC, datetime

from grounded_resume.core.models import (
    EvidenceMappingResult,
    GapItem,
    OutputAttachment,
    OutputMetadata,
    ResumeDraft,
    ResumeOutput,
    RiskFlag,
    TargetJob,
)


class ResumeFormatter:
    def format(
        self,
        confirmed_resume: ResumeDraft,
        evidence_mapping: EvidenceMappingResult,
        gap_items: list[GapItem],
        risk_flags: list[RiskFlag],
        target_job: TargetJob,
    ) -> ResumeOutput:
        resume_markdown = self._format_resume_markdown(confirmed_resume)
        attachments = [
            OutputAttachment(
                type="evidence_map",
                title="证据映射表",
                content=f"{resume_markdown}\n\n{self._format_evidence_map(evidence_mapping)}",
            ),
            OutputAttachment(
                type="gap_report",
                title="Gap 报告",
                content=self._format_gap_report(gap_items),
            ),
            OutputAttachment(
                type="risk_summary",
                title="风险提示摘要",
                content=self._format_risk_summary(risk_flags),
            ),
            OutputAttachment(
                type="modification_guide",
                title="修改建议指南",
                content=self._format_modification_guide(),
            ),
        ]

        return ResumeOutput(
            resume=confirmed_resume,
            metadata=OutputMetadata(
                target_job=target_job,
                generation_timestamp=datetime.now(UTC),
                version=f"{confirmed_resume.version}.0",
                confidence=evidence_mapping.mapping_confidence,
                material_coverage=self._material_coverage(evidence_mapping, gap_items),
                gap_count=len(gap_items),
            ),
            attachments=attachments,
        )

    def _format_resume_markdown(self, draft: ResumeDraft) -> str:
        lines = [
            "> **本简历为「接近可投版」（Level 2）**",
            "> 已根据目标岗位与现有素材生成，请在投递前核对事实、数字和时间信息。",
            "",
        ]

        for section in sorted(draft.sections, key=lambda item: item.order):
            lines.append(f"## {section.title}")
            lines.append("")
            for bullet in section.bullets:
                lines.append(f"- {bullet.text}")
            lines.append("")

        return "\n".join(lines).rstrip()

    def _format_evidence_map(self, mapping: EvidenceMappingResult) -> str:
        lines = ["# 证据映射表", "", "| JD 要求 | 证据强度 | 映射理由 |", "|---|---|---|"]
        for item in mapping.mappings:
            lines.append(f"| {item.jd_requirement_id} | {item.strength} | {item.reasoning} |")

        if len(lines) == 4:
            lines.append("| - | - | 未生成映射 |")

        return "\n".join(lines)

    def _format_gap_report(self, gaps: list[GapItem]) -> str:
        lines = ["# Gap 报告", ""]
        if not gaps:
            lines.append("未发现 gap。")
            return "\n".join(lines)

        for item in gaps:
            lines.append(f"- **{item.severity}**: {item.description}")
            if item.recommendation:
                lines.append(f"  - 建议: {item.recommendation}")

        return "\n".join(lines)

    def _format_risk_summary(self, risk_flags: list[RiskFlag]) -> str:
        lines = ["# 风险提示摘要", ""]
        if not risk_flags:
            lines.append("未发现明显风险。")
            return "\n".join(lines)

        for item in risk_flags:
            lines.append(f"- **{item.severity}**: {item.description}")

        return "\n".join(lines)

    def _format_modification_guide(self) -> str:
        return (
            "# 修改建议指南\n\n"
            "1. 删除重复描述，保留最关键的动作和结果。\n"
            "2. 按目标岗位微调技术/产品比重。\n"
            "3. 对 gap 项准备简短说明。"
        )

    def _material_coverage(self, mapping: EvidenceMappingResult, gaps: list[GapItem]) -> float:
        total = len(mapping.mappings) + len(gaps)
        if total == 0:
            return 0.0
        return len(mapping.mappings) / total
