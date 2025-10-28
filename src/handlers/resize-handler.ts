import { MarkdownView } from 'obsidian';
import { IImageResizePlugin } from '../types';
import { LinkUpdateService } from '../utils';

/**
 * 图片调整大小处理器
 * 负责处理鼠标事件和图片调整逻辑
 */
export class ResizeHandler {
	private plugin: IImageResizePlugin;
	private linkUpdateService: LinkUpdateService;
	private isDragging = false;
	private dragTarget: HTMLImageElement | null = null;
	private startX = 0;
	private startY = 0;
	private startWidth = 0;
	private startHeight = 0;
	private lastUpdateX = 0;
	private lastUpdate = 1;
	private updatedWidth = 0;
	private lastMoveTime = 0;

	constructor(plugin: IImageResizePlugin) {
		this.plugin = plugin;
		this.linkUpdateService = new LinkUpdateService(plugin);
	}

	/**
	 * 注册文档事件监听器
	 */
	registerDocument(document: Document): void {
		// 鼠标按下事件
		const mouseDownHandler = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (target.tagName === 'IMG') {
				this.handleMouseDown(event);
			}
		};
		document.addEventListener('mousedown', mouseDownHandler);
		this.plugin.register(() => document.removeEventListener('mousedown', mouseDownHandler));

		// 鼠标移动事件
		const mouseMoveHandler = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (target.tagName === 'IMG') {
				this.handleMouseMove(event);
			}
		};
		document.addEventListener('mousemove', mouseMoveHandler);
		this.plugin.register(() => document.removeEventListener('mousemove', mouseMoveHandler));

		// 鼠标离开事件
		const mouseLeaveHandler = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (target.tagName === 'IMG') {
				this.handleMouseLeave(event);
			}
		};
		document.addEventListener('mouseleave', mouseLeaveHandler);
		this.plugin.register(() => document.removeEventListener('mouseleave', mouseLeaveHandler));
	}

	/**
	 * 处理鼠标按下事件
	 */
	private handleMouseDown(event: MouseEvent): void {
		const currentMd = this.plugin.app.workspace.getActiveFile();
		if (!currentMd || currentMd.name.endsWith('.canvas')) {
			return;
		}

		const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView || activeView.getMode() === 'preview') {
			return;
		}

		if (event.button === 0) {
			event.preventDefault();
		}

		const img = event.target as HTMLImageElement;
		const editor = activeView.editor;
		if (!editor) {
			return;
		}

		const rect = img.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const edgeSize = this.plugin.settings.edgeSize;

		// 检查是否在右下角可拖拽区域
		const isInResizeArea = x > rect.width - edgeSize && y > rect.height - edgeSize;

		if (isInResizeArea) {
			this.startDrag(event, img, editor);
		}
	}

	/**
	 * 处理鼠标移动事件
	 */
	private handleMouseMove(event: MouseEvent): void {
		const currentMd = this.plugin.app.workspace.getActiveFile();
		if (!currentMd || currentMd.name.endsWith('.canvas')) {
			return;
		}

		const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView || activeView.getMode() === 'preview') {
			return;
		}

		const img = event.target as HTMLImageElement;
		const rect = img.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const edgeSize = this.plugin.settings.edgeSize;

		// 检查是否在右下角可拖拽区域
		const isInResizeArea = x > rect.width - edgeSize && y > rect.height - edgeSize;

		if (isInResizeArea) {
			img.style.cursor = 'nwse-resize';
		} else {
			img.style.cursor = '';
		}
	}

	/**
	 * 处理鼠标离开事件
	 */
	private handleMouseLeave(event: MouseEvent): void {
		const img = event.target as HTMLImageElement;
		img.style.cursor = '';
	}

	/**
	 * 开始拖拽调整大小
	 */
	private startDrag(event: MouseEvent, img: HTMLImageElement, editor: any): void {
		this.isDragging = true;
		this.dragTarget = img;
		this.startX = event.clientX;
		this.startY = event.clientY;
		this.startWidth = img.clientWidth;
		this.startHeight = img.clientHeight;
		this.lastUpdateX = this.startX;
		this.lastUpdate = 1;
		this.updatedWidth = this.startWidth;
		this.lastMoveTime = Date.now();

		const editorView = editor.cm;
		const target_pos = editorView.posAtDOM(img);

		const preventEvent = (e: Event) => {
			e.preventDefault();
			e.stopPropagation();
		};

		const onMouseMove = (e: MouseEvent) => {
			img.addEventListener('click', preventEvent);
			this.performDrag(e, img, target_pos);
		};

		const allowOtherEvent = () => {
			img.removeEventListener('click', preventEvent);
		};

		const onMouseUp = (e: MouseEvent) => {
			setTimeout(allowOtherEvent, 100);
			e.preventDefault();
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			this.endDrag(img, target_pos);
		};

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	}

	/**
	 * 执行拖拽调整
	 */
	private performDrag(event: MouseEvent, img: HTMLImageElement, target_pos: number): void {
		const currentX = event.clientX;
		this.lastUpdate = currentX - this.lastUpdateX === 0 ? this.lastUpdate : currentX - this.lastUpdateX;
		
		let newWidth = this.startWidth + (currentX - this.startX);
		const aspectRatio = this.startWidth / this.startHeight;
		
		newWidth = Math.max(newWidth, 50);
		let newHeight = newWidth / aspectRatio;
		
		newWidth = Math.round(newWidth);
		newHeight = Math.round(newHeight);
		this.updatedWidth = newWidth;
		
		img.style.width = `${newWidth}px`;
		
		const now = Date.now();
		if (now - this.lastMoveTime < 100) {
			return;
		}
		
		this.lastMoveTime = now;
		this.linkUpdateService.updateImageLinkWithNewSize(img, target_pos, newWidth, newHeight);
		this.lastUpdateX = event.clientX;
	}

	/**
	 * 结束拖拽调整
	 */
	private endDrag(img: HTMLImageElement, target_pos: number): void {
		// 移除所有内联样式，确保markdown尺寸设置生效
		img.style.removeProperty('width');
		img.style.removeProperty('height');
		img.style.removeProperty('max-width');
		img.style.removeProperty('max-height');

		if (this.plugin.settings.resizeInterval > 1) {
			const resize_interval = this.plugin.settings.resizeInterval;
			const width_offset = this.lastUpdate > 0 ? resize_interval : 0;
			
			if (this.updatedWidth % resize_interval !== 0) {
				this.updatedWidth = Math.floor(this.updatedWidth / resize_interval) * resize_interval + width_offset;
			}
			
			this.linkUpdateService.updateImageLinkWithNewSize(img, target_pos, this.updatedWidth, 0);
		}

		this.isDragging = false;
		this.dragTarget = null;
	}

	
}