/*
 * An object type representing an implicit sphere.
 *
 * @param center A Vector3 object representing the position of the center of the sphere
 * @param radius A Number representing the radius of the sphere.
 * 
 * Example usage:
 * var mySphere = new Sphere(new Vector3(1, 2, 3), 4.23);
 * var myRay = new Ray(new Vector3(0, 1, -10), new Vector3(0, 1, 0));
 * var result = mySphere.raycast(myRay);
 * 
 * if (result.hit) {
 *   console.log("Got a valid intersection!");
 * }
 */

var Sphere = function(center, radius) {
  // Sanity checks (your modification should be below this where indicated)
  if (!(this instanceof Sphere)) {
    console.error("Sphere constructor must be called with the new operator");
  }

  this.center = center;
  this.radius = radius;

  // todo - make sure this.center and this.radius are replaced with default values if and only if they
  // are invalid or undefined (i.e. center should be of type Vector3 & radius should be a Number)
  // - the default center should be the zero vector
  // - the default radius should be 1
  // YOUR CODE HERE

   this.center = (center instanceof Vector3) ? center : new Vector3(0, 0, 0);
   this.radius = (typeof radius === 'number' && radius > 0) ? radius : 1;

  // Sanity checks (your modification should be above this)
  if (!(this.center instanceof Vector3)) {
    console.error("The sphere center must be a Vector3");
  }

  if ((typeof(this.radius) != 'number')) {
    console.error("The radius must be a Number");
  }
};

Sphere.prototype = {
  
  //----------------------------------------------------------------------------- 
  raycast: function(r1) {
    // todo - determine whether the ray intersects has a VALID intersection with this
	//        sphere and if so, where. A valid intersection is on the is in front of
	//        the ray and whose origin is NOT inside the sphere

    // Recommended steps
    // ------------------
    // 0. (optional) watch the video showing the complete implementation of plane.js
    //    You may find it useful to see a different piece of geometry coded.

    // 1. review slides/book math
    
    // 2. identity the vectors needed to solve for the coefficients in the quadratic equation

    // 3. calculate the discriminant
    
    // 4. use the discriminant to determine if further computation is necessary 
    //    if (discriminant...) { ... } else { ... }

    // 5. return the following object literal "result" based on whether the intersection
    //    is valid (i.e. the intersection is in front of the ray AND the ray is not inside
    //    the sphere)
    //    case 1: no VALID intersections
    //      var result = { hit: false, point: null }
    //    case 2: 1 or more intersections
    //      var result = {
    //        hit: true,
    //        point: 'a Vector3 containing the CLOSEST VALID intersection',
    //        normal: 'a vector3 containing a unit length normal at the intersection point',
    //        distance: 'a scalar containing the intersection distance from the ray origin'
    //      }

    // An object created from a literal that we will return as our result
    // Replace the null values in the properties below with the right values
    var result = {
      hit: false,
      point: null,
      normal: null,
      distance: null
    };

    var L = this.center.subtract(r1.origin);
    var tca = L.dot(r1.direction);
    var d2 = L.dot(L) - tca * tca;
    var radius2 = this.radius * this.radius;

    if (d2 > radius2) {
      return result;
    }

    var thc = Math.sqrt(radius2 - d2);
    var t0 = tca - thc;
    var t1 = tca + thc;

    if (t0 > t1) {
      var temp = t0;
      t0 = t1;
      t1 = temp;
    }

    if (t1 < 0) {
      return result;
    }

    var t = t0 < 0 ? t1 : t0;
    if (t < 0) {
      return result;
    }

    var point = r1.origin.add(r1.direction.multiplyScalar(t));
    var normal = point.subtract(this.center).normalize();

    result.hit = true;
    result.point = point;
    result.normal = normal;
    result.distance = t;

    return result;
  }
};

// EOF 00100001-10