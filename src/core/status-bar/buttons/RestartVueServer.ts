/*
 * @Author: mulingyuer
 * @Date: 2025-07-15 21:31:10
 * @LastEditTime: 2025-07-22 11:10:50
 * @LastEditors: mulingyuer
 * @Description: 重启Vue服务按钮
 * @FilePath: \restart-vscode-server\src\core\status-bar\buttons\RestartVueServer.ts
 * 怎么可能会有bug！！！
 */
import { BaseStatusButton } from "./BaseButton";
import * as vscode from "vscode";
import {
  getExtensionCommand,
  getExtensionConfig,
  getStatusBarPriority,
} from "@/utils/tools";
import { VUE_EXTENSION_ID } from "@/constant";

export class RestartVueServerButton extends BaseStatusButton {
  /** 状态缓存，防止重复触发耗时的判断 */
  private showStatus: boolean | null = null;

  constructor() {
    super({
      alignment: vscode.StatusBarAlignment.Left,
      priority: getStatusBarPriority(),
      command: getExtensionCommand("restartVueServer"),
      icon: "debug-restart",
      text: "重启Vue",
    });
  }

  protected async shouldShow(): Promise<boolean> {
    try {
      const config = getExtensionConfig();
      const enable = config.get("enableRestartVueServer") as boolean;
      if (!enable) {
        return false;
      }

      // 使用缓存，减少重复判断
      if (this.showStatus !== null) {
        return this.showStatus;
      }

      // vue插件是否激活
      const vueExtension = vscode.extensions.getExtension(VUE_EXTENSION_ID);
      if (!vueExtension?.isActive) {
        return false;
      }

      // 判断是否存在vue文件
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return false;
      }
      const vueFiles = await vscode.workspace.findFiles(
        "**/*.vue",
        "**/node_modules/**"
      );
      this.showStatus = vueFiles.length > 0;

      return this.showStatus;
    } catch {
      return false;
    }
  }
}
