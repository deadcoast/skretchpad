# Ruff

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit's guide to Ruff.

[Ruff](https://docs.astral.sh/ruff/) is a linter for Python or Jupiter Notebooks.

## Files

Ruff will run on files with the following extensions:

* `.py`
* `.ipynb` (using nbqa)

## Configuration

Ruff supports the following config files:

* `pyproject.toml`
* `ruff.toml`
* `.ruff.toml`

CodeRabbit will use the default settings based on the profile selected if no config file is found.

## When we skip Ruff

CodeRabbit will skip running Ruff when:

* Ruff is already running in GitHub workflows.

## Ignored codes

The following Ruff codes are automatically ignored:

* `I001` - unsorted imports
* `F401` - unused imports
* `W291` - trailing whitespace
* `W293` - blank line contains whitespace
* `Q000` - bad quotes
* `ANN001` - missing type annotation
* `ANN201` - missing return type annotation
* `UP006` - deprecated type alias
* `UP045` - deprecated import
* `E501` - line too long
* `S101` - use of assert detected
* `EXE001` - Shebang is present but file is not executable

## Profile behavior

In **Chill** mode, Ruff uses a focused set of rule codes including Pyflakes (F), flake8-bugbear (B), flake8-bandit (S), and other essential checks.

In **Assertive** mode, Ruff additionally enables:

* `ANN` - flake8-annotations (type annotations)
* `ASYNC` - flake8-async (async/await issues)
* `FBT` - flake8-boolean-trap
* `C4` - flake8-comprehensions
* `DTZ` - flake8-datetimez (timezone issues)
* `DJ` - flake8-django
* `ISC` - flake8-implicit-str-concat
* `LOG` - flake8-logging
* `G` - flake8-logging-format
* `PIE` - flake8-pie
* `PT` - flake8-pytest-style
* `FLY` - flynt (f-string opportunities)
* `UP` - pyupgrade (upgrade opportunities)

Additionally, in Assertive mode, `S101` (use of assert) is ignored in test files.

## Links

* [Ruff Configuration](https://docs.astral.sh/ruff/configuration/)
* [nbqa Documentation](https://github.com/nbQA-dev/nbQA)
