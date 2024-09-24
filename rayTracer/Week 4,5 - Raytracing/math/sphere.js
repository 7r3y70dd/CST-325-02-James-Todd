/*
 * An object type representing an implicit sphere.
 *
 * @param center A Vector3 object representing the position of the center of the sphere
 * @param radius A Number representing the radius of the sphere.
 */

var Sphere = function(center, radius) {
  if (!(this instanceof Sphere)) {
    console.error("Sphere constructor must be called with the new operator");
  }

	this.center = center;
	this.radius = radius;

	if (center == undefined || radius == undefined) {
		this.center = new Vector3();
		this.radius = 1;
  }

  if (!(this.center instanceof Vector3)) {
    console.error("The sphere center must be a Vector3");
  }

  if ((typeof(this.radius) != 'number')) {
    console.error("The radius must be a Number");
  }
};

Sphere.prototype = {
  //----------------------------------------------------------------------------- 
	raycast: function(ray) {
		var sphereOriginToRayOrigin = ray.origin.clone().subtract(this.center);

		var a = ray.direction.dot(ray.direction);
		var b = ray.direction.clone().multiplyScalar(2).dot(sphereOriginToRayOrigin);
		var c = sphereOriginToRayOrigin.dot(sphereOriginToRayOrigin) - this.radius * this.radius;

		var result = { hit: false };

		var discriminant = b * b - 4 * a * c;
		if (discriminant < 0) {
			return result;
		}

		var t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
		var t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

		if (t1 > 0 && t2 > 0) {
			var t = (t1 < t2) ? t1: t2;
			var originOffset = ray.clone().direction.multiplyScalar(t);

			result.hit = true;
			result.point = ray.origin.clone().add(originOffset);
			result.normal = (result.point.clone().subtract(this.center)).normalize();
			result.distance = originOffset.length();
		}

		return result;
	}
}

// EOF 00100001-1