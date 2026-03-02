// Excel Export & Import Logic (v1.2 Enhanced with Styling)

function exportToExcel() {
    // 1. Show Visual Feedback
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white animate-fade-in';
    overlay.innerHTML = `
        <div class="relative">
            <div class="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <ion-icon name="cloud-download-outline" class="absolute inset-0 m-auto text-4xl text-indigo-400"></ion-icon>
        </div>
        <h3 class="mt-8 text-2xl font-bold tracking-tight">Generating Styled Reports...</h3>
        <p class="mt-2 text-gray-400 text-sm animate-pulse">Applying branding and formatting</p>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
        try {
            const assets = inventory.getAllAssets();
            const stolen = inventory.getAllStolen();
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const workbook = XLSX.utils.book_new();

            // Helper to create Pretty Sheet with Styling
            const createStyledSheet = (data) => {
                if (data.length === 0) return null;
                const ws = XLSX.utils.json_to_sheet(data);

                // Header Range (A1 to LastCol1)
                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_col(C) + "1";
                    if (!ws[address]) continue;
                    ws[address].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" } },
                        fill: { fgColor: { rgb: "4F46E5" } }, // indigo-600
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }

                // Auto-width
                ws['!cols'] = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length + 5, 20) }));
                return ws;
            };

            // 1. Full Inventory
            const fullSheetData = assets.map(a => ({
                'ASSET CODE': a.assetCode || 'N/A',
                'NAME': a.name,
                'CATEGORY': a.category,
                'DEPARTMENT': a.department || '-',
                'QTY': a.quantity || 1,
                'COMPANY': a.company || '-',
                'SERIAL/IMEI': a.serialNumber || '-',
                'STATUS': a.status,
                'ASSIGNED TO': a.assignedTo || '-',
                'RECEIVED': a.receivedDate || '-',
                'DISPATCHED': a.dispatchedDate || '-',
                'REMARKS': a.notes || '-'
            }));
            const fullWs = createStyledSheet(fullSheetData);
            if (fullWs) XLSX.utils.book_append_sheet(workbook, fullWs, 'Full Inventory');

            // 2. Weekly New
            const weeklyData = assets.filter(a => new Date(a.dateAdded) >= oneWeekAgo).map(a => ({
                'ASSET CODE': a.assetCode || 'N/A',
                'NAME': a.name,
                'CATEGORY': a.category,
                'DEPARTMENT': a.department || '-',
                'QTY': a.quantity || 1,
                'ADDED DATE': new Date(a.dateAdded).toLocaleDateString()
            }));
            const weeklyWs = createStyledSheet(weeklyData);
            if (weeklyWs) XLSX.utils.book_append_sheet(workbook, weeklyWs, 'Weekly New');

            // 3. Dispatched / Distributed
            const dispatchedData = assets.filter(a => (a.dispatchedDate && a.dispatchedDate !== '') || a.status === 'In Use').map(a => ({
                'ASSET CODE': a.assetCode || 'N/A',
                'NAME': a.name,
                'DEPARTMENT': a.department || '-',
                'COMPANY': a.company || '-',
                'DISPATCHED DATE': a.dispatchedDate || 'In Use',
                'RECIPIENT': a.assignedTo || '-'
            }));
            const dispatchedWs = createStyledSheet(dispatchedData);
            if (dispatchedWs) XLSX.utils.book_append_sheet(workbook, dispatchedWs, 'Distributed Assets');

            // 4. Stolen Items
            const stolenData = stolen.map(s => ({
                'ASSET CODE': s.assetCode || 'N/A',
                'ITEM NAME': s.name,
                'CATEGORY': s.category,
                'STOLEN DATE': s.date || '-',
                'REMARK': s.remark || '-'
            }));
            const stolenWs = createStyledSheet(stolenData);
            if (stolenWs) XLSX.utils.book_append_sheet(workbook, stolenWs, 'Security Log');

            const filename = `Jetwing_Inventory_Styled_v1.2_${now.toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(workbook, filename);

        } catch (error) {
            console.error(error);
            alert('Export failed: ' + error.message);
        } finally {
            setTimeout(() => overlay.remove(), 1000);
        }
    }, 1500);
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) throw new Error('Sheet is empty');

            jsonData.forEach(row => {
                const assetData = {
                    assetCode: row['ASSET CODE'] || '',
                    name: row['NAME'] || row['Asset Name'] || 'Imported',
                    category: row['CATEGORY'] || 'Other',
                    department: row['DEPARTMENT'] || '',
                    quantity: row['QTY'] || 1,
                    company: row['COMPANY'] || '',
                    serialNumber: row['SERIAL/IMEI'] || '',
                    status: row['STATUS'] || 'In Stock',
                    assignedTo: row['ASSIGNED TO'] || '',
                    receivedDate: row['RECEIVED'] || '',
                    dispatchedDate: row['DISPATCHED'] || '',
                    notes: row['REMARKS'] || ''
                };
                inventory.addCategory(assetData.category);
                inventory.addAsset(assetData);
            });

            alert('Import Successful!');
            location.reload();
        } catch (err) {
            alert('Import failed: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}
