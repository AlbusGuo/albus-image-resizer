import { Plugin } from 'obsidian';
import { ImageResizeSettings, DEFAULT_SETTINGS, ImageResizeSettingsTab } from './src/settings';
import { ResizeHandler } from './src/handlers';
import './src/styles/image-resizer.css';

/**
 * 图片调整大小插件主类
 * 允许用户通过拖拽图片边缘来调整图片大小
 */
export default class ImageResizePlugin extends Plugin {
	settings: ImageResizeSettings;
	private resizeHandler: ResizeHandler;

	async onload() {
		console.log('Image Resize Plugin 插件已加载...');

		// 加载设置
		await this.loadSettings();

		// 初始化处理器
		this.resizeHandler = new ResizeHandler(this);

		// 添加设置选项卡
		this.addSettingTab(new ImageResizeSettingsTab(this.app, this));

		// 注册主文档事件
		this.registerDocument(document);

		// 监听新窗口打开事件
		this.app.workspace.on('window-open', (workspaceWindow, window) => {
			this.registerDocument(window.document);
		});

		// 添加调试信息
		if (this.settings.debug) {
			console.log('Image Resize Plugin 调试模式已启用');
			console.log('当前设置:', this.settings);
		}
	}

	onunload() {
		console.log('Image Resize Plugin 插件已卸载...');
	}

	/**
	 * 注册文档事件监听器
	 */
	private registerDocument(document: Document): void {
		if (this.settings.dragResize) {
			this.resizeHandler.registerDocument(document);
		}
	}

	/**
	 * 加载插件设置
	 */
	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * 保存插件设置
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		
		// 如果调试模式开启，输出设置信息
		if (this.settings.debug) {
			console.log('设置已保存:', this.settings);
		}
	}
}
