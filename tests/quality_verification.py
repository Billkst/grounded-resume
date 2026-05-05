"""Manual quality verification with real DeepSeek V4 Pro.

Usage:
    GROUNDED_RESUME_DEEPSEEK_API_KEY=sk-xxx python tests/quality_verification.py
"""

import json
import os
import sys

from grounded_resume.core.config import LLMConfig
from grounded_resume.core.generator import (
    build_job_profile,
    generate_ideal_resume,
    analyze_gaps,
)
from grounded_resume.core.llm_service import LLMService


def main():
    api_key = os.environ.get("GROUNDED_RESUME_DEEPSEEK_API_KEY")
    if not api_key:
        print("Set GROUNDED_RESUME_DEEPSEEK_API_KEY env var")
        sys.exit(1)

    config = LLMConfig(
        provider="deepseek",
        model="deepseek-v4-pro",
        temperature=0.1,
        max_tokens=8192,
        timeout_seconds=120,
        mode="hybrid",
        deepseek_api_key=api_key,
    )
    llm = LLMService(config=config)

    sample = {
        "target_role": "AI产品经理",
        "experience_level": "new_grad",
        "jd_text": """【岗位】AI产品经理实习生
【要求】
1. 本科及以上学历，计算机、AI相关专业优先
2. 熟悉大模型能力，有Prompt Engineering经验
3. 了解Agent、RAG等AI产品形态
4. 每周至少实习4天，至少3个月
5. 有产品实习经验优先""",
        "background": """
2023-2027 XX大学 计算机科学 本科
用Python做过课程项目：电影推荐系统
经常使用ChatGPT、Claude等AI工具
参加过一次校内黑客松
没有实习经历
""",
    }

    print("=" * 60)
    print(f"Testing: {sample['target_role']} ({sample['experience_level']})")
    print("=" * 60)

    # Step 1: Job profile
    print("\n[1/3] Building job profile...")
    profile = build_job_profile(llm, sample["target_role"], sample["jd_text"])
    print(f"  Hard requirements: {len(profile.hard_requirements)}")
    for hr in profile.hard_requirements:
        print(f"    - [{hr.category}] {hr.requirement}")
    print(f"  Core capabilities: {len(profile.core_capabilities)}")
    for cc in profile.core_capabilities[:3]:
        print(f"    - {cc.name} (weight={cc.weight})")
    print(f"  Profile preview: {profile.ideal_candidate_profile[:100]}...")

    # Step 2: Ideal resume
    print("\n[2/3] Generating ideal resume...")
    resume_data = generate_ideal_resume(llm, profile, sample["target_role"], sample["experience_level"])
    md = resume_data.get("markdown", "")
    sections = resume_data.get("sections", [])
    print(f"  Sections: {len(sections)}")
    for s in sections:
        print(f"    - {s.get('title', '?')} ({len(s.get('content', ''))} chars)")
    print(f"  Markdown preview:\n{md[:300]}...")

    # Step 3: Gap analysis
    print("\n[3/3] Analyzing gaps...")
    gap_data = analyze_gaps(llm, profile, sample["background"], md, sample["experience_level"])
    print(f"  Overall score: {gap_data.get('overall_score')}")
    print(f"  Summary: {gap_data.get('summary')}")
    print(f"  Blockers: {len(gap_data.get('blockers', []))}")
    for b in gap_data.get('blockers', []):
        print(f"    - {b.get('gap')}")
    print(f"  Critical gaps: {len(gap_data.get('critical_gaps', []))}")
    for g in gap_data.get('critical_gaps', [])[:3]:
        print(f"    - {g.get('ideal')[:60]}...")
    print(f"  Expression tips: {len(gap_data.get('expression_tips', []))}")

    print("\n" + "=" * 60)
    print("Verification complete. Rate each dimension 0-5:")
    print("  - 理想简历-岗位对齐度:  /5")
    print("  - 理想简历-表达具象度:  /5")
    print("  - 理想简历-结构完整度:  /5")
    print("  - 差距报告-致命差距准确度: /5")
    print("  - 差距报告-补足路径可执行性: /5")


if __name__ == "__main__":
    main()
