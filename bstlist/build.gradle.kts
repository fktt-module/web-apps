version = "5.0.0"

project.ext.set(
    "urlFileNameFilterValues",
    if (project.hasProperty("githubPagesUrl")) arrayOf(
        "bahnhof.json",
        "datenblaetter_gelbe-seiten.zip",
        "gelbe-seiten.html"
    ) else emptyArray()
)