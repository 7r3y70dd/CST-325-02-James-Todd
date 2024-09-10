/*
 * An "object" representing a 3d vector to make operations simple and concise.
 *
 * Similar to how we work with plain numbers, we will work with vectors as
 * an entity unto itself.  Note the syntax below: var Vector3 = function...
 * This is different than you might be used to in most programming languages.
 * Here, the function is meant to be instantiated rather than called and the
 * instantiation process IS similar to other object oriented languages => new Vector3()
 */

var Vector3 = function(x = 0, y = 0, z = 0) {
  this.x = x; this.y = y; this.z = z;

  if (!(this instanceof Vector3)) {
    console.error("Vector3 constructor must be called with the 'new' operator");
  }
}


Vector3.prototype = {

  //----------------------------------------------------------------------------- 
set: function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  return this;
},

  //----------------------------------------------------------------------------- 
  clone: function() {
    return new Vector3(this.x, this.y, this.z);
  },

  //----------------------------------------------------------------------------- 
copy: function(other) {
  this.x = other.x;
  this.y = other.y;
  this.z = other.z;
  return this;
},

  //----------------------------------------------------------------------------- 
negate: function() {
  this.x = -this.x;
  this.y = -this.y;
  this.z = -this.z;
  return this;
},

  //----------------------------------------------------------------------------- 
add: function(v) {
  this.x += v.x;
  this.y += v.y;
  this.z += v.z;
  return this;
},

  //----------------------------------------------------------------------------- 
subtract: function(v) {
  this.x -= v.x;
  this.y -= v.y;
  this.z -= v.z;
  return this;
},

  //----------------------------------------------------------------------------- 
multiplyScalar: function(scalar) {
  this.x *= scalar;
  this.y *= scalar;
  this.z *= scalar;
  return this;
},

  //----------------------------------------------------------------------------- 
length: function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
},

  //----------------------------------------------------------------------------- 
lengthSqr: function() {
  return this.x * this.x + this.y * this.y + this.z * this.z;
},

  //----------------------------------------------------------------------------- 
normalize: function() {
  let len = this.length();
  if (len > 0) {
    this.multiplyScalar(1 / len);
  }
  return this;
},

  //----------------------------------------------------------------------------- 
dot: function(other) {
  return this.x * other.x + this.y * other.y + this.z * other.z;
},


  //============================================================================= 
  // The functions below must be completed in order to receive an "A"

  //----------------------------------------------------------------------------- 
fromTo: function(fromPoint, toPoint) {
  return new Vector3(
    toPoint.x - fromPoint.x,
    toPoint.y - fromPoint.y,
    toPoint.z - fromPoint.z
  );
},

  //----------------------------------------------------------------------------- 
rescale: function(newScale) {
  return this.normalize().multiplyScalar(newScale);
},

  //----------------------------------------------------------------------------- 
angle: function(v1, v2) {
  const dotProduct = v1.dot(v2);
  const lengths = v1.length() * v2.length();
  const cosineTheta = dotProduct / lengths;
  return Math.acos(cosineTheta) * (180 / Math.PI);
},

  //----------------------------------------------------------------------------- 
project: function(vectorToProject, otherVector) {
  let scalarProjection = vectorToProject.dot(otherVector) / otherVector.lengthSqr();
  return otherVector.clone().multiplyScalar(scalarProjection);
},
};

 
