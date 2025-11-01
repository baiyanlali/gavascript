# Gavascript: Godot JavaScript Runtime Plugin

Gavascript is a plugin that provides a JavaScript runtime environment for the Godot Engine. It allows developers to run and interact with JavaScript code directly inside Godot projects, enabling more flexible scripting and cross-language integration.

## Features

- Embed a JavaScript runtime inside Godot
- Distributed as a GDExtension plugin so you don't need to rebuild the entire Godot engine
- Supports data and method interop between Godot and JS
- Supports Windows and macOS platforms (other platforms untested)

## Repository layout

```
demo/                # Godot example project
godot-cpp/           # Godot C++ binding code
src/                 # Core plugin source code (C++)
thirdparty/          # Third-party dependencies
SConstruct           # Build script
```

## Quick start

1. Clone the repository

```powershell
git clone https://github.com/baiyanlali/gavascript.git
```

2. Build the plugin

Make sure Godot and the required C++ build tools (for example SCons, CMake) are installed.

```powershell
cd gavascript
scons platform=windows
```

3. Integrate into a Godot project

- Add the generated files in the `bin/` directory to your Godot project
- The `demo/` folder contains an example project you can open and run directly

4. Call JS from Godot scripts

See `main.gd` and the `javascript` folder examples for how to call JS code from GDScript.

Example:

```gdscript
var js_instance = GavascriptInstance.new()
js_instance.eval("console.log('Hello from JS!')")
```

## Dependencies

- Godot 4.x
- C++17
- SCons / CMake
- [godot-cpp](https://github.com/godotengine/godot-cpp)

## Contributing

Issues and pull requests are welcome. Contributions to expand features or support more platforms are appreciated.

## License

MIT License

---

If you need more detailed documentation or API references, please let me know what specifics you want and I can add them.
