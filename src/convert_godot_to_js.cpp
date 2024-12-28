#include "convert_godot_to_js.h"

namespace gavascript{
    JSValue variant_to_var(JSContext *ctx, const Variant &value)
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
            case Variant::NIL:
                return JS_NULL;
            default:
            //TODO
                throw "custom variant to var Not implemented";
        
        }
    }
}

