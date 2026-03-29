/*
 * @Author: mulingyuer
 * @Date: 2026-03-29 16:01:26
 * @LastEditTime: 2026-03-29 16:32:00
 * @LastEditors: mulingyuer
 * @Description: 状态栏相关类型定义
 * @FilePath: \restart-vscode-server\src\status-bar\types.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";

/** 按钮类 */
export interface StatusBarButton extends vscode.Disposable {
	/** 获取vscode状态按钮实例 */
	getInstance(): vscode.StatusBarItem;
	/** 显示状态按钮 */
	show(): void;
	/** 隐藏状态按钮 */
	hide(): void;
	/** 更新按钮显示 */
	updateVisibility(): void | Promise<void>;
}
