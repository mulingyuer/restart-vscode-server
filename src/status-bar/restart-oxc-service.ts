/*
 * @Author: mulingyuer
 * @Date: 2026-04-01 00:00:00
 * @LastEditTime: 2026-04-01 20:54:11
 * @LastEditors: mulingyuer
 * @Description: 重启 OXC 服务状态栏按钮
 * @FilePath: \restart-vscode-server\src\status-bar\restart-oxc-service.ts
 * 怎么可能会有bug！！！！
 */
import * as vscode from "vscode";
import type { StatusBarButton } from "./types";
import { RESTART_OXC_SERVICE_COMMAND } from "@/constant/command";
import { EXTENSION_NAMESPACE } from "@/constant/extension";
import { SHOW_OXC_STATUS_BUTTON_SETTING } from "@/constant/status-bar";
import { getExtensionConfiguration } from "@/utils/tools";
import { debounce } from "@/utils/tools";

/** OXC 插件 ID */
const OXC_EXTENSION_ID = "oxc.oxc-vscode";
const OXC_CONFIG_GLOB =
	"**/{.oxlintrc.json,.oxlintrc.jsonc,.oxfmtrc.json,.oxfmtrc.jsonc,oxlint.config.ts,oxlint.config.mts,oxlint.config.cts}";
const COMMON_EXCLUDE_GLOB = "**/{node_modules,dist,out,build}/**";

export class RestartOXCServiceButton implements StatusBarButton {
	private button: vscode.StatusBarItem;
	/** 上下文监听器（文件变化），按钮显示后清空，配置关->开时可重建 */
	private contextDisposables: vscode.Disposable[] = [];
	/** 设置监听器，与类同生命周期，不会被中途清空 */
	private settingDisposables: vscode.Disposable[] = [];
	private readonly settingKey = `${EXTENSION_NAMESPACE}.${SHOW_OXC_STATUS_BUTTON_SETTING}`;
	private isShown = false;

	constructor() {
		this.button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 17);

		// 绑定要执行的命令
		this.button.command = RESTART_OXC_SERVICE_COMMAND;

		// 设置按钮文本和提示
		this.button.text = `$(debug-restart) ${vscode.l10n.t("statusBar.restartOXC.label")}`;
		this.button.tooltip = vscode.l10n.t("statusBar.restartOXC.tooltip");

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
		const watcher = vscode.workspace.createFileSystemWatcher(OXC_CONFIG_GLOB, false, true, true);
		watcher.onDidCreate(this.updateVisibility, this, this.contextDisposables);
		this.contextDisposables.push(watcher);
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

	/** 更新按钮的可见性 */
	private async isVisible(): Promise<boolean> {
		// 用户配置可完全关闭按钮显示
		if (!getExtensionConfiguration<boolean>(SHOW_OXC_STATUS_BUTTON_SETTING, true)) return false;

		// 缓存处理，如果已经显示了，就不再进行复杂的检查，直接返回 true
		if (this.isShown) return true;

		// OXC 插件安装检查
		const hasOXC = !!vscode.extensions.getExtension(OXC_EXTENSION_ID);
		if (!hasOXC) return false;

		// 工作区存在 OXC 配置文件时显示
		const configFiles = await vscode.workspace.findFiles(OXC_CONFIG_GLOB, COMMON_EXCLUDE_GLOB, 1);
		return configFiles.length > 0;
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
			const configAllows = getExtensionConfiguration<boolean>(SHOW_OXC_STATUS_BUTTON_SETTING, true);
			if (configAllows) {
				this.registerContextWatchers();
			} else {
				this.clearContextWatchers();
			}
		}
	}, 150);
}
