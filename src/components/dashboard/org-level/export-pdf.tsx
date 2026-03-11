import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

/**
 * Creates an invisible, detached clone of a node for safe PDF export
 * This prevents React reconciliation errors by never touching the live DOM
 */
const cloneForExport = (node: HTMLElement, orgName?: string, reportTitle: string = "IT Dashboard Report") => {
    const clone = node.cloneNode(true) as HTMLElement;

    // ISO: Desktop-width rendering to preserve the Dashboard Grid Look
    clone.style.position = "fixed";
    clone.style.top = "-10000px";
    clone.style.left = "0";
    clone.style.width = "1600px";
    clone.style.background = "#f4f7fa"; // Match dashboard sidebar background
    clone.style.padding = "40px";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "-1";

    clone.classList.add("pdf-export");

    // ---------------------------------------------------------
    // 🏛️ PREMIUM DASHBOARD HEADER (MATCHING UI)
    // ---------------------------------------------------------
    const reportHeader = document.createElement("div");
    reportHeader.style.marginBottom = "30px";
    reportHeader.style.padding = "24px 32px";
    reportHeader.style.background = "#ffffff";
    reportHeader.style.borderRadius = "16px";
    reportHeader.style.border = "1px solid #e2e8f0";
    reportHeader.style.display = "flex";
    reportHeader.style.justifyContent = "space-between";
    reportHeader.style.alignItems = "center";
    reportHeader.style.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.1)";

    reportHeader.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 4px; height: 32px; background: #3b82f6; border-radius: 4px;"></div>
            <div style="padding: 4px 0;">
                <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.3; padding-bottom: 2px;">${reportTitle}</h1>
                <p style="font-size: 14px; font-weight: 600; color: #64748b; margin: 0; text-transform: uppercase; line-height: 1.2;">Organization: ${orgName || "Enterprise View"}</p>
            </div>
        </div>
        <div style="text-align: right;">
            <p style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">Generated On</p>
            <p style="font-size: 14px; font-weight: 700; color: #334155; margin: 4px 0 0 0; line-height: 1.2;">${new Date().toLocaleDateString('en-GB')} | ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
    `;
    clone.prepend(reportHeader);

    // ---------------------------------------------------------
    // 🔧 DASHBOARD LAYOUT RECONSTRUCTION & OVERLAP FIXES
    // ---------------------------------------------------------

    // 1️⃣ Fix general text squashing/cutting (The "Why it's cutting over" fix)
    clone.querySelectorAll("*").forEach((el) => {
        const e = el as HTMLElement;
        // Forces explicit vertical spacing to prevent lines from bleeding into each other
        e.style.lineHeight = "1.5";
        e.style.letterSpacing = "0px";
    });

    // 2️⃣ Restore Grid Layout (2-Column Look exactly like dashboard)
    clone.querySelectorAll(".grid").forEach((grid) => {
        const g = grid as HTMLElement;
        g.style.display = "grid";
        g.style.gridTemplateColumns = "1fr 1fr";
        g.style.gap = "24px";
        g.style.height = "auto";
        g.style.minHeight = "0";
        g.style.overflow = "visible";
    });

    // 3️⃣ Premium Card Restyling (Maintaining Dashboard Vibe)
    clone.querySelectorAll(".bg-card").forEach((card) => {
        const c = card as HTMLElement;
        c.style.height = "560px"; // Increased height to prevent content squashing
        c.style.display = "flex";
        c.style.flexDirection = "column";
        c.style.background = "#ffffff";
        c.style.borderRadius = "16px";
        c.style.border = "1px solid #e2e8f0";
        c.style.boxShadow = "0 10px 15px -3px rgb(0 0 0 / 0.1)";
        c.style.padding = "28px";
        c.style.overflow = "visible"; // Allow data to bleed rather than cut

        // Handle col-span-2 components
        if (c.parentElement?.classList.contains("col-span-2") || (c.classList.contains("col-span-2"))) {
            const target = c.parentElement?.classList.contains("col-span-2") ? c.parentElement : c;
            target.style.gridColumn = "span 2 / span 2";
            c.style.height = "620px";
        }
    });

    // 4️⃣ Fix List Items Overlapping (Specific to StatusComponent3)
    clone.querySelectorAll(".flex.items-center.gap-3.p-3").forEach(el => {
        const container = el as HTMLElement;
        container.style.padding = "16px";
        container.style.marginBottom = "10px";
        container.style.width = "100%";
    });

    // Clear truncation and add safety margins for Bot Names
    clone.querySelectorAll(".flex-1.min-w-0").forEach(el => {
        const e = el as HTMLElement;
        e.style.flex = "1";
        e.style.minWidth = "0";
        e.style.paddingRight = "64px"; // 64px buffer to prevent name from hitting number

        const childP = e.querySelectorAll("p");
        childP.forEach(p => {
            p.classList.remove("truncate");
            p.style.whiteSpace = "normal";
            p.style.overflow = "visible";
            p.style.lineHeight = "1.5";
            p.style.display = "block";
        });
    });

    // Fix the "RUNS" number collision
    clone.querySelectorAll(".flex-shrink-0.text-right").forEach(el => {
        const e = el as HTMLElement;
        e.style.minWidth = "120px";
        e.style.textAlign = "right";
    });

    // 5️⃣ Fix Content Areas
    clone.querySelectorAll(".flex-1, .min-h-0, .relative").forEach((el) => {
        const e = el as HTMLElement;
        e.style.height = "auto";
        e.style.overflow = "visible";
    });

    // 6️⃣ Fix Lists & Scrolling Areas
    clone.querySelectorAll(".overflow-auto, .overflow-y-auto, .custom-scrollbar").forEach((el) => {
        const h = el as HTMLElement;
        h.style.overflow = "visible";
        h.style.height = "auto";
    });

    // 7️⃣ Fix Recharts Dimensions
    clone.querySelectorAll(".recharts-responsive-container").forEach((el) => {
        const e = el as HTMLElement;
        const parentCard = e.closest(".bg-card") as HTMLElement;
        const targetHeight = parentCard && parentCard.style.height.includes("620") ? "500px" : "400px";

        e.style.height = targetHeight;
        e.style.width = "100%";
        e.style.minHeight = targetHeight;
        e.style.visibility = "visible";
        e.style.opacity = "1";
    });

    // 6️⃣ Handle Interactive Elements (Toggles/Badges)
    clone.querySelectorAll("button").forEach((btn) => {
        const b = btn as HTMLElement;
        const isToggleText = b.innerText.includes("FAILURES") || b.innerText.includes("SUCCESSES") || b.innerText.includes("STATUS") || b.innerText.includes("MACHINE");

        if (isToggleText) {
            b.style.background = "#f1f5f9";
            b.style.border = "1px solid #cbd5e1";
            b.style.borderRadius = "20px";
            b.style.padding = "4px 12px";
            b.style.pointerEvents = "none";
            b.style.color = "#475569";
            b.style.fontWeight = "700";
            b.style.fontSize = "10px";
        } else if (!b.closest("[data-date-filter]")) {
            b.style.display = "none";
        }
    });

    // 7️⃣ Date Filter Stylization
    const dateFilter = clone.querySelector("[data-date-filter]");
    if (dateFilter) {
        const text = dateFilter.textContent;
        const bar = document.createElement("div");
        bar.style.padding = "8px 16px";
        bar.style.background = "#f8fafc";
        bar.style.border = "1px solid #e2e8f0";
        bar.style.borderRadius = "8px";
        bar.style.fontSize = "13px";
        bar.style.fontWeight = "700";
        bar.style.color = "#1e293b";
        bar.innerHTML = `<span style="color: #64748b; font-weight: 500;">Reporting Period:</span> ${text || "Live Metrics"}`;
        dateFilter.replaceWith(bar);
    }

    // 8️⃣ Final Aesthetic Polish (Fix text clarity)
    clone.querySelectorAll(".truncate").forEach(el => {
        (el as HTMLElement).style.whiteSpace = "normal";
        (el as HTMLElement).style.overflow = "visible";
    });

    // 9️⃣ Inject Dashboard-Style Footer
    const footer = document.createElement("div");
    footer.style.marginTop = "60px";
    footer.style.padding = "20px";
    footer.style.borderTop = "1px solid #e2e8f0";
    footer.style.textAlign = "center";
    footer.innerHTML = `
        <p style="font-size: 11px; font-weight: 600; color: #94a3b8; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
            Confidential Reporting • Generated via BotMantra Analytics Console • &copy; ${new Date().getFullYear()}
        </p>
    `;
    clone.appendChild(footer);

    document.body.appendChild(clone);

    return () => {
        document.body.removeChild(clone);
    };
};

export const exportDashboardToPDF = async (
    dashboardRef: React.RefObject<HTMLDivElement | null>,
    setExporting: (value: boolean) => void,
    filename: string = "IT_Dashboard.pdf",
    orgName?: string,
    reportTitle: string = "IT Dashboard Report"
) => {
    if (!dashboardRef.current) {
        toast.error("Dashboard not ready");
        return;
    }

    let cleanup: (() => void) | undefined;

    try {
        setExporting(true);

        cleanup = cloneForExport(dashboardRef.current, orgName, reportTitle);

        // Allow extra time for complex SVG charts to finish rendering in the DOM
        await new Promise((resolve) => setTimeout(resolve, 800));

        const exportNode = document.querySelector(".pdf-export") as HTMLElement;

        const canvas = await html2canvas(exportNode, {
            scale: 2.5, // High DPI capture for crisp text and graphics
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
        });

        const imgData = canvas.toDataURL("image/png", 1.0);
        const pdf = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4",
            compress: true
        });

        // Add document metadata
        pdf.setProperties({
            title: `${reportTitle} - ${orgName || 'Report'}`,
            subject: 'System Metrics Report',
            author: 'BotMantra Analytics',
            creator: 'BotMantra Console'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        let y = 0;
        while (y < pdfHeight) {
            pdf.addImage(imgData, "PNG", 0, -y, pdfWidth, pdfHeight, undefined, "FAST");
            y += pageHeight;
            if (y < pdfHeight) {
                pdf.addPage();
            }
        }

        pdf.save(filename);
        toast.success("Professional report generated successfully");
    } catch (err) {
        console.error("PDF export failed:", err);
        toast.error("Failed to generate PDF report");
    } finally {
        cleanup?.();
        setExporting(false);
    }
};

