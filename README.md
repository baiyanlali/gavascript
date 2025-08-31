# Gavascript: Godot JavaScript Runtime Plugin

Gavascript 是一个为 [Godot Engine](https://godotengine.org/) 提供 JavaScript 运行环境的插件。它允许开发者在 Godot 项目中直接运行和交互 JavaScript 代码，实现更灵活的脚本扩展和跨语言集成。

## 功能特性

- 在 Godot 中嵌入 JavaScript 运行时
- 以GDExtension方式提供插件，无需重新编译整个godot引擎。
- 支持 Godot 与 JS 之间的数据和方法互通
- 支持 Windows、Mac 平台（其他平台有待测试）

## 目录结构

```
demo/                # Godot 示例项目
godot-cpp/           # Godot C++ 绑定相关代码
src/                 # 插件核心源码（C++）
thirdparty/          # 第三方依赖
SConstruct           # 构建脚本
```

## 快速开始

1. 克隆仓库

```shell
git clone https://github.com/baiyanlali/gavascript.git
```

2. 构建插件

确保已安装 Godot 及相关 C++ 构建工具（如 SCons、CMake）。

```shell
cd gavascript
scons platform=windows
```

3. 在 Godot 项目中集成

- 将 `bin/` 目录下生成的插件文件加入你的 Godot 项目
- 在 demo 目录下有示例项目，可直接打开运行

4. 在 Godot 脚本中调用 JS

参考 main.gd 和 javascript 目录下的示例，了解如何在 GDScript 中调用 JS 代码。

## 示例

```gdscript
var js_instance = GavascriptInstance.new()
js_instance.eval("console.log('Hello from JS!')")
```

## 依赖

- Godot 4.x
- C++17
- SCons/CMake
- [godot-cpp](https://github.com/godotengine/godot-cpp)

## 贡献

欢迎提交 issue 和 PR，完善功能或适配更多平台。

## 许可证

MIT License

---

如需更详细的说明或 API 文档，请补充具体需求。