// @glass-constants
@group(0) @binding(0) var opaque: texture_2d<f32>;
@group(0) @binding(1) var opticalDepth: texture_2d<f32>;
@group(0) @binding(2) var reflection: texture_2d<f32>;
@vertex fn vs_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
    let positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
    return vec4<f32>(positions[index], 0.0, 1.0);
}
fn linearRgb(rgb: vec3<f32>) -> vec3<f32> {
    if (all(rgb <= vec3<f32>(0.04045))) { return rgb / 12.92; }
    if (all(rgb == vec3<f32>(1.0))) { return rgb; }
    return select(pow((rgb + 0.055) / 1.055, vec3<f32>(2.4)), rgb / 12.92, rgb <= vec3<f32>(0.04045));
}
fn encodedRgb(rgb: vec3<f32>) -> vec3<f32> {
    if (all(rgb <= vec3<f32>(0.0031308))) { return rgb * 12.92; }
    return select(1.055 * pow(max(rgb, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.4)) - 0.055, rgb * 12.92, rgb <= vec3<f32>(0.0031308));
}
@fragment fn fs_main(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
    let pixel = vec2<i32>(position.xy);
    let base = textureLoad(opaque, pixel, 0);
    // Additive FP16 may saturate under extreme overdraw: bound before division/exp.
    let accumulatedDepth = textureLoad(opticalDepth, pixel, 0);
    if (all(accumulatedDepth == vec4<f32>(0.0))) { return base; }
    let depth = min(accumulatedDepth, vec4<f32>(FP16_MAX)) / ACCUMULATION_SCALE;
    let reflected = min(textureLoad(reflection, pixel, 0), vec4<f32>(FP16_MAX));
    let transmission = exp(-min(depth.rgb, vec3<f32>(MAX_OPTICAL_DEPTH)));
    let coverage = 1.0 - exp(-min(depth.a, MAX_OPTICAL_DEPTH));
    let alpha = base.a + (1.0 - base.a) * coverage;
    let baseLinear = linearRgb(clamp(base.rgb / max(base.a, 0.000001), vec3<f32>(0.0), vec3<f32>(1.0))) * base.a;
    let meanReflection = min(reflected.rgb / max(reflected.a, 0.000001), vec3<f32>(MAX_RADIANCE));
    let premultipliedLinear = baseLinear * transmission + meanReflection * coverage;
    let encoded = clamp(encodedRgb(premultipliedLinear / max(alpha, 0.000001)), vec3<f32>(0.0), vec3<f32>(1.0));
    return vec4<f32>(encoded * alpha, alpha);
}
