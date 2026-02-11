# Semgrep

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit's guide to Semgrep.

[Semgrep](https://github.com/semgrep/semgrep) is an open-source static analysis tool designed to scan code for security vulnerabilities and code quality issues.

## Configuration

Semgrep uses a YAML style configuration file. By default, we will automatically
use the following files if any are set in the root directory of your
repository.

* `semgrep.yml` or `semgrep.yaml`
* `semgrep.config.yml` or `semgrep.config.yaml`

Semgrep supports the following config files:

* User-defined config file set at `reviews.tools.semgrep.config_file` in your
  project's `.coderabbit.yaml` file or setting the "Review → Tools → Semgrep →
  Config File" field in CodeRabbit's settings page.

Due to licensing, CodeRabbit does not ship with the [community-created Semgrep rules](https://github.com/returntocorp/semgrep-rules).

<Note>
  CodeRabbit will only run Semgrep if your repository contains a Semgrep config file. This config must use the default file names, or you must define the path to this file in the `.coderabbit.yaml` or config UI.
</Note>

## Links

* [Semgrep CLI Reference](https://semgrep.dev/docs/cli-reference)
* [Writing Semgrep Rules for Config Files](https://semgrep.dev/docs/running-rules)

## Files

Semgrep will run on the following file types:

* C/C++ (`.c`, `.cpp`, `.cc`, `.cxx`, `.c++`, `.h`, `.hpp`, `.hh`, `.hxx`, `.h++`)
* C# (`.cs`)
* Go (`.go`)
* Java (`.java`)
* JavaScript (`.js`, `.jsx`)
* Kotlin (`.kt`)
* Python (`.py`)
* TypeScript (`.ts`)
* Ruby (`.rb`)
* Rust (`.rs`)
* PHP (`.php`)
* Scala (`.scala`)
* Swift (`.swift`)
* Terraform (`.tf`)
* JSON (`.json`)
