#include "gavascriptinstance.h"
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/utility_functions.hpp>
#include <godot_cpp/core/method_bind.hpp>
#include <godot_cpp/core/defs.hpp>
#include <godot_cpp/templates/hash_set.hpp>

using namespace godot;

_FORCE_INLINE_ static String js_to_string(JSContext *ctx, const JSValueConst &p_val) {
    String ret;
    size_t len = 0;
    const char *utf8 = JS_ToCStringLen(ctx, &len, p_val);
    ret.parse_utf8(utf8, len);
    JS_FreeCString(ctx, utf8);
    return ret;
}

int get_js_array_length(JSContext *ctx, JSValue p_val) {
	if (!JS_IsArray(ctx, p_val))
		return -1;
	JSValue ret = JS_GetProperty(ctx, p_val, GavaScriptInstance::JS_ATOM_length);
	int32_t length = -1;
	if (JS_ToInt32(ctx, &length, ret))
		return -1;
	return length;
}

void get_own_property_names(JSContext *ctx, JSValue p_object, HashSet<String> *r_list) {
	ERR_FAIL_COND(!JS_IsObject(p_object));
	JSPropertyEnum *props = NULL;
	uint32_t tab_atom_count;
	JS_GetOwnPropertyNames(ctx, &props, &tab_atom_count, p_object, JS_GPN_STRING_MASK | JS_GPN_SYMBOL_MASK);
	for (uint32_t i = 0; i < tab_atom_count; i++) {
		JSValue key = JS_AtomToValue(ctx, props[i].atom);
		String name = js_to_string(ctx, key);
		r_list->insert(name);
		JS_FreeAtom(ctx, props[i].atom);
		JS_FreeValue(ctx, key);
	}
	js_free_rt(JS_GetRuntime(ctx), props);
}

Dictionary js_to_dictionary(JSContext *ctx, const JSValue &p_val, List<void *> &stack) {
	Dictionary dict;
	HashSet<String> keys;
	get_own_property_names(ctx, p_val, &keys);
	stack.push_back(JS_VALUE_GET_PTR(p_val));
	for (const String &key : keys) {
		JSValue v = JS_GetPropertyStr(ctx, p_val, key.utf8().get_data());
		Variant val;
		if (JS_IsObject(v)) {
			void *ptr = JS_VALUE_GET_PTR(v);
			if (stack.find(ptr)) {
				union {
					const void *p;
					uint64_t i;
				} u;
				u.p = ptr;
				ERR_PRINT(vformat("Property '%s' circular reference to 0x%X", key, u.i));
				JS_FreeValue(ctx, v);
				continue;
			} else {
				stack.push_back(ptr);
				val = var_to_variant(ctx, v);
				stack.pop_back();
			}
		} else {
			val = var_to_variant(ctx, v);
		}
		dict[key] = val;
		JS_FreeValue(ctx, v);
	}
	stack.pop_back();
	return dict;
}

Variant var_to_variant(JSContext *ctx, JSValue p_val) {
	int64_t tag = JS_VALUE_GET_TAG(p_val);
	switch (tag) {
		case JS_TAG_INT:
			return Variant(JS_VALUE_GET_INT(p_val));
		case JS_TAG_BOOL:
			return Variant(bool(JS_VALUE_GET_INT(p_val)));
		case JS_TAG_FLOAT64:
			return Variant(real_t(JS_VALUE_GET_FLOAT64(p_val)));
		case JS_TAG_STRING:
			return js_to_string(ctx, p_val);
		case JS_TAG_OBJECT: {
			if (JS_VALUE_GET_PTR(p_val) == NULL) {
				return Variant();
			}
			int length = get_js_array_length(ctx, p_val);
			if (length != -1) { // Array
				Array arr;
				arr.resize(length);
				for (int i = 0; i < length; i++) {
					JSValue val = JS_GetPropertyUint32(ctx, p_val, i);
					arr[int(i)] = var_to_variant(ctx, val);
					JS_FreeValue(ctx, val);
				}
				return arr;
			} else if (JS_IsFunction(ctx, p_val)) {
				JSValue function = JS_FunctionToString(ctx, p_val);
				String ret = js_to_string(ctx, function);
				JS_FreeValue(ctx, function);
				return ret;
			} else { // Plain Object as Dictionary
				List<void *> stack;
				return js_to_dictionary(ctx, p_val, stack);
			}
		} break;
		case JS_TAG_NULL:
		case JS_TAG_UNDEFINED:
			return Variant();
			break;
		default:
#ifdef JS_NAN_BOXING
			if (tag > JS_TAG_FLOAT64 || tag < JS_TAG_FIRST) {
				return Variant(real_t(JS_VALUE_GET_FLOAT64(p_val)));
			}
#endif
			return Variant();
	}
}

void GavaScriptInstance::_bind_methods() {
    ClassDB::bind_method(D_METHOD("run_script", "script"), &GavaScriptInstance::run_script);
	// ClassDB::bind_method(D_METHOD("set_amplitude", "p_amplitude"), &GavaScriptInstance::set_amplitude);

	// ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "amplitude"), "set_amplitude", "get_amplitude");

}

GavaScriptInstance::GavaScriptInstance() {
    ClassBindData data;
    runtime = JS_NewRuntime();
    context = JS_NewContext(runtime);
    const char* jscode = "let a = 5; let b = 10; a + b;";
    auto result = JS_Eval(context, jscode, strlen(jscode), "<quickjs>", JS_EVAL_TYPE_GLOBAL);
    int int_result = JS_VALUE_GET_INT(result);
    UtilityFunctions::print(int_result);
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
    // ClassBindData data;
    // runtime = JS_NewRuntime();
    // context = JS_NewContext(runtime);
    // const char* jscode = "let a = 5; let b = 10; a + b;";
    // JS_Eval(context, jscode, strlen(jscode), "<quickjs>", JS_EVAL_TYPE_GLOBAL);
    // UtilityFunctions::print(jscode);
}

void GavaScriptInstance::run_script(String script) {
    String script_str = script;
    const char* jscode = script_str.utf8().get_data();
    JSValue result = JS_Eval(context, jscode, strlen(jscode), "<quickjs>", JS_EVAL_TYPE_GLOBAL);
    int int_result = JS_VALUE_GET_INT(result);
    UtilityFunctions::print(int_result);

}