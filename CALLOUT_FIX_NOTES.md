# Callout 图片调整大小修复说明

## 问题描述

在之前的版本中，当用户尝试在 callout 块内调整图片大小时，会出现以下问题：

1. **视觉上可以拖动**：图片在拖动时会改变大小
2. **实际未修改**：释放鼠标后，Markdown 源码中的尺寸参数没有更新
3. **报错提示**：可能显示"未能找到当前图像链接"的错误

## 根本原因

问题出在 `src/utils/link-update-service.ts` 文件中处理 callout 的逻辑：

### 1. 正则表达式不准确
```typescript
// 之前：只匹配 '>'
callout: /^>/

// 现在：匹配 '>' 后面可能有的空格
callout: /^>\s*/
```

### 2. 文本匹配时未去除 callout 前缀
在 callout 中，每行文本都以 `> ` 开头，但我们在匹配图片链接时，需要在去除这个前缀后的文本上进行匹配。

**修复前**：直接在包含 `> ` 前缀的完整行上匹配
```typescript
const matched = this.matchLineWithInternalLink(line.text, imageName, newWidth, inTable);
```

**修复后**：先去除 callout 前缀，再进行匹配
```typescript
const lineTextToMatch = mode === 'callout' 
    ? line.text.replace(/^>\s*/, '') 
    : line.text;
const matched = this.matchLineWithInternalLink(lineTextToMatch, imageName, newWidth, inTable);
```

### 3. 更新位置计算错误
在替换文本时，需要考虑 callout 前缀的长度偏移。

**修复前**：直接使用匹配到的位置
```typescript
editorView.dispatch({
    changes: {
        from: target_line2.from + matched_results[0].from_ch,
        to: target_line2.from + matched_results[0].to_ch,
        insert: matched_results[0].new_link
    }
});
```

**修复后**：加上 callout 前缀的长度
```typescript
// 计算 callout 标记的偏移量
const calloutPrefixMatch = target_line2.text.match(/^>\s*/);
const calloutPrefixLength = calloutPrefixMatch ? calloutPrefixMatch[0].length : 0;

editorView.dispatch({
    changes: {
        from: target_line2.from + calloutPrefixLength + matched_results[0].from_ch,
        to: target_line2.from + calloutPrefixLength + matched_results[0].to_ch,
        insert: matched_results[0].new_link
    }
});
```

## 修复内容

修改了 `src/utils/link-update-service.ts` 文件中的两个方法：

1. ✅ `updateInternalLink()` - 处理内部图片链接（Wiki 链接和 Markdown 链接）
2. ✅ `updateExternalLink()` - 处理外部图片链接（HTTP/HTTPS）

对这两个方法都应用了相同的修复逻辑：
- 更准确的 callout 正则表达式
- 在匹配前去除 callout 前缀
- 在更新时正确计算位置偏移

## 测试方法

1. 重新加载插件（在 Obsidian 中禁用后重新启用）
2. 打开 `CALLOUT_TEST.md` 测试文件
3. 在编辑模式下尝试拖动 callout 内的图片右下角调整大小
4. 检查源码是否正确更新

## 支持的语法

修复后支持以下所有格式：

### Wiki 链接
```markdown
> ![[image.png]]
> ![[image.png|300]]
> ![[image.png|alt text|300]]
```

### Markdown 链接（内部）
```markdown
> ![](image.png)
> ![300](image.png)
> ![alt text|300](image.png)
```

### Markdown 链接（外部）
```markdown
> ![](https://example.com/image.png)
> ![alt text|300](https://example.com/image.png)
```

## 注意事项

- 确保在**编辑模式**下使用此功能
- 光标移到图片右下角会显示调整大小的箭头
- 拖动时会实时显示大小变化
- 释放鼠标后会自动更新 Markdown 源码
- callout 的 `> ` 标记会被正确保留

## 技术细节

- 使用正则表达式 `/^>\s*/` 匹配各种 callout 前缀格式
- 通过字符串替换去除前缀进行匹配
- 通过计算前缀长度调整替换位置
- 同时支持内部链接和外部链接
- 同时支持 Wiki 语法和 Markdown 语法
