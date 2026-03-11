// import { useState, useEffect } from "react";
// import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { X, Save } from "lucide-react";
// import type { User } from "@/constants/data";

// interface EditUserSidebarProps {
//   user: User | null;
//   open: boolean;
//   onSave: (user: User) => void;
//   onClose: () => void;
// }

// export function EditUserSidebar({ user, open, onSave, onClose }: EditUserSidebarProps) {
//   const { toast } = useToast();
//   const [formData, setFormData] = useState<Partial<User>>({});

//   useEffect(() => {
//     if (user) {
//       setFormData(user);
//     }
//   }, [user]);

// //   const handleSave = () => {
// //     if (!user || !formData.name || !formData.email) {
// //       toast({
// //         title: "Error",
// //         description: "Please fill in all required fields",
// //         variant: "destructive",
// //       });
// //       return;
// //     }

// //     onSave({
// //       ...user,
// //       ...formData,
// //     } as User);

// //     toast({
// //       title: "Success",
// //       description: "User updated successfully",
// //     });
// //   };

//   const handleInputChange = (field: keyof User, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   if (!user) return null;

//   return (
//     <Sheet open={open} onOpenChange={onClose}>
//       <SheetContent className="w-[400px] sm:w-[540px] bg-card/95 backdrop-blur-sm border-border/50">
//         <SheetHeader className="border-b border-border/50 pb-4">
//           <div className="flex items-center justify-between">
//             <SheetTitle className="text-xl font-semibold">Edit User</SheetTitle>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={onClose}
//               className="h-8 w-8 p-0"
//             >
//               <X className="h-4 w-4" />
//             </Button>
//           </div>
//         </SheetHeader>

//         <div className="py-6 space-y-6">
//           {/* User Avatar */}
//           <div className="flex items-center space-x-4">
//             <Avatar className="h-16 w-16">
//               <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
//                 {formData.name?.split(" ").map(n => n[0]).join("") || "?"}
//               </AvatarFallback>
//             </Avatar>
//             <div>
//               <h3 className="font-medium">{formData.name}</h3>
//               <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
//             </div>
//           </div>

//           {/* Form Fields */}
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="name">Full Name *</Label>
//               <Input
//                 id="name"
//                 value={formData.name || ""}
//                 onChange={(e) => handleInputChange("name", e.target.value)}
//                 placeholder="Enter full name"
//                 className="bg-background/50"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="email">Email Address *</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={formData.email || ""}
//                 onChange={(e) => handleInputChange("email", e.target.value)}
//                 placeholder="Enter email address"
//                 className="bg-background/50"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="role">Role</Label>
//               <Select
//                 value={formData.role || ""}
//                 onValueChange={(value) => handleInputChange("role", value)}
//               >
//                 <SelectTrigger className="bg-background/50">
//                   <SelectValue placeholder="Select role" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="user">User</SelectItem>
//                   <SelectItem value="moderator">Moderator</SelectItem>
//                   <SelectItem value="admin">Admin</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="status">Status</Label>
//               <Select
//                 value={formData.status || ""}
//                 onValueChange={(value) => handleInputChange("status", value)}
//               >
//                 <SelectTrigger className="bg-background/50">
//                   <SelectValue placeholder="Select status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="active">Active</SelectItem>
//                   <SelectItem value="inactive">Inactive</SelectItem>
//                   <SelectItem value="pending">Pending</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="joinedAt">Join Date</Label>
//               <Input
//                 id="joinedAt"
//                 type="date"
//                 value={formData.joinedAt || ""}
//                 onChange={(e) => handleInputChange("joinedAt", e.target.value)}
//                 className="bg-background/50"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="border-t border-border/50 pt-4 flex gap-3">
//           <Button onClick={handleSave} className="flex-1">
//             <Save className="w-4 h-4 mr-2" />
//             Save Changes
//           </Button>
//           <Button variant="outline" onClick={onClose} className="flex-1">
//             Cancel
//           </Button>
//         </div>
//       </SheetContent>
//     </Sheet>
//   );
// }
