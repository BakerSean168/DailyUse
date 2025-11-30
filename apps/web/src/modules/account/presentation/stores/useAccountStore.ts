import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Account } from '@dailyuse/domain-client/account';

export const useAccountStore = defineStore(
  'auth',
  () => {
    // State
    const accountUuid = ref<string | null>(null);
    const account = ref<Account | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const savedAccounts = ref<Array<any>>([]);

    // Getters
    const isAuthenticated = computed(() => !!account.value);
    const currentAccount = computed(() => account.value);
    const getAccountUuid = computed(() => (account.value ? account.value.uuid : null));
    const getAllSavedAccounts = computed(() => savedAccounts.value);
    const rememberedAccounts = computed(() =>
      savedAccounts.value.filter((account) => account.remember),
    );

    // Actions
    const setAccountUuid = (uuid: string) => {
      accountUuid.value = uuid;
    };

    const setAccount = (acc: Account) => {
      account.value = acc;
    };

    const logout = () => {
      localStorage.removeItem('token');
      account.value = null;
      loading.value = false;
      error.value = null;
    };

    const setSavedAccounts = (accounts: Array<any>) => {
      savedAccounts.value = accounts;
    };

    const removeSavedAccount = (username: string) => {
      savedAccounts.value = savedAccounts.value.filter((account) => account.username !== username);
    };

    return {
      // State
      accountUuid,
      account,
      loading,
      error,
      savedAccounts,

      // Getters
      isAuthenticated,
      currentAccount,
      getAccountUuid,
      getAllSavedAccounts,
      rememberedAccounts,

      // Actions
      setAccountUuid,
      setAccount,
      logout,
      setSavedAccounts,
      removeSavedAccount,
    };
  },
  {
    persist: {
      storage: localStorage,
      serializer: {
        serialize: (value: any) => {
          // 自定义序列化逻辑
          const serialized = { ...value };
          if (serialized.account) {
            // 将 Account 对象转换为可序列化的格式
            serialized.account = {
              uuid: serialized.account.uuid,
              username: serialized.account.username,
              accountType: serialized.account.accountType,
              email: serialized.account.email?.value,
              phoneNumber: serialized.account.phoneNumber?.value,
              address: serialized.account.address
                ? {
                    street: serialized.account.address.street,
                    city: serialized.account.address.city,
                    state: serialized.account.address.state,
                    country: serialized.account.address.country,
                    postalCode: serialized.account.address.postalCode,
                  }
                : null,
              user: {
                uuid: serialized.account.user.uuid,
                firstName: serialized.account.user.firstName,
                lastName: serialized.account.user.lastName,
                displayName: serialized.account.user.displayName,
              },
              createdAt: serialized.account.createdAt?.toISOString(),
              updatedAt: serialized.account.updatedAt?.toISOString(),
            };
          }
          return JSON.stringify(serialized);
        },
        deserialize: (value: string) => {
          const parsed = JSON.parse(value);
          // 在反序列化时，可以选择不恢复 Account 对象，或者实现恢复逻辑
          // 这里暂时保持原样，Account 对象会在使用时重新创建
          if (parsed.account && parsed.account.createdAt) {
            parsed.account.createdAt = new Date(parsed.account.createdAt);
          }
          if (parsed.account && parsed.account.updatedAt) {
            parsed.account.updatedAt = new Date(parsed.account.updatedAt);
          }
          return parsed;
        },
      },
    },
  },
);
