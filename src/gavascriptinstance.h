#ifndef GAVASCRIPTINSTANCE_H
#define GAVASCRIPTINSTANCE_H

#include <godot_cpp/classes/node.hpp>
#include "../thirdparty/quickjs/quickjs.h"
#include <godot_cpp/templates/hash_set.hpp>
#include <godot_cpp/templates/vector.hpp>
#include <godot_cpp/classes/resource.hpp>
#include <convert_js_to_godot.h>

#define JS_HIDDEN_SYMBOL(x) ("\xFF" x)
#define BINDING_DATA_FROM_JS(ctx, p_val) (JavaScriptGCHandler *)JS_GetOpaque((p_val), QuickJSBinder::get_origin_class_id((ctx)))
#define GET_JSVALUE(p_gc_handler) JS_MKPTR(JS_TAG_OBJECT, (p_gc_handler).javascript_object)
#define NO_MODULE_EXPORT_SUPPORT 0
#define MODULE_HAS_REFCOUNT 0 // The module doesn't seem to follow the reference count rule in quickjs.
#define MAX_ARGUMENT_COUNT 50
#define PROP_NAME_CONSOLE_LOG_OBJECT_TO_JSON "LOG_OBJECT_TO_JSON"
#define ENDL "\r\n"

#ifndef countof
#define countof(x) (sizeof(x) / sizeof((x)[0]))
#endif

#define JS_CPPFUNC_DEF(name, length, func1) { name, JS_PROP_WRITABLE | JS_PROP_CONFIGURABLE, JS_DEF_CFUNC, 0, { { length, JS_CFUNC_generic, { func1 } } } }
namespace gavascript {

    struct ModuleCache {
		int flags = 0;
		JSModuleDef *module = NULL;
		uint32_t hash = 0;
		JSValue res_value;
		Ref<Resource> res;
	};

    enum {
        CONSOLE_LOG,
        CONSOLE_DEBUG,
        CONSOLE_ERROR,
        CONSOLE_TRACE,
        CONSOLE_ASSERT,
    };
    
    class GavaScriptInstance : public Node {
        GDCLASS(GavaScriptInstance, Node)
    
    protected:
        static String resolve_module_file(const String &file);
        static JSModuleDef *js_module_loader(JSContext *ctx, const char *module_name, void *opaque);

        static void _bind_methods();
        JSRuntime *runtime;
        JSContext *context;

        struct ClassBindData {
            JSClassID class_id;
            CharString class_name;
            JSValue prototype;
            JSValue constructor;
            JSClassDef jsclass;
            const ClassBindData *base_class;
	    };
        JSValue godot_object;
        JSValue global_object;
        JSValue console_object;
        HashMap<String, ModuleCache> module_cache;
        static HashMap<String, const char *> class_remap;
        const ClassBindData *godot_object_class;
        const ClassBindData *godot_reference_class;
        HashMap<JSClassID, ClassBindData> class_bindings;
        Vector<MethodBind *> godot_methods;
        int internal_godot_method_id;
	    HashMap<StringName, const ClassBindData *> classname_bindings;
    
        
    public:
        GavaScriptInstance();
        ~GavaScriptInstance();

        void _process(double delta) override;
        void _ready() override;
        Variant start(String module_name);
        Variant run_script(String script);
        Variant run_script_in_module(String script);
        Variant get_global(String name);
        void set_global(String name, Variant value);

        void dump_exception(JSContext *ctx, const JSValue &p_exception, JavaScriptError *r_error);
        String error_to_string(const JavaScriptError &p_error);

        static JSAtom get_atom(JSContext *ctx, const StringName &p_key);

        JSClassID register_class(const StringName *p_class);
        void add_godot_classes();
        
        void add_global_console();

        JSModuleDef* add_godot_module();
        static int init_godot_module(JSContext *ctx, JSModuleDef *m);


        static JSValue console_log(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic);


        enum {
		    PROP_DEF_DEFAULT = JS_PROP_ENUMERABLE | JS_PROP_CONFIGURABLE,
	    };

        _FORCE_INLINE_ static real_t js_to_number(JSContext *ctx, const JSValueConst &p_val) {
            double_t v = 0;
            JS_ToFloat64(ctx, &v, p_val);
            return real_t(v);
	    }
        _FORCE_INLINE_ static String js_to_string(JSContext *ctx, const JSValueConst &p_val) {
            String ret;
            size_t len = 0;
            const char *utf8 = JS_ToCStringLen(ctx, &len, p_val);
            ret.parse_utf8(utf8, len);
            JS_FreeCString(ctx, utf8);
            return ret;
        }
        _FORCE_INLINE_ static bool js_to_bool(JSContext *ctx, const JSValueConst &p_val) {
            return JS_ToBool(ctx, p_val);
        }
        _FORCE_INLINE_ static int32_t js_to_int(JSContext *ctx, const JSValueConst &p_val) {
            int32_t i;
            JS_ToInt32(ctx, &i, p_val);
            return i;
        }
        _FORCE_INLINE_ static uint32_t js_to_uint(JSContext *ctx, const JSValueConst &p_val) {
            uint32_t u;
            JS_ToUint32(ctx, &u, p_val);
            return u;
        }
        _FORCE_INLINE_ static int64_t js_to_int64(JSContext *ctx, const JSValueConst &p_val) {
            int64_t i;
            JS_ToInt64(ctx, &i, p_val);
            return i;
        }
        _FORCE_INLINE_ static uint64_t js_to_uint64(JSContext *ctx, const JSValueConst &p_val) {
            uint64_t i;
            JS_ToIndex(ctx, &i, p_val);
            return i;
        }
        _FORCE_INLINE_ static JSValue to_js_number(JSContext *ctx, real_t p_val) {
            return JS_NewFloat64(ctx, double(p_val));
        }
        _FORCE_INLINE_ static JSValue to_js_string(JSContext *ctx, const String &text) {
            CharString utf8 = text.utf8();
            return JS_NewStringLen(ctx, utf8.get_data(), utf8.length());
        }
        _FORCE_INLINE_ static JSValue to_js_bool(JSContext *ctx, bool p_val) {
            return JS_NewBool(ctx, p_val);
        }
    };
}

#endif