#include "convert_godot_to_js.h"
#include "convert_js_to_godot.h"
#include <godot_cpp/variant/callable.hpp>
#include <godot_cpp/variant/utility_functions.hpp>
#include <godot_cpp/templates/vector.hpp>
#include "GDFunction.h"
namespace gavascript{

    // JSValue MagicFunction(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic) {
    //     // Callable callable = *static_cast<Callable*>(JS_GetOpaque(this_val, 0));
    //     // Variant* args = (Variant*)alloca(sizeof(Variant) * argc);

    //     // for (int i = 0; i < argc; i++) {
    //     //     args[i] = (var_to_variant(ctx, argv[i]));
    //     // }
    //     // Variant ret = callable.call(args);
    //     // return variant_to_var(ctx, ret);
    //     // return JS_UNDEFINED;
    //     // UtilityFunctions::print("Magic Function Called");
    //     return JS_UNDEFINED;
    // }

    JSValue variant_to_var(JSContext *ctx, const Variant value)
    {
        switch (value.get_type()) {
            case Variant::BOOL:
                return ((bool)value) ? JS_TRUE : JS_FALSE;
            case Variant::INT:
                return JS_NewInt64(ctx, int64_t(value));
            case Variant::FLOAT:
                return JS_NewFloat64(ctx, (double)(value));
            case Variant::NODE_PATH:
            case Variant::STRING:
                return to_js_string(ctx, value);
            case Variant::OBJECT: {
                //TODO
                throw "custom variant to var for object type Not implemented";
                // Object *obj = value;
                // if (obj == NULL)
                // 	return JS_NULL;
                // JavaScriptGCHandler *data = BINDING_DATA_FROM_GD(ctx, obj);
                // ERR_FAIL_NULL_V(data, JS_UNDEFINED);
                // ERR_FAIL_NULL_V(data->javascript_object, JS_UNDEFINED);
                // ERR_FAIL_COND_V(data->context != ctx, (JS_UNDEFINED));
                // JSValue js_obj = JS_MKPTR(JS_TAG_OBJECT, data->javascript_object);
                // JS_DupValue(ctx, js_obj);

                // return js_obj;
            }
            case Variant::ARRAY: {
                Array arr = value;
                JSValue js_arr = JS_NewArray(ctx);
                for (int i = 0; i < arr.size(); i++) {
                    JS_SetPropertyUint32(ctx, js_arr, i, variant_to_var(ctx, arr[int(i)]));
                }
                return js_arr;
            }
            case Variant::DICTIONARY: {
                Dictionary dict = static_cast<Dictionary>(value);
                JSValue obj = JS_NewObject(ctx);
                Array keys = dict.keys();
                for (int i = 0; i < keys.size(); i++) {
                    const Variant &key = keys[i];
                    const Variant &value = dict[key];
                    String key_str = keys[i];
                    JS_SetPropertyStr(ctx, obj, key_str.utf8().get_data(), variant_to_var(ctx, value));
                }
                return obj;
            }
            case Variant::CALLABLE: {
                UtilityFunctions::print("Create Callable Binding");
                JSValue callable = JS_NewObjectClass(ctx, GDFunction::class_id);
                GDFunction* func = new GDFunction();
                func->callable = value;
                JS_SetOpaque(callable, func);
                return callable;

                // callable->callable = value;
                // JSAtom atom = JS_NewAtom(ctx, "call");
                // JSValue obj = JS_NewObject(ctx);
                // JS_SetProperty(ctx, obj, atom, JS_NewCFunctionMagic(ctx, GDFunction::MagicFunction, NULL, 0, JS_CFUNC_generic_magic, 0));
                // return obj;
            }
                
            case Variant::SIGNAL:
            //TODO
            case Variant::NIL:
                return JS_NULL;
            default:
            //TODO
                throw "custom variant to var Not implemented";
        
        }
    }
}

