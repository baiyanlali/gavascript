#!/usr/bin/env python
import os
import sys

env = SConscript("godot-cpp/SConstruct")

CacheDir('cache')

# For reference:
# - CCFLAGS are compilation flags shared between C and C++
# - CFLAGS are for C-specific compilation flags
# - CXXFLAGS are for C++-specific compilation flags
# - CPPFLAGS are for pre-processor flags
# - CPPDEFINES are for pre-processor defines
# - LINKFLAGS are for linking flags

# tweak this if you want to use different folders, or more folders, to store your source code in.
env.Append(CPPPATH=["src/"])
sources = Glob("src/*.cpp")

quickjs_version = open("thirdparty/quickjs/VERSION", "r").read().split("\n")[0]
cppdefines = [
    f'CONFIG_VERSION="{quickjs_version}"',
    'CONFIG_BIGNUM=y',
]

env.Append(CPPDEFINES=cppdefines)

env.Append(CPPPATH=["thirdparty/quickjs/"])

sources.extend(
    [
        'thirdparty/quickjs/quickjs.c',
        'thirdparty/quickjs/cutils.c',
        'thirdparty/quickjs/libbf.c',
        'thirdparty/quickjs/libregexp.c',
        'thirdparty/quickjs/libunicode.c'
    ]
)

# env.add_source_files(env.modules_sources, "thirdparty/quickjs/*.c")

if env["platform"] == "windows":
    if env["use_mingw"]:
        env.Append(LIBS=["pthread"])


if env["platform"] == "macos":
    library = env.SharedLibrary(
        "demo/bin/libgavascript.{}.{}.framework/libgavascript.{}.{}".format(
            env["platform"], env["target"], env["platform"], env["target"]
        ),
        source=sources,
    )
elif env["platform"] == "ios":
    if env["ios_simulator"]:
        library = env.StaticLibrary(
            "demo/bin/libgavascript.{}.{}.simulator.a".format(env["platform"], env["target"]),
            source=sources,
        )
    else:
        library = env.StaticLibrary(
            "demo/bin/libgavascript.{}.{}.a".format(env["platform"], env["target"]),
            source=sources,
        )
else:
    library = env.SharedLibrary(
        "demo/bin/libgavascript{}{}".format(env["suffix"], env["SHLIBSUFFIX"]),
        source=sources,
    )

Default(library)
