/*
 * @Author: mulingyuer
 * @Date: 2026-03-29 16:10:23
 * @LastEditTime: 2026-03-29 19:31:41
 * @LastEditors: mulingyuer
 * @Description: 重启 TypeScript 服务状态栏按钮
 * @FilePath: \restart-vscode-server\src\status-bar\restart-ts-server.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import type { StatusBarButton } from "./types";
import { RESTART_TS_SERVER_COMMAND } from "@/constant/command";
import { EXTENSION_NAMESPACE } from "@/constant/extension";
import { SHOW_TS_STATUS_BUTTON_SETTING } from "@/constant/status-bar";
import { getExtensionConfiguration } from "@/utils/tools";
import { debounce } from "@/utils/tools";

const TS_LANGUAGE_IDS = new Set(["typescript", "typescriptreact"]);
const PROJECT_CONFIG_GLOB = "**/{tsconfig*.json,jsconfig*.json}";
const TS_FILE_GLOB = "**/*.{ts,tsx,mts,cts}";
const COMMON_EXCLUDE_GLOB = "**/{node_modules,dist,out,build}/**";

export class RestartTsServerButton implements StatusBarButton {
	private button: vscode.StatusBarItem;
	/** 上下文监听器（文件/编辑器变化），按钮显示后清空，配置关→开时可重建 */
	private contextDisposables: vscode.Disposable[] = [];
	/** 设置监听器，与类同生命周期，不会被中途清空 */
	private settingDisposables: vscode.Disposable[] = [];
	private readonly settingKey = `${EXTENSION_NAMESPACE}.${SHOW_TS_STATUS_BUTTON_SETTING}`;
	private isShown = false;

	constructor() {
		this.button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 20);

		// 绑定要执行的命令
		this.button.command = RESTART_TS_SERVER_COMMAND;

		// 设置按钮文本和提示
		this.button.text = `$(debug-restart) ${vscode.l10n.t("statusBar.restartTs.label")}`;
		this.button.tooltip = vscode.l10n.t("statusBar.restartTs.tooltip");

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
		const watcher = vscode.workspace.createFileSystemWatcher(
			`{${PROJECT_CONFIG_GLOB},${TS_FILE_GLOB}}`,
			false,
			true,
			true
		);
		watcher.onDidCreate(this.updateVisibility, this, this.contextDisposables);
		this.contextDisposables.push(watcher);

		// 注册事件监听
		vscode.window.onDidChangeActiveTextEditor(this.updateVisibility, this, this.contextDisposables);
		vscode.workspace.onDidOpenTextDocument(this.updateVisibility, this, this.contextDisposables);
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
		this.contextDisposables.forEach((d) => d.dispose());
		this.contextDisposables = [];
		this.settingDisposables.forEach((d) => d.dispose());
		this.settingDisposables = [];
	}

	/** 更新按钮的可见性 */
	private async isVisible(): Promise<boolean> {
		// 用户配置可完全关闭按钮显示
		if (!getExtensionConfiguration<boolean>(SHOW_TS_STATUS_BUTTON_SETTING, true)) return false;

		// 缓存处理，如果已经显示了，就不再进行复杂的检查，直接返回 true
		if (this.isShown) return true;

		// 1) 当前活动编辑器是 TS 文件时，优先显示（覆盖只打开单文件场景）
		if (this.isTypeScriptDocument(vscode.window.activeTextEditor?.document)) {
			return true;
		}

		// 2) 已打开文档中存在 TS 文件时显示
		if (vscode.workspace.textDocuments.some((doc) => this.isTypeScriptDocument(doc))) {
			return true;
		}

		// 3) 工作区存在 TS/JS 配置文件时显示（tsconfig/jsconfig）
		const configFiles = await vscode.workspace.findFiles(
			PROJECT_CONFIG_GLOB,
			COMMON_EXCLUDE_GLOB,
			1
		);
		if (configFiles.length > 0) return true;

		// 4) 工作区存在 TS 源码文件时显示（即使没有 tsconfig）
		const files = await vscode.workspace.findFiles(
			`{${PROJECT_CONFIG_GLOB},${TS_FILE_GLOB}}`,
			COMMON_EXCLUDE_GLOB,
			1
		);
		return files.length > 0;
	}

	/** 是否为 TypeScript 文档 */
	private isTypeScriptDocument(document?: vscode.TextDocument): boolean {
		if (!document) return false;

		if (TS_LANGUAGE_IDS.has(document.languageId)) {
			return true;
		}

		const fileName = document.fileName.toLowerCase();
		return (
			fileName.endsWith(".ts") ||
			fileName.endsWith(".tsx") ||
			fileName.endsWith(".mts") ||
			fileName.endsWith(".cts") ||
			fileName.endsWith(".d.ts")
		);
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
			const configAllows = getExtensionConfiguration<boolean>(SHOW_TS_STATUS_BUTTON_SETTING, true);
			if (configAllows) {
				this.registerContextWatchers();
			}
		}
	}, 150);
}
