#include "GDFunction.h"
#include <godot_cpp/variant/utility_functions.hpp>
#include <godot_cpp/core/method_bind.hpp>
#include <godot_cpp/variant/callable.hpp>
#include <gdextension_interface.h>
namespace gavascript {
    
    JSClassID GDFunction::class_id = 0;

    void GDFunction::register_class(JSContext* ctx) {
        JSClassDef class_def = {
            "GDFunction",
            js_finalizer,
        };
        JS_NewClassID(JS_GetRuntime(ctx), &class_id);
        JS_NewClass(JS_GetRuntime(ctx), class_id, &class_def);

        JSValue proto = JS_NewObject(ctx);
        JS_SetPropertyStr(
            ctx, 
            proto, 
            "call", 
            JS_NewCFunctionMagic(ctx, MagicFunction, "call", 0, JS_CFUNC_generic_magic, 0)
        );
        
        JS_SetClassProto(ctx, class_id, proto);
    }

    void GDFunction::js_finalizer(JSRuntime *rt, JSValue val) {
        GDFunction* func = (GDFunction*)JS_GetOpaque(val, class_id);
        if (func) {
            delete func;
        }
    }

    bool GDFunction::is_instance(JSContext *ctx, JSValue val)
    {
        if(!JS_IsObject(val)){
            return false;
        }
        
        return JS_GetClassID(val) == class_id;
    }


    JSValue GDFunction::MagicFunction(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic)
    {
        GDFunction *func = static_cast<GDFunction *>(JS_GetOpaque(this_val, class_id));
        
        if(!func){
            return JS_EXCEPTION;
        }

        // if(!func->callable.is_valid()){
        //     return JS_EXCEPTION;
        // }

        Array args;
        args.resize(argc);
        for (int i = 0; i < argc; i++) {
            args.push_back(var_to_variant(ctx, argv[i]));
        }
        // Callable binded_callable = func->callable.bindv(args);
        // Variant ret = func->callable->callv(args);
        Variant ret = func->callable.callv(args);
        // return JS_NULL;
        return variant_to_var(ctx, ret);
        // return func->call();
    }
}