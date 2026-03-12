import { Route, Routes } from "react-router-dom";
import Users from "./pages/user";
import TbVsGlReconciliation from "./pages/bots/tb-vs-gl";
import AuditedGlEntry from "./pages/bots/audited-gl-entry";
import TriggerPage from "./components/common/trigger-page";
import Login from "./pages/login";
import ProtectedRoute from "./components/protected-route";
import Botconfig from "./pages/Botconfig";
import JudgementalSamplePreparation from "./pages/bots/revenure-judgemental";
import TriggerPageJudgementalSamplePreparation from "./components/bots/revenue/judgemental/trigger-page-judgemental";
import Trigger3rdPage from "./components/common/trigger-3rd-page";
import SystemSampling from "./pages/Revenue/System-Sampling";
import { Toaster } from "sonner";
import Organisations from "./pages/organisations";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import DashboardConfig from "./pages/dashboard-config";
import WorkFlow from "./pages/workflow";
import ForgotPasswordpage from "./pages/forgot-passsword-page";
import ResetPasswordpage from "./pages/ResetPasswordPage";
import DynamicBotPages from "./pages/dynamic-bot-pages";
import TokenExpiryWatcher from "./components/common/token-expiry-watcher";
import TaskConfig from "./pages/task-config";
import FormMasterPage from "./pages/form-master";
import { TestPage } from "./pages/test";
import TaskCategory from "./pages/task/task-category";
import TaskPreviewEdit from "./pages/task/task-preview-edit";

import EmailConfig from "./pages/email-config";
import ItLevelDashboard from "./pages/Dashboard/org-level-dashboard";
import BotLevelDashboard from "./pages/Dashboard/bot-level-dashboard";
import CategoryLevelDashboard from "./pages/Dashboard/category-level-dashboard";
import BotTrigger from "./pages/bot-trigger/bot-trigger";
import StaticTrigger from "./pages/bot-trigger/static-trigger";
import NewDashboard from "./components/top-dash/NewDashboard";
import DynamicOrgExecutionPages from "./pages/dynamic-org-pages";
import DynamicFormPage from "./pages/dynamic-form-page";
import DynamicCatoPage from "./pages/dynamic-cato-page";
import VendorOnboarding from "./pages/vendorOnboarding/Vendor-onboarding-table";

const App = () => {
  return (
    <>
      <OrganizationProvider>
        <Toaster richColors position="top-center" duration={2000} closeButton />
        <TokenExpiryWatcher />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPasswordpage />} />
          <Route path="/reset-password" element={<ResetPasswordpage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <NewDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor-onboarding"
            element={
              <ProtectedRoute>
                <VendorOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/Organisation"
            element={
              <ProtectedRoute>
                <Organisations />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/test"
            element={
              <ProtectedRoute>
                <TestPage />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/dashboard-config"
            element={
              <ProtectedRoute>
                <DashboardConfig />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/task"
            element={
              <ProtectedRoute>
                <TaskCategory />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/task-category-preview-edit-form"
            element={
              <ProtectedRoute>
                <TaskPreviewEdit />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/manage-work-flow-config"
            element={
              <ProtectedRoute>
                <WorkFlow />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/form-master"
            element={
              <ProtectedRoute>
                <FormMasterPage />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/task-master"
            element={
              <ProtectedRoute>
                <TaskConfig />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/email-config"
            element={
              <ProtectedRoute>
                <EmailConfig />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/tb-vs-gl-reconciliation"
            element={
              <ProtectedRoute>
                <TbVsGlReconciliation />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/judgmental-sample-preparation"
            element={
              <ProtectedRoute>
                <JudgementalSamplePreparation />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/bot"
            element={
              <ProtectedRoute>
                <DynamicBotPages />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/org-execution"
            element={
              <ProtectedRoute>
                <DynamicOrgExecutionPages />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/it-dashboard"
            element={
              <ProtectedRoute>
                <ItLevelDashboard />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/bot-trigger"
            element={
              <ProtectedRoute>
                <BotTrigger />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/static-trigger"
            element={
              <ProtectedRoute>
                <StaticTrigger />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/bot-dashboard"
            element={
              <ProtectedRoute>
                <BotLevelDashboard />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/form-log"
            element={
              <ProtectedRoute>
                <DynamicFormPage />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/dashboard-category"
            element={
              <ProtectedRoute>
                <CategoryLevelDashboard />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/bot-category"
            element={
              <ProtectedRoute>
                <DynamicCatoPage />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/trigger-page-judgmental-sample-preparation"
            element={
              <ProtectedRoute>
                <TriggerPageJudgementalSamplePreparation />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/System Sampling"
            element={
              <ProtectedRoute>
                <SystemSampling />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/audited-gl-entry"
            element={
              <ProtectedRoute>
                <AuditedGlEntry />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/trigger-page"
            element={
              <ProtectedRoute>
                <TriggerPage />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/trigger-3rd-page"
            element={
              <ProtectedRoute>
                <Trigger3rdPage />
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/bot-config"
            element={
              <ProtectedRoute>
                <Botconfig />
              </ProtectedRoute>
            }
          ></Route>
        </Routes>
      </OrganizationProvider>
    </>
  );
};

export default App;
