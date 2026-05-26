import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user-info';
export function useLoginManager() {
 const router = useRouter();
 const userStore = useUserStore();
 const loginModalVisible = ref(false);
 const loginCallback = ref(null);
 const loginContext = ref(null);
 const isLoggedIn = computed(() => userStore.isLogin);
 const showLoginModal = (callback = null, context = null) => {
 loginCallback.value = callback;
 loginContext.value = context;
 loginModalVisible.value = true;
 };
 const hideLoginModal = () => {
 loginModalVisible.value = false;
 loginCallback.value = null;
 loginContext.value = null;
 };
 const handleLoginSuccess = () => {
 if (loginCallback.value) {
 setTimeout(() => {
 try {
 loginCallback.value(loginContext.value);
 }
 catch (error) {
 console.error('Login callback error:', error);
 }
 }, 300);
 }
 };
 const requireLogin = (callback = null, context = null) => {
 return new Promise((resolve, reject) => {
 if (isLoggedIn.value) {
 resolve({ loggedIn: true, user: userStore.profile });
 }
 else {
 const handleSuccess = (ctx) => {
 resolve({ loggedIn: true, user: userStore.profile, context: ctx });
 };
 showLoginModal(handleSuccess, context);
 }
 });
 };
 const checkLoginBeforeAction = async (actionType, context = null) => {
 if (!isLoggedIn.value) {
 await requireLogin();
 }
 return true;
 };
 const actionsRequiringLogin = [
 'chat',
 'modify_profile',
 'order',
 'reserve',
 'recharge',
 'withdraw',
 'publish',
 'apply_companion'
 ];
 const isActionRequiringLogin = (actionType) => {
 return actionsRequiringLogin.includes(actionType);
 };
 const handleActionWithLogin = async (actionType, action, context = null) => {
 if (!isActionRequiringLogin(actionType)) {
 return action();
 }
 if (!isLoggedIn.value) {
 const result = await requireLogin();
 if (!result.loggedIn) {
 return null;
 }
 }
 return action();
 };
 const initAutoLogin = () => {
 const savedToken = localStorage.getItem('token');
 if (savedToken && !userStore.token) {
 userStore.setToken(savedToken);
 }
 };
 return {
 loginModalVisible,
 isLoggedIn,
 showLoginModal,
 hideLoginModal,
 handleLoginSuccess,
 requireLogin,
 checkLoginBeforeAction,
 isActionRequiringLogin,
 handleActionWithLogin,
 initAutoLogin
 };
}
export default useLoginManager;