import os
import importlib
import subprocess
import sys
from typing import cast


def test_package_exports_version() -> None:
    package = importlib.import_module("grounded_resume")
    assert cast(str, package.__version__) == "0.1.0"


def test_package_health_command() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "grounded_resume"],
        check=True,
        capture_output=True,
        text=True,
        env={**os.environ, "PYTHONPATH": "src"},
    )

    assert result.stdout.strip() == "grounded-resume backend 0.1.0"
