#include "JSObject.h"
#include "convert_godot_to_js.h"
#include "convert_js_to_godot.h"
#include <godot_cpp/variant/utility_functions.hpp>
namespace gavascript{

    void gavascript::JSObject::_bind_methods()
    {
    }

    bool gavascript::JSObject::_get(const StringName &property_name, Variant &r_value)
    {
        JSAtom name = get_atom(context, property_name);
        JSValue result = JS_GetProperty(context, object, name);

        if(JS_IsException(result)){
            return false;
        }
        r_value = var_to_variant(context, result);
        return true;
    }

    bool gavascript::JSObject::_set(const StringName &property_name, const Variant &value)
    {
        JSAtom name = get_atom(context, property_name);
        JSValue prop_name = JS_GetProperty(context, object, name);

        if(JS_IsException(prop_name)){
            return false;
        }

        int result = JS_SetProperty(context, object, name, variant_to_var(context, value));
        if(result == JS_PROP_THROW || result == JS_PROP_THROW_STRICT){
            return false;
        }
        return true;
    }

    String gavascript::JSObject::_to_string() const
    {
        // JSPropertyEnum *props;
        // uint32_t prop_count;
        // int ret = JS_GetOwnPropertyNames(context, &props, &prop_count, object, JS_GPN_STRING_MASK | JS_GPN_SYMBOL_MASK);

        // if (ret < 0) {
        //     return "[JS Object]: {Error}";
        // }

        // String str = "[JS Object]: {";

        // for (uint32_t i = 0; i < prop_count; i++) {
        //     JSValue key = JS_AtomToValue(context, props[i].atom);
        //     String name = js_to_string(context, key);
        //     str += name + ", ";
        //     JS_FreeAtom(context, props[i].atom);
        //     JS_FreeValue(context, key);
        // }

        // return str;

        // JSValue val = JS_GetPropertyStr(context, object, "default");
        // val = JS_GetPropertyStr(context, val, "sea");
        // return "[JS Object]: {" + js_to_string(context, val) + "}";
        auto get_property_name = "`[JS Object]: { ${Object.keys(this).toString()} }`;";
        JSValue properties = JS_EvalThis(context, object, get_property_name, strlen(get_property_name) , "<JSObject::_to_string>", JS_EVAL_TYPE_GLOBAL);
        if(JS_IsException(properties)){
            JSValue e = JS_GetException(context);
            JavaScriptError err;
            dump_exception(context, e, &err);
            UtilityFunctions::printerr(error_to_string(err));
            return "[JS Object]: {Error}";
        }
        return js_to_string(context, properties);
    }

}