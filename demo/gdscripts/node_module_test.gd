extends Node
@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance


func _ready() -> void:
	gava_script_instance.set_global("parent", self)
	
	var js_module: JSObject = gava_script_instance.start('./jstest/test_node_modules/testfile.js')
	
	var js_object: JSObject = gava_script_instance.start('./jstest/test_godot_classes/test.js')
	
	var sprite2d = Sprite2D.new()
	sprite2d.name = "from godot"
	self.add_child(sprite2d)
	print(sprite2d)
	
func call_from_js():
	print("call from js")
