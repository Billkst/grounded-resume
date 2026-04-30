from grounded_resume.core.utils.text import (
    clean_whitespace,
    extract_snippet,
    is_chinese_dominant,
)


def test_clean_whitespace() -> None:
    assert clean_whitespace("  hello\nworld \t python  ") == "hello world python"


def test_is_chinese_dominant() -> None:
    assert is_chinese_dominant("中文内容测试abc") is True
    assert is_chinese_dominant("English only") is False


def test_extract_snippet() -> None:
    assert extract_snippet("abcdefg", 2, 5) == "abcdefg"
