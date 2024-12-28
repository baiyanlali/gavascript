#include "JSFunction.h"
#include "quickjs.h"
#include "convert_js_to_godot.h"
#include "convert_godot_to_js.h"

namespace gavascript{

Variant gavascript::JSFunction::call(const Array& args)
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

void gavascript::JSFunction::_bind_methods()
{
    ClassDB::bind_method(D_METHOD("call", "args"), &JSFunction::call);
}
}
