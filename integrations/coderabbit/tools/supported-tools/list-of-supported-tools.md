# List of supported tools

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Overview of CodeRabbit's supported linters and security analysis tools

This is a list of the third-party open-source linters and security analysis tools that CodeRabbit uses to generate code reviews.

For more information about fine-tuning the CodeRabbit configuration of a tool, click that tool's name in the following list.

For an overview of how CodeRabbit uses these tools when generating code reviews, as well as general information about controlling their use, see [Configure third-party tools](/tools/).

| Technology                  | Tools                                                                                                                                      | Category                                            |
| :-------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------- |
| All                         | [Gitleaks](/tools/gitleaks), [OSV-Scanner](/tools/osv-scanner), [Trivy](/tools/trivy), [Pipeline Remediation](/tools/pipeline-remediation) | Code Security, CI/CD                                |
| ast-grep                    | [ast-grep](/tools/ast-grep)                                                                                                                | Code Quality, Code Security                         |
| Azure DevOps Pipelines      | [Pipeline Remediation](/tools/pipeline-remediation)                                                                                        | CI/CD Failure Remediation                           |
| CircleCI                    | [CircleCI](/tools/circleci), [Pipeline Remediation](/tools/pipeline-remediation)                                                           | Configuration Validation, CI/CD Failure Remediation |
| CloudFormation              | [Checkov](/tools/checkov)                                                                                                                  | Code Security                                       |
| Cppcheck                    | [Cppcheck](/tools/cppcheck)                                                                                                                | Code Quality                                        |
| Clang                       | [Clang-Tidy](/tools/clang-tidy)                                                                                                            | Code Quality                                        |
| CSS                         | [Biome](/tools/biome)                                                                                                                      | Code Quality                                        |
| Docker                      | [Hadolint](/tools/hadolint), [Checkov](/tools/checkov)                                                                                     | Code Quality, Code Security                         |
| Environment Files (.env)    | [Dotenv Linter](/tools/dotenv)                                                                                                             | Code Quality                                        |
| Fortran                     | [Fortitude](/tools/fortitude)                                                                                                              | Code Quality                                        |
| GitHub Actions              | [actionlint](/tools/actionlint), [Pipeline Remediation](/tools/pipeline-remediation)                                                       | Code Quality, CI/CD Failure Remediation             |
| GitLab Pipelines            | [Pipeline Remediation](/tools/pipeline-remediation)                                                                                        | CI/CD Failure Remediation                           |
| Go                          | [golangci-lint](/tools/golangci-lint)                                                                                                      | Code Quality                                        |
| Helm                        | [Checkov](/tools/checkov)                                                                                                                  | Code Security                                       |
| HTML                        | [HTMLHint](/tools/htmlhint)                                                                                                                | Code Quality                                        |
| Javascript                  | [Biome](/tools/biome), [oxlint](/tools/oxlint)                                                                                             | Code Quality                                        |
| JSON, JSONC                 | [Biome](/tools/biome)                                                                                                                      | Code Quality                                        |
| JSX                         | [Biome](/tools/biome), [oxlint](/tools/oxlint)                                                                                             | Code Quality                                        |
| Kotlin                      | [detekt](/tools/detekt)                                                                                                                    | Code Quality                                        |
| Kubernetes                  | [Checkov](/tools/checkov)                                                                                                                  | Code Security                                       |
| Lua                         | [Luacheck](/tools/luacheck)                                                                                                                | Code Quality                                        |
| Makefile                    | [Checkmake](/tools/checkmake)                                                                                                              | Code Quality                                        |
| Markdown                    | [markdownlint](/tools/markdownlint), [LanguageTool](/tools/languagetool)                                                                   | Code Quality, Grammar Checking                      |
| PHP                         | [PHPStan](/tools/phpstan), [PHPMD](/tools/phpmd), [PHPCS](/tools/phpcs)                                                                    | Code Quality                                        |
| Plaintext                   | [LanguageTool](/tools/languagetool)                                                                                                        | Grammar and Spell Checking                          |
| Java                        | [PMD](/tools/pmd)                                                                                                                          | Code Quality                                        |
| Protobuf                    | [Buf](/tools/buf)                                                                                                                          | Code Quality                                        |
| Python                      | [Ruff](/tools/ruff), [Pylint](/tools/pylint), [Flake8](/tools/flake8)                                                                      | Code Quality                                        |
| Jupyter Notebooks           | [Ruff](/tools/ruff), [Pylint](/tools/pylint), [Flake8](/tools/flake8)                                                                      | Code Quality                                        |
| Regal                       | [Regal](/tools/regal)                                                                                                                      | Code Quality                                        |
| Ruby                        | [RuboCop](/tools/rubocop), [Brakeman](/tools/brakeman)                                                                                     | Code Quality, Code Security                         |
| Rust                        | [Clippy](/tools/clippy)                                                                                                                    | Code Quality                                        |
| Semgrep                     | [Semgrep](/tools/semgrep)                                                                                                                  | Code Security                                       |
| Shell (sh, bash, ksh, dash) | [ShellCheck](/tools/shellcheck)                                                                                                            | Code Quality                                        |
| Windows Batch Files         | [Blinter](/tools/blinter)                                                                                                                  | Code Quality                                        |
| Shopify                     | [Shopify CLI](/tools/shopify-cli)                                                                                                          | Code Quality                                        |
| SQL                         | [SQLFluff](/tools/sqlfluff)                                                                                                                | Code Quality                                        |
| Swift                       | [SwiftLint](/tools/swiftlint)                                                                                                              | Code Quality                                        |
| Terraform                   | [TFLint](/tools/tflint), [Checkov](/tools/checkov)                                                                                         | Code Quality, Code Security                         |
| TSX                         | [Biome](/tools/biome), [oxlint](/tools/oxlint)                                                                                             | Code Quality                                        |
| Typescript                  | [Biome](/tools/biome), [oxlint](/tools/oxlint)                                                                                             | Code Quality                                        |
| YAML                        | [YAMLlint](/tools/yamllint)                                                                                                                | Code Quality                                        |
| Prisma                      | [Prisma Lint](/tools/prisma-lint)                                                                                                          | Code Quality                                        |
