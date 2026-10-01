import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

// 起步冒烟测试：验证 vitest + @vue/test-utils + happy-dom 工具链可用。
// 使用 render 函数（非 template 字符串），避免 runtime-compiler 缺失导致挂载失败。
const Hello = defineComponent({
  name: 'Hello',
  props: {
    name: { type: String, default: 'world' },
  },
  render() {
    return h('div', { class: 'hello' }, `hello ${this.name}`);
  },
});

describe('admin-frontend 测试起步', () => {
  it('vitest + @vue/test-utils + happy-dom 环境正常', () => {
    const wrapper = mount(Hello, { props: { name: 'eudazi' } });
    expect(wrapper.find('.hello').text()).toContain('eudazi');
  });
});
