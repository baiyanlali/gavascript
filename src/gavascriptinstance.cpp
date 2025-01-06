#include "gavascriptinstance.h"
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/utility_functions.hpp>
#include <godot_cpp/core/method_bind.hpp>
#include <godot_cpp/core/defs.hpp>
#include <godot_cpp/classes/file_access.hpp>
#include "quickjs.h"
#include "GDFunction.h"
#include "GDObject.h"

using namespace godot;


namespace gavascript{

HashMap<String, const char *> GavaScriptInstance::class_remap;


void GavaScriptInstance::_bind_methods() {
    ClassDB::bind_method(D_METHOD("run_script", "script"), &GavaScriptInstance::run_script);
    ClassDB::bind_method(D_METHOD("run_script_in_module", "script"), &GavaScriptInstance::run_script_in_module);
    ClassDB::bind_method(D_METHOD("start", "module_name"), &GavaScriptInstance::start);
    ClassDB::bind_method(D_METHOD("get_global", "js_variant"), &GavaScriptInstance::get_global);
    ClassDB::bind_method(D_METHOD("set_global", "js_name", "variant"), &GavaScriptInstance::set_global);
	// ClassDB::bind_method(D_METHOD("set_amplitude", "p_amplitude"), &GavaScriptInstance::set_amplitude);

	// ADD_PROPERTY(PropertyInfo(Variant::FLOAT, "amplitude"), "set_amplitude", "get_amplitude");

}



GavaScriptInstance::GavaScriptInstance() {
    ClassBindData data;
    runtime = JS_NewRuntime();
    context = JS_NewContext(runtime);
	// JS_AddIntrinsicOperators(context);
	JS_SetModuleLoaderFunc(runtime, NULL, js_module_loader, this);
	JS_SetContextOpaque(context, this);
	global_object = JS_GetGlobalObject(context);

	godot_object = JS_NewObject(context);
	GDFunction::register_class(context);
	GDObject::register_class(context);

	add_global_console();

	// auto test = "console.log(123)";
	// JS_Eval(context, test, strlen(test), "ttest", JS_EVAL_TYPE_GLOBAL);
    UtilityFunctions::print("GavaScript Instance Created");
}

GavaScriptInstance::~GavaScriptInstance() {
    JS_FreeContext(context);
    JS_FreeRuntime(runtime);

	context = NULL;
	runtime = NULL;
}

void GavaScriptInstance::_process(double delta) {
    // TODO: Implement
}

void GavaScriptInstance::_ready() {

}

Variant GavaScriptInstance::start(String module_name)
{
	String file = resolve_module_file(module_name);
	// ERR_FAIL_COND_MSG(file.is_empty(), "Failed to resolve module: '" + module_name + "'.");
	ERR_FAIL_COND_V_MSG(file.is_empty(), Variant(), "Failed to open module: '" + file + "'.");
	auto fileAccess = FileAccess::open(file, FileAccess::READ);
	// ERR_FAIL_COND_MSG(fileAccess.is_null(), "Failed to open module: '" + file + "'.");
	ERR_FAIL_COND_V_MSG(fileAccess.is_null(), Variant(), "Failed to open module: '" + file + "'.");

	String content = fileAccess->get_as_text();

	JSValue val = JS_Eval(context, content.utf8().get_data(), content.length(), module_name.utf8().get_data(), JS_EVAL_TYPE_MODULE);

	if(JS_IsException(val)){
		JSValue e = JS_GetException(context);
		JavaScriptError err;
		dump_exception(context, e, &err);
		UtilityFunctions::printerr(error_to_string(err));
		return Variant();
	}
	return var_to_variant(context, val);
}

Variant GavaScriptInstance::run_script(String script) {
    // String script_str = script;
    // const char* jscode = script.utf8().get_data();
	auto jscode_len = script.utf8().length();
	auto jscode_utf8 = script.utf8();
	char* jscode = (char *)alloca(sizeof(char) * jscode_len);

	// In macos, using script.utf8().get_data() do not work. Use this workaround.
	jscode[jscode_len] = '\0';
	for (size_t i = 0; i < jscode_len; i++)
	{
		jscode[i] = jscode_utf8.get(i);
	}
	

    JSValue result = JS_Eval(context, jscode, jscode_len, "<quickjs>", JS_EVAL_TYPE_GLOBAL);

	if(JS_IsException(result)){
		JSValue e = JS_GetException(context);
		JavaScriptError err;
		dump_exception(context, e, &err);
		
		UtilityFunctions::printerr(error_to_string(err));
		return Variant();
		
	}
    return var_to_variant(context, result);
}

Variant GavaScriptInstance::run_script_in_module(String script)
{
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
	// JSValue module_namespace = JS_GetModuleNamespace(context, result);
    // if (JS_IsException(module_namespace)) {
    //     printf("Failed to get module namespace.\n");
    // }
    return var_to_variant(context, result);
}

Variant GavaScriptInstance::get_global(String name)
{
	// JSValue global = JS_GetGlobalObject(context);
	JSValue ret = JS_GetPropertyStr(context, global_object, name.utf8().get_data());
	if(JS_IsException(ret)){
		JSValue e = JS_GetException(context);
		JavaScriptError err;
		dump_exception(context, e, &err);
		UtilityFunctions::printerr(error_to_string(err));
		return Variant();
	}

	if(JS_IsNull(ret) || JS_IsUndefined(ret)){
		UtilityFunctions::printerr("Global variable '" + name + "' not found.");
	}
    return var_to_variant(context, ret);
}

void GavaScriptInstance::set_global(String name, Variant value)
{
	JSValue val = variant_to_var(context, value);
	JS_SetPropertyStr(context, global_object, name.utf8().get_data(), val);
	// JS_FreeValue(context, val);
}

void GavaScriptInstance::dump_exception(JSContext *ctx, const JSValue &p_exception, JavaScriptError *r_error) {
	// JSValue err_file = JS_GetProperty(ctx, p_exception, JS_ATOM_fileName);
	// JSValue err_line = JS_GetProperty(ctx, p_exception, JS_ATOM_lineNumber);
	JSValue err_msg = JS_GetProperty(ctx, p_exception, JS_ATOM_message);
	JSValue err_stack = JS_GetProperty(ctx, p_exception, JS_ATOM_stack);

	// JS_ToInt32(ctx, &r_error->line, err_line);
	r_error->message = js_to_string(ctx, err_msg);
	// r_error->file = js_to_string(ctx, err_file);
	r_error->stack.push_back(js_to_string(ctx, err_stack));
	r_error->column = 0;

	// JS_FreeValue(ctx, err_file);
	// JS_FreeValue(ctx, err_line);
	JS_FreeValue(ctx, err_msg);
	JS_FreeValue(ctx, err_stack);
}

String GavaScriptInstance::error_to_string(const JavaScriptError &p_error)
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

JSAtom GavaScriptInstance::get_atom(JSContext *ctx, const StringName &p_key) {
	String name = p_key;
	CharString name_str = name.utf8();
	JSAtom atom = JS_NewAtom(ctx, name_str.get_data());
	return atom;
}

void GavaScriptInstance::add_global_console() {
	// UtilityFunctions::print("GavaScript Add Global Console");
	JSValue console = JS_NewObject(context);
	
	// JSValue log = JS_NewCFunctionMagic(context, console_log, "log", JS_CFUNC_generic_magic);
	JSValue log = JS_NewCFunctionMagic(context, console_log, "log", 0, JS_CFUNC_generic_magic, CONSOLE_LOG);
	JSValue debug = JS_NewCFunctionMagic(context, console_log, "debug", 0, JS_CFUNC_generic_magic, CONSOLE_DEBUG);
	JSValue error = JS_NewCFunctionMagic(context, console_log, "error", 0, JS_CFUNC_generic_magic, CONSOLE_ERROR);
	JSValue trace = JS_NewCFunctionMagic(context, console_log, "trace", 0, JS_CFUNC_generic_magic, CONSOLE_TRACE);
	JSValue assert = JS_NewCFunctionMagic(context, console_log, "assert", 0, JS_CFUNC_generic_magic, CONSOLE_ASSERT);
	JS_DefinePropertyValueStr(context, global_object, "console", console, PROP_DEF_DEFAULT);
	JS_DefinePropertyValueStr(context, global_object, "print", log, PROP_DEF_DEFAULT);
	JS_DefinePropertyValueStr(context, console, "log", log, PROP_DEF_DEFAULT);
	JS_DefinePropertyValueStr(context, console, "debug", debug, PROP_DEF_DEFAULT);
	JS_DefinePropertyValueStr(context, console, "error", error, PROP_DEF_DEFAULT);
	JS_DefinePropertyValueStr(context, console, "trace", trace, PROP_DEF_DEFAULT);
	JS_DefinePropertyValueStr(context, console, "assert", assert, PROP_DEF_DEFAULT);
	console_object = JS_DupValue(context, console);
}

JSValue nativeClear(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
{
    return JS_NULL;
}

const JSCFunctionListEntry godot_funcs[] = {
	JS_CPPFUNC_DEF("print", 1, nativeClear),
};

JSModuleDef* GavaScriptInstance::add_godot_module()
{
    JSModuleDef *m;
    m = JS_NewCModule(context, "godot", init_godot_module);
    if (!m)
        return NULL;
    JS_AddModuleExportList(context, m, godot_funcs, countof(godot_funcs));
    return m;
}

int GavaScriptInstance::init_godot_module(JSContext *ctx, JSModuleDef *m)
{
    return JS_SetModuleExportList(ctx, m, godot_funcs, countof(godot_funcs));
}

static HashMap<String, String> resolve_path_cache;


String GavaScriptInstance::resolve_module_file(const String &file) {
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

JSModuleDef *GavaScriptInstance::js_module_loader(JSContext *ctx, const char *module_name, void *opaque)
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

JSValue GavaScriptInstance::console_log(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic)
{
	// UtilityFunctions::print("Call console log");
	// TODO: Implement assert
	if(magic == CONSOLE_ASSERT) return JS_UNDEFINED;
	if(magic == CONSOLE_DEBUG) return JS_UNDEFINED;
	Vector<Variant> args;
	args.resize(argc);

	String message = "";
	for (int i = 0; i < argc; ++i) {
		auto variant = var_to_variant(ctx, argv[i]);
		message += variant.stringify();
		message += " ";
	}

	if(magic == CONSOLE_ERROR) 
		UtilityFunctions::printerr(message);
	else
		UtilityFunctions::print(message);
	return JS_UNDEFINED;
}
}
