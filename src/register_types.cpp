#include "register_types.h"
#include "gavascriptinstance.h"
#include <gdextension_interface.h>
#include <godot_cpp/core/defs.hpp>
#include <godot_cpp/godot.hpp>
#include "JSObject.h"
#include "JSMetaObject.h"
#include "JSFunction.h"
using namespace godot;

void initialize_gavascript_module(ModuleInitializationLevel p_level) {
	if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
		return;
	}

	GDREGISTER_CLASS(gavascript::GavaScriptInstance);
	GDREGISTER_CLASS(gavascript::JSMetaObject);
	// GDREGISTER_CLASS(gavascript::JSObject);
	GDREGISTER_CLASS(gavascript::JSFunction);
}

void uninitialize_gavascript_module(ModuleInitializationLevel p_level) {
	if (p_level != MODULE_INITIALIZATION_LEVEL_SCENE) {
		return;
	}
}

extern "C" {
// Initialization.
GDExtensionBool GDE_EXPORT gavascript_library_init(GDExtensionInterfaceGetProcAddress p_get_proc_address, const GDExtensionClassLibraryPtr p_library, GDExtensionInitialization *r_initialization) {
	godot::GDExtensionBinding::InitObject init_obj(p_get_proc_address, p_library, r_initialization);

	init_obj.register_initializer(initialize_gavascript_module);
	init_obj.register_terminator(uninitialize_gavascript_module);
	init_obj.set_minimum_library_initialization_level(MODULE_INITIALIZATION_LEVEL_SCENE);

	return init_obj.init();
}
}