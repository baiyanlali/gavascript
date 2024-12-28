#ifndef JSOBJECT_H
#define JSOBJECT_H

#include <godot_cpp/classes/node.hpp>
#include "quickjs.h"
#include <godot_cpp/templates/hash_set.hpp>
#include <godot_cpp/templates/vector.hpp>
#include <godot_cpp/classes/resource.hpp>
#include "JSMetaObject.h"

using namespace godot;

namespace gavascript{
    class JSObject : public JSMetaObject {
        GDCLASS(JSObject, JSMetaObject);

    public:
        JSObject(){
            throw "[GavaScript Error] Do not init JSObject without context and object";
        };
        JSObject(JSContext* context, const JSValue& object): 
            JSMetaObject(context, object) {};

    protected:
        static void _bind_methods();

        bool _get(const StringName& property_name, Variant& r_value);
        bool _set(const StringName& property_name, const Variant& value);
        String _to_string() const;
    };
}



#endif