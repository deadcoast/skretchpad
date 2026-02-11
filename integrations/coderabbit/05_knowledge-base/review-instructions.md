# Review instructions

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Add custom review instructions using path-based patterns or AST rules. Configure CodeRabbit to follow specific guidelines for different file types and enforce coding standards.

<CardGroup cols={3}>
  <Card title="Path-based instructions" icon="folder">
    **Covered in this guide**

    Add custom review instructions for specific file paths using glob patterns. Ideal for enforcing style guides by file types or directories.
  </Card>

  <Card title="Code guidelines" icon="book" href="/integrations/knowledge-base#code-guidelines:-automatic-team-rules">
    Create persistent coding standards and best practices that CodeRabbit learns from your codebase and applies consistently across reviews.
  </Card>

  <Card title="Learnings" icon="brain" href="/guides/learnings#about-coderabbit-learnings">
    Capture feedback from code review conversations to help CodeRabbit understand your team's preferences and coding patterns.
  </Card>
</CardGroup>

## Understanding the difference

<Warning>
  **Common confusion:** Path Instructions and Code Guidelines serve different
  purposes. Many users mistakenly put guideline file names in path\_instructions,
  which causes CodeRabbit to review the guideline files instead of using them as
  reference.
</Warning>

### Path Instructions vs. Code Guidelines

| Feature              | Path Instructions                            | Code Guidelines                                      |
| -------------------- | -------------------------------------------- | ---------------------------------------------------- |
| **Purpose**          | Tell CodeRabbit HOW to review specific files | Reference files containing your coding standards     |
| **Configuration**    | `.coderabbit.yaml` under `path_instructions` | Settings → Knowledge Base → Code Guidelines          |
| **What you provide** | Direct instructions as text                  | File paths/patterns to guideline documents           |
| **Example usage**    | "Check React code for hooks best practices"  | `CLAUDE.md`, `.cursorrules`, `CODING_STANDARDS.md`   |
| **Scope**            | Applies to files matching the path pattern   | Applies to files in same directory as guideline file |

### When to use each

**Use Path Instructions when:**

* You want CodeRabbit to focus on specific review aspects for certain file types
* You need different review strictness levels for different directories
* You want to enforce specific style guides or security checks by path

**Use Code Guidelines when:**

* You have existing guideline files (CLAUDE.md, .cursorrules, etc.)
* You want CodeRabbit to understand your team's coding standards
* You need consistent standards across AI tools (Cursor, Claude, etc.)

### Common mistake: Referencing guideline files in path\_instructions

<Accordion title="Example of incorrect configuration">
  ```yaml  theme={null}
  # ❌ WRONG: Don't do this
  path_instructions:
    - path: "mono/backend/CLAUDE.md"
      instructions: "Use this as coding guidelines"
  ```

  **What happens:** CodeRabbit tries to review the CLAUDE.md file itself, not use it as guidelines.

  **Correct approach:** Configure CLAUDE.md in Knowledge Base → Code Guidelines settings, or let CodeRabbit auto-detect it (enabled by default).
</Accordion>

### How Code Guidelines are scoped

<Info>
  Code guideline files are automatically scoped to their directory and subdirectories:

* `mono/backend/CLAUDE.md` → applies to `mono/backend/**` files only
* `mono/frontend/CLAUDE.md` → applies to `mono/frontend/**` files only
* `documentation/guidelines/CODING_STANDARDS.md` → applies to `documentation/guidelines/**` files only

  This means guidelines in a documentation directory won't affect your code reviews unless the code files are in that same directory tree.
</Info>

## Path-based instructions

Add custom code review instructions for your entire project or specific file paths using glob patterns. Developers can provide tailored review guidelines based on file paths.

<Tip>
  Use path-based instructions when you want CodeRabbit to follow specific
  guidelines beyond standard reviews, such as enforcing style guides by file
  types or directories.
</Tip>

### Default blocked paths

By default, CodeRabbit blocks certain file paths and extensions from being reviewed. If you want CodeRabbit to review any of these blocked paths, you can explicitly include them in your Path Filters configuration.

<Accordion title="View complete list of default blocked paths">
  The following paths are blocked by default, grouped by category:

#### Build and Dependency Directories

  | Path Pattern          | Description                |
  | --------------------- | -------------------------- |
  | `!**/dist/**`         | Build output directory     |
  | `!**/node_modules/**` | Node.js dependencies       |
  | `!**/.svelte-kit/**`  | SvelteKit build directory  |
  | `!**/.webpack/**`     | Webpack build directory    |
  | `!**/.yarn/**`        | Yarn cache directory       |
  | `!**/.docusaurus/**`  | Docusaurus build directory |
  | `!**/.temp/**`        | Temporary files directory  |
  | `!**/.cache/**`       | Cache directory            |
  | `!**/.next/**`        | Next.js build directory    |
  | `!**/.nuxt/**`        | Nuxt.js build directory    |

#### Lock Files

  | Path Pattern            | Description        |
  | ----------------------- | ------------------ |
  | `!**/package-lock.json` | npm lock file      |
  | `!**/yarn.lock`         | Yarn lock file     |
  | `!**/pnpm-lock.yaml`    | pnpm lock file     |
  | `!**/bun.lockb`         | Bun lock file      |
  | `!**/*.lock`            | Generic lock files |

#### Generated Code

  | Path Pattern           | Description                            |
  | ---------------------- | -------------------------------------- |
  | `!**/generated/**`     | Generated code directory               |
  | `!**/@generated/**`    | Generated code directory (alternative) |
  | `!**/__generated__/**` | Generated code directory (alternative) |
  | `!**/__generated/**`   | Generated code directory (alternative) |
  | `!**/_generated/**`    | Generated code directory (alternative) |
  | `!**/gen/**`           | Generated code directory (alternative) |
  | `!**/@gen/**`          | Generated code directory (alternative) |
  | `!**/__gen__/**`       | Generated code directory (alternative) |
  | `!**/__gen/**`         | Generated code directory (alternative) |
  | `!**/_gen/**`          | Generated code directory (alternative) |

#### Binary and Compiled Files

  | Path Pattern  | Description             |
  | ------------- | ----------------------- |
  | `!**/*.app`   | Application bundle      |
  | `!**/*.bin`   | Binary file             |
  | `!**/*.class` | Java compiled class     |
  | `!**/*.dll`   | Windows dynamic library |
  | `!**/*.dylib` | macOS dynamic library   |
  | `!**/*.exe`   | Windows executable      |
  | `!**/*.o`     | Object file             |
  | `!**/*.so`    | Shared object file      |
  | `!**/*.wasm`  | WebAssembly file        |

#### Archives and Compressed Files

  | Path Pattern | Description             |
  | ------------ | ----------------------- |
  | `!**/*.bz2`  | Bzip2 archive           |
  | `!**/*.gz`   | Gzip archive            |
  | `!**/*.xz`   | XZ archive              |
  | `!**/*.zip`  | ZIP archive             |
  | `!**/*.7z`   | 7-Zip archive           |
  | `!**/*.rar`  | RAR archive             |
  | `!**/*.zst`  | Zstandard archive       |
  | `!**/*.tar`  | TAR archive             |
  | `!**/*.jar`  | Java archive            |
  | `!**/*.war`  | Web application archive |
  | `!**/*.nar`  | NAR archive             |

#### Media Files

  | Path Pattern | Description     |
  | ------------ | --------------- |
  | `!**/*.mp3`  | MP3 audio       |
  | `!**/*.wav`  | WAV audio       |
  | `!**/*.wma`  | WMA audio       |
  | `!**/*.mp4`  | MP4 video       |
  | `!**/*.avi`  | AVI video       |
  | `!**/*.mkv`  | MKV video       |
  | `!**/*.wmv`  | WMV video       |
  | `!**/*.m4a`  | M4A audio       |
  | `!**/*.m4v`  | M4V video       |
  | `!**/*.3gp`  | 3GP video       |
  | `!**/*.3g2`  | 3G2 video       |
  | `!**/*.rm`   | RealMedia video |
  | `!**/*.mov`  | QuickTime video |
  | `!**/*.flv`  | Flash video     |
  | `!**/*.swf`  | Flash animation |
  | `!**/*.flac` | FLAC audio      |
  | `!**/*.ogg`  | OGG audio       |

#### Images and Fonts

  | Path Pattern  | Description            |
  | ------------- | ---------------------- |
  | `!**/*.ico`   | Icon file              |
  | `!**/*.svg`   | SVG image              |
  | `!**/*.jpeg`  | JPEG image             |
  | `!**/*.jpg`   | JPEG image             |
  | `!**/*.png`   | PNG image              |
  | `!**/*.gif`   | GIF image              |
  | `!**/*.bmp`   | BMP image              |
  | `!**/*.tiff`  | TIFF image             |
  | `!**/*.webm`  | WebM image             |
  | `!**/*.ttf`   | TrueType font          |
  | `!**/*.otf`   | OpenType font          |
  | `!**/*.woff`  | Web Open Font Format   |
  | `!**/*.woff2` | Web Open Font Format 2 |
  | `!**/*.eot`   | Embedded OpenType font |

#### Documents and Data Files

  | Path Pattern    | Description             |
  | --------------- | ----------------------- |
  | `!**/*.pdf`     | PDF document            |
  | `!**/*.doc`     | Word document           |
  | `!**/*.docx`    | Word document           |
  | `!**/*.xls`     | Excel spreadsheet       |
  | `!**/*.xlsx`    | Excel spreadsheet       |
  | `!**/*.ppt`     | PowerPoint presentation |
  | `!**/*.pptx`    | PowerPoint presentation |
  | `!**/*.csv`     | CSV data file           |
  | `!**/*.tsv`     | TSV data file           |
  | `!**/*.dat`     | Data file               |
  | `!**/*.db`      | Database file           |
  | `!**/*.parquet` | Parquet data file       |

#### Development and System Files

  | Path Pattern         | Description         |
  | -------------------- | ------------------- |
  | `!**/tags`           | Tags file           |
  | `!**/.tags`          | Tags file           |
  | `!**/TAGS`           | Tags file           |
  | `!**/.TAGS`          | Tags file           |
  | `!**/.DS_Store`      | macOS system file   |
  | `!**/.cscope.files`  | Cscope files        |
  | `!**/.cscope.out`    | Cscope output       |
  | `!**/.cscope.in.out` | Cscope input/output |
  | `!**/.cscope.po.out` | Cscope output       |
  | `!**/*.log`          | Log file            |
  | `!**/*.map`          | Source map          |
  | `!**/*.out`          | Output file         |
  | `!**/*.sum`          | Checksum file       |
  | `!**/*.work`         | Work file           |
  | `!**/*.md5sum`       | MD5 checksum file   |

#### Game and 3D Assets

  | Path Pattern        | Description            |
  | ------------------- | ---------------------- |
  | `!**/*.tga`         | Targa image            |
  | `!**/*.dds`         | DirectDraw surface     |
  | `!**/*.psd`         | Photoshop document     |
  | `!**/*.fbx`         | FBX 3D model           |
  | `!**/*.obj`         | OBJ 3D model           |
  | `!**/*.blend`       | Blender file           |
  | `!**/*.dae`         | COLLADA 3D model       |
  | `!**/*.gltf`        | GL Transmission Format |
  | `!**/*.hlsl`        | HLSL shader            |
  | `!**/*.glsl`        | GLSL shader            |
  | `!**/*.unity`       | Unity scene            |
  | `!**/*.umap`        | Unreal map             |
  | `!**/*.prefab`      | Unity prefab           |
  | `!**/*.mat`         | Material file          |
  | `!**/*.shader`      | Shader file            |
  | `!**/*.shadergraph` | Shader graph           |
  | `!**/*.sav`         | Save file              |
  | `!**/*.scene`       | Scene file             |
  | `!**/*.asset`       | Asset file             |

#### Python-specific Files

  | Path Pattern   | Description           |
  | -------------- | --------------------- |
  | `!**/*.pyc`    | Python compiled file  |
  | `!**/*.pyd`    | Python dynamic module |
  | `!**/*.pyo`    | Python optimized file |
  | `!**/*.pkl`    | Python pickle file    |
  | `!**/*.pickle` | Python pickle file    |

#### Go-specific Files

  | Path Pattern     | Description                     |
  | ---------------- | ------------------------------- |
  | `!**/*.pb.go`    | Protocol buffer Go file         |
  | `!**/*.pb.gw.go` | Protocol buffer gateway Go file |

#### Terraform Files

  | Path Pattern           | Description            |
  | ---------------------- | ---------------------- |
  | `!**/*.tfstate`        | Terraform state file   |
  | `!**/*.tfstate.backup` | Terraform state backup |

#### Minified Files

  | Path Pattern       | Description                    |
  | ------------------ | ------------------------------ |
  | `!**/*.min.js`     | Minified JavaScript            |
  | `!**/*.min.js.map` | Minified JavaScript source map |
  | `!**/*.min.js.css` | Minified CSS                   |

</Accordion>

### Configure path filters

You can edit your path filters directly in the UI:

<Steps>
  <Step title="Navigate to settings">
    Go to **Configuration** > **Review** > **Settings** > **Path Filters**
  </Step>

  <Step title="Modify filters">Add or remove path patterns as needed</Step>
</Steps>

<img src="https://mintcdn.com/coderabbit/69LGK0BhaHIxrC15/images/guides/img/guides/path-filters.png?fit=max&auto=format&n=69LGK0BhaHIxrC15&q=85&s=c45b14a62b428d2fa7a691266c54287c" alt="Path Filters Configuration" data-og-width="1155" width="1155" data-og-height="412" height="412" data-path="images/guides/img/guides/path-filters.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/69LGK0BhaHIxrC15/images/guides/img/guides/path-filters.png?w=280&fit=max&auto=format&n=69LGK0BhaHIxrC15&q=85&s=bf75677a7a2be7d50a38f0a197aaa420 280w, https://mintcdn.com/coderabbit/69LGK0BhaHIxrC15/images/guides/img/guides/path-filters.png?w=560&fit=max&auto=format&n=69LGK0BhaHIxrC15&q=85&s=2070d50d9bdcb3275263af307ab183a0 560w, https://mintcdn.com/coderabbit/69LGK0BhaHIxrC15/images/guides/img/guides/path-filters.png?w=840&fit=max&auto=format&n=69LGK0BhaHIxrC15&q=85&s=33bbf9b36263f9c28631cf46887e3342 840w, https://mintcdn.com/coderabbit/69LGK0BhaHIxrC15/images/guides/img/guides/path-filters.png?w=1100&fit=max&auto=format&n=69LGK0BhaHIxrC15&q=85&s=20e89334b3a6dbb4d7dee556f387e5c0 1100w, https://mintcdn.com/coderabbit/69LGK0BhaHIxrC15/images/guides/img/guides/path-filters.png?w=1650&fit=max&auto=format&n=69LGK0BhaHIxrC15&q=85&s=5f5541d9c782204ba7fa7c2ce740ac0e 1650w, https://mintcdn.com/coderabbit/69LGK0BhaHIxrC15/images/guides/img/guides/path-filters.png?w=2500&fit=max&auto=format&n=69LGK0BhaHIxrC15&q=85&s=4b02797abbb021fe5fb37d1d1b508d2f 2500w" />

### Sample usage

<Note>
  Paths accept glob patterns. See the
  [minimatch](https://github.com/isaacs/minimatch) documentation for more
  information.
</Note>

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    #...
    reviews:
    #...
    path_instructions:
        - path: "**/*.js"
        instructions: |
            Review the JavaScript code against the Google JavaScript style guide and point out any mismatches
        - path: "tests/**.*"
        instructions: |
            Review the following unit test code written using the Mocha test library. Ensure that:
            - The code adheres to best practices associated with Mocha.
            - Descriptive test names are used to clearly convey the intent of each test.
    ```

## Abstract Syntax Tree (AST) based instructions

<Info>
  This feature is available exclusively as part of the Pro plan. Please refer to
  our [pricing page](https://coderabbit.ai/pricing) for more information about
  our plans and features.
</Info>

CodeRabbit offers review instructions based on Abstract Syntax Tree (AST) patterns. Under the hood, CodeRabbit uses [`ast-grep`](https://ast-grep.github.io) to power this feature.

<Card title="ast-grep" icon="code">
  `ast-grep` is written in Rust and uses the tree-sitter parser to generate the
  AST for popular languages. Written and maintained by [Herrington
  Darkholme](https://twitter.com/hd_nvim).
</Card>

<Check>
  `ast-grep` Playground is quite effective in designing and testing AST rules on
  source code snippets. You can access the playground
  [here](https://ast-grep.github.io/playground.html).
</Check>

<Note>
  The additional context provided by this feature is only available during the automated code review process, and it's not available in the chat.

  Moreover, this feature is only recommended for advanced users as there is a learning curve involved.
</Note>

<Note>
  **Deep dive into AST patterns and `ast-grep` rules**

* Abstract Syntax Tree (AST) [Wikipedia article](https://en.wikipedia.org/wiki/Abstract_syntax_tree)
* `ast-grep` [official documentation](https://ast-grep.github.io/guide/rule-config.html) for detailed guides.
</Note>

This section explains how to add custom code review instructions using `ast-grep` rules for searching code using abstract syntax trees (AST) patterns.

### Setup process

<Steps>
  <Step title="Create rules directory">
    Create a directory to keep all the `ast-grep` rules in your project
    directory
  </Step>

  <Step title="Add rule files">
    Add individual `.yaml` files for each `ast-grep` rule within the newly
    created directory
  </Step>

  <Step title="Configure rules">
    Ensure that each `.yaml` file contains the necessary `ast-grep` rule
    configurations
  </Step>

  <Step title="Add message property">
    Ensure that all rules contain a `message` property that will be used during
    the review process
  </Step>

  <Step title="Update configuration">
    Add the rules' directory to the `.coderabbit.yml` file under
    `tools.ast-grep` configuration
  </Step>

  <Step title="Add packages (optional)">
    Optionally, add `packages` property to specify packages that should be
    installed before running the `ast-grep` tool
  </Step>
</Steps>

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    #...
    reviews:
    #...
    tools:
        ast-grep:
        essential_rules: true # option to enable essential security rules
        rule_dirs:
            - "custom-name"
        packages:
            - "myorg/myawesomepackage" # custom package name following the format organization/repository
    #...
    ```

### The rule object

Rule object is the core concept of `ast-grep` rule system and every other feature is built on top of it.

Below is the full list of fields in a rule object. Every rule field is optional and can be omitted, but at least one field should be present in a rule. A node will match a rule if and only if it satisfies all fields in the rule object.

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    rule:
    # atomic rule
    pattern: "search.pattern"
    kind: "tree_sitter_node_kind"
    regex: "rust|regex"
    # relational rule
    inside: { pattern: "sub.rule" }
    has: { kind: "sub_rule" }
    follows: { regex: "can|use|any" }
    precedes: { kind: "multi_keys", pattern: "in.sub" }
    # composite rule
    all: [{ pattern: "match.all" }, { kind: "match_all" }]
    any: [{ pattern: "match.any" }, { kind: "match_any" }]
    not: { pattern: "not.this" }
    matches: "utility-rule"
    ```

### Rule categories

The rule object fields can be categorized into three types:

<CardGroup cols={3}>
  <Card title="Atomic Rule" icon="atom">
    The most basic rule that checks if AST nodes match
  </Card>

  <Card title="Relational Rule" icon="link">
    Rules that check if a node is surrounded by another node
  </Card>

  <Card title="Composite Rule" icon="puzzle">
    Rules that combine sub-rules together using logical operators
  </Card>
</CardGroup>

These three categories of rules can be composed together to create more complex rules.

<Tip>
  The rule object is inspired by CSS selectors but with more composability and
  expressiveness. Thinking about how selectors in CSS work can help you
  understand the rule object!
</Tip>

> Read `ast-grep` > [documentation](https://ast-grep.github.io/guide/rule-config.html) for detailed guides.

#### Atomic rule

Atomic rule defines the most basic matching rule that determines whether one syntax node matches the rule or not. There are three kinds of atomic rule: `pattern`, `kind` and `regex`.

> Official documentation guide on [Atomic Rule](https://ast-grep.github.io/guide/rule-config/atomic-rule.html)

#### Relational rule

A relational rule defines the relationship between two syntax nodes. There are four kinds of relational rule: `inside`, `has`, `follows` and `precedes`.

All four relational rules accept a sub-rule object as their value. The sub-rule will match the surrounding node, while the relational rule itself will match the target node.

> Official documentation guide on [Relational Rule](https://ast-grep.github.io/guide/rule-config/relational-rule.html)

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    rule:
    pattern: await $PROMISE
    inside:
        kind: for_in_statement
        stopBy: end
    ```

#### Composite rule

A composite rule defines the logical relationship between multiple sub-rules. There are three kinds of composite rule: `all`, `any` and `not`.

**`all`**

The `all` rule matches if all sub-rules match.

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    rule:
    all:
        - pattern: console.log('Hello World');
        - kind: expression_statement
    ```

**`any`**

`any` rule matches if any sub-rule matches.

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    rule:
    any:
        - pattern: var a = $A
        - pattern: const a = $A
        - pattern: let a = $A
    ```

**`not`**

`not` applies negation to a sub-rule. It matches if the sub-rule does not match.

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    rule:
    pattern: console.log($GREETING)
    not:
        pattern: console.log('Hello World')
    ```

> Official documentation guide on [Composite Rule](https://ast-grep.github.io/guide/rule-config/composite-rule.html)

### Reusing rule as utility

`ast-grep` chooses to use YAML for rule representation. While this decision makes writing rules easier, it does impose some limitations on the rule authoring. One of the limitations is that rule objects cannot be reused.

#### Local utility rule

Local utility rules are defined in the utils field of the config file. Utils is a string-keyed dictionary.

For example, the following config file defines a local utility rule `is-literal`:

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    utils:
    is-literal:
        any:
        - kind: string
        - kind: number
        - kind: boolean
    rule:
    matches: is-literal
    ```

#### Global utility rule

Global utility rules are defined in a separate file. But they are available across all rule configurations in the project.

To create global utility rules, you need to have the `rules` directory created on the root of your project and another `utils` directory inside the root of your project.

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    my-awesome-project   # project root
    |- rules           # rule directory
    | |- my-rule.yml
    |- utils           # utils directory
    | |- is-literal.yml
    ```

> Also, you need to add the `rules` and `utils` directories to the `.coderabbit.yml` file under `tools.ast-grep` configuration. The rules can also be inside a package. If you have a package that contains rules, you can add the package name to the `packages` field in the `.coderabbit.yml` file.

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    #...
    reviews:
    #...
    tools:
        ast-grep:
        essential_rules: true
        rule_dirs:
            - "rules"
        util_dirs:
            - "utils"
        packages:
            - "my-awesome-org/my-awesome-package" # public repository that contains ast-grep rules
    #...
    ```

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    # is-literal.yml
    id: is-literal
    language: TypeScript
    rule:
    any:
        - kind: "false"
        - kind: undefined
        - kind: "null"
        - kind: "true"
        - kind: regex
        - kind: number
        - kind: string
    ```

> Official documentation guide on [Utility Rule](https://ast-grep.github.io/guide/rule-config/utility-rule.html)

### Packages

A package allows you to share rules across multiple projects. Essentially, a package is a collection of `ast-grep` rules.

<CardGroup cols={2}>
  <Card title="Built-in packages" icon="package">
    CodeRabbit provides packages you can use out of the box
  </Card>

  <Card title="Custom packages" icon="box">
    Create your own packages and share them with your community or organization
  </Card>
</CardGroup>

#### CodeRabbit packages

<Card title="ast-grep-essentials" icon="shield" href="https://github.com/coderabbitai/ast-grep-essentials">
  **Essential security rules package**

  Because we value security, this package gets its own property in the `.coderabbit.yml` file for easier installation without overwriting existing configurations.
</Card>

To use a package, you need to add the package name to the `packages` field in the `.coderabbit.yml` file.

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    #...
    reviews:
    #...
    tools:
        ast-grep:
        essential_rules: true
        packages: # list of packages to install, in future coderabbit will provide a set of packages, beside the essentials one.
            - "my-awesome-org/my-awesome-package" # custom package name following the format organization/repository
    #...
    ```

#### Using custom package

Let's say that you have a public repository that contains `ast-grep` rules. You can add the package name to the `packages` field in the `.coderabbit.yml` file.

#### Package requirements

<AccordionGroup>
  <Accordion title="Repository requirements">
    * Must be a public repository
    * Name should be in the format `organization/repository`
  </Accordion>

  <Accordion title="Content requirements">
    * Contains rules that follow the `ast-grep` rule format
    * Follows the required folder structure shown below
  </Accordion>

  <Accordion title="Folder structure">
    ```text  theme={null}
    my-awesome-project   # project root
      |- rules           # rule directory
      | |- my-rule.yml
      |- utils           # utils directory
      | |- is-literal.yml
    ```

    <Note>
      `rules` and `utils` directories are keywords and must be named exactly as shown. Inside each directory, the structure is flexible. You can have other root directories or files as needed.
    </Note>
  </Accordion>
</AccordionGroup>

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    #...
    reviews:
    #...
    tools:
        ast-grep:
        packages:
            - "my-awesome-org/my-awesome-package"
    #...
    ```

### Multiple languages support

CodeRabbit supports multiple programming languages for defining `ast-grep` rules:

<CardGroup cols={3}>
  <Card title="Web Technologies" icon="globe">
    * JavaScript
    * TypeScript
  </Card>

  <Card title="Systems Languages" icon="microchip">
    * C
    * Rust
    * Golang
  </Card>

  <Card title="Enterprise Languages" icon="building">
    * Java
    * C#
    * Kotlin
    * Python
  </Card>
</CardGroup>

### Language examples

Below are examples of `ast-grep` rules in different languages:

#### JavaScript

##### Importing files without an extension is not allowed

    ```yaml
    # YAML lines wrap icon="code" theme={null}
    id: find-import-file
    language: js
    message: "Importing files without an extension is not allowed"
    rule:
    regex: "/[^.]+[^/]$"
    kind: string_fragment
    any:
        - inside:
            stopBy: end
            kind: import_statement
        - inside:
            stopBy: end
            kind: call_expression
            has:
            field: function
            regex: "^import$"
    ```

##### No console.log allowed except `console.error` on the catch block

    ```yaml
    #YAML lines wrap icon="code" theme={null}
    id: no-console-except-error
    language: typescript
    message: "No console.log allowed except console.error on the catch block"
    rule:
    any:
        - pattern: console.error($$$)
        not:
            inside:
            kind: catch_clause
            stopBy: end
        - pattern: console.$METHOD($$$)
    constraints:
    METHOD:
        regex: "log|debug|warn"
    ```

#### C

In C, there is no built-in support for object-oriented programming, but some programmers use structs and function pointers to simulate classes and methods.

However, this style can have some drawbacks, such as:

* Extra memory allocation and reallocation for the struct and the function pointer.
* Indirection overhead when calling the function pointer.

A possible alternative is to use a plain function call with the struct pointer as the first argument.

    ```yaml
    #YAML lines wrap icon="code" theme={null}
    id: method_receiver
    language: c
    rule:
    pattern: $R.$METHOD($$$ARGS)
    transform:
    MAYBE_COMMA:
        replace:
        source: $$$ARGS
        replace: "^.+"
        by: ", "
    fix: $METHOD(&$R$MAYBE_COMMA$$$ARGS)
    ```

---
