/**
 * 工作流设置值对象
 */
export class WorkflowSettings {
  constructor(
    public readonly autoSave: boolean,
    public readonly autoSaveInterval: number,
    public readonly confirmBeforeDelete: boolean,
    public readonly defaultGoalView: string,
    public readonly defaultTaskView: string,
    public readonly defaultScheduleView: string,
  ) {
    this.validate();
  }

  private validate(): void {
    // 验证自动保存间隔（毫秒）
    if (this.autoSave && (this.autoSaveInterval < 1000 || this.autoSaveInterval > 300000)) {
      throw new Error(
        `Auto-save interval must be between 1s and 5min: ${this.autoSaveInterval}ms`,
      );
    }
  }

  static createDefault(): WorkflowSettings {
    return new WorkflowSettings(true, 30000, true, 'LIST', 'LIST', 'WEEK');
  }

  static fromJSON(data: any): WorkflowSettings {
    return new WorkflowSettings(
      data.autoSave ?? true,
      data.autoSaveInterval ?? 30000,
      data.confirmBeforeDelete ?? true,
      data.defaultGoalView || 'LIST',
      data.defaultTaskView || 'LIST',
      data.defaultScheduleView || 'WEEK',
    );
  }

  toJSON(): Record<string, any> {
    return {
      autoSave: this.autoSave,
      autoSaveInterval: this.autoSaveInterval,
      confirmBeforeDelete: this.confirmBeforeDelete,
      defaultGoalView: this.defaultGoalView,
      defaultTaskView: this.defaultTaskView,
      defaultScheduleView: this.defaultScheduleView,
    };
  }

  equals(other: WorkflowSettings): boolean {
    return (
      this.autoSave === other.autoSave &&
      this.autoSaveInterval === other.autoSaveInterval &&
      this.confirmBeforeDelete === other.confirmBeforeDelete &&
      this.defaultGoalView === other.defaultGoalView &&
      this.defaultTaskView === other.defaultTaskView &&
      this.defaultScheduleView === other.defaultScheduleView
    );
  }
}
