version = "3.0.0"

project.ext.set(
    "urlFileNameFilterValues",
    if (project.hasProperty("githubPagesUrl")) arrayOf(
        "GelbeSeitenVersand.json",
        "GelbeSeitenEmpfang.json"
    ) else emptyArray()
)