import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { IImageResizePlugin } from '../types';
import { ImageResizeSettings, DEFAULT_SETTINGS } from './types';

/**
 * 图片调整大小插件的设置选项卡
 */
export class ImageResizeSettingsTab extends PluginSettingTab {
	plugin: IImageResizePlugin;

	constructor(app: App, plugin: IImageResizePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 主标题
		containerEl.createEl('h2', { text: '图片调整大小设置' });

		// 拖拽调整功能开关
		new Setting(containerEl)
			.setName('启用拖拽调整大小')
			.setDesc('是否允许通过拖拽图片边缘来调整图片大小')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.dragResize)
				.onChange(async (value) => {
					this.plugin.settings.dragResize = value;
					await this.plugin.saveSettings();
				}));

		// 调整大小的时间间隔设置
		new Setting(containerEl)
			.setName('调整大小的时间间隔')
			.setDesc('拖动调整最小刻度（默认值为 0 即不对齐刻度）')
			.addText(text => text
				.setPlaceholder('0')
				.setValue(this.plugin.settings.resizeInterval.toString())
				.onChange(async (value) => {
					if (value === '') {
						this.plugin.settings.resizeInterval = 0;
						await this.plugin.saveSettings();
					} else if (/^\d+$/.test(value) && Number(value) >= 0) {
						this.plugin.settings.resizeInterval = parseInt(value);
						await this.plugin.saveSettings();
					} else {
						new Notice('请输入非负整数');
						text.setValue(this.plugin.settings.resizeInterval.toString());
					}
				}));

		// 边缘检测区域大小设置
		new Setting(containerEl)
			.setName('边缘检测区域大小')
			.setDesc('鼠标在图片边缘多少像素内可以触发调整大小（单位：像素）')
			.addSlider(slider => slider
				.setLimits(5, 150, 1)
				.setValue(this.plugin.settings.edgeSize)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.edgeSize = value;
					await this.plugin.saveSettings();
				}));

		// 调试模式开关
		new Setting(containerEl)
			.setName('调试模式')
			.setDesc('启用调试模式以在控制台输出详细日志信息')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debug)
				.onChange(async (value) => {
					this.plugin.settings.debug = value;
					await this.plugin.saveSettings();
				}));

		// 重置按钮
		containerEl.createEl('hr');
		new Setting(containerEl)
			.setName('重置为默认设置')
			.setDesc('将所有设置恢复为默认值')
			.addButton(button => button
				.setButtonText('重置')
				.setWarning()
				.onClick(async () => {
					this.plugin.settings = { ...DEFAULT_SETTINGS };
					await this.plugin.saveSettings();
					this.display();
					new Notice('设置已重置为默认值');
				}));
	}
}