# ast-grep

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit's guide to ast-grep.

[ast-grep](https://ast-grep.github.io) is an open-source static analysis tool that uses abstract syntax trees (AST) to find patterns in your codebase, helping identify security vulnerabilities and enforce code quality standards.

### Configuration Options

You can configure ast-grep in your `.coderabbit.yaml` file or through CodeRabbit's settings page under "Review → Tools → ast-grep". The following options are available:

* **`rule_dirs`**: List of directories containing your custom ast-grep rules (relative to repository root)
* **`util_dirs`**: List of directories containing utility configs to support rule management (relative to repository root)
* **`essential_rules`**: Enable the ast-grep essentials package (default: `true`)
* **`packages`**: List of GitHub packages to use (format: `owner/repo`)

### Example Configuration

```yaml  theme={null}
reviews:
  tools:
    ast-grep:
      rule_dirs:
        - "rules/javascript"
        - "rules/python"
      util_dirs:
        - "utils"
      essential_rules: true
      packages:
        - "owner/custom-rules"
```

<Note>
  CodeRabbit will only run ast-grep if you have configured at least one of the following:

* Custom rule directories (`rule_dirs`)
* Custom utility directories (`util_dirs`)
* Essential rules enabled (`essential_rules: true`)
* Custom packages (`packages`)
</Note>

## Links

* [ast-grep Documentation](https://ast-grep.github.io)
* [Writing ast-grep Rules](https://ast-grep.github.io/reference/yaml.html)
* [ast-grep Rule Object Properties](https://ast-grep.github.io/reference/rule.html)
* [ast-grep Essentials Package](https://github.com/coderabbitai/ast-grep-essentials)

## Files

ast-grep will run on the following file types:

* C/C++ (.c, .cpp, .h, .hpp)
* C# (.cs)
* CSS (.css)
* Elixir (.ex, .exs)
* Go (.go)
* Haskell (.hs)
* HTML (.html)
* Java (.java)
* JavaScript (.js, .jsx)
* JSON (.json)
* Kotlin (.kt)
* Lua (.lua)
* PHP (.php)
* Python (.py)
* Ruby (.rb)
* Rust (.rs)
* Scala (.scala)
* Shell (.sh, .bash)
* SQL (.sql)
* Swift (.swift)
* TypeScript (.ts, .tsx)
* YAML (.yaml, .yml)
