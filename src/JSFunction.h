#ifndef JSFUNCTION_H
#define JSFUNCTION_H

#include <godot_cpp/classes/node.hpp>
#include "../thirdparty/quickjs/quickjs.h"
#include <godot_cpp/templates/hash_set.hpp>
#include <godot_cpp/templates/vector.hpp>
#include <godot_cpp/classes/resource.hpp>
#include "JSMetaObject.h"

using namespace godot;

namespace gavascript {
    
    class JSFunction : public JSMetaObject {
        GDCLASS(JSFunction, JSMetaObject);

    public:
        JSFunction(){
            throw "[GavaScript Error] Do not init JSFunction without context and object";
        }

        JSFunction(JSContext* context, const JSValue& function, const JSValue& this_object): 
            JSMetaObject(context, function) {
            this->this_object = this_object;
        };

        Variant call(const Array& args);
    protected:
        static void _bind_methods();
        JSValue this_object;
    };
}

#endif