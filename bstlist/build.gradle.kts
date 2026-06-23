version = "5.0.0"

project.ext.set(
    "urlFileNameFilterValues",
    if (project.hasProperty("githubPagesUrl")) arrayOf(
        "base-url=\""
    ) else emptyArray()
)