#!/usr/bin/env python
import os
import sys
# from SCons.Script import SConscript, ARGUMENTS, Action, Copy, CacheDir
env = SConscript("godot-cpp/SConstruct")

# CacheDir('cache')

# For reference:
# - CCFLAGS are compilation flags shared between C and C++
# - CFLAGS are for C-specific compilation flags
# - CXXFLAGS are for C++-specific compilation flags
# - CPPFLAGS are for pre-processor flags
# - CPPDEFINES are for pre-processor defines
# - LINKFLAGS are for linking flags

# tweak this if you want to use different folders, or more folders, to store your source code in.
# env.Append(CPPDEFINES=['CONFIG_ATOMICS'])
env.Append(CPPPATH=["src/"])
sources = Glob("src/*.cpp")

quickjs_version = open("thirdparty/quickjs/VERSION", "r").read().split("\n")[0]
cppdefines = [
    f'CONFIG_VERSION="{quickjs_version}"',
    'CONFIG_BIGNUM=y',
    'MSVC_VERSION=14.3'
]

env.Append(CPPDEFINES=cppdefines)

env.Append(CPPPATH=["thirdparty/quickjs/"])

if env['CC'] == 'cl':  # MSVC 编译器的环境变量
    print("MSVC set env")
    # env.Append(CFLAGS='-Wno-unsafe-buffer-usage')
    # env.Append(CFLAGS='-Wno-sign-conversion')
    # env.Append(CFLAGS='-Wno-nonportable-system-include-path')
    # env.Append(CFLAGS='-Wno-implicit-int-conversion')
    # env.Append(CFLAGS='-Wno-shorten-64-to-32')
    # env.Append(CFLAGS='-Wno-reserved-macro-identifier')
    # env.Append(CFLAGS='-Wno-reserved-identifier')
    # env.Append(CFLAGS='-Wdeprecated-declarations')
    # env.Append(CFLAGS='/wd4996')
    # env.Append(CFLAGS='/experimental:c11atomics')
    env.Append(CFLAGS='/std:c11')  # -Wno-sign-conversion
    env.Append(CFLAGS='/experimental:c11atomics')  # -Wno-sign-conversion
    # env.Append(CFLAGS='/wd4061')  # -Wno-implicit-fallthrough
    # env.Append(CFLAGS='/wd4100')  # -Wno-unused-parameter
    # env.Append(CFLAGS='/wd4200')  # -Wno-zero-length-array
    # env.Append(CFLAGS='/wd4242')  # -Wno-shorten-64-to-32
    # env.Append(CFLAGS='/wd4244')  # -Wno-shorten-64-to-32
    # env.Append(CFLAGS='/wd4245')  # -Wno-sign-compare
    # env.Append(CFLAGS='/wd4267')  # -Wno-shorten-64-to-32
    # env.Append(CFLAGS='/wd4388')  # -Wno-sign-compare
    # env.Append(CFLAGS='/wd4389')  # -Wno-sign-compare
    # env.Append(CFLAGS='/wd4710')  # Function not inlined
    # env.Append(CFLAGS='/wd4711')  # Function was inlined
    # env.Append(CFLAGS='/wd4820')  # Padding added after construct
    # env.Append(CFLAGS='/wd4996')  # -Wdeprecated-declarations
    # env.Append(CFLAGS='/wd5045')  # Compiler will insert Spectre mitigation for memory load if /Qspectre switch specified


sources.extend(
    [
        'thirdparty/quickjs/quickjs.c',
        'thirdparty/quickjs/cutils.c',
        'thirdparty/quickjs/libbf.c',
        'thirdparty/quickjs/libregexp.c',
        'thirdparty/quickjs/libunicode.c',
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
