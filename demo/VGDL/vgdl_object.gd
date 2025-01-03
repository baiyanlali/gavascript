extends Node2D
class_name VGDLObject

var renderer: VGDLRenderer = null

func update_object_state(object_state: JSObject):
	position.x = object_state.location.x * renderer.PIXEL_RATIO
	position.y = object_state.location.y * renderer.PIXEL_RATIO
	if object_state.hidden:
		visible = false
