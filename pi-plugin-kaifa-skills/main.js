/**
 * kaifa 项目技能包 — PI-Desktop plugin entry.
 *
 * 技能（skills/*.md）由 manifest.contributes.skills 声明，宿主按 id 提供给
 * 智能体按需加载；本入口不做任何运行时工作，也不弹提示，避免开机噪音。
 * 若要新增能力（面板、工具等），需同步扩大 manifest.json 的 permissions。
 */

async function onLoad() {
  // no-op：技能包本身不需要运行时钩子
}

async function onUnload() {
  // nothing to tear down
}

module.exports = { onLoad, onUnload };
