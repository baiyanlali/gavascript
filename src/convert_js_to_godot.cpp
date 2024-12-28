#include "convert_js_to_godot.h"
#include "JSFunction.h"
#include <godot_cpp/core/memory.hpp>
#include <godot_cpp/variant/utility_functions.hpp>
typedef struct JSObject JSObject;

namespace gavascript{

    Variant var_to_variant(JSContext *ctx, const JSValue &p_val)
    {
        int64_t tag = JS_VALUE_GET_TAG(p_val);

        UtilityFunctions::print("var_to_variant " + String::num_int64(tag));

        switch (tag) {
            case JS_TAG_INT:
                return Variant(JS_VALUE_GET_INT(p_val));
            case JS_TAG_BOOL:
                return Variant(bool(JS_VALUE_GET_INT(p_val)));
            case JS_TAG_FLOAT64:
                return Variant(real_t(JS_VALUE_GET_FLOAT64(p_val)));
            case JS_TAG_STRING:
                return js_to_string(ctx, p_val);
            case JS_TAG_OBJECT: {
                if (JS_VALUE_GET_PTR(p_val) == NULL) {
                    return Variant();
                }

                int length = get_js_array_length(ctx, p_val);
                if (length != -1) { // Array
                    Array arr;
                    arr.resize(length);
                    for (int i = 0; i < length; i++) {
                        JSValue val = JS_GetPropertyUint32(ctx, p_val, i);
                        arr[int(i)] = var_to_variant(ctx, val);
                        JS_FreeValue(ctx, val);
                    }
                    return arr;
                } else if (JS_IsFunction(ctx, p_val)) {
                    UtilityFunctions::print("IS JSFunction");
                    JSFunction *func = memnew(JSFunction(ctx, p_val, JS_UNDEFINED));
                    return func;
                    // JS_Call()
                    // JSValue function = JS_FunctionToString(ctx, p_val);
                    // String ret = js_to_string(ctx, function);
                    // JS_FreeValue(ctx, function);
                    // return ret;
                    // TODO: Implement
                    return Variant();
                } else { // Plain Object as Dictionary
                    UtilityFunctions::print("IS Dictionary");
                    List<void *> stack;
                    return js_to_dictionary(ctx, p_val, stack);
                }
            } break;
            case JS_TAG_NULL:
            case JS_TAG_UNDEFINED:
                return Variant();
                break;
            default:
    #ifdef JS_NAN_BOXING
                if (tag > JS_TAG_FLOAT64 || tag < JS_TAG_FIRST) {
                    return Variant(real_t(JS_VALUE_GET_FLOAT64(p_val)));
                }
    #endif
                return Variant();
        }
    }

    String js_to_string(JSContext *ctx, const JSValueConst &p_val){
        String ret;
        size_t len = 0;
        const char *utf8 = JS_ToCStringLen(ctx, &len, p_val);
        ret.parse_utf8(utf8, len);
        JS_FreeCString(ctx, utf8);
        return ret;
    }

    int get_js_array_length(JSContext *ctx, JSValue p_val){
        if (!JS_IsArray(ctx, p_val))
            return -1;
        JSValue ret = JS_GetProperty(ctx, p_val, JS_ATOM_length);
        int32_t length = -1;
        if (JS_ToInt32(ctx, &length, ret))
            return -1;
        return length;
    }

    Dictionary js_to_dictionary(JSContext *ctx, const JSValue &p_val, List<void *> &stack){
        Dictionary dict;
        HashSet<String> keys;
        get_own_property_names(ctx, p_val, &keys);
        stack.push_back(JS_VALUE_GET_PTR(p_val));
        for (const String &key : keys) {
            JSValue v = JS_GetPropertyStr(ctx, p_val, key.utf8().get_data());
            Variant val;
            if (JS_IsObject(v)) {
                void *ptr = JS_VALUE_GET_PTR(v);
                if (stack.find(ptr)) {
                    union {
                        const void *p;
                        uint64_t i;
                    } u;
                    u.p = ptr;
                    ERR_PRINT(vformat("Property '%s' circular reference to 0x%X", key, u.i));
                    JS_FreeValue(ctx, v);
                    continue;
                } else {
                    stack.push_back(ptr);
                    val = var_to_variant(ctx, v);
                    stack.pop_back();
                }
            } else {
                val = var_to_variant(ctx, v);
            }
            dict[key] = val;
            JS_FreeValue(ctx, v);
        }
        stack.pop_back();
        return dict;
    }

    void get_own_property_names(JSContext *ctx, JSValue p_object, HashSet<String> *r_list) {
        ERR_FAIL_COND(!JS_IsObject(p_object));
        JSPropertyEnum *props = NULL;
        uint32_t tab_atom_count;
        JS_GetOwnPropertyNames(ctx, &props, &tab_atom_count, p_object, JS_GPN_STRING_MASK | JS_GPN_SYMBOL_MASK);
        for (uint32_t i = 0; i < tab_atom_count; i++) {
            JSValue key = JS_AtomToValue(ctx, props[i].atom);
            String name = js_to_string(ctx, key);
            r_list->insert(name);
            JS_FreeAtom(ctx, props[i].atom);
            JS_FreeValue(ctx, key);
        }
        js_free_rt(JS_GetRuntime(ctx), props);
    }

}