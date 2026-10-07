import * as THREE from 'three'

/**
 * RevealMaterial —— 手绘“上色揭示”材质。
 *
 * 在 MeshBasicMaterial 基础上，通过 onBeforeCompile 注入 uProgress uniform：
 * 随着 uProgress 0→1，按 (1.0 - vMapUv.y) 自底向上、带噪声边缘地 discard 线稿像素，
 * 露出下层的上色（painted）贴图。用于双门“灰白线稿 → 暖色上色”的悬停反馈。
 *
 * 参考：ITomPoland/portfolio-itom（MIT）的 RevealMaterial 思路，仅保留 discard 部分。
 */
export class RevealMaterial extends THREE.MeshBasicMaterial {
  private _uProgress = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _shader: any = null

  get uProgress(): number {
    return this._uProgress
  }

  set uProgress(v: number) {
    this._uProgress = v
    if (this._shader) {
      this._shader.uniforms.uProgress.value = v
    }
  }

  customProgramCacheKey(): string {
    return 'RevealMaterial_v1'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBeforeCompile(shader: any): void {
    this._shader = shader
    shader.uniforms.uProgress = { value: this._uProgress }

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
        uniform float uProgress;
        float revealRand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
        float revealNoise(vec2 p) {
          vec2 ip = floor(p);
          vec2 u = fract(p);
          u = u * u * (3.0 - 2.0 * u);
          float res = mix(
            mix(revealRand(ip), revealRand(ip + vec2(1.0, 0.0)), u.x),
            mix(revealRand(ip + vec2(0.0, 1.0)), revealRand(ip + vec2(1.0, 1.0)), u.x),
            u.y
          );
          return res * res;
        }
      `,
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <alphatest_fragment>',
      `#include <alphatest_fragment>
        if (uProgress > 0.001) {
          float rn = revealNoise(vMapUv * 15.0) * 0.15;
          float maskValue = vMapUv.y + rn;
          float threshold = uProgress * 1.5;
          if (maskValue < threshold) discard;
        }
      `,
    )
  }
}
