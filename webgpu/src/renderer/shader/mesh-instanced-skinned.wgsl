struct GlobalUniforms {
    viewProjectionMatrix: mat4x4<f32>,
};
@binding(0) @group(0) var<uniform> globalUniforms: GlobalUniforms;

struct Light {
    position: vec4<f32>,
    color: vec4<f32>,
};

struct SceneUniforms {
    viewMatrix: mat4x4<f32>,
    viewNormalMatrix: mat4x4<f32>,
    numLights: u32,
    lights: array<Light, 4>,
    cameraPosition: vec3<f32>,
    padding: f32,
};
@binding(1) @group(0) var<uniform> sceneUniforms: SceneUniforms;

struct PerObjectUniforms {
    modelMatrix: mat4x4<f32>,
    normalMatrix: mat4x4<f32>,
    color: vec4<f32>,
    skinParams: vec4<f32>,
};
@binding(0) @group(1) var<uniform> perObject: PerObjectUniforms;

// Packed palettes, one boneCount-sized block for every instance.
@binding(0) @group(2) var<storage, read> instanceBones: array<mat4x4<f32>>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) viewPosition: vec3<f32>,
    @location(1) viewNormal: vec3<f32>,
};

@vertex
fn vs_main(
    @location(0) pos: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) skinIndex: vec4<u32>,
    @location(3) skinWeight: vec4<f32>,
    @location(4) instanceMatrix0: vec4<f32>,
    @location(5) instanceMatrix1: vec4<f32>,
    @location(6) instanceMatrix2: vec4<f32>,
    @location(7) instanceMatrix3: vec4<f32>,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    var out: VertexOutput;
    var worldPosition: vec4<f32>;
    var worldNormal: vec3<f32>;

    let boneOffset = instanceIndex * u32(perObject.skinParams.x);
    let skinMatrix =
        instanceBones[boneOffset + skinIndex.x] * skinWeight.x +
        instanceBones[boneOffset + skinIndex.y] * skinWeight.y +
        instanceBones[boneOffset + skinIndex.z] * skinWeight.z +
        instanceBones[boneOffset + skinIndex.w] * skinWeight.w;

    let instanceMatrix = mat4x4<f32>(instanceMatrix0, instanceMatrix1, instanceMatrix2, instanceMatrix3);
    let deformation = instanceMatrix * skinMatrix;
    worldPosition = perObject.modelMatrix * deformation * vec4<f32>(pos, 1.0);

    // Inverse transpose preserves normals under non-uniform instance scale.
    let a = deformation[0].xyz;
    let b = deformation[1].xyz;
    let c = deformation[2].xyz;
    let determinant = dot(a, cross(b, c));
    let cofactor = mat3x3<f32>(cross(b, c), cross(c, a), cross(a, b));
    let divisor = select(1.0, determinant, abs(determinant) > 0.0000001);
    worldNormal = (perObject.normalMatrix * vec4<f32>((cofactor * normal) / divisor, 0.0)).xyz;

    out.position = globalUniforms.viewProjectionMatrix * worldPosition;
    out.viewPosition = (sceneUniforms.viewMatrix * worldPosition).xyz;
    out.viewNormal = (sceneUniforms.viewNormalMatrix * vec4<f32>(worldNormal, 0.0)).xyz;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let ambient = vec3<f32>(0.1, 0.1, 0.1);
    var totalDiffuse = vec3<f32>(0.0, 0.0, 0.0);
    let normal = normalize(in.viewNormal);

    for (var i: u32 = 0u; i < sceneUniforms.numLights; i = i + 1u) {
        let light = sceneUniforms.lights[i];
        let lightDir = normalize(light.position.xyz - in.viewPosition);
        let diffuseStrength = max(dot(normal, lightDir), 0.0);
        let intensity = light.color.a;
        totalDiffuse = totalDiffuse + light.color.rgb * diffuseStrength * intensity;
    }

    let finalColor = perObject.color.rgb * (ambient + totalDiffuse);
    return vec4<f32>(finalColor, perObject.color.a);
}
