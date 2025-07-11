import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useAccountStore } from "../stores/accountStore";
import type { TUser } from "../../types/account";
// services
import { UserDataInitService } from "@/shared/services/userDataInitService";
import { UserStoreService } from "@/shared/services/userStoreService";
// composables
import { useUserAuth } from "./useUserAuth";

export function useAccountManagement() {
  const router = useRouter();
  const accountStore = useAccountStore();
  const { handleLocalLogout, handleRemoteLogout } = useUserAuth();
  // 状态
  const user = ref<Omit<TUser, "password"> | null>(null);
  const loading = ref(false);
  const exporting = ref(false);
  const importing = ref(false);
  const clearing = ref(false);
  const switching = ref(false);
  const loggingOut = ref(false);
  const currentUser = computed(() => accountStore.currentUser);
  // 表单数据
  const profileForm = reactive({
    username: "",
    email: "",
    phone: "",
    avatar: "",
    bio: "",
  });

  // 弹窗配置
  const snackbar = reactive({
    show: false,
    message: "",
    color: "error",
  });

  // 对话框配置
  const dialog = reactive({
    show: false,
    title: "",
    message: "",
    confirmColor: "primary",
    onConfirm: () => {},
  });

  // 初始化用户数据
  const initUserData = () => {
    user.value = accountStore.currentUser;
    if (user.value) {
      profileForm.username = user.value.username;
      profileForm.email = user.value.email || "";
    }
  };

  // 导出用户数据
  const exportUserData = async () => {
    try {
      exporting.value = true;
      if (!user.value) {
        throw new Error("用户未登录或信息不完整");
      }
      const result = await UserStoreService.export();
      if (result) {
        snackbar.message = "用户数据导出成功";
        snackbar.color = "success";
        snackbar.show = true;
      }
    } catch (error) {
      console.error("导出失败:", error);
    } finally {
      exporting.value = false;
    }
  };

  // 导入用户数据
  const importUserData = async () => {
    try {
      importing.value = true;
      if (!user.value) {
        throw new Error("用户未登录或信息不完整");
      }
      const result = await UserStoreService.import();
      if (result) {

      }
    } catch (error) {
      console.error("导入失败:", error);
    } finally {
      importing.value = false;
    }
  };

  // 确认清除数据
  const confirmClearData = () => {
    dialog.title = "清除所有数据";
    dialog.message = "此操作将清除所有用户数据，且不可恢复。是否继续？";
    dialog.confirmColor = "error";
    dialog.onConfirm = clearUserData;
    dialog.show = true;
  };

  // 清除用户数据
  const clearUserData = async () => {
    try {
      clearing.value = true;
      if (!user.value) {
        throw new Error("用户未登录或信息不完整");
      }
      const result = await UserStoreService.clear();
      if (result) {

      }
    } catch (error) {
      console.error("清除失败:", error);
    } finally {
      clearing.value = false;
      dialog.show = false;
    }
  };

  // 切换账号
  const switchAccount = () => {
    accountStore.logout();
    router.push({ path: "/auth" });

  };

  // 确认退出登录
  const confirmLogout = () => {
    dialog.title = "退出登录";
    dialog.message = "确定要退出登录吗？";
    dialog.confirmColor = "error";
    dialog.onConfirm = handleLogout;
    dialog.show = true;
  };

  // 处理退出登录
  const handleLogout = async () => {
    try {
      // 当前用户未登录或信息不完整
      if (!currentUser.value) {
        snackbar.message = "用户未登录或信息不完整";
        snackbar.color = "error";
        snackbar.show = true;
        return;
      }
      if (localStorage.getItem("accountType") === "remote") {
        handleRemoteLogout()
      } else {
        handleLocalLogout();
      }
    } catch (error) {
      console.error("退出登录失败:", error);
    } finally {
      loggingOut.value = false;
      dialog.show = false;
      UserDataInitService.clearAllStoreData();
    }
  };

  return {
    user,
    loading,
    exporting,
    importing,
    clearing,
    switching,
    loggingOut,
    profileForm,
    dialog,
    snackbar,
    initUserData,
    exportUserData,
    importUserData,
    confirmClearData,
    clearUserData,
    switchAccount,
    confirmLogout,
    handleLogout,
  };
}
