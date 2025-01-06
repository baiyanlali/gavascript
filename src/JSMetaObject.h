#ifndef JSMETAOBJECT_H
#define JSMETAOBJECT_H

#include <godot_cpp/classes/node.hpp>
#include "../thirdparty/quickjs/quickjs.h"
#include <godot_cpp/templates/hash_set.hpp>
#include <godot_cpp/templates/vector.hpp>
#include <godot_cpp/classes/resource.hpp>


using namespace godot;

namespace gavascript {

    class JSMetaObject : public RefCounted {
        GDCLASS(JSMetaObject, RefCounted);

    public:

        JSMetaObject(){
            // Do not use this constructor
        }

        JSMetaObject(JSContext *ctx, const JSValue& object){
            context = ctx;
            this->object = object;
        }

        JSContext* get_context(){
            if(context == nullptr){
                return nullptr;
            }
            return context;
        }

        JSValue get_object(){
            if(JS_IsUndefined(object)){
                return JS_EXCEPTION;
                // throw "[GavaScript Error] Object is undefined";
            }
            return object;
        }

    protected:
        static void _bind_methods(){

        };

        JSContext *context;
        JSValue object;
    };
}


#endif  // __LUA_FUNCTION_HPP__