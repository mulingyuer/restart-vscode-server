/*
 * @Author: mulingyuer
 * @Date: 2026-04-01 00:00:00
 * @LastEditTime: 2026-04-01 00:00:00
 * @LastEditors: mulingyuer
 * @Description: 重启插件服务状态栏按钮
 * @FilePath: \restart-vscode-server\src\status-bar\restart-extension-service.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import type { StatusBarButton } from "./types";
import { RESTART_EXTENSION_SERVICE_COMMAND } from "@/constant/command";
import { EXTENSION_NAMESPACE } from "@/constant/extension";
import { SHOW_RESTART_EXTENSION_SERVICE_BUTTON_SETTING } from "@/constant/status-bar";
import { getExtensionConfiguration } from "@/utils/tools";
import { debounce } from "@/utils/tools";

export class RestartExtensionServiceButton implements StatusBarButton {
	private button: vscode.StatusBarItem;
	/** 设置监听器，与类同生命周期，不会被中途清空 */
	private settingDisposables: vscode.Disposable[] = [];
	private readonly settingKey = `${EXTENSION_NAMESPACE}.${SHOW_RESTART_EXTENSION_SERVICE_BUTTON_SETTING}`;

	constructor() {
		this.button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);

		// 绑定要执行的命令
		this.button.command = RESTART_EXTENSION_SERVICE_COMMAND;

		// 设置按钮文本和提示
		this.button.text = `${vscode.l10n.t("statusBar.restartExtensionService.label")}`;
		this.button.tooltip = vscode.l10n.t("statusBar.restartExtensionService.tooltip");

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
		if (await this.isVisible()) {
			this.show();
			return;
		}

		this.hide();
	}

	getInstance(): vscode.StatusBarItem {
		return this.button;
	}

	show(): void {
		this.button.show();
	}

	hide(): void {
		this.button.hide();
	}

	dispose(): void {
		this.button.dispose();
		this.settingDisposables.forEach((d) => d.dispose());
		this.settingDisposables = [];
	}

	/** 更新按钮的可见性 */
	private async isVisible(): Promise<boolean> {
		const shouldShow = getExtensionConfiguration<boolean>(
			SHOW_RESTART_EXTENSION_SERVICE_BUTTON_SETTING,
			true
		);
		if (shouldShow) return true;
		return false;
	}

	/** 防抖更新 */
	updateVisibility = debounce(async () => {
		if (await this.isVisible()) {
			this.show();
		} else {
			this.hide();
		}
	}, 150);
}
