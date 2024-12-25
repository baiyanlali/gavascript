#ifndef GAVASCRIPTINSTANCE_H
#define GAVASCRIPTINSTANCE_H

#include <godot_cpp/classes/node.hpp>
#include "../thirdparty/quickjs/quickjs.h"
#include <godot_cpp/templates/hash_set.hpp>
#include <godot_cpp/templates/vector.hpp>

#define JS_HIDDEN_SYMBOL(x) ("\xFF" x)
#define BINDING_DATA_FROM_JS(ctx, p_val) (JavaScriptGCHandler *)JS_GetOpaque((p_val), QuickJSBinder::get_origin_class_id((ctx)))
#define GET_JSVALUE(p_gc_handler) JS_MKPTR(JS_TAG_OBJECT, (p_gc_handler).javascript_object)
#define NO_MODULE_EXPORT_SUPPORT 0
#define MODULE_HAS_REFCOUNT 0 // The module doesn't seem to follow the reference count rule in quickjs.
#define MAX_ARGUMENT_COUNT 50
#define PROP_NAME_CONSOLE_LOG_OBJECT_TO_JSON "LOG_OBJECT_TO_JSON"
#define ENDL "\r\n"

namespace godot {

    struct JavaScriptError {
        int line;
        int column;
        String message;
        String file;
        Vector<String> stack;
    };
    class GavaScriptInstance : public Node {
        GDCLASS(GavaScriptInstance, Node)
    
    protected:
        static int get_js_array_length(JSContext *ctx, JSValue p_val);
        static void get_own_property_names(JSContext *ctx, JSValue p_object, HashSet<String> *r_list);
        static Dictionary js_to_dictionary(JSContext *ctx, const JSValue &p_val, List<void *> &stack);
        static Variant var_to_variant(JSContext *ctx, JSValue p_val);
        static void _bind_methods();
        JSRuntime *runtime;
        JSContext *context;

        JSValue global_object;
        JSValue console_object;

        struct ClassBindData {
            JSClassID class_id;
            CharString class_name;
            JSValue prototype;
            JSValue constructor;
            JSClassDef jsclass;
            const ClassDB::ClassInfo *gdclass;
            const ClassBindData *base_class;
	    };
    public:
        GavaScriptInstance();
        ~GavaScriptInstance();

        void _process(double delta) override;
        void _ready() override;
        void start(String module_name);
        Variant run_script(String script);

        void dump_exception(JSContext *ctx, const JSValue &p_exception, JavaScriptError *r_error);
        String error_to_string(const JavaScriptError &p_error);

        void add_global_console();

        static JSValue console_log(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic);

        enum {
		__JS_ATOM_NULL = JS_ATOM_NULL,
        #if !(defined(EMSCRIPTEN) || defined(_MSC_VER))
        #define CONFIG_ATOMICS
        #endif
        #define DEF(name, str) JS_ATOM_##name,
        #include "../thirdparty/quickjs/quickjs-atom.h"
        #undef DEF
        #ifdef CONFIG_ATOMICS
        #undef CONFIG_ATOMICS
        #endif
                JS_ATOM_END, 
        };

        enum {
		    PROP_DEF_DEFAULT = JS_PROP_ENUMERABLE | JS_PROP_CONFIGURABLE,
	    };
    };
}

#endif