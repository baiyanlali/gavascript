const s = Godot.Sprite2D();
s.set("name", "FromTestJS");
console.log(s); // 应该得到一个 JS 对象包装（GDObject），你可通过已有的 get/set 方法操作它

console.log(Object.keys(globalThis));
console.log(globalThis.parent);
console.log(globalThis.parent.get("call_from_js"));
console.log(globalThis.parent.get("add_child"));
globalThis.parent.get("call_from_js").call();
globalThis.parent.get("add_child").call(s);
// globalThis.parent.add_child(s);

// s.set("position", Godot.Vector2(100, 150));