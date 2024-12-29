#include "JSObject.h"
#include "convert_godot_to_js.h"
#include "convert_js_to_godot.h"

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
        return "[JS Object]: " + js_to_string(context, JS_GetPropertyStr(context, object, "name"));
    }

}