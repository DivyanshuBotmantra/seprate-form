export type AvatarType = "USER" | "ADMIN" | "SUPER ADMIN";

export const isValidAvatarType = (role: string): role is AvatarType => {
  return ["USER", "ADMIN", "SUPER ADMIN"].includes(role);
};
