# MilkyText theme

> The new default theme for skretchpad, a work in progress

```json
        {
            "backgroundBase": "#0A0A0E",
            "backgroundColor":"#0D0E13",
            "backgroundSubtleLight": "#12131b",
            "black": "#363941",
            "blue": "#8875FF",
            "brightBlack": "#505664",
            "brightBlue": "#C4AEF5",
            "brightCyan": "#BAF3DD",
            "brightGreen": "#F3F3B0",
            "brightPurple": "#FFAED8",
            "brightRed": "#FF8FA3",
            "brightWhite": "#FFE6EA",
            "brightYellow": "#FDDEBC",
            "cursorColor": "#FFCCD5",
            "cyan": "#75FFCF",
            "foreground": "#FFFFFF",
            "green": "#E6FF75",
            "name": "milkyterms",
            "purple": "#FF75C6",
            "red": "#FF758F",
            "selectionBackground": "#FFFFFF",
            "white": "#FFCCD5",
            "yellow": "#FBD58E"
        }
    ]
```

```toml
[metadata]
name = "MilkyText"
author = "heat"
version = "1.0.0"
base = "light"

[window]
background.base = "#0A0A0E"
background.blur = 20
border.radius = 12
border.width = 1
border.color = "rgba(0, 0, 0, 0.1)"

[chrome]
background.color = "#0D0E13"
background.blur = 10
height = 32
foreground = "#FFFFFF"

[editor]
background = "transparent"
foreground = "#FFFFFF"
cursor.color = "#FFCCD5"
cursor.width = 2
selection.background = "#FFFFFF"

[syntax]
comment = "#8875FF"
keyword = "#FF75C6"
string = "#75FFCF"
number = "#BAF3DD"
operator = "#FF758F"
function = "#F3F3B0"
variable = "#FFCCD5"
type = "#C4AEF5"
constant = "#FFAED8"

[ui]
status_bar.background = "#363941"
status_bar.foreground = "#FFFFFF"
status_bar.height = 24

[transitions]
chrome_toggle = 200
theme_switch = 300
hover = 100
easing = "cubic-bezier(0.4, 0.0, 0.2, 1)"

```

---
