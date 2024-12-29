#include "JSFunction.h"
#include "quickjs.h"
#include "convert_js_to_godot.h"
#include "convert_godot_to_js.h"

namespace gavascript{

    Variant gavascript::JSFunction::callv(const Array& args = Array())
    {
        int arg_count = args.size();

        if(arg_count == 0){
            // JSValue result = JS_Call(context, object, JS_UNDEFINED, 0, NULL);
            JSValue result = JS_Call(context, object, this_object, 0, NULL);
            return var_to_variant(context, result);
        }

        JSValue* argv = (JSValue*)alloca(sizeof(JSValue) * arg_count);

        for(int i = 0; i < arg_count; i++){
            argv[i] = variant_to_var(context, args[i]);
        }
        JSValue result = JS_Call(context, object, this_object, arg_count, argv);

        for(int i = 0; i < arg_count; i++){
            JS_FreeValue(context, argv[i]);
        }

        return var_to_variant(context, result);
    }

    Variant JSFunction::call(const Variant **args, GDExtensionInt arg_count, GDExtensionCallError &error)
    {
        if(arg_count == 0){
            // JSValue result = JS_Call(context, object, JS_UNDEFINED, 0, NULL);
            JSValue result = JS_Call(context, object, this_object, 0, NULL);
            return var_to_variant(context, result);
        }

        JSValue* argv = (JSValue*)alloca(sizeof(JSValue) * arg_count);

        for(int i = 0; i < arg_count; i++){
            argv[i] = variant_to_var(context, *args[i]);
        }
        JSValue result = JS_Call(context, object, this_object, arg_count, argv);

        for(int i = 0; i < arg_count; i++){
            JS_FreeValue(context, argv[i]);
        }

        return var_to_variant(context, result);
    }

    String JSFunction::_to_string() const
    {
        JSValue name = JS_GetPropertyStr(context, object, "name");
        JSValue toString = JS_GetPropertyStr(context, object, "toString");
        JSValue result = JS_Call(context, toString, object, 0, NULL);
        return "[JS Function]: " + js_to_string(context, name) + js_to_string(context, result);
        // return js_to_string( context, JS_GetPropertyStr(context, object, "name"));
    }

    JSFunction::operator String() const
    {
        return this->_to_string();
    }

    void gavascript::JSFunction::_bind_methods()
    {
        ClassDB::bind_method(D_METHOD("callv", "args"), &JSFunction::callv);
        ClassDB::bind_vararg_method(METHOD_FLAG_VARARG, "call", &JSFunction::call);
        // ClassDB::bind_method(D_METHOD("to_string"), &JSFunction::to_string);
        // ClassDB::bind_method(D_METHOD("str"), &JSFunction::to_string);
    }
}
