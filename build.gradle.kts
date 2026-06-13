import opensavvy.gradle.vite.base.viteConfig

plugins {
    id("wrapper")
    id("base")
    id("com.github.node-gradle.node").version("7.1.0").apply(true)
    id("dev.opensavvy.vite.base").version("0.9.0").apply(false)
}

/*wrapper {
    gradleVersion = "8.14.5"
}*/
plugins.withId("com.github.node-gradle.node") {
    node.version = "22.18.0"
    node.download = true
}

group = "de.fktt-module"
version = "2026.7"

gradle.projectsEvaluated {
    subprojects {
        apply { plugin("wrapper") }
        apply { plugin("base") }
        apply { plugin("dev.opensavvy.vite.base") }

        val projectName = project.name
        val distributionFileName = project.name + "-" + project.version
        val resourcesDir: String = arrayOf("src", "main").joinToString(File.separator)

        project.plugins.withType<opensavvy.gradle.vite.base.BaseVitePlugin> {
            viteConfig.version.set("8.0.12")
            viteConfig.build.outDir.set(project.layout.buildDirectory.dir("vite"))
        }

        project.tasks.register<opensavvy.gradle.vite.base.tasks.WriteConfig>("viteConfigDump") {
            description = "Writes project vite configuration file."
            val viteConfigFile = project.layout.projectDirectory.file("vite.config.js")
            onlyIf { !viteConfigFile.asFile.exists() }
            config.setDefaults()
            config.root.set(file(resourcesDir))
            config.version.set("8.0.12")
            config.cacheDir.set(file("../node_modules/.vite").relativeTo(file(resourcesDir)).toString())
            config.build.target.set("es2015")
            config.build.modulePreload.set(false)
            // sadly, this will intern always be converted to an absolute path!
            //config.build.outDir.set(project.layout.buildDirectory.dir("vite").get().asFile.relativeTo(file(resourcesDir)))
            //config.build.outDir.set(file("build/vite").relativeTo(file(resourcesDir)))
            configurationFile.set(viteConfigFile)
            outputs.file(viteConfigFile)
        }

        project.tasks.register<opensavvy.gradle.vite.base.tasks.ViteExec>("viteBuild") {
            description = "Runs project vite build."
            dependsOn(":pnpmInstall", "viteConfigDump")
            command.set("build")
            configurationFile.set(tasks.named("viteConfigDump").get().outputs.files.singleFile)
            workingDirectory.set(project.layout.projectDirectory.asFile.toString())
            nodePath.set(
                file(
                    project.rootProject.layout.projectDirectory.file(
                        project.property("nodeBinaryPath").toString()
                    )
                )
            )
            vitePath.set(file(project.rootProject.layout.projectDirectory.file("node_modules/vite/bin/vite.js")))
            //@see vite.config.js => build.rolldownOptions.output.entryFileNames
            outputs.file(config.build.outDir.file("index.js"))
        }

        project.tasks.named("assemble").get().dependsOn("buildIntern")

        tasks.register<Copy>("buildIntern") {
            description = "Assemble all projects outputs."
            dependsOn("viteBuild")
            val base64prefix = "data:application/javascript;base64,"
            val base64bytes = project.tasks.named("viteBuild").get().outputs.files.singleFile
            from(tasks.named("viteBuild").get().outputs.files.singleFile) {
                rename { _ -> "${distributionFileName}.min.js" }
            }
            from(resourcesDir) {
                include("index.html")
                rename { fileName -> fileName.replace("index", "${projectName}-min") }
                filter { it -> it.replace("js/${projectName}", "${distributionFileName}.min") }
            }
            from(resourcesDir) {
                include("index.html")
                rename { fileName -> fileName.replace("index", "${projectName}-base64") }
                filter { it ->
                    it.replace(
                        "js/${projectName}.js",
                        base64prefix + java.util.Base64.getEncoder().encodeToString(base64bytes.readBytes())
                    )
                }
            }
            if (project.hasProperty("githubPagesUrl") && project.ext.has("urlFileNameFilterValues")) {
                val url = project.property("githubPagesUrl").toString() + "/"
                val suffix = "-github-pages"
                from(resourcesDir) {
                    include("index.html")
                    rename { fileName -> fileName.replace("index", "${projectName}-min${suffix}") }
                    filter { it -> it.replace("js/${projectName}", "${distributionFileName}.min") }
                    (project.ext.get("urlFileNameFilterValues") as Array<*>).map { str -> str as String }
                        .forEach { fn ->
                            run {
                                filter { it ->
                                    it.replace(
                                        fn,
                                        url + fn
                                    )
                                }
                            }
                        }
                }
                from(resourcesDir) {
                    include("index.html")
                    rename { fileName -> fileName.replace("index", "${projectName}-base64${suffix}") }
                    filter { it ->
                        it.replace(
                            "js/${projectName}.js",
                            base64prefix + java.util.Base64.getEncoder().encodeToString(base64bytes.readBytes())
                        )
                    }
                    (project.ext.get("urlFileNameFilterValues") as Array<*>).map { str -> str as String }
                        .forEach { fn ->
                            run {
                                filter { it ->
                                    it.replace(
                                        fn,
                                        url + fn
                                    )
                                }
                            }
                        }
                }
            }
            into(project.layout.buildDirectory)
        }

        tasks.register<opensavvy.gradle.vite.base.tasks.ViteExec>("viteDev") {
            description = "Run projects vite dev."
            dependsOn(":pnpmInstall", "viteConfigDump")
            onlyIf { project.hasProperty("nodeBinaryPath") }
            configurationFile.set(tasks.named("viteConfigDump").get().outputs.files.singleFile)
            workingDirectory.set(project.layout.projectDirectory.toString())
            nodePath.set(
                file(
                    project.rootProject.layout.projectDirectory.file(
                        project.property("nodeBinaryPath").toString()
                    )
                )
            )
            vitePath.set(file(project.rootProject.layout.projectDirectory.file("node_modules/vite/bin/vite.js")))
        }

        /*tasks.register<opensavvy.gradle.vite.base.tasks.ViteExec>("vitePreview") {
            description = "Run projects vite preview."
            dependsOn("assemble")
            onlyIf { project.hasProperty("nodeBinaryPath") }
            command.set("preview")
            arguments.add("-d")
            arguments.add("--open")
            arguments.add("bstlist-min-github-pages.html")
            configurationFile.set(tasks.named("viteConfigDump").get().outputs.files.singleFile)
            workingDirectory.set(project.layout.projectDirectory.toString())
            nodePath.set(
                file(
                    project.rootProject.layout.projectDirectory.file(
                        project.property("nodeBinaryPath").toString()
                    )
                )
            )
            vitePath.set(file(project.rootProject.layout.projectDirectory.file("node_modules/vite/bin/vite.js")))
        }*/

        tasks.register<Zip>("binZip") {
            description = "Builds the project binary zip archive."
            dependsOn("build")
            archiveFileName = "${distributionFileName}.zip"
            destinationDirectory = project.layout.buildDirectory.dir("dist")
            from(project.layout.buildDirectory) {
                include("*.html")
                include("*.js")
            }
        }

        project.tasks.named("viteBuild").get().onlyIf { project.hasProperty("nodeBinaryPath") }
    }
}

tasks.register("checkUpdatePackageJson") {
    description = ""
    val packageFile = project.file("package.json")
    onlyIf { packageFile.exists() }
    val packageContent =
        groovy.json.JsonSlurper().parseText(packageFile.readText()) as org.apache.groovy.json.internal.LazyMap
    val packageContentOrigin = org.apache.groovy.json.internal.LazyMap()
    packageContentOrigin.putAll(packageContent)
    packageContent["name"]?.equals(rootProject.name)?.let {
        if (!it) {
            packageContent["name"] = rootProject.name
        }
    }
    packageContent["version"]?.equals(rootProject.version)?.let {
        if (!it) {
            packageContent["version"] = rootProject.version
        }
    }
    if (packageContent != packageContentOrigin) {
        packageFile.writeText(
            groovy.json.JsonBuilder(packageContent).toPrettyString().lineSequence()
                .joinToString("\n") { it -> it.replace("    ", "  ") })
    }
}

tasks.register<com.github.gradle.node.pnpm.task.PnpmInstallTask>("pnpmConfirmInstall") {
    description = "Pnpm install task with confirm modules purge false."
    args.set(listOf("--config.confirmModulesPurge=false"))
}

tasks.named("pnpmConfirmInstall").get().dependsOn("checkUpdatePackageJson")
tasks.named("pnpmInstall").get().dependsOn("pnpmConfirmInstall")

tasks.register<Copy>("releaseAssets") {
    description = "Collects all subprojects binary zip archives together."
    val spec = subprojects.map { it: Project -> it.tasks.matching { tt: Task -> tt.name == "binZip" } }
    dependsOn(spec)
    from(spec)
    into(project.layout.buildDirectory.dir("release-assets"))
}

tasks.register("version") {
    description = "Displays project, gradle and kotlin version used."
    doLast {
        println("Project version: $version")
        println(" Gradle version: " + project.gradle.gradleVersion)
        println(" Kotlin version: ${KotlinVersion.CURRENT}")
        println("   Node version: ${node.version.get()}")
        //println("   Pnpm version: ${node.pnpmVersion.get()}")
    }
}
