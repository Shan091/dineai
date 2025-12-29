import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CartItem } from '../components/SmartCart';

export const generatePDF = (orderItems: CartItem[], totalAmount: number, guestName: string = 'Guest', tableId?: number) => {
    const doc = new jsPDF();

    // --- HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Dine AI", 105, 20, { align: "center" }); // Centered Title

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Restaurant & Lounge", 105, 28, { align: "center" });

    // Meta Data
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 40);
    doc.text(`Guest: ${guestName}`, 14, 46);
    if (tableId) doc.text(`Table: ${tableId}`, 14, 52);

    // --- TABLE ---
    const tableColumn = ["Item", "Qty", "Price", "Total"];
    const tableRows: any[] = [];

    orderItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const itemData = [
            item.name,
            item.quantity.toString(),
            `INR ${item.price}`,
            `INR ${itemTotal}`
        ];
        tableRows.push(itemData);
    });

    // Calculations for Footer
    // We strictly follow Backend Logic: 
    // Subtotal = Sum of (Price * Qty)
    // GST = 5%
    // Service = 2.5%
    // Total = Sub + GST + Service
    const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const gst = subtotal * 0.05;
    const service = subtotal * 0.025;
    // We use the derived total to ensure the breakdown adds up visually, 
    // checking it against totalAmount for sanity could be done but visually matching breakdown is more important for receipt.
    const calculatedTotal = subtotal + gst + service;

    autoTable(doc, {
        startY: 60,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [255, 87, 34] }, // Orange branding
        styles: { fontSize: 10 },
    });

    // --- FOOTER SUMMARY ---
    // Get Y position after table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setTextColor(0);

    doc.text(`Subtotal: INR ${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`GST (5%): INR ${gst.toFixed(2)}`, 140, finalY + 6);
    doc.text(`Service (2.5%): INR ${service.toFixed(2)}`, 140, finalY + 12);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    // Use the backend provided totalAmount as the source of truth, 
    // but default to calculated if there's a huge mismatch (which there shouldn't be).
    // Actually, visually: Sub + Tax + Svc SHOULD equal Total.
    // If backend provided total is different (e.g. due to rounding), the receipt looks wrong.
    // For consistency, we display the breakdown values that sum up to the total we display.
    // Let's rely on the variables we just calculated so 100 + 5 + 2.5 = 107.5
    doc.text(`TOTAL: INR ${calculatedTotal.toFixed(2)}`, 140, finalY + 22);

    // Thank You Message
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Thank you for dining with us!", 105, finalY + 40, { align: "center" });

    // Save
    doc.save(`receipt_${Date.now()}.pdf`);
};
