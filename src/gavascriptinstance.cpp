#include "gavascriptinstance.h"
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/utility_functions.hpp>
using namespace godot;

void GavaScriptInstance::_bind_methods() {
}

GavaScriptInstance::GavaScriptInstance() {
}

GavaScriptInstance::~GavaScriptInstance() {
    JS_FreeContext(context);
    JS_FreeRuntime(runtime);
}

void GavaScriptInstance::_process(double delta) {
    // TODO: Implement
}

void GavaScriptInstance::_ready() {
    UtilityFunctions::print("hello world");
    ClassBindData data;
    runtime = JS_NewRuntime();
    context = JS_NewContext(runtime);
    const char* jscode = "let a = 5; let b = 10; a + b;";
    JS_Eval(context, jscode, strlen(jscode), "<quickjs>", JS_EVAL_TYPE_GLOBAL);
    UtilityFunctions::print(jscode);
}