import { Plugin } from 'obsidian';
import { ImageResizeSettings } from '../settings/types';

/**
 * 图片调整大小插件接口
 * 避免循环导入
 */
export interface IImageResizePlugin extends Plugin {
	settings: ImageResizeSettings;
	saveSettings(): Promise<void>;
}