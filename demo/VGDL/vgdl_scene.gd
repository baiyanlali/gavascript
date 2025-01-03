extends Node2D

@onready var vgdl_renderer: VGDLRenderer = $VGDLRenderer

@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance
var VGDLGame: JSObject
var game_start: JSFunction
var get_full_state: JSFunction
var update: JSFunction
var presskey: JSFunction
var presskeyUp: JSFunction
# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	gava_script_instance.start("res://javascript/main.js")
	VGDLGame = gava_script_instance.get_global("game")
	get_full_state = gava_script_instance.get_global("get_full_state")
	update = gava_script_instance.get_global("update")
	presskey = gava_script_instance.get_global("presskey")
	presskeyUp = gava_script_instance.get_global("presskeyUp")
	vgdl_renderer.parsing_state(get_full_state.call(null))

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta: float) -> void:
	update.call(delta)
	vgdl_renderer.parsing_state(get_full_state.call(null))
