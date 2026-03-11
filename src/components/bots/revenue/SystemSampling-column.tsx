// import { type ColumnDef } from "@tanstack/react-table";
// import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
// import { Badge } from "@/components/ui/badge";
// import TbReconViewSheet from '../tb-vs-gl/sheet/tb-recon-view-sheet';

// export type User = {
//     id: number;
//     name: string;
//     email: string;
//     role: string;
//     status: string;
// };

// const TbReconColumn = (): ColumnDef<User>[] => {
//     return [
//         {
//             accessorKey: "execution_id",
//             header: ({ column }) => (
//                 <DataTableColumnHeader column={column} title="Execution ID" />
//             ),
//             cell: ({ row }) => <div className="">{row.getValue("execution_id")}</div>,
//             enableSorting: true,
//             enableHiding: false,
//         },
//         {
//             accessorKey: "initiated_by",
//             header: ({ column }) => (
//                 <DataTableColumnHeader column={column} title="Initiated By" />
//             ),
//             cell: ({ row }) => <div className="">{row.getValue("initiated_by")}</div>,
//             enableSorting: true,
//             enableHiding: true,
//         },

//         {
//             accessorKey: "initiated_on",
//             header: ({ column }) => (
//                 <DataTableColumnHeader column={column} title="Initiated On" />
//             ),
//             cell: ({ row }) => <div className="">{row.getValue("initiated_on")}</div>,
//             enableSorting: true,
//             enableHiding: true,
//         },
//         {
//             accessorKey: "bot_status",
//             header: ({ column }) => (
//                 <DataTableColumnHeader column={column} title="Status" />
//             ),
//             cell: ({ row }) => {
//                 const status = row.getValue("bot_status") as string;
//                 return <Badge className="bg-[#5cb85c]">{status}</Badge>;
//             },
//             enableSorting: true,
//             enableHiding: true,
//         },
//         {
//             id: "actions",
//             header: "Actions",
//             cell: ({ row }) => {
//                 // Fixed: Accept the complete payload structure from RegexSummaryCellEdit
//                 // const handleEditSummary = async (payload: any) => {
//                 // console.log("Payload being sent:", payload);
//                 // const res = await updateRegexSummary(payload);
//                 // console.log("Response:", res.data);
//                 // if (res.data.status_description === "SUCCESS") {
//                 //   toast.success("Regex Summary Updated");
//                 //   refresh();
//                 // } else {
//                 //   toast.error("Error while updating the config");
//                 // }
//                 // return res;
//                 // };

//                 return (
//                     <div className="flex">
//                         <TbReconViewSheet data={row.original} />
//                     </div>
//                 );
//             },
//         },
//     ];
// };

// export default TbReconColumn;
