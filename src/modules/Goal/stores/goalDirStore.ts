import { defineStore } from "pinia";
import type { IGoalDir } from "../types/goal";
import { v4 as uuidv4 } from 'uuid';
import { useUserStore } from '@/modules/Account/composables/useUserStore';

export const SYSTEM_DIR_TYPES = {
    ALL: 'all',
    TRASH: 'trash',
    ARCHIVE: 'archive',
}

const SYSTEM_DIRS: IGoalDir[] = [
    {
        id: SYSTEM_DIR_TYPES.ALL,
        name: '全部目标',
        icon: 'mdi-target',
    },
    {
        id: SYSTEM_DIR_TYPES.TRASH,
        name: '已删除',
        icon: 'mdi-delete',
    },
    {
        id: SYSTEM_DIR_TYPES.ARCHIVE,
        name: '已归档',
        icon: 'mdi-archive',
    }
];

export const useGoalDirStore = defineStore('goalDir', {
    state: () => ({
        systemDirs: SYSTEM_DIRS,
        userDirs: [
            { id: '3', name: '学习', icon: 'mdi-folder' },
        ] as IGoalDir[],
        tempDir: {
            id: 'temp',
            name: '临时目录',
            icon: 'mdi-folder',
        } as IGoalDir,
    }),
    getters: {
        getAllDirs(): IGoalDir[] {
            return [
                this.systemDirs.find(dir => dir.id === SYSTEM_DIR_TYPES.ALL)!,
                ...this.userDirs,
                ...this.systemDirs.filter(dir =>
                    dir.id === SYSTEM_DIR_TYPES.TRASH || dir.id === SYSTEM_DIR_TYPES.ARCHIVE
                )
            ].filter(Boolean);
        },
        getDirById: (state) => (id: string) => {
            return state.userDirs.find(g => g.id === id) || state.systemDirs.find(g => g.id === id);
        },
        getUserDirs(state): IGoalDir[] {
            return state.userDirs;
        },
    },
    actions: {
        async  initialize() {
            const { loadUserData } = useUserStore<Partial<{ userDirs: IGoalDir[] }>>('goalDir');
            const data = await loadUserData();
            if (data && data.userDirs) {
                this.$patch({ userDirs: data.userDirs });
            }
        },
        async saveState() {
            const { saveUserData } = useUserStore<Partial<{ userDirs: IGoalDir[] }>>('goalDir');
            await saveUserData({
                userDirs: this.userDirs,
            });
        },
            
        // 初始化临时目录（用于新建）
        initTempDir() {
            this.tempDir = {
                id: 'temp',
                name: '',
                icon: 'mdi-folder',
            };
            return this.tempDir;
        },
        // 初始化临时目录（用于编辑）
        initTempDirByDirId(dirId: string) {
            const dir = this.getDirById(dirId);
            if (dir) {
                this.tempDir = {
                    id: dir.id,
                    name: dir.name,
                    icon: dir.icon,
                };
            } else {
                throw new Error('目录不存在');
            }
            return this.tempDir;
        },
        // 保存临时目录
        saveTempDir() {
            if (this.tempDir.id === 'temp') {
                // 如果临时目录是新建的，则添加到 userDirs 中
                this.userDirs.push({ ...this.tempDir, id: uuidv4() });
                this.initTempDir();
                return '新建目录成功';
            } else {
                // 如果临时目录是编辑的，则更新 userDirs 中的对应目录
                const index = this.userDirs.findIndex(dir => dir.id === this.tempDir.id);
                if (index !== -1) {
                    this.userDirs.splice(index, 1, this.tempDir);
                    this.initTempDir();
                    return '编辑目录成功';
                } else {
                    this.userDirs.push(this.tempDir);
                    this.initTempDir();
                    return '编辑目录失败';
                }
            }

        },
        // 删除目录
        deleteGoalDir(id: string) {
            const index = this.userDirs.findIndex(dir => dir.id === id);
            if (index !== -1) {
                this.userDirs.splice(index, 1);
            }
        },
    },
    persist: true,
});