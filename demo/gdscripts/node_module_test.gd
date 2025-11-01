extends Node
@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance


func _ready() -> void:
	var js_module: JSObject = gava_script_instance.start('./jstest/test_node_modules/testfile.js')
