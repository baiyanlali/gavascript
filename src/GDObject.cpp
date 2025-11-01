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

    GDObject::~GDObject() {
        if (is_ref_counted && godot_object.get_type() == Variant::OBJECT) {
            Object *obj = godot_object.operator Object*();
            if (obj && obj->is_class("RefCounted")) {
                // If it's a RefCounted object, let it know we're done with it
                RefCounted *ref = Object::cast_to<RefCounted>(obj);
                if (ref) {
                    ref->unreference();
                }
            }
        }
        godot_object = Variant();  // Clear the variant
    }
    
    void GDObject::set_object(const Variant &p_object) {
        // Clean up any existing object
        if (is_ref_counted && godot_object.get_type() == Variant::OBJECT) {
            Object *old_obj = godot_object.operator Object*();
            if (old_obj && old_obj->is_class("RefCounted")) {
                RefCounted *ref = Object::cast_to<RefCounted>(old_obj);
                if (ref) {
                    ref->unreference();
                }
            }
        }
        
        // Store new object
        godot_object = p_object;
        is_ref_counted = false;
        
        // Check if new object is reference counted
        if (p_object.get_type() == Variant::OBJECT) {
            Object *obj = p_object.operator Object*();
            if (obj && obj->is_class("RefCounted")) {
                is_ref_counted = true;
                // The object was already referenced when created, no need to reference again
            }
        }
    }

    void gavascript::GDObject::js_finalizer(JSRuntime *rt, JSValue val)
    {
        GDObject* func = (GDObject*)JS_GetOpaque(val, class_id);
        if (func) {
            // Destructor will handle unreferencing the object
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

        if (gdobj->godot_object.get_type() != Variant::OBJECT) {
            return JS_ThrowTypeError(ctx, "Invalid or destroyed Godot object");
        }

        if(argc != 1){
            return JS_EXCEPTION;
        }

        Object *obj = gdobj->godot_object.operator Object*();
        if (!obj) {
            return JS_ThrowTypeError(ctx, "Invalid Godot object");
        }
        
        Variant ret = obj->get(var_to_variant(ctx, argv[0]));
        
        return variant_to_var(ctx, ret);
    }
    JSValue GDObject::set(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic)
    {
        GDObject* gdobj = (GDObject *)JS_GetOpaque(this_val, class_id);
        if (!gdobj) {
            return JS_EXCEPTION;
        }

        if (gdobj->godot_object.get_type() != Variant::OBJECT) {
            return JS_ThrowTypeError(ctx, "Invalid or destroyed Godot object");
        }

        if(argc != 2){
            return JS_EXCEPTION;
        }

        Object *obj = gdobj->godot_object.operator Object*();
        if (!obj) {
            return JS_ThrowTypeError(ctx, "Invalid Godot object");
        }

        obj->set(var_to_variant(ctx, argv[0]), var_to_variant(ctx, argv[1]));
        return JS_UNDEFINED;
    }
}
