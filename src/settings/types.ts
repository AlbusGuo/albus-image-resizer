/**
 * 图片调整大小插件的设置接口
 */
export interface ImageResizeSettings {
	/** 调整大小的时间间隔（像素） */
	resizeInterval: number;
	/** 边缘检测区域大小（像素） */
	edgeSize: number;
	/** 是否启用拖拽调整大小 */
	dragResize: boolean;
	/** 是否启用调试模式 */
	debug: boolean;
}

/**
 * 默认设置配置
 */
export const DEFAULT_SETTINGS: ImageResizeSettings = {
	resizeInterval: 0,
	edgeSize: 20,
	dragResize: true,
	debug: false,
};