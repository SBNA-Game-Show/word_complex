import yaml
from pathlib import Path


def load_swagger_description():
    files = [
        Path("swaggerdocs/project/project_overview.yml"),
        # Path("swaggerdocs/project/sources_credits.yml"),
        # Path("swaggerdocs/project/libraries_used.yml"),
        # Path("swaggerdocs/project/footer.yml")
    ]

    sections = []

    for file in files:

        if not file.exists():
            raise FileNotFoundError(
                f"Swagger documentation file not found: {file}"
            )

        with file.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        if not isinstance(data, dict):
            continue

        title = data.get("title")
        content = data.get("content")

        if title and content:
            sections.append(f"## {title}\n\n{content}")

    return "\n\n---\n\n".join(sections)