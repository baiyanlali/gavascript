#ifndef CONVERT_JS_TO_GODOT_H
#define CONVERT_JS_TO_GODOT_H
#include "quickjs.h"
#include <godot_cpp/variant/variant.hpp>
#include <godot_cpp/templates/hash_set.hpp>
#include <godot_cpp/templates/vector.hpp>

using namespace godot;
namespace gavascript {

    struct JavaScriptError {
        int line;
        int column;
        String message;
        String file;
        Vector<String> stack;
    };

    Variant var_to_variant(JSContext *ctx, const JSValue &p_val);

    String js_to_string(JSContext *ctx, const JSValueConst &p_val);

    int get_js_array_length(JSContext *ctx, JSValue p_val);

    Dictionary js_to_dictionary(JSContext *ctx, const JSValue &p_val, List<void *> &stack);

    void get_own_property_names(JSContext *ctx, JSValue p_object, HashSet<String> *r_list);

    String error_to_string(const JavaScriptError &p_error);

    void dump_exception(JSContext *ctx, const JSValue &p_exception, JavaScriptError *r_error);

    enum {
            __JS_ATOM_NULL = JS_ATOM_NULL,
            #if !(defined(EMSCRIPTEN) || defined(_MSC_VER))
            #define CONFIG_ATOMICS
            #endif
            #define DEF(name, str) JS_ATOM_##name,
            #include "../thirdparty/quickjs/quickjs-atom.h"
            #undef DEF
            #ifdef CONFIG_ATOMICS
            #undef CONFIG_ATOMICS
            #endif
                    JS_ATOM_END, 
    };
}

#endif