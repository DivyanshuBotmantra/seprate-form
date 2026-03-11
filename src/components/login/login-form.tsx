import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { getUserDetail, validateUser } from "@/services/auth/auth";
import OrbitLoader from "../loader";
import { getSidebarConfig } from "@/services/siebar";
import { useOrgStore } from "@/lib/store/org-store";

const LoginForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNoPermissionDialog, setShowNoPermissionDialog] = useState(false);

  const [formData, setFormData] = useState({
    user_id: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: loginData, error: loginError } = await validateUser({
      user_id: formData.user_id,
      password: formData.password,
      role: "",
      org_name: [""],
      status: "",
    });

    if (loginError) {
      setIsLoading(false);
      toast.error(loginError, { duration: 2000 });
      return;
    }

    const { data: userData, error: userError } = await getUserDetail({
      user_id: formData.user_id,
      role: "",
      org_name: "",
      status: "",
    });

    if (userError) {
      setIsLoading(false);
      toast.error(userError, { duration: 2000 });
      return;
    }

    const userDetail = userData.response_body[0];
    sessionStorage.setItem("userDetail", JSON.stringify(userDetail));
    const userRole = userDetail.role;

    // if (userRole === "USER") {
    //   setShowNoPermissionDialog(true);
    //   setIsLoading(false);
    //   return;
    // }
    // Save SelectedOrg in the same format that org-switcher expects
    const selectedOrg = {
      id: userDetail.role === "ADMIN" ? userDetail.org_name[0] : "Botmantra",
      name: userDetail.role === "ADMIN" ? userDetail.org_name[0] : "Botmantra",
      org_name:
        userDetail.role === "ADMIN" ? userDetail.org_name[0] : "Botmantra",
    };

    // Update both sessionStorage and the zustand store via the store action
    await useOrgStore.getState().setSelectedOrg(selectedOrg);
    // Fetch agents data after successful authentication
    const { data: sidebarConfig, error: sidebarError } = await getSidebarConfig(
      {
        org_name: selectedOrg.org_name,
      }
    );
    if (sidebarError) {
      setIsLoading(false);
      toast.error(sidebarError, { duration: 2000 });
      return;
    }
    sessionStorage.setItem(
      "sidebarItems",
      JSON.stringify(sidebarConfig.response_body)
    );
    console.log(sidebarConfig, "sidebarConfig");
    // const { data: agentsData, error: agentsError } = await getAgents({
    //   agent_type: "Agent",
    //   org_name:
    //     userDetail.role === "ADMIN" ? userDetail.org_name[0] : "Botmantra",
    //   agent_name: "",
    //   api_name: "",
    //   agent_status: "Active",
    //   agent_category: "",
    //   agent_flow_flag: null,
    // });

    // if (agentsError) {
    //   console.warn("Failed to fetch agents:", agentsError);
    //   // Continue with login even if agents fetch fails
    // } else if (agentsData) {
    //   sessionStorage.setItem(
    //     "agents",
    //     JSON.stringify(agentsData.response_body)
    //   );
    // }

    if (userRole === "ADMIN") {
      navigate("/users");
    } else {
      navigate("/");
    }

    setIsLoading(false);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-6 rounded-lg sm:min-w-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">Login</h1>
          <p className="text-sm text-muted-foreground">
            Please provide your key to login
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 ">
            <label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </label>
            <Input
              type="email"
              id="email"
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              className="bg-muted"
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <label htmlFor="password" className="text-sm text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="pr-10 bg-muted [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                style={
                  {
                    WebkitTextSecurity: showPassword ? "none" : "disc",
                  } as React.CSSProperties
                }
                autoComplete="current-password"
                data-testid="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOffIcon size={16} className="hover:cursor-pointer" />
                ) : (
                  <EyeIcon size={16} className="hover:cursor-pointer" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="px-0 text-sm text-primary font-medium"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </Button>
          </div>
          <Button
            type="submit"
            className="hover:cursor-pointer mt-2 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <OrbitLoader size={5} outerColor="border-white" />
            ) : (
              "Login"
            )}
          </Button>
        </div>
      </form>

      <Dialog
        open={showNoPermissionDialog}
        onOpenChange={setShowNoPermissionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permission Denied</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You don’t have permission to login with this account.
          </p>
          <DialogFooter>
            <Button onClick={() => setShowNoPermissionDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginForm;
