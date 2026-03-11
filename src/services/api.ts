  import axios from "axios";

const commonHeaders = {
  "Content-Type": "application/json",
  request_type: "application/json",
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create authenticated Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  // timeout: 60000,
  headers: commonHeaders,
});

const coreAdvancedDevApi = axios.create({
  baseURL: import.meta.env.VITE_API_CORE_DEV_BASE_URL,
  // timeout: 120000,
  headers: commonHeaders,
});

const formApi = axios.create({
  baseURL:
    "https://botiq-admin-uat-agdke3ascycjg3fr.centralindia-01.azurewebsites.net/api",
  // timeout: 10000,
  headers: commonHeaders,
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers["authorize_token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unauthenticated API instance (for login etc.)
const loginApi = axios.create({
  baseURL: BASE_URL,
  // timeout: 30000,
  headers: commonHeaders,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


// ADMIN API 
const endpoints = {
  validateUser: import.meta.env.VITE_VALIDATE_USER_ENDPOINT,
  getUserDetail: import.meta.env.VITE_GET_USER_DETAIL_ENDPOINT,
  getBotExecutionLog: import.meta.env.VITE_GET_BOT_EXECUTION_LOG_ENDPOINT,
  createUUIDFolder: import.meta.env.VITE_CREATE_UUID_ENDPOINT,
  uploadFile: import.meta.env.VITE_UPLOAD_FILE_ENDPOINT,
  createExecutionLog: import.meta.env.VITE_CREATE_EXECUTION_LOG_ENDPOINT,
  getBotConfig: import.meta.env.VITE_GET_BOT_CONFIG_API_URL,
  createBotConfig: import.meta.env.VITE_CREATE_BOT_CONFIG_API_URL,
  updateBotConfig: import.meta.env.VITE_UPDATE_BOT_CONFIG_API_URL,
  getLovMaser: import.meta.env.VITE_GET_LOV_MASTER_API_URL,
  getOrganizations: import.meta.env.VITE_GET_ORG_DETAILS_ENDPOINT,
  createOrganisation: import.meta.env.VITE_CREATE_ORG_ENDPOINT,
  updateOrganisation: import.meta.env.VITE_UPDATE_ORG_ENDPOINT,
  getUsers: import.meta.env.VITE_GET_USER_DETAIL_ENDPOINT,
  updateUser: import.meta.env.VITE_UPDATE_USER_API_URL,
  createUser: import.meta.env.VITE_CREATE_USER_ENDPOINT,
  changePassword: import.meta.env.VITE_CHANGE_PASSWORD_API_URL,
  resetPassword: import.meta.env.VITE_RESET_PASSWORD_API_URL,
  forgetPassword: import.meta.env.VITE_FORGET_PASSWORD_API_URL,
  getOrgCred: import.meta.env.VITE_GET_ORG_CRED_API_URL,
  createOrgCred: import.meta.env.VITE_CREATE_ORG_CRED_API_URL,
  updateOrgCred: import.meta.env.VITE_UPDATE_ORG_CRED_API_URL,
  getBotUser: import.meta.env.VITE_GET_BOT_USER_API_URL,
  createBotUser: import.meta.env.VITE_CREATE_BOT_USER_API_URL,
  deleteBotUser: import.meta.env.VITE_DELETE_BOT_USER_API_URL,
  getdashboardconfig: import.meta.env.VITE_GET_DASHBOARD_CONFIG_API_URL,
  createdashboardconfig: import.meta.env.VITE_CREATE_DASHBOARD_CONFIG_API_URL,
  updatedashboardconfig: import.meta.env.VITE_UPDATE_DASHBOARD_CONFIG_API_URL,
  getWorkFlow: import.meta.env.VITE_GET_WORK_FLOW_API_URL,
  createWorkFlow: import.meta.env.VITE_CREATE_WORK_FLOW_API_URL,
  updateWorkFlow: import.meta.env.VITE_UPDATE_WORK_FLOW_API_URL,
  getWorkFlowForm: import.meta.env.VITE_GET_WORK_FLOW_FORM_API_URL,
  createWorkFlowform: import.meta.env.VITE_CREATE_WORK_FLOW_FORM_API_URL,
  updateWorkFlowform: import.meta.env.VITE_UPDATE_WORK_FLOW_FORM_API_URL,
  getwfformuser: import.meta.env.VITE_GET_WF_FORM_USER_API_URL,
  createwfformuser: import.meta.env.VITE_CREATE_WF_FORM_USER_API_URL,
  deletewfformuser: import.meta.env.VITE_DELETE_WF_FORM_USER_API_URL,
  getSidebarConfig: import.meta.env.VITE_GET_SIDEBAR_OPTIONS,
  regenerateToken: import.meta.env.VITE_RENEW_TOKEN_URL,
  getDashboardBotUser: import.meta.env.VITE_GET_DASHBOARD_USER_API_URL,
  createDashboardBotUser: import.meta.env.VITE_CREATE_DASHBOARD_USER_API_URL,
  deleteDashboardBotUser: import.meta.env.VITE_DELETE_DASHBOARD_USER_API_URL,
  getTaskmaster: import.meta.env.VITE_GET_TASK_MASTER_API_URL,
  createTaskmaster: import.meta.env.VITE_CREATE_TASK_MASTER_API_URL,
  updateTaskmaster: import.meta.env.VITE_UPDATE_TASK_MASTER_API_URL,
  getTaskMasterUser: import.meta.env.VITE_GET_TASK_MASTER_USER_API_URL,
  createTaskMasterUser: import.meta.env.VITE_CREATE_TASK_MASTER_USER_API_URL,
  deletetaskMasterUser: import.meta.env.VITE_DELETE_TASK_MASTER_USER_API_URL,
  getformaster: import.meta.env.VITE_GET_FORM_MASTER_API_URL,
  createFormMaster: import.meta.env.VITE_CREATE_FORM_MASTER_API_URL,
  updateFormMaster: import.meta.env.VITE_UPDATE_FORM_MASTER_API_URL,
  getFormMasterUser: import.meta.env.VITE_GET_FORM_MASTER_USER_API_URL,
  createFormMasterUser: import.meta.env.VITE_CREATE_FORM_MASTER_USER_API_URL,
  deleteFormMasterUser: import.meta.env.VITE_DELETE_FORM_MASTER_USER_API_URL,
  getemailConfig: import.meta.env.VITE_GET_EMAIL_CONFIG_API_URL,
  createEmailConfig: import.meta.env.VITE_CREATE_EMAIL_CONFIG_API_URL,
  updateEmailConfig: import.meta.env.VITE_UPDATE_EMAIL_CONFIG_API_URL,
  getTaskExecutionLog: import.meta.env.VITE_GET_TASK_EXECUTION_LOG,
  downloadFile: import.meta.env.VITE_DOWNLOAD_FILE_API,
  updateTask: import.meta.env.VITE_UPDATE_TASK_API,
  sendMailApi: import.meta.env.VITE_SEND_EMAIL_API_URL,
  createBotExecution: import.meta.env.VITE_CREATE_BOT_EXCU_API_URL,
  getdashboardData: import.meta.env.VITE_GET_DASHBOARD_DATA_API_URL,
  getOrgDashboardData: import.meta.env.VITE_GET_ORG_DASHBOARD_DATA_API_URL,
  getOrgExecutionLog: import.meta.env.VITE_GET_ORG_EXECUTION_LOG_API_URL,
  directFileUpload: import.meta.env.VITE_DIRECT_FILE_UPLOAD_API_URL,
  createFormExecutionLog: import.meta.env.VITE_CREATE_FORM_EXECUTION_LOG_API_URL,
  getFormExecutionLog: import.meta.env.VITE_GET_FORM_EXECUTION_LOG_API_URL, 
  deleteFile: import.meta.env.VITE_DELETE_FILE_API_URL,
  getBotCategoryExecutionLog: import.meta.env.VITE_GET_BOT_CATEGORY_EXECUTION_LOG_API_URL,
  downloadTemplate : import.meta.env.VITE_DOWNLOAD_TEMPLATE_API_URL,
  
};

export { api, loginApi, endpoints, coreAdvancedDevApi, formApi };
