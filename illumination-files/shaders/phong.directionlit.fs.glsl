precision mediump float;

uniform vec3 uLightDirection;
uniform vec3 uCameraPosition;
uniform sampler2D uTexture;

varying vec2 vTexcoords;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main(void) {

    gl_FragColor = vec4(uLightDirection, 1.0);

    vec3 normalizedLightDir = normalize(uLightDirection);

    gl_FragColor = vec4(normalizedLightDir, 1.0);

    vec3 normalizedWorldNormal = normalize(vWorldNormal);

    gl_FragColor = vec4(normalizedWorldNormal, 1.0);

    float lambertTerm = max(dot(normalizedWorldNormal, normalizedLightDir), 0.0);

    gl_FragColor = vec4(vec3(lambertTerm), 1.0);

    // specular contribution
    // todo #4 in world space, calculate the direction from the surface point to the eye (normalized)
    vec3 eyeVector = normalize(uCameraPosition - vWorldPosition);
    gl_FragColor = vec4(eyeVector * 0.5 + 0.5, 1.0);
    // todo #5 in world space, calculate the reflection vector (normalized)
    vec3 reflectionVector = normalize(2.0 * dot(normalizedLightDir, normalizedWorldNormal) * normalizedWorldNormal - normalizedLightDir);
    gl_FragColor = vec4(reflectionVector * 0.5 + 0.5, 1.0);
    // todo #6 calculate the phong term
    float specularTerm = pow(max(dot(eyeVector, reflectionVector), 0.0), 64.0);
    gl_FragColor = vec4(specularTerm, specularTerm, specularTerm, 1.0);

    // combine
    // todo #7 apply light and material interaction for diffuse value by using the texture color as the material
    vec4 materialColor = texture2D(uTexture, vTexcoords);
    vec3 diffuseColor = materialColor.rgb * lambertTerm;
    gl_FragColor = vec4(diffuseColor, 1.0);
    // todo #8 apply light and material interaction for phong, assume phong material color is (0.3, 0.3, 0.3)
    vec3 specularMaterialColor = vec3(0.3, 0.3, 0.3);
    vec3 lightColor = vec3(1.0, 1.0, 1.0);

    vec3 albedo = texture2D(uTexture, vTexcoords).rgb;

    vec3 ambient = albedo * 0.1;
    vec3 specularColor = specularMaterialColor * lightColor * specularTerm;

    // todo #9
    // add "diffuseColor" and "specularColor" when ready
    vec3 finalColor = ambient + diffuseColor + specularColor;

    gl_FragColor = vec4(finalColor, 1.0);
}

// EOF 00100001-10