
export interface UserDetails {
  user_id: string;
  password: string;
  name: string;
  role: "ADMIN" | "SUPER ADMIN" | "USER";
  user_status: "Active" | "Inactive";
  org_name: string[];
}

export const getUserDetails = (): UserDetails | null => {
  try {
    const userDetails = sessionStorage.getItem("userDetail");
    return userDetails ? JSON.parse(userDetails) : null;
  } catch (error) {
    console.error("Error parsing user details:", error);
    return null;
  }
};
export const isAuthenticated = (): boolean => {
  const token = sessionStorage.getItem("token");
  const userDetails = getUserDetails();
  return !!(token && userDetails);
};


export const isAdmin = (): boolean => {
  const userDetails = getUserDetails();
  return userDetails?.role === 'ADMIN' || userDetails?.role === 'SUPER ADMIN';
};

export const isAdminonly = (): boolean => {
  const userDetails = getUserDetails();
  return userDetails?.role === 'ADMIN';
};

export const isSuperAdmin = (): boolean => {
  const userDetails = getUserDetails();
  return userDetails?.role === 'SUPER ADMIN';
};

export const hasRole = (roles: string[]): boolean => {
  const userDetails = getUserDetails();
  if (!userDetails) return false;
  return roles.includes(userDetails.role);
};