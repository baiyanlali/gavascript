#ifndef GDOBJECT_H
#define GDOBJECT_H

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
    class GDObject {
    public:
        static JSClassID class_id;
        static void register_class(JSContext* ctx);

        static void js_finalizer(JSRuntime *rt, JSValue val);

        static bool is_instance(JSContext *ctx, JSValueConst val);

        GDObject() {};
        Variant godot_object;

        static JSValue get(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic);
        static JSValue set(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic);
    };
}

#endif