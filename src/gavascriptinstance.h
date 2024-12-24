#ifndef GAVASCRIPTINSTANCE_H
#define GAVASCRIPTINSTANCE_H

#include <godot_cpp/classes/node.hpp>
#include "../thirdparty/quickjs/quickjs.h"

namespace godot {
    class GavaScriptInstance : public Node {
        GDCLASS(GavaScriptInstance, Node)
    
    protected:
        static void _bind_methods();
        JSRuntime *runtime;
        JSContext *context;
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
        void run_script(String script);

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
    };
}

#endif