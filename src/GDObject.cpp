#include "GDObject.h"

namespace gavascript {
    JSClassID GDObject::class_id = 0;
    void gavascript::GDObject::register_class(JSContext *ctx)
    {
        JSClassDef class_def = {
            "GDObject",
            js_finalizer,
        };
        JS_NewClassID(JS_GetRuntime(ctx), &class_id);
        JS_NewClass(JS_GetRuntime(ctx), class_id, &class_def);

        JSValue proto = JS_NewObject(ctx);
        JS_SetPropertyStr(
            ctx, 
            proto, 
            "get", 
            JS_NewCFunctionMagic(ctx, get, "get", 0, JS_CFUNC_generic_magic, 0)
        );
        JS_SetPropertyStr(
            ctx, 
            proto, 
            "set", 
            JS_NewCFunctionMagic(ctx, set, "set", 0, JS_CFUNC_generic_magic, 0)
        );

        JS_SetClassProto(ctx, class_id, proto);
    }

    void gavascript::GDObject::js_finalizer(JSRuntime *rt, JSValue val)
    {
        GDObject* func = (GDObject*)JS_GetOpaque(val, class_id);
        if (func) {
            delete func;
        }
    }

    bool gavascript::GDObject::is_instance(JSContext *ctx, JSValueConst val)
    {
        if(!JS_IsObject(val)){
            return false;
        }
        
        return JS_GetClassID(val) == class_id;
    }
    JSValue GDObject::get(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic)
    {
        auto gdobj = (GDObject *)JS_GetOpaque(this_val, class_id);
        if (!gdobj) {
            return JS_EXCEPTION;
        }

        if(argc != 1){
            return JS_EXCEPTION;
        }

        auto ret = gdobj->godot_object.get(var_to_variant(ctx, argv[0]));
        
        return variant_to_var(ctx, ret);
    }
    JSValue GDObject::set(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic)
    {
        auto gdobj = (GDObject *)JS_GetOpaque(this_val, class_id);
        if (!gdobj) {
            return JS_EXCEPTION;
        }
        if(argc != 2){
            return JS_EXCEPTION;
        }

        gdobj->godot_object.set(var_to_variant(ctx, argv[0]), var_to_variant(ctx, argv[1]));
        return JS_UNDEFINED;
    }
}
