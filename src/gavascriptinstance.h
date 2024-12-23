#ifndef GAVASCRIPTINSTANCE_H
#define GAVASCRIPTINSTANCE_H

#include <godot_cpp/classes/node.hpp>


namespace godot {
    class GavaScriptInstance : public Node {
        GDCLASS(GavaScriptInstance, Node)
    
    protected:
        static void _bind_methods();
    public:
        GavaScriptInstance();
        ~GavaScriptInstance();

        void _process(double delta) override;
    };
}

#endif