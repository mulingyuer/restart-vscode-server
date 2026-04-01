/*
 * @Author: mulingyuer
 * @Date: 2026-03-31 00:00:00
 * @LastEditTime: 2026-04-01 20:55:45
 * @LastEditors: mulingyuer
 * @Description: 重启 Vue 服务状态栏按钮
 * @FilePath: \restart-vscode-server\src\status-bar\restart-vue-service.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import type { StatusBarButton } from "./types";
import { RESTART_VUE_SERVICE_COMMAND } from "@/constant/command";
import { EXTENSION_NAMESPACE } from "@/constant/extension";
import { SHOW_VUE_STATUS_BUTTON_SETTING } from "@/constant/status-bar";
import { getExtensionConfiguration } from "@/utils/tools";
import { debounce } from "@/utils/tools";

/** Volar 插件 ID（新版，官方推荐） */
const VOLAR_EXTENSION_ID = "vue.volar";
/** Vetur 插件 ID（旧版） */
const VETUR_EXTENSION_ID = "octref.vetur";

const VUE_FILE_GLOB = "**/*.vue";
const COMMON_EXCLUDE_GLOB = "**/{node_modules,dist,out,build}/**";

export class RestartVueServiceButton implements StatusBarButton {
	private button: vscode.StatusBarItem;
	/** 上下文监听器（文件/编辑器变化），按钮显示后清空，配置关→开时可重建 */
	private contextDisposables: vscode.Disposable[] = [];
	/** 设置监听器，与类同生命周期，不会被中途清空 */
	private settingDisposables: vscode.Disposable[] = [];
	private readonly settingKey = `${EXTENSION_NAMESPACE}.${SHOW_VUE_STATUS_BUTTON_SETTING}`;
	private isShown = false;

	constructor() {
		this.button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 18);

		// 绑定要执行的命令
		this.button.command = RESTART_VUE_SERVICE_COMMAND;

		// 设置按钮文本和提示
		this.button.text = `$(debug-restart) ${vscode.l10n.t("statusBar.restartVue.label")}`;
		this.button.tooltip = vscode.l10n.t("statusBar.restartVue.tooltip");

		// 初始化
		this.init();

		// 监听插件配置变化（后续用于控制是否显示）
		vscode.workspace.onDidChangeConfiguration(
			(event) => {
				if (event.affectsConfiguration(this.settingKey)) {
					this.updateVisibility();
				}
			},
			this,
			this.settingDisposables
		);
	}

	/** 初始化 */
	private async init() {
		const isShow = await this.isVisible();
		if (isShow) {
			this.show();
			return;
		}

		this.registerContextWatchers();
	}

	getInstance(): vscode.StatusBarItem {
		return this.button;
	}

	/** 注册上下文监听器（幂等：仅在未注册时才注册） */
	private registerContextWatchers(): void {
		if (this.contextDisposables.length > 0) return;

		// 注册文件监听（仅监听创建）
		const watcher = vscode.workspace.createFileSystemWatcher(VUE_FILE_GLOB, false, true, true);
		watcher.onDidCreate(this.updateVisibility, this, this.contextDisposables);
		this.contextDisposables.push(watcher);

		// 注册事件监听
		vscode.window.onDidChangeActiveTextEditor(this.updateVisibility, this, this.contextDisposables);
		vscode.workspace.onDidOpenTextDocument(this.updateVisibility, this, this.contextDisposables);
	}

	/** 清理上下文监听器 */
	private clearContextWatchers(): void {
		this.contextDisposables.forEach((d) => d.dispose());
		this.contextDisposables = [];
	}

	show(): void {
		this.button.show();
		this.isShown = true;
	}

	hide(): void {
		this.button.hide();
		this.isShown = false;
	}

	dispose(): void {
		this.button.dispose();
		this.clearContextWatchers();
		this.settingDisposables.forEach((d) => d.dispose());
		this.settingDisposables = [];
	}

	/** 是否为 Vue 文档 */
	private isVueDocument(document?: vscode.TextDocument): boolean {
		if (!document) return false;
		return document.languageId === "vue" || document.fileName.toLowerCase().endsWith(".vue");
	}

	/** 更新按钮的可见性 */
	private async isVisible(): Promise<boolean> {
		// 用户配置可完全关闭按钮显示
		if (!getExtensionConfiguration<boolean>(SHOW_VUE_STATUS_BUTTON_SETTING, true)) return false;

		// 缓存处理，如果已经显示了，就不再进行复杂的检查，直接返回 true
		if (this.isShown) return true;

		// Vue 插件安装检查
		const hasVolar = !!vscode.extensions.getExtension(VOLAR_EXTENSION_ID);
		const hasVetur = !!vscode.extensions.getExtension(VETUR_EXTENSION_ID);
		if (!hasVolar && !hasVetur) return false;

		// 1) 当前活动编辑器是 .vue 文件时显示
		if (this.isVueDocument(vscode.window.activeTextEditor?.document)) {
			return true;
		}

		// 2) 已打开文档中存在 .vue 文件时显示
		if (vscode.workspace.textDocuments.some((doc) => this.isVueDocument(doc))) {
			return true;
		}

		// 3) 工作区中存在 .vue 文件时显示
		const files = await vscode.workspace.findFiles(VUE_FILE_GLOB, COMMON_EXCLUDE_GLOB, 1);
		return files.length > 0;
	}

	/** 防抖更新 */
	updateVisibility = debounce(async () => {
		if (await this.isVisible()) {
			this.show();
			this.contextDisposables.forEach((d) => d.dispose());
			this.contextDisposables = [];
		} else {
			this.hide();
			// 配置允许显示但上下文条件暂不满足时，确保上下文监听器已注册（重建场景）
			const configAllows = getExtensionConfiguration<boolean>(SHOW_VUE_STATUS_BUTTON_SETTING, true);
			if (configAllows) {
				this.registerContextWatchers();
			} else {
				this.clearContextWatchers();
			}
		}
	}, 150);
}
