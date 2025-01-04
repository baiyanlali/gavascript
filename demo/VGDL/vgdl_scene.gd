extends Node2D

@onready var vgdl_renderer: VGDLRenderer = $VGDLRenderer

@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance
var VGDLGame: JSObject
var get_full_state: JSFunction
var update: JSFunction
var presskey: JSFunction
var presskeyUp: JSFunction
var start_game: JSFunction

const VGDLInputMapping: Dictionary = {
	"move_up": "UP",
	"move_down": "DOWN",
	"move_left": "LEFT",
	"move_right": "RIGHT",
	"hit": "SPACE"
}

func get_time():
	return Time.get_ticks_msec()

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	gava_script_instance.set_global("get_time", get_time)
	gava_script_instance.start("res://javascript/main.js")
	VGDLGame = gava_script_instance.get_global("game")
	get_full_state = gava_script_instance.get_global("get_full_state")
	update = gava_script_instance.get_global("update")
	presskey = gava_script_instance.get_global("presskey")
	presskeyUp = gava_script_instance.get_global("presskeyUp")
	start_game = gava_script_instance.get_global("startGame")
	vgdl_renderer.parsing_state(get_full_state.call_nonargs())
	start_game.call_nonargs()

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta: float) -> void:
	for action_mapping in VGDLInputMapping.keys():
		var vgdl_action = VGDLInputMapping[action_mapping]
		if Input.is_action_just_pressed(action_mapping):
			presskey.call(vgdl_action)
		elif Input.is_action_just_released(action_mapping):
			presskeyUp.call(vgdl_action)
	update.callv([delta])
	vgdl_renderer.parsing_state(get_full_state.call_nonargs())
