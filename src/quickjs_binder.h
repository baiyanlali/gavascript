#include "quickjs/quickjs.h"
#include <godot_cpp/core/class_db.hpp>

using namespace godot;

class QuickJSBinder {

protected:
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
    QuickJSBinder() {
        ClassBindData data;
        runtime = JS_NewRuntime();
        context = JS_NewContext(runtime);
        const char* jscode = "let a = 5; let b = 10; a + b;";
        JS_Eval(context, jscode, strlen(jscode), "<quickjs>", JS_EVAL_TYPE_GLOBAL);
    };
    ~QuickJSBinder() {
        JS_FreeContext(context);
        JS_FreeRuntime(runtime);
    };
    
};