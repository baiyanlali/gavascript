extends Node2D
class_name VGDLRenderer
const VGDL_OBJECT = preload("res://VGDL/vgdl_object.tscn")
const PIXEL_RATIO = 64
var VGDLObjects: Dictionary = {}

func parsing_state(state: JSObject):
	for obj in state.objects:
		if VGDLObjects.has(obj.ID):
			var current_object: VGDLObject = VGDLObjects[obj.ID]
			current_object.update_object_state(obj)
		else:
			var current_object: VGDLObject = VGDL_OBJECT.instantiate()
			current_object.name = "%d_%s" % [obj.ID, obj.name]
			current_object.renderer = self
			add_child(current_object)
			VGDLObjects[obj.ID] = current_object
			current_object.update_object_state(obj)
