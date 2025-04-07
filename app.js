// Initialize expenses array from localStorage
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let companySettings = JSON.parse(localStorage.getItem('companySettings')) || {};
let employeeDetails = JSON.parse(localStorage.getItem('employeeDetails')) || [];

// Add editExpense variable to track editing state
let editingExpenseIndex = -1;

// Format amount to INR
const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)
    .replace(/^(\D+)/, '₹') // Clean ₹ symbol
    .replace(/,/g, ','); // Maintain commas
};

// Save expenses to localStorage
const saveExpenses = () => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
};

// Add new expense
const addExpense = (expense) => {
    expenses.push(expense);
    saveExpenses();
    displayExpenses();
};

// Edit expense
const editExpense = (index) => {
    editingExpenseIndex = index;
    const expense = expenses[index];
    
    document.getElementById('date').value = expense.date;
    document.getElementById('category').value = expense.category;
    document.getElementById('amount').value = expense.amount;
    document.getElementById('details').value = expense.details;
    
    // Change form button text
    const submitBtn = document.getElementById('expenseSubmitBtn');
    submitBtn.textContent = 'Update Expense';
    
    // Show attachment preview if exists
    if (expense.attachment) {
        const previewDiv = document.createElement('div');
        previewDiv.id = 'attachmentPreview';
        previewDiv.className = 'mt-2';
        previewDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2">Current Attachment:</span>
                ${expense.attachment.startsWith('data:image') 
                    ? `<img src="${expense.attachment}" style="height: 50px; width: auto;" class="me-2" alt="Current receipt">` 
                    : `<span class="me-2">PDF Document</span>`
                }
                <button type="button" class="btn btn-sm btn-danger" onclick="removeAttachment()">Remove</button>
            </div>
        `;
        document.getElementById('attachment').parentNode.appendChild(previewDiv);
    }
    
    // Scroll to form
    document.getElementById('expenseForm').scrollIntoView();
};

// Remove attachment during edit
const removeAttachment = () => {
    if (editingExpenseIndex !== -1) {
        const previewDiv = document.getElementById('attachmentPreview');
        if (previewDiv) previewDiv.remove();
        expenses[editingExpenseIndex].attachment = null;
        saveExpenses();
    }
};

// Cancel edit
const cancelEdit = () => {
    editingExpenseIndex = -1;
    document.getElementById('expenseForm').reset();
    const submitBtn = document.getElementById('expenseSubmitBtn');
    submitBtn.textContent = 'Add Expense';
    const previewDiv = document.getElementById('attachmentPreview');
    if (previewDiv) previewDiv.remove();
};

// Delete expense
const deleteExpense = (index) => {
    expenses.splice(index, 1);
    saveExpenses();
    displayExpenses();
};

// Convert file to base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// Save company settings
const saveCompanySettings = async (e) => {
    e.preventDefault();
    const logoFile = document.getElementById('companyLogo').files[0];
    companySettings = {
        name: document.getElementById('companyName').value,
        logo: logoFile ? await fileToBase64(logoFile) : companySettings.logo
    };
    localStorage.setItem('companySettings', JSON.stringify(companySettings));
};

// Save employee details
const saveEmployeeDetails = (e) => {
    e.preventDefault();
    employeeDetails = {
        empCode: document.getElementById('empCode').value,
        empName: document.getElementById('empName').value,
        department: document.getElementById('department').value,
        designation: document.getElementById('designation').value,
        location: document.getElementById('location').value,
        reportingHead: document.getElementById('reportingHead').value
    };
    localStorage.setItem('employeeDetails', JSON.stringify(employeeDetails));
};

// Display attachments
const displayAttachments = () => {
    const container = document.getElementById('attachmentsList');
    container.innerHTML = '';

    expenses.forEach((expense, index) => {
        if (expense.attachment) {
            const col = document.createElement('div');
            col.className = 'col-md-3';
            col.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h6>Receipt for ${expense.details}</h6>
                        <p class="text-muted">${new Date(expense.date).toLocaleDateString()}</p>
                        ${expense.attachment.startsWith('data:image') 
                            ? `<img src="${expense.attachment}" class="img-fluid mb-2" alt="Receipt">`
                            : `<a href="${expense.attachment}" class="btn btn-sm btn-info" download>Download PDF</a>`
                        }
                    </div>
                </div>
            `;
            container.appendChild(col);
        }
    });
};

// Display expenses in table
const displayExpenses = () => {
    const tbody = document.getElementById('expensesList');
    tbody.innerHTML = '';
    
    expenses.forEach((expense, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${new Date(expense.date).toLocaleDateString()}</td>
            <td>${expense.details}</td>
            <td>${expense.category}</td>
            <td class="text-end">${formatAmount(expense.amount)}</td>
            <td>
                <button class="btn btn-primary btn-sm me-1" onclick="editExpense(${index})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteExpense(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    displayAttachments();
};

// Handle form submission
document.getElementById('expenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const attachmentFile = document.getElementById('attachment').files[0];
    let attachmentData = null;
    
    if (attachmentFile) {
        attachmentData = await fileToBase64(attachmentFile);
    }
    
    const expense = {
        date: document.getElementById('date').value,
        category: document.getElementById('category').value,
        amount: parseFloat(document.getElementById('amount').value),
        details: document.getElementById('details').value,
        attachment: attachmentData || (editingExpenseIndex !== -1 ? expenses[editingExpenseIndex].attachment : null)
    };
    
    if (editingExpenseIndex !== -1) {
        expenses[editingExpenseIndex] = expense;
        editingExpenseIndex = -1;
        document.getElementById('expenseSubmitBtn').textContent = 'Add Expense';
        const previewDiv = document.getElementById('attachmentPreview');
        if (previewDiv) previewDiv.remove();
    } else {
        expenses.push(expense);
    }
    
    saveExpenses();
    displayExpenses();
    e.target.reset();
});

// Generate PDF
const generateExpensePDF = (preview = false) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let y = margin;

    // Add a subtle header background
    doc.setFillColor(247, 250, 252);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Add a thin accent line at the top
    doc.setDrawColor(0, 82, 57);
    doc.setLineWidth(0.5);
    doc.line(0, 0, pageWidth, 0);

    // Header section with logo and company name
    if (companySettings.logo) {
        const logoHeight = 22;
        const logoWidth = logoHeight;
        doc.addImage(companySettings.logo, 'JPEG', margin, y, logoWidth, logoHeight);
        
        // Company name with better typography
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 82, 57); // Dark green
        doc.text(companySettings.name || 'Company Name', margin + logoWidth + 8, y + (logoHeight/2), { 
            align: 'left', 
            baseline: 'middle'
        });
        
        y += logoHeight + 8;
    } else {
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 82, 57);
        doc.text(companySettings.name || 'Company Name', margin, y + 10);
        y += 15;
    }

    // Title with better styling
    const month = new Date().toLocaleString('default', { month: 'long' });
    const year = new Date().getFullYear();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 55, 72);
    doc.text(`Expense Statement - ${month} ${year}`, pageWidth / 2, y, { align: 'center' });

    // Employee details section
    y += 12;
    doc.setFillColor(252, 252, 253);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    
    // Draw employee details box with subtle styling
    const boxHeight = 32; // Increased height for two rows
    const boxWidth = pageWidth - (margin * 2);
    doc.roundedRect(margin, y - 3, boxWidth, boxHeight, 1, 1, 'FD');
    
    // Employee details content in two rows
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 55, 72);
    
    // Calculate widths for each section
    const labelWidth = 25;
    const valueWidth = 55;
    const spacing = 8;
    
    // First row
    let xPos = margin + 5;
    let rowY = y + 8;
    
    // Employee Code
    doc.setFont('helvetica', 'normal');
    doc.text('Code:', xPos, rowY);
    doc.setFont('helvetica', 'bold');
    doc.text(employeeDetails.empCode || '', xPos + labelWidth, rowY);
    
    // Name
    xPos += labelWidth + valueWidth + spacing;
    doc.setFont('helvetica', 'normal');
    doc.text('Name:', xPos, rowY);
    doc.setFont('helvetica', 'bold');
    doc.text(employeeDetails.empName || '', xPos + labelWidth, rowY);
    
    // Department
    xPos += labelWidth + valueWidth + spacing;
    doc.setFont('helvetica', 'normal');
    doc.text('Dept:', xPos, rowY);
    doc.setFont('helvetica', 'bold');
    doc.text(employeeDetails.department || '', xPos + labelWidth, rowY);
    
    // Second row
    xPos = margin + 5;
    rowY = y + 20; // Move to second row
    
    // Designation
    doc.setFont('helvetica', 'normal');
    doc.text('Desig:', xPos, rowY);
    doc.setFont('helvetica', 'bold');
    doc.text(employeeDetails.designation || '', xPos + labelWidth, rowY);
    
    // Location
    xPos += labelWidth + valueWidth + spacing;
    doc.setFont('helvetica', 'normal');
    doc.text('Location:', xPos, rowY);
    doc.setFont('helvetica', 'bold');
    doc.text(employeeDetails.location || '', xPos + labelWidth, rowY);
    
    // Reporting Head
    xPos += labelWidth + valueWidth + spacing;
    doc.setFont('helvetica', 'normal');
    doc.text('Rep Head:', xPos, rowY);
    doc.setFont('helvetica', 'bold');
    doc.text(employeeDetails.reportingHead || '', xPos + labelWidth, rowY);

    // Expense table
    y += boxHeight + 8;
    const headers = ['S.No', 'Date', 'Details', 'Category', 'Amount'];
    
    // Table styling
    const columnWidths = [20, 30, 70, 35, 30];
    const alignments = ['center', 'left', 'left', 'left', 'right'];
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
    const startX = (pageWidth - tableWidth) / 2;

    // Header row with gradient effect
    doc.setFillColor(240, 243, 246);
    doc.rect(startX, y, tableWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(startX, y, tableWidth, 12);

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(45, 55, 72);
    
    let x = startX;
    headers.forEach((header, i) => {
        const xPos = alignments[i] === 'right'
            ? x + columnWidths[i] - 5
            : alignments[i] === 'center'
            ? x + (columnWidths[i] / 2)
            : x + 5;
        doc.text(header, xPos, y + 8, { align: alignments[i] });
        x += columnWidths[i];
    });

    // Table content
    y += 12;
    doc.setFont('helvetica', 'normal');
    let totalAmount = 0;
    let isEvenRow = false;

    expenses.forEach((expense, index) => {
        if (y > pageHeight - 60) {
            doc.addPage();
            y = margin + 10;
            // Add subtle header to new page
            doc.setFillColor(247, 250, 252);
            doc.rect(0, 0, pageWidth, 20, 'F');
            // Repeat table header
            doc.setFillColor(240, 243, 246);
            doc.rect(startX, y, tableWidth, 12, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.2);
            doc.rect(startX, y, tableWidth, 12);

            doc.setFont('helvetica', 'bold');
            x = startX;
            headers.forEach((header, i) => {
                const xPos = alignments[i] === 'right'
                    ? x + columnWidths[i] - 5
                    : alignments[i] === 'center'
                    ? x + (columnWidths[i] / 2)
                    : x + 5;
                doc.text(header, xPos, y + 8, { align: alignments[i] });
                x += columnWidths[i];
            });
            y += 12;
            doc.setFont('helvetica', 'normal');
        }

        // Zebra striping for rows
        if (isEvenRow) {
            doc.setFillColor(250, 250, 252);
            doc.rect(startX, y - 5, tableWidth, 10, 'F');
        }

        // Row data
        x = startX;
        const rowData = [
            (index + 1).toString().padStart(2, '0'),
            new Date(expense.date).toLocaleDateString(),
            expense.details.substring(0, 40),
            expense.category,
            formatAmount(expense.amount)
        ];

        rowData.forEach((text, i) => {
            const xPos = alignments[i] === 'right'
                ? x + columnWidths[i] - 5
                : alignments[i] === 'center'
                ? x + (columnWidths[i] / 2)
                : x + 5;
            
            doc.text(text.toString(), xPos, y, { 
                align: alignments[i],
                maxWidth: columnWidths[i] - 8
            });
            x += columnWidths[i];
        });

        totalAmount += expense.amount;
        y += 10;
        isEvenRow = !isEvenRow;
    });

    // Total section with enhanced styling
    y += 2;
    doc.setFillColor(240, 243, 246);
    doc.roundedRect(startX, y - 5, tableWidth, 12, 1, 1, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(startX, y - 5, tableWidth, 12, 1, 1);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Total:', startX + tableWidth - columnWidths[4] - 5, y + 2);
    doc.text(formatAmount(totalAmount), startX + tableWidth - 5, y + 2, { align: 'right' });

    // Footer with signature section
    const addSignatureFooter = () => {
        const footerY = pageHeight - 30;
        
        // Add subtle footer background
        doc.setFillColor(247, 250, 252);
        doc.rect(0, footerY - 5, pageWidth, 35, 'F');
        
        // Signature section
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(45, 55, 72);
        
        const signatureWidth = (pageWidth - (margin * 2)) / 3;
        [
            ['Claimed By', employeeDetails.empName],
            ['Checked By', ''],
            ['Authorized By', employeeDetails.reportingHead]
        ].forEach((sig, i) => {
            const x = margin + (i * signatureWidth) + 10;
            doc.text(sig[0], x, footerY);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(x, footerY + 5, x + signatureWidth - 30, footerY + 5);
            doc.text(sig[1] || '', x, footerY + 10);
        });

        // Timestamp in footer
        doc.setFontSize(7);
        doc.setTextColor(160, 174, 192);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - margin, footerY + 15, { align: 'right' });
    };

    // Add footer to current page
    addSignatureFooter();

    // Handle attachments with signature footer on each page
    if (expenses.some(e => e.attachment)) {
        expenses.forEach((expense, index) => {
            if (expense.attachment) {
                doc.addPage();
                
                // Attachment header
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40, 40, 40);
                doc.text('Expense Receipt', pageWidth / 2, margin, { align: 'center' });
                
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                
                // Add a box around attachment details
                doc.setFillColor(248, 249, 250);
                doc.rect(margin, margin + 10, pageWidth - (margin * 2), 30, 'F');
                doc.setDrawColor(220, 220, 220);
                doc.rect(margin, margin + 10, pageWidth - (margin * 2), 30);
                
                doc.text('Expense Details:', margin + 8, margin + 22);
                doc.text(expense.details, margin + 8, margin + 30);
                doc.text(`Date: ${new Date(expense.date).toLocaleDateString()}`, pageWidth - margin - 50, margin + 22);
                doc.text(`Amount: ${formatAmount(expense.amount)}`, pageWidth - margin - 50, margin + 30);

                if (expense.attachment.startsWith('data:image')) {
                    try {
                        // Calculate image dimensions to fit page while maintaining aspect ratio
                        const maxWidth = pageWidth - (margin * 2);
                        const maxHeight = pageHeight - (margin * 2) - 80; // Adjusted for footer
                        doc.addImage(expense.attachment, 'JPEG', margin, margin + 45, maxWidth, maxHeight);
                    } catch (err) {
                        doc.text('Error loading image attachment', margin, margin + 45);
                    }
                } else {
                    doc.text('PDF attachment available in web view', margin, margin + 45);
                }

                // Add signature footer to attachment page
                addSignatureFooter();
            }
        });
    }

    // Output handling
    if (preview) {
        try {
            const pdfBlob = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            const previewWindow = window.open('', '_blank');
            
            if (!previewWindow) {
                alert('Please allow popups to preview the PDF');
                return;
            }

            previewWindow.document.write(`
                <html>
                    <head>
                        <title>Expense Report Preview</title>
                        <style>
                            body { margin: 0; height: 100vh; overflow: hidden; }
                            #pdf-viewer {
                                width: 100%;
                                height: 100%;
                                border: none;
                            }
                            .error-message {
                                padding: 20px;
                                text-align: center;
                                display: none;
                            }
                        </style>
                    </head>
                    <body>
                        <iframe id="pdf-viewer" src="${blobUrl}#toolbar=1"></iframe>
                        <div class="error-message">
                            Unable to load PDF preview. 
                            <button onclick="window.location.href='${blobUrl}'">Download Instead</button>
                        </div>
                        <script>
                            document.getElementById('pdf-viewer').onerror = function() {
                                this.style.display = 'none';
                                document.querySelector('.error-message').style.display = 'block';
                            };
                        </script>
                    </body>
                </html>
            `);
            previewWindow.document.close();
            
            previewWindow.onbeforeunload = () => URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Preview error:', err);
            alert('Error generating preview. Please try downloading instead.');
        }
    } else {
        doc.save(`expense-report-${month}-${year}.pdf`);
    }
};

document.getElementById('downloadPdf').addEventListener('click', () => generateExpensePDF(false));
document.getElementById('previewPdf').addEventListener('click', () => generateExpensePDF(true));

document.getElementById('companySettingsForm').addEventListener('submit', saveCompanySettings);
document.getElementById('employeeDetailsForm').addEventListener('submit', saveEmployeeDetails);

window.addEventListener('load', () => {
    if (companySettings.name) {
        document.getElementById('companyName').value = companySettings.name;
    }
    if (employeeDetails.empCode) {
        Object.keys(employeeDetails).forEach(key => {
            if (document.getElementById(key)) {
                document.getElementById(key).value = employeeDetails[key];
            }
        });
    }
});

displayExpenses();
