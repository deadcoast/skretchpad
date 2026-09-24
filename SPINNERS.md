# SPINNERS.md

## [TASK]

The Progress bar should be designed to look like it is "coming out" of the "Python Spinner".

- The Python Spinner is a single character that simulates a gradient, the Progress bar should look like a natural extension of the spinner, entering into the bar from spinner position, and exiting on the spinner pisition. For lack of a better term, the "Python Spinner" acts as a "portal" for the "Python Progress Bar".

## [PAIR1]:"Python Spinner"

```python
# Using with Rich
from rich.console import Console
from rich.spinner import Spinner

console = Console()
with console.status("Loading...", spinner="noise"):
    # your code here
    pass

# ─────────────────────────────────────────

# Using with Halo
from halo import Halo

spinner = Halo(
    text="Loading...",
    spinner={
        "interval": 100,
        "frames": [
  "▓",
  "▒",
  "░"
]
    }
)
spinner.start()
# your code here
spinner.stop()

# ─────────────────────────────────────────

# Raw frames (for custom implementation)
frames = [
  "▓",
  "▒",
  "░"
]
interval = 100  # ms
```

## [PAIR1]:"Python Progress Bar"

```python
# Using with Rich
from rich.console import Console
from rich.spinner import Spinner

console = Console()
with console.status("Loading...", spinner="material"):
    # your code here
    pass

# ─────────────────────────────────────────

# Using with Halo
from halo import Halo

spinner = Halo(
    text="Loading...",
    spinner={
        "interval": 17,
        "frames": [
  "█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "███▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "███████▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "████████▁▁▁▁▁▁▁▁▁▁▁▁",
  "█████████▁▁▁▁▁▁▁▁▁▁▁",
  "█████████▁▁▁▁▁▁▁▁▁▁▁",
  "██████████▁▁▁▁▁▁▁▁▁▁",
  "███████████▁▁▁▁▁▁▁▁▁",
  "█████████████▁▁▁▁▁▁▁",
  "██████████████▁▁▁▁▁▁",
  "████████████████▁▁▁▁",
  "█████████████████▁▁▁",
  "███████████████████▁",
  "████████████████████",
  "████████████████████",
  "▁████████████████████",
  "▁▁████████████████████",
  "▁▁▁██████████████████",
  "▁▁▁▁▁████████████████",
  "▁▁▁▁▁▁███████████████",
  "▁▁▁▁▁▁▁▁█████████████",
  "▁▁▁▁▁▁▁▁▁▁███████████",
  "▁▁▁▁▁▁▁▁▁▁▁▁█████████",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁███████",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁"
]
    }
)
spinner.start()
# your code here
spinner.stop()

# ─────────────────────────────────────────

# Raw frames (for custom implementation)
frames = [
  "█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "███▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "███████▁▁▁▁▁▁▁▁▁▁▁▁▁",
  "████████▁▁▁▁▁▁▁▁▁▁▁▁",
  "█████████▁▁▁▁▁▁▁▁▁▁▁",
  "█████████▁▁▁▁▁▁▁▁▁▁▁",
  "██████████▁▁▁▁▁▁▁▁▁▁",
  "███████████▁▁▁▁▁▁▁▁▁",
  "█████████████▁▁▁▁▁▁▁",
  "██████████████▁▁▁▁▁▁",
  "████████████████▁▁▁▁",
  "█████████████████▁▁▁",
  "███████████████████▁",
  "████████████████████",
  "████████████████████",
  "▁████████████████████",
  "▁▁████████████████████",
  "▁▁▁██████████████████",
  "▁▁▁▁▁████████████████",
  "▁▁▁▁▁▁███████████████",
  "▁▁▁▁▁▁▁▁█████████████",
  "▁▁▁▁▁▁▁▁▁▁███████████",
  "▁▁▁▁▁▁▁▁▁▁▁▁█████████",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁███████",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
  "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁"
]
interval = 17  # ms
```

---
