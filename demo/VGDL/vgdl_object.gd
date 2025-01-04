extends Node2D
class_name VGDLObject
@onready var icon: Sprite2D = $Icon

var renderer: VGDLRenderer = null

func update_object_state(object_state: JSObject):
	if object_state.img:
		icon.texture = load("res://sprites/%s.png" % [object_state.img])
	if object_state.Z:
		icon.z_index = object_state.Z
	position.x = object_state.location.x * renderer.PIXEL_RATIO
	position.y = object_state.location.y * renderer.PIXEL_RATIO
	if object_state.hidden:
		visible = false
