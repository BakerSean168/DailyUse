import { PrismaClient } from '@prisma/client';
import type { IEditorWorkspaceRepository } from '@dailyuse/domain-server';
import { EditorWorkspace } from '@dailyuse/domain-server';

export class PrismaEditorWorkspaceRepository implements IEditorWorkspaceRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(w: any): EditorWorkspace {
    return EditorWorkspace.fromPersistenceDTO({
      uuid: w.uuid,
      accountUuid: w.accountUuid,
      name: w.name,
      description: w.description,
      project_path: w.projectPath,
      project_type: w.projectType as any,
      layout: JSON.stringify(w.layout),
      settings: JSON.stringify(w.settings),
      is_active: w.isActive,
      createdAt: w.createdAt.getTime(),
      updatedAt: w.updatedAt.getTime(),
      lastAccessedAt: w.accessedAt?.getTime(),
    });
  }

  async save(workspace: EditorWorkspace): Promise<void> {
    const wp = workspace.toPersistenceDTO();
    const toDate = (t: number | null | undefined) => (t ? new Date(t) : null);

    await this.prisma.editorWorkspace.upsert({
      where: { uuid: wp.uuid },
      create: {
        uuid: wp.uuid,
        accountUuid: wp.accountUuid,
        name: wp.name,
        description: wp.description,
        projectPath: wp.project_path,
        projectType: wp.project_type,
        layout: wp.layout as any,
        setting: wp.settings as any,
        isActive: wp.is_active,
        createdAt: toDate(wp.createdAt) as Date,
        updatedAt: toDate(wp.updatedAt) as Date,
        accessedAt: toDate(wp.lastAccessedAt) as Date,
      },
      update: {
        name: wp.name,
        layout: wp.layout as any,
        setting: wp.settings as any,
        isActive: wp.is_active,
        updatedAt: toDate(wp.updatedAt) as Date,
        accessedAt: toDate(wp.lastAccessedAt) as Date,
      },
    });
  }

  async findByUuid(
    uuid: string,
    options?: { includeSessions?: boolean },
  ): Promise<EditorWorkspace | null> {
    const w = await this.prisma.editorWorkspace.findUnique({ where: { uuid } });
    return w ? this.mapToEntity(w) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    options?: { includeSessions?: boolean },
  ): Promise<EditorWorkspace[]> {
    const list = await this.prisma.editorWorkspace.findMany({ where: { accountUuid } });
    return list.map((w) => this.mapToEntity(w));
  }

  async findByAccountUuidAndName(
    accountUuid: string,
    name: string,
  ): Promise<EditorWorkspace | null> {
    const w = await this.prisma.editorWorkspace.findFirst({ where: { accountUuid, name } });
    return w ? this.mapToEntity(w) : null;
  }

  async findActiveByAccountUuid(accountUuid: string): Promise<EditorWorkspace | null> {
    const w = await this.prisma.editorWorkspace.findFirst({
      where: { accountUuid, isActive: true },
      orderBy: { accessedAt: 'desc' },
    });
    return w ? this.mapToEntity(w) : null;
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.editorWorkspace.delete({ where: { uuid } });
  }

  async saveBatch(workspaces: EditorWorkspace[]): Promise<void> {
    for (const w of workspaces) await this.save(w);
  }

  async existsByName(accountUuid: string, name: string): Promise<boolean> {
    return (await this.prisma.editorWorkspace.count({ where: { accountUuid, name } })) > 0;
  }

  async countByAccountUuid(accountUuid: string): Promise<number> {
    return await this.prisma.editorWorkspace.count({ where: { accountUuid } });
  }

  async isPathUsed(projectPath: string): Promise<boolean> {
    return (await this.prisma.editorWorkspace.count({ where: { projectPath } })) > 0;
  }
}
