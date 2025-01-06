#ifndef GDFUNCTION_H
#define GDFUNCTION_H

#include <godot_cpp/classes/node.hpp>
#include "../thirdparty/quickjs/quickjs.h"
#include <godot_cpp/templates/hash_set.hpp>
#include <godot_cpp/templates/vector.hpp>
#include <godot_cpp/classes/resource.hpp>
#include "JSMetaObject.h"
#include "convert_js_to_godot.h"
#include "convert_godot_to_js.h"

using namespace godot;

namespace gavascript {
    class GDFunction {
    public:
        static JSClassID class_id;
        static void register_class(JSContext* ctx);

        static void js_finalizer(JSRuntime *rt, JSValue val);

        static bool is_instance(JSContext *ctx, JSValueConst val);

        GDFunction() {};
        Callable callable;

        static JSValue MagicFunction(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic);
    };
}

#endif