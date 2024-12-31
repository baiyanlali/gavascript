#include "GDObject.h"

namespace gavascript {
    JSClassID GDObject::class_id;
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
            "call", 
            JS_NewCFunctionMagic(ctx, MagicFunction, "call", 0, JS_CFUNC_generic_magic, 0)
        );

        JS_SetClassProto(ctx, class_id, proto);
    }

    void gavascript::GDObject::js_finalizer(JSRuntime *rt, JSValue val)
    {
        GDObject* func = (GDObject*)JS_GetOpaque(val, GDObject::class_id);
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
}


