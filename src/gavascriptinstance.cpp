#include "gavascriptinstance.h"
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/utility_functions.hpp>
#include <godot_cpp/core/method_bind.hpp>
#include <godot_cpp/core/defs.hpp>
#include <godot_cpp/classes/file_access.hpp>

using namespace godot;

_FORCE_INLINE_ static String js_to_string(JSContext *ctx, const JSValueConst &p_val) {
    String ret;
    size_t len = 0;
    const char *utf8 = JS_ToCStringLen(ctx, &len, p_val);
    ret.parse_utf8(utf8, len);
    JS_FreeCString(ctx, utf8);
    return ret;
}

int GavaScriptInstance::get_js_array_length(JSContext *ctx, JSValue p_val) {
	if (!JS_IsArray(ctx, p_val))
		return -1;
	JSValue ret = JS_GetProperty(ctx, p_val, GavaScriptInstance::JS_ATOM_length);
	int32_t length = -1;
	if (JS_ToInt32(ctx, &length, ret))
		return -1;
	return length;
}

void GavaScriptInstance::get_own_property_names(JSContext *ctx, JSValue p_object, HashSet<String> *r_list) {
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

Dictionary GavaScriptInstance::js_to_dictionary(JSContext *ctx, const JSValue &p_val, List<void *> &stack) {
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

Variant GavaScriptInstance::var_to_variant(JSContext *ctx, JSValue p_val) {
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
    ClassDB::bind_method(D_METHOD("start", "module_name"), &GavaScriptInstance::start);
	// ClassDB::bind_method(D_METHOD("set_amplitude", "p_amplitude"), &GavaScriptInstance::set_amplitude);

	// ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "amplitude"), "set_amplitude", "get_amplitude");

}

GavaScriptInstance::GavaScriptInstance() {
    ClassBindData data;
    runtime = JS_NewRuntime();
    context = JS_NewContext(runtime);
	JS_AddIntrinsicOperators(context);
	JS_SetModuleLoaderFunc(runtime, NULL, js_module_loader, this);
	JS_SetContextOpaque(context, this);
	global_object = JS_GetGlobalObject(context);
	add_global_console();
    UtilityFunctions::print("GavaScript Instance Created");
}

GavaScriptInstance::~GavaScriptInstance() {
    JS_FreeContext(context);
    JS_FreeRuntime(runtime);
}

void GavaScriptInstance::_process(double delta) {
    // TODO: Implement
}

void GavaScriptInstance::_ready() {

}

void godot::GavaScriptInstance::start(String module_name)
{
	String file = resolve_module_file(module_name);
	ERR_FAIL_COND_MSG(file.is_empty(), "Failed to resolve module: '" + module_name + "'.");

	auto fileAccess = FileAccess::open(file, FileAccess::READ);
	ERR_FAIL_COND_MSG(fileAccess.is_null(), "Failed to open module: '" + file + "'.");

	String content = fileAccess->get_as_text();

	JSValue val = JS_Eval(context, content.utf8().get_data(), content.length(), module_name.utf8().get_data(), JS_EVAL_TYPE_MODULE);

	if(JS_IsException(val)){
		JSValue e = JS_GetException(context);
		JavaScriptError err;
		dump_exception(context, e, &err);
		UtilityFunctions::printerr(error_to_string(err));
		return;
	}
}

Variant GavaScriptInstance::run_script(String script) {
    String script_str = script;
    const char* jscode = script_str.utf8().get_data();
    JSValue result = JS_Eval(context, jscode, strlen(jscode), "<quickjs>", JS_EVAL_TYPE_MODULE);

	if(JS_IsException(result)){
		JSValue e = JS_GetException(context);
		JavaScriptError err;
		dump_exception(context, e, &err);
		
		UtilityFunctions::printerr(error_to_string(err));
		return Variant();
		
	}

    return var_to_variant(context, result);
}

void godot::GavaScriptInstance::dump_exception(JSContext *ctx, const JSValue &p_exception, JavaScriptError *r_error) {
	JSValue err_file = JS_GetProperty(ctx, p_exception, JS_ATOM_fileName);
	JSValue err_line = JS_GetProperty(ctx, p_exception, JS_ATOM_lineNumber);
	JSValue err_msg = JS_GetProperty(ctx, p_exception, JS_ATOM_message);
	JSValue err_stack = JS_GetProperty(ctx, p_exception, JS_ATOM_stack);

	JS_ToInt32(ctx, &r_error->line, err_line);
	r_error->message = js_to_string(ctx, err_msg);
	r_error->file = js_to_string(ctx, err_file);
	r_error->stack.push_back(js_to_string(ctx, err_stack));
	r_error->column = 0;

	JS_FreeValue(ctx, err_file);
	JS_FreeValue(ctx, err_line);
	JS_FreeValue(ctx, err_msg);
	JS_FreeValue(ctx, err_stack);
}

String godot::GavaScriptInstance::error_to_string(const JavaScriptError &p_error)
{
	
    String message = "JavaScript Error: \n";
	if (p_error.stack.size()) {
		message += p_error.stack[0];
	}
	message += p_error.message;
	for (int i = 1; i < p_error.stack.size(); i++) {
		message += p_error.stack[i];
	}
	return message;
}

void godot::GavaScriptInstance::add_global_console() {
	JSValue console = JS_NewObject(context);
	// JSValue log = JS_NewCFunctionMagic(context, console_log, "log", JS_CFUNC_generic_magic);
	JSValue log = JS_NewCFunctionMagic(context, console_log, "log", 0, JS_CFUNC_generic_magic, 0);
	JS_DefinePropertyValueStr(context, global_object, "console", console, PROP_DEF_DEFAULT);
	JS_DefinePropertyValueStr(context, console, "log", log, PROP_DEF_DEFAULT);
	console_object = JS_DupValue(context, console);
}

static HashMap<String, String> resolve_path_cache;


String godot::GavaScriptInstance::resolve_module_file(const String &file) {
	if (const String *ptr = resolve_path_cache.getptr(file)) {
		return *ptr;
	}
	String path = file;
	if (!path.ends_with(".js")) {
		path += ".js";
	}
	if (FileAccess::file_exists(path))
		return path;
	return "";
}

JSModuleDef *godot::GavaScriptInstance::js_module_loader(JSContext *ctx, const char *module_name, void *opaque)
{
	GavaScriptInstance *thisInstance = (GavaScriptInstance*)opaque;
	JSModuleDef *m = NULL;
	Error err;

	String resolving_file;
	resolving_file.parse_utf8(module_name);

	String file = resolve_module_file(resolving_file);
	UtilityFunctions::print("Loading module: '" + resolving_file + "'.");
	ERR_FAIL_COND_V_MSG(file.is_empty(), NULL, "Failed to resolve module: '" + resolving_file + "'.");
	resolve_path_cache.insert(resolving_file, file);


	if (ModuleCache *ptr = thisInstance->module_cache.getptr(file)) {
		UtilityFunctions::print("Loading cached module: '" + resolving_file + "'.");
		m = ptr->module;
	}

	if (!m) {
		auto fileAccess = FileAccess::open(file, FileAccess::READ);
		ERR_FAIL_COND_V_MSG(fileAccess.is_null(), NULL, "Failed to open module: '" + file + "'.");

		String content = fileAccess->get_as_text();

		// JSValue val = JS_Eval(ctx, content.utf8().get_data(), content.length(), file.utf8().get_data(), JS_EVAL_TYPE_MODULE);
		
		/* compile the module */
        JSValue val = JS_Eval(ctx, content.utf8().get_data(), content.length(), module_name,
                           JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);

        if(JS_IsException(val)){
			JSValue e = JS_GetException(ctx);
			JavaScriptError err;
			thisInstance->dump_exception(ctx, e, &err);
			
			UtilityFunctions::printerr(thisInstance->error_to_string(err));
			return NULL;
		}
        /* XXX: could propagate the exception */
        // js_module_set_import_meta(ctx, func_val, TRUE, FALSE);
        /* the module is already referenced, so we must free it */
        m = (JSModuleDef *)JS_VALUE_GET_PTR(val);
        JS_FreeValue(ctx, val);

		ModuleCache module;
		module.module = m;
		thisInstance->module_cache[file] = module;
		// m = JS_NewCModule(ctx, module_name, val);
	}

	return m;
}

JSValue godot::GavaScriptInstance::console_log(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic)
{
	Vector<Variant> args;
	args.resize(argc);

	String message = "";
	for (int i = 0; i < argc; ++i) {
		auto variant = var_to_variant(ctx, argv[i]);
		message += variant.stringify();
		message += " ";
	}

	UtilityFunctions::print(message);
	return JS_UNDEFINED;
}

