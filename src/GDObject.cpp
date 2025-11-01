#include "GDObject.h"

namespace gavascript {

    static JSClassExoticMethods g_gdobject_exotic_methods = {
        nullptr, // get_own_property
        nullptr, // get_own_property_names
        nullptr, // delete_property
        nullptr, // define_own_property
        GDObject::js_has_property, // has_property
        GDObject::js_get_property, // get_property
        GDObject::js_set_property, // set_property
    };


    JSClassID GDObject::class_id = 0;
    void gavascript::GDObject::register_class(JSContext *ctx)
    {
        JSClassDef class_def = {
            "GDObject",
            js_finalizer,
            nullptr,
            nullptr,
            &g_gdobject_exotic_methods
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



    #define GET_GD_OBJ(var, obj_out) \
        GDObject* obj_out = (GDObject *)JS_GetOpaque(var, gavascript::GDObject::class_id); \
        if (!obj_out) { return JS_EXCEPTION; } \
        Object *g_obj = obj_out->godot_object.operator Object*(); \
        if (!g_obj) { return JS_ThrowTypeError(ctx, "Invalid or destroyed Godot object"); }

    #define GET_GD_OBJ_INT(var, obj_out) \
        GDObject* obj_out = (GDObject *)JS_GetOpaque(var, gavascript::GDObject::class_id); \
        if (!obj_out) { return -1; } \
        Object *g_obj = obj_out->godot_object.operator Object*(); \
        if (!g_obj) { JS_ThrowTypeError(ctx, "Invalid or destroyed Godot object"); return -1; }


    /**
     * @brief 当 JS 执行 'parent.position' (读取) 时调用
     */
    JSValue GDObject::js_get_property(JSContext *ctx, JSValueConst obj, JSAtom atom, JSValueConst receiver)
    {
        GET_GD_OBJ(obj, gdobj); // 使用上面的宏获取 C++ 对象和 Godot 对象

        const char *prop_name_c = JS_AtomToCString(ctx, atom);
        if (!prop_name_c) {
            return JS_EXCEPTION;
        }
        StringName prop_name(prop_name_c);
        
        Variant ret = g_obj->get(prop_name);
        
        JS_FreeCString(ctx, prop_name_c); // 不要忘记释放

        // 在 Godot 对象上找到了属性

        if(ret.get_type() != Variant::NIL){
            return variant_to_var(ctx, ret);
        }else{
            // --- 回退 ---
            // 在 Godot 对象上没找到。
            // 也许它是一个在 JS 中定义的属性 (比如 my_js_prop)
            // 我们需要检查原型链。
            JSValue proto = JS_GetClassProto(ctx, class_id);
            JSValue js_prop = JS_GetProperty(ctx, proto, atom);
            JS_FreeValue(ctx, proto);
            
            // 如果在原型上没找到 (js_prop 是 undefined 且无异常),
            // JS_GetPropertyInternal 也会检查对象本身, 但我们不能直接调用它。
            // 对于只读，返回在原型上找到的东西 (很可能是 undefined) 就足够了。
            return js_prop; 
        }
    }

    /**
     * @brief 当 JS 执行 'parent.position = ...' (写入) 时调用
     */
    int GDObject::js_set_property(JSContext *ctx, JSValueConst obj, JSAtom atom, JSValueConst value, JSValueConst receiver, int flags)
    {
        GET_GD_OBJ_INT(obj, gdobj); // 获取 C++ 和 Godot 对象 (返回 int 的版本)

        const char *prop_name_c = JS_AtomToCString(ctx, atom);
        if (!prop_name_c) {
            return -1; // 异常
        }
        StringName prop_name(prop_name_c);

        Variant res = g_obj->get(prop_name); // 检查属性是否存在

        if(res.get_type() != Variant::NIL){
            // 属性存在于 Godot 对象上，尝试设置它
            Variant var_val = var_to_variant(ctx, value);
            g_obj->set(prop_name, var_val);
            
            JS_FreeCString(ctx, prop_name_c);

            return 1; // 成功
        }else{
            // --- 回退 ---
            // Godot 对象没有这个属性。
            // 我们将其作为常规 JS 属性添加到 JS 包装器对象 (obj) 上。
            JS_FreeCString(ctx, prop_name_c);

            // 使用 JS_DefinePropertyValue 在 'obj' 实例上定义 JS 属性
            // (注意：不是在原型上！)
            // JS_DupValue 是必需的，因为 JS_DefinePropertyValue 会“消耗” value。
            int ret = JS_DefinePropertyValue(ctx, obj, atom, JS_DupValue(ctx, value), JS_PROP_C_W_E);
            return ret;
        }
    }

    /**
     * @brief 当 JS 执行 'if ("position" in parent)' 时调用
     */
    int GDObject::js_has_property(JSContext *ctx, JSValueConst obj, JSAtom atom)
    {
        GET_GD_OBJ_INT(obj, gdobj); // 获取 C++ 和 Godot 对象

        const char *prop_name_c = JS_AtomToCString(ctx, atom);
        if (!prop_name_c) {
            return -1; // 异常
        }
        StringName prop_name(prop_name_c);
        
        Variant res = g_obj->get(prop_name);
        JS_FreeCString(ctx, prop_name_c);

        if(res.get_type() != Variant::NIL){
            return 1;
        }

        // --- 回退 ---
        // 检查原型链
        JSValue proto = JS_GetClassProto(ctx, class_id);
        int ret = JS_HasProperty(ctx, proto, atom);
        JS_FreeValue(ctx, proto);

        return ret; // 0 (未找到) 或 1 (在原型上找到)
    }

}
