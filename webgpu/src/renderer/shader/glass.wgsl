// Тонкие оболочки: Beer–Lambert + GGX/Schlick существующих точечных источников.
// Нет фонового emission, screen-space преломления или полного пути внутри объёма.
// @glass-constants
// @glass-depth
// @engine-presentation-clip
struct GlobalUniforms { viewProjectionMatrix: mat4x4<f32>, };
struct Light { position: vec4<f32>, color: vec4<f32>, };
struct SceneUniforms {
    viewMatrix: mat4x4<f32>, viewNormalMatrix: mat4x4<f32>,
    numLights: u32, lights: array<Light, 4>, cameraPosition: vec3<f32>, padding: f32,
};
struct PerObjectUniforms {
    modelMatrix: mat4x4<f32>, normalMatrix: mat4x4<f32>, absorptionAndDensity: vec4<f32>,
    optics: vec4<f32>, padding: array<vec4<f32>, 4>, presentationClipRange: vec4<f32>,
};
@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;
@group(0) @binding(1) var<uniform> sceneUniforms: SceneUniforms;
@group(1) @binding(0) var<uniform> perObject: PerObjectUniforms;

fn safeNormalize(value: vec3<f32>, fallback: vec3<f32>) -> vec3<f32> {
    let squared = dot(value, value);
    if (!(squared > 0.00000001 && squared < 1e30)) { return fallback; }
    return value * inverseSqrt(squared);
}
fn linearRgb(value: vec3<f32>) -> vec3<f32> {
    let rgb = clamp(value, vec3<f32>(0.0), vec3<f32>(1.0));
    if (all(rgb <= vec3<f32>(0.04045))) { return rgb / 12.92; }
    if (all(rgb == vec3<f32>(1.0))) { return rgb; }
    return select(pow((rgb + 0.055) / 1.055, vec3<f32>(2.4)), rgb / 12.92, rgb <= vec3<f32>(0.04045));
}
fn fifthPower(value: f32) -> f32 {
    let squared = value * value;
    return squared * squared * value;
}
fn opaqueVisibility(position: vec4<f32>) -> f32 {
    let pixel = vec2<i32>(position.xy);
    // @glass-depth-visibility
}
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>, @location(1) viewPosition: vec3<f32>,
    @location(2) viewNormal: vec3<f32>,
};
@vertex fn vs_main(@location(0) position: vec3<f32>, @location(1) normal: vec3<f32>) -> VertexOutput {
    var out: VertexOutput;
    let world = perObject.modelMatrix * vec4<f32>(position, 1.0);
    out.position = globalUniforms.viewProjectionMatrix * world;
    out.worldPosition = world.xyz;
    out.viewPosition = (sceneUniforms.viewMatrix * world).xyz;
    out.viewNormal = (sceneUniforms.viewNormalMatrix * perObject.normalMatrix * vec4<f32>(normal, 0.0)).xyz;
    return out;
}
struct Accumulation { @location(0) depth: vec4<f32>, @location(1) reflection: vec4<f32>, };
@fragment fn fs_main(in: VertexOutput) -> Accumulation {
    let visibility = opaqueVisibility(in.position) * presentationClipCoverage(in.worldPosition, perObject.presentationClipRange);
    let density = perObject.absorptionAndDensity.a * visibility;
    if (density <= 0.0) { discard; }
    let view = select(safeNormalize(-in.viewPosition, vec3<f32>(0.0, 0.0, 1.0)), vec3<f32>(0.0, 0.0, 1.0), sceneUniforms.padding > 0.5);
    let rawNormal = safeNormalize(in.viewNormal, vec3<f32>(0.0, 0.0, 1.0));
    let normal = select(-rawNormal, rawNormal, dot(rawNormal, view) >= 0.0);
    let facing = clamp(dot(normal, view), 0.0, 1.0);
    let f0 = perObject.optics.y;
    let fresnel = select(f0 + (1.0 - f0) * fifthPower(1.0 - facing), 0.0, f0 == 0.0);
    let reflectionDepth = -log(max(0.000001, 1.0 - density * fresnel));
    let absorption = perObject.absorptionAndDensity.rgb;
    let depth = min(vec3<f32>(MAX_OPTICAL_DEPTH), absorption * perObject.optics.x * density / max(0.1, facing) + reflectionDepth);
    let coverageDepth = max(depth.x, max(depth.y, depth.z));
    let coverage = 1.0 - exp(-coverageDepth);
    let roughSquared = perObject.optics.z;
    let k = perObject.optics.w;
    var reflected = vec3<f32>(0.0);
    for (var i = 0u; i < min(sceneUniforms.numLights, 4u); i += 1u) {
        let light = sceneUniforms.lights[i];
        if (!all(abs(light.position.xyz) < vec3<f32>(1e15)) || !all(light.color >= vec4<f32>(0.0)) || !all(light.color < vec4<f32>(1e15))) { continue; }
        let direction = safeNormalize(light.position.xyz - in.viewPosition, normal);
        let halfDirection = safeNormalize(direction + view, normal);
        let nDotL = max(dot(normal, direction), 0.0);
        let nDotH = max(dot(normal, halfDirection), 0.0);
        let vDotH = max(dot(view, halfDirection), 0.0);
        let denominator = nDotH * nDotH * (roughSquared - 1.0) + 1.0;
        let distribution = roughSquared / max(0.000001, 3.14159265 * denominator * denominator);
        let maskingView = facing / max(0.000001, facing * (1.0 - k) + k);
        let maskingLight = nDotL / max(0.000001, nDotL * (1.0 - k) + k);
        let reflectionFresnel = select(f0 + (1.0 - f0) * fifthPower(1.0 - vDotH), 0.0, f0 == 0.0);
        let specular = distribution * maskingView * maskingLight * reflectionFresnel / max(0.000001, 4.0 * facing);
        reflected += linearRgb(light.color.rgb) * min(light.color.a, 10000.0) * specular;
    }
    var out: Accumulation;
    out.depth = vec4<f32>(depth, coverageDepth) * ACCUMULATION_SCALE;
    out.reflection = vec4<f32>(min(reflected, vec3<f32>(MAX_RADIANCE)) * density, coverage) * ACCUMULATION_SCALE;
    return out;
}
