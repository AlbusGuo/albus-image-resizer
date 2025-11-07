# 调试说明

## 问题诊断

发现了关键问题：在 callout 模式下，传递给匹配函数的 `inTable` 参数不正确。

### 根本原因

在 `matchLineWithInternalLink` 和 `matchLineWithExternalLink` 函数中，`inTable` 参数用于控制是否转义管道符 `|`：
- 在表格中：管道符需要转义为 `\|`
- 在 callout 中：管道符**不需要**转义

但之前的代码在 callout 模式下仍然传递了原始的 `inTable` 参数，导致：
1. 如果图片在既是 callout 又是表格的情况下（理论上不存在），会错误地转义
2. 匹配逻辑会寻找转义的管道符，但 callout 中的图片链接使用的是普通管道符

### 修复内容

1. ✅ **修复普通行和 callout 中的匹配**：所有调用都明确传递 `false` 作为 `inTable` 参数
   ```typescript
   // 之前（错误）
   const matched = this.matchLineWithInternalLink(lineTextToMatch, imageName, newWidth, inTable);
   
   // 现在（正确）
   const matched = this.matchLineWithInternalLink(lineTextToMatch, imageName, newWidth, false);
   ```

2. ✅ **添加详细的调试日志**：启用调试模式后可以看到：
   - 图片名称
   - 起始行号和文本
   - 每一行的原始文本和处理后文本
   - 匹配结果

## 如何测试

### 1. 启用调试模式

1. 打开 Obsidian 设置
2. 找到 "Image Resize Plugin"
3. 开启 "调试模式"

### 2. 打开浏览器控制台

按 `Ctrl+Shift+I` (Windows) 或 `Cmd+Option+I` (Mac) 打开开发者工具

### 3. 测试 callout 中的图片

在一个 Markdown 文件中创建如下内容：

```markdown
> [!note] 测试
> ![[your-image.png]]
```

或者使用外部图片：

```markdown
> [!info] 
> ![](https://via.placeholder.com/150)
```

### 4. 拖动调整图片大小

1. 切换到编辑模式
2. 将鼠标移到图片右下角
3. 拖动调整大小
4. 查看控制台输出

### 5. 查看控制台输出

你应该看到类似这样的日志：

```
[Callout Debug] 开始搜索图片链接
[Callout Debug] 图片名称: your-image.png
[Callout Debug] 起始行号: 2
[Callout Debug] 起始行文本: > ![[your-image.png]]
[Callout Debug] 第2行原文: > ![[your-image.png]]
[Callout Debug] 第2行处理后: ![[your-image.png]]
[Callout Debug] 第2行匹配到1个结果: [{...}]
[Callout Debug] 总共匹配结果数: 1
```

## 可能的问题场景

### 场景 1：找不到图片链接

**症状**：显示 "在callout中未找到图像链接"

**可能原因**：
1. `imageName` 获取不正确
2. 图片链接格式不标准
3. callout 前缀匹配失败

**解决方法**：
- 检查控制台中的 `imageName` 值
- 确认图片链接格式是否正确
- 查看行文本是否正确处理

### 场景 2：找到多个链接

**症状**：显示 "找到多个相同的图像链接"

**可能原因**：
- callout 中有多个相同的图片

**解决方法**：
- 手动调整其中一个图片的尺寸
- 或使用不同的图片

### 场景 3：更新位置错误

**症状**：更新了错误的文本位置

**可能原因**：
- callout 前缀长度计算错误

**解决方法**：
- 检查 `calloutPrefixLength` 的值
- 确认正则表达式 `/^>\s*/` 是否匹配正确

## 支持的图片链接格式

### Wiki 链接（内部图片）
```markdown
> ![[image.png]]
> ![[image.png|300]]
> ![[image.png|描述|300]]
> ![[folder/image.png|300]]
```

### Markdown 链接（内部图片）
```markdown
> ![](image.png)
> ![300](image.png)
> ![描述|300](image.png)
```

### Markdown 链接（外部图片）
```markdown
> ![](https://example.com/image.png)
> ![描述|300](https://example.com/image.png)
```

## 注意事项

1. **编辑模式**：必须在编辑模式下使用，预览模式不支持
2. **callout 格式**：支持所有 callout 类型（note, info, warning, tip, etc.）
3. **多级 callout**：目前只支持单级 callout（`>` 开头）
4. **嵌套结构**：callout 内的表格暂不支持

## 下一步

如果仍然有问题：

1. **查看控制台日志**：找到具体的匹配失败原因
2. **提供测试用例**：告诉我你使用的具体 Markdown 格式
3. **截图错误信息**：包括控制台的完整输出

现在请：
1. 在 Obsidian 中重新加载插件
2. 启用调试模式
3. 尝试调整 callout 中的图片大小
4. 将控制台输出发给我
