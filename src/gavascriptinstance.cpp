#include "gavascriptinstance.h"
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/utility_functions.hpp>
#include <godot_cpp/core/method_bind.hpp>
#include <godot_cpp/core/defs.hpp>
#include <godot_cpp/classes/file_access.hpp>
#include <quickjs.h>
#include "GDFunction.h"

using namespace godot;


namespace gavascript{

HashMap<String, const char *> GavaScriptInstance::class_remap;


void GavaScriptInstance::_bind_methods() {
    ClassDB::bind_method(D_METHOD("run_script", "script"), &GavaScriptInstance::run_script);
    ClassDB::bind_method(D_METHOD("start", "module_name"), &GavaScriptInstance::start);
    ClassDB::bind_method(D_METHOD("get_global", "js_variant"), &GavaScriptInstance::get_global);
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


	add_global_console();
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

void gavascript::GavaScriptInstance::start(String module_name)
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
    JSValue result = JS_Eval(context, jscode, strlen(jscode), "<quickjs>", JS_EVAL_TYPE_GLOBAL);

	if(JS_IsException(result)){
		JSValue e = JS_GetException(context);
		JavaScriptError err;
		dump_exception(context, e, &err);
		
		UtilityFunctions::printerr(error_to_string(err));
		return Variant();
		
	}
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
    return var_to_variant(context, ret);
}

void gavascript::GavaScriptInstance::dump_exception(JSContext *ctx, const JSValue &p_exception, JavaScriptError *r_error) {
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

String gavascript::GavaScriptInstance::error_to_string(const JavaScriptError &p_error)
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

JSAtom gavascript::GavaScriptInstance::get_atom(JSContext *ctx, const StringName &p_key) {
	String name = p_key;
	CharString name_str = name.utf8();
	JSAtom atom = JS_NewAtom(ctx, name_str.get_data());
	return atom;
}

// JSClassID gavascript::GavaScriptInstance::register_class(const StringName *p_cls)
// {
// 	JSContext *ctx = context;
	
// 	ClassBindData data;
// 	data.class_id = 0;
// 	data.base_class = NULL;

// 	if (class_remap.has(*p_cls)) {
// 		data.class_name = class_remap[*p_cls];
// 		data.jsclass.class_name = class_remap[*p_cls];
// 		if (strcmp(data.jsclass.class_name, "") == 0) {
// 			return 0;
// 		}
// 	} else {
// 		data.class_name = String(*p_cls).utf8();
// 		data.jsclass.class_name = data.class_name.get_data();
// 	}

// 	data.jsclass.exotic = NULL;
// 	data.jsclass.gc_mark = NULL;
// 	data.jsclass.call = NULL;

// 	data.prototype = JS_NewObject(ctx);

// 	// methods
// 	HashMap<StringName, JSValue> methods;
// 	{
// 		// https://docs.godotengine.org/en/stable/classes/class_classdb.html#class-classdb-method-class-get-method-list
// 		// Returns an array with all the methods of class or its ancestry if no_inheritance is false. 
// 		// Every element of the array is a Dictionary with the following keys: 
// 		// args, default_args, flags, id, name, return: (class_name, hint, hint_string, name, type, usage)
// 		auto method_map = ClassDB::class_get_method_list(*p_cls);
// 		godot_methods.resize(internal_godot_method_id + method_map.size());

// 		for (int i = 0; i < method_map.size(); i++)
// 		{
// 			Dictionary method_info = method_map[i];
// 			String method_name = method_info["name"];
// 			if((*p_cls) == String("Object") && method_name == String("connect"))
// 			{
// 				const char *connect = "connect";
// 				JSValue func = JS_NewCFunction(ctx, godot_object_method_connect, connect, 3);
// 				JS_DefinePropertyValueStr(ctx, data.prototype, connect, func, PROP_DEF_DEFAULT);
// 				continue;
// 			}

// 			MethodBind *mb = pair.value;
// 			godot_methods.set(internal_godot_method_id, mb);
// 			CharString name = String(pair.key).utf8();
// 			JSValue method = JS_NewCFunctionMagic(ctx, &GavaScriptInstance::object_method, name.get_data(), mb->get_argument_count(), JS_CFUNC_generic_magic, internal_godot_method_id);
// 			JS_DefinePropertyValueStr(ctx, data.prototype, name.get_data(), method, PROP_DEF_DEFAULT);
// 			methods.insert(pair.key, method);
// 			++internal_godot_method_id;
// 		}

// 		if (*p_cls == String("Object")) {
// 			// toString()
// 			JSValue to_string_func = JS_NewCFunction(ctx, godot_to_string, TO_STRING_LITERAL, 0);
// 			JS_DefinePropertyValueStr(ctx, data.prototype, TO_STRING_LITERAL, to_string_func, PROP_DEF_DEFAULT);
// 			// free()
// 			const char *free_func_name = "free";
// 			JSValue free_func = JS_NewCFunction(ctx, object_free, free_func_name, 0);
// 			JS_DefinePropertyValueStr(ctx, data.prototype, free_func_name, free_func, PROP_DEF_DEFAULT);
// 		}
// 	}

// 	// properties
// 	{
// 		// https://docs.godotengine.org/en/stable/classes/class_classdb.html#class-classdb-method-class-get-property-list
// 		auto property_setget = ClassDB::class_get_property_list(*p_cls);
// 		/*
// 		[
// 		{ "name": "_import_path", "class_name": &"", "type": 22, "hint": 0, "hint_string": "", "usage": 10 }, 
// 		{ "name": "name", "class_name": &"", "type": 21, "hint": 0, "hint_string": "", "usage": 0 }, 
// 		{ "name": "unique_name_in_owner", "class_name": &"", "type": 1, "hint": 0, "hint_string": "", "usage": 2 }
// 		]
// 		*/
// 		for (int i = 0; i < property_setget.size(); i++)
// 		{
// 			Dictionary prop_info = property_setget[i];
// 			const String prop_name = prop_info["name"];
// 		}
		
		
// 		for (const KeyValue<StringName, ClassDB::PropertySetGet> &i : property_setget) {
// 			const StringName &prop_name = i.key;
// 			const ClassDB::PropertySetGet &prop = i.value;

// 			JSValue setter = JS_UNDEFINED;
// 			JSValue getter = JS_UNDEFINED;

// 			if (prop.index >= 0) {
// 				int size = godot_object_indexed_properties.size();
// 				if (size <= internal_godot_indexed_property_id) {
// 					godot_object_indexed_properties.resize(size + 128);
// 				}
// 				godot_object_indexed_properties.write[internal_godot_indexed_property_id] = &prop;
// 				CharString name = String(prop_name).utf8();
// 				getter = JS_NewCFunctionMagic(ctx, &QuickJSBinder::object_indexed_property, name.get_data(), 0, JS_CFUNC_generic_magic, internal_godot_indexed_property_id);
// 				setter = JS_NewCFunctionMagic(ctx, &QuickJSBinder::object_indexed_property, name.get_data(), 1, JS_CFUNC_generic_magic, internal_godot_indexed_property_id);
// 				++internal_godot_indexed_property_id;
// 			} else {
// 				if (HashMap<StringName, JSValue>::ConstIterator it = methods.find(prop.setter)) {
// 					setter = it->value;
// 					JS_DupValue(ctx, setter);
// 				} else if (MethodBind *mb = prop._setptr) {
// 					if (godot_methods.size() >= internal_godot_method_id) {
// 						godot_methods.resize(godot_methods.size() + 1);
// 					}
// 					godot_methods.write[internal_godot_method_id] = mb;
// 					String setter_name = prop.setter;
// 					setter = JS_NewCFunctionMagic(ctx, &QuickJSBinder::object_method, setter_name.utf8().get_data(), mb->get_argument_count(), JS_CFUNC_generic_magic, internal_godot_method_id);
// 					++internal_godot_method_id;
// 				}

// 				if (HashMap<StringName, JSValue>::ConstIterator it = methods.find(prop.getter)) {
// 					getter = it->value;
// 					JS_DupValue(ctx, getter);
// 				} else if (MethodBind *mb = prop._getptr) {
// 					if (godot_methods.size() >= internal_godot_method_id) {
// 						godot_methods.resize(godot_methods.size() + 1);
// 					}
// 					godot_methods.write[internal_godot_method_id] = mb;
// 					String getter_name = prop.getter;
// 					getter = JS_NewCFunctionMagic(ctx, &QuickJSBinder::object_method, getter_name.utf8().get_data(), mb->get_argument_count(), JS_CFUNC_generic_magic, internal_godot_method_id);
// 					++internal_godot_method_id;
// 				}
// 			}

// 			JSAtom atom = get_atom(ctx, prop_name);
// 			JS_DefinePropertyGetSet(ctx, data.prototype, atom, getter, setter, PROP_DEF_DEFAULT);
// 			JS_FreeAtom(ctx, atom);
// 		}
// 	}

// 	JS_NewClassID(&data.class_id);
// 	JS_NewClass(JS_GetRuntime(ctx), data.class_id, &data.jsclass);
// 	JS_SetClassProto(ctx, data.class_id, data.prototype);

// 	data.constructor = JS_NewCFunctionMagic(ctx, object_constructor, data.jsclass.class_name, data.class_name.size(), JS_CFUNC_constructor_magic, (int)data.class_id);
// 	JS_SetConstructor(ctx, data.constructor, data.prototype);
// 	JS_DefinePropertyValue(ctx, data.prototype, js_key_godot_classid, JS_NewInt32(ctx, data.class_id), PROP_DEF_DEFAULT);
// 	JS_DefinePropertyValue(ctx, data.constructor, js_key_godot_classid, JS_NewInt32(ctx, data.class_id), PROP_DEF_DEFAULT);

	
// 	// constants
// 	for (const KeyValue<StringName, int64_t> &pair : p_cls->constant_map) {
// 		JSAtom atom = get_atom(ctx, pair.key);
// 		JS_DefinePropertyValue(ctx, data.constructor, atom, JS_NewInt64(ctx, pair.value), PROP_DEF_DEFAULT);
// 		JS_FreeAtom(ctx, atom);
// 	}

// 	// enumeration
// 	auto enum_list = ClassDB::class_get_enum_list(*p_cls);
// 	for (int i = 0; i < enum_list.size(); i++)
// 	{
// 		JSValue enum_obj = JS_NewObject(ctx);
// 		JSAtom atom = get_atom(ctx, enum_list[i]);

// 		const auto const_keys = ClassDB::class_get_enum_constants(*p_cls, enum_list[i]);

// 		for (int j = 0; j < const_keys.size(); j++)
// 		{
// 			int value = p_cls->constant_map.get(E->get());
// 			JSAtom atom_key = get_atom(ctx, E->get());
// 			JS_DefinePropertyValue(ctx, enum_obj, atom_key, JS_NewInt32(ctx, value), PROP_DEF_DEFAULT);
// 			JS_FreeAtom(ctx, atom_key);
// 		}

// 		JS_DefinePropertyValue(ctx, data.constructor, atom, enum_obj, PROP_DEF_DEFAULT);
// 		JS_FreeAtom(ctx, atom);
// 	}
	


// 	// signals
// 	// from https://docs.godotengine.org/en/stable/classes/class_classdb.html#class-classdb-method-class-get-signal-list
// 	// return args, default_args, flags, id, name, return: (class_name, hint, hint_string, name, type, usage)
// 	auto signal_map = ClassDB::class_get_signal_list(*p_cls);
// 	for (int i = 0; i < signal_map.size(); i++)
// 	{
// 		Dictionary pair = signal_map[i];
// 		auto string_name = pair["name"];

// 		JSAtom atom = get_atom(ctx, string_name);
// 		JS_DefinePropertyValue(ctx, data.constructor, atom, to_js_string(ctx, string_name), PROP_DEF_DEFAULT);
// 		JS_FreeAtom(ctx, atom);
// 	}

// 	class_bindings.insert(data.class_id, data);
// 	classname_bindings.insert(*p_cls, class_bindings.getptr(data.class_id));

// 	return data.class_id;
// }

// void GavaScriptInstance::add_godot_classes()
// {
//     HashMap<StringName, JSClassID> gdclass_jsmap;
// 	// register classes
// 	for (const StringName class_name : ClassDB::get_class_list()) {
// 		if (JSClassID id = register_class(&class_name)) {
// 			gdclass_jsmap.insert(class_name, id);
// 		}
// 	}

// 	// Setup inherits chain
// 	for (const KeyValue<const ClassDB::ClassInfo *, JSClassID> &pair : gdclass_jsmap) {
// 		const ClassDB::ClassInfo *gdcls = pair.key;
// 		ClassBindData &bind = class_bindings.get(pair.value);
// 		if (gdcls->parent_ptr) {
// 			if (const HashMap<const ClassDB::ClassInfo *, JSClassID>::ConstIterator &base = gdclass_jsmap.find(gdcls->parent_ptr)) {
// 				bind.base_class = class_bindings.getptr(base->value);
// 			}
// 		}
// 	}

// 	// Setup the prototype chain
// 	for (const KeyValue<JSClassID, ClassBindData> &pair : class_bindings) {
// 		const ClassBindData &data = pair.value;
// 		int flags = PROP_DEF_DEFAULT;
// 		// Allows redefine as to global object
// 		if (Engine::get_singleton()->has_singleton(data.gdclass->name)) {
// 			flags |= JS_PROP_CONFIGURABLE;
// 		}
// 		JS_DefinePropertyValueStr(ctx, godot_object, data.jsclass.class_name, data.constructor, flags);
// 		if (data.base_class) {
// 			JS_SetPrototype(ctx, data.prototype, data.base_class->prototype);
// 		} else {
// 			JS_SetPrototype(ctx, data.prototype, godot_origin_class.prototype);
// 		}
// 	}

// 	godot_object_class = *classname_bindings.getptr("Object");
// 	godot_reference_class = *classname_bindings.getptr("RefCounted");
// }

void gavascript::GavaScriptInstance::add_global_console() {
	JSValue console = JS_NewObject(context);
	// JSValue log = JS_NewCFunctionMagic(context, console_log, "log", JS_CFUNC_generic_magic);
	JSValue log = JS_NewCFunctionMagic(context, console_log, "log", 0, JS_CFUNC_generic_magic, 0);
	JS_DefinePropertyValueStr(context, global_object, "console", console, PROP_DEF_DEFAULT);
	JS_DefinePropertyValueStr(context, console, "log", log, PROP_DEF_DEFAULT);
	console_object = JS_DupValue(context, console);
}

static HashMap<String, String> resolve_path_cache;


String gavascript::GavaScriptInstance::resolve_module_file(const String &file) {
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

JSModuleDef *gavascript::GavaScriptInstance::js_module_loader(JSContext *ctx, const char *module_name, void *opaque)
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

JSValue gavascript::GavaScriptInstance::console_log(JSContext *ctx, JSValue this_val, int argc, JSValue *argv, int magic)
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
}
