import { defineStore } from "pinia";
import { Component, markRaw } from "vue";
import FileExplorer from "@/modules/Editor/components/Explorer.vue";
// import Search from "@/modules/Editor/components/Search.vue";

import SourceControl from "../components/SourceControl.vue";
import GoalPlugin from "../components/GoalPlugin.vue";

interface ActivityBarItem {
    uuid: string;
    label: string;
    title: string;
    icon: string;
    component: Component;
}

export const useActivityBarStore = defineStore("activityBar", {
    state: () => ({
        activityBarItems: [
            { uuid: 'explorer', label: 'Explorer', title: 'Folders', icon: 'mdi-file-multiple', component: markRaw(FileExplorer) },
            // { uuid: 'search', label: 'Search', title: 'Search', icon: 'mdi-file-search', component: markRaw(Search) },
            { uuid: 'git', label: 'Git', title: 'Source Control', icon: 'mdi-source-branch', component: markRaw(SourceControl) },
            { uuid: 'goal', label: 'Goal', title: 'Goal', icon: 'mdi-flag', component: markRaw(GoalPlugin) },
        ] as ActivityBarItem[],
        activeActivityBarItemId: 'explorer',
    }),

    getters: {
        activeActivityBarItem: (state) => {
            const activeActivityBarItem = state.activityBarItems.find(item => item.uuid === state.activeActivityBarItemId);
            return activeActivityBarItem;
        },
        isSidebarVisible: (state) => !!state.activeActivityBarItemId
    },

    actions: {
        setActiveActivityBarItemId(uuid: string) {
            // Toggle if clicking the same item
            this.activeActivityBarItemId = 
                this.activeActivityBarItemId === id ? '' : id;
        },
    },
})