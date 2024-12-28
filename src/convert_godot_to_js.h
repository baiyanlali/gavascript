#ifndef CONVERT_GODOT_TO_JS_H
#define CONVERT_GODOT_TO_JS_H
#include "quickjs.h"
#include <godot_cpp/variant/variant.hpp>
#include <godot_cpp/templates/hash_set.hpp>
#include <godot_cpp/templates/vector.hpp>

using namespace godot;
namespace gavascript {
    JSValue variant_to_var(JSContext *ctx, const Variant& value);

    _FORCE_INLINE_ static JSValue to_js_number(JSContext *ctx, real_t p_val) {
            return JS_NewFloat64(ctx, double(p_val));
    }

    _FORCE_INLINE_ static JSValue to_js_string(JSContext *ctx, const String &text) {
        CharString utf8 = text.utf8();
        return JS_NewStringLen(ctx, utf8.get_data(), utf8.length());
    }
}

#endif