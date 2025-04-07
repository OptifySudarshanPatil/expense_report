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
        currency: 'INR'
    }).format(amount);
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
}); // Added missing closing parenthesis

// Generate PDF
const generateExpensePDF = (preview = false) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let y = margin;

    // Company header with centered name and timestamp
    if (companySettings.logo) {
        const logoHeight = 25;
        const logoWidth = logoHeight;
        doc.addImage(companySettings.logo, 'JPEG', margin, y, logoWidth, logoHeight);
    }

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.name || 'Company Name', pageWidth / 2, y + 15, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const timestamp = new Date().toLocaleString();
    doc.text(`Generated on: ${timestamp}`, pageWidth - margin, margin, { align: 'right' });

    y += 25;
    const month = new Date().toLocaleString('default', { month: 'long' });
    const year = new Date().getFullYear();
    doc.text(`Expense Statement - ${month} ${year}`, pageWidth / 2, y, { align: 'center' });

    y += 15;
    doc.setFontSize(10);
    const details = [
        [`Employee Code: ${employeeDetails.empCode}`, `Department: ${employeeDetails.department}`],
        [`Employee Name: ${employeeDetails.empName}`, `Designation: ${employeeDetails.designation}`],
        [`Location: ${employeeDetails.location}`, `Reporting Head: ${employeeDetails.reportingHead}`]
    ];

    details.forEach(row => {
        doc.text(row[0], margin, y);
        doc.text(row[1], pageWidth / 2, y);
        y += 7;
    });

    y += 10;
    const headers = ['S.No', 'Date', 'Details', 'Category', 'Amount'];
    doc.setDrawColor(200);
    const columnWidths = [20, 30, 50, 35, 45]; // Adjusted widths, more space for amount
    const alignments = ['center', 'left', 'left', 'left', 'right'];
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
    const startX = (pageWidth - tableWidth) / 2;

    const minTableHeight = Math.max((expenses.length * 7) + 15, 30);
    const tableHeight = Math.min(minTableHeight, 250);

    const drawTableHeader = (yPos) => {
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, yPos, tableWidth, 8, 'F');
        
        let x = startX;
        headers.forEach((header, i) => {
            const xPos = alignments[i] === 'right'
                ? x + columnWidths[i] - 4
                : x + (columnWidths[i] / 2);
            doc.text(header, xPos, yPos + 6, { align: alignments[i] });
            
            // Draw vertical separator
            if (i < headers.length - 1) {
                doc.line(x + columnWidths[i], yPos, x + columnWidths[i], yPos + tableHeight);
            }
            x += columnWidths[i];
        });
    };

    drawTableHeader(y);
    doc.rect(startX, y, tableWidth, tableHeight);
    y += 8;

    let totalAmount = 0;
    expenses.forEach((expense, index) => {
        if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
            drawTableHeader(y);
            doc.rect(startX, y, tableWidth, tableHeight);
            y += 8;
        }

        const rowData = [
            (index + 1).toString().padStart(2, '0'),
            new Date(expense.date).toLocaleDateString(),
            expense.details.substring(0, 20),
            expense.category,
            formatAmount(expense.amount)
        ];

        let x = startX;
        rowData.forEach((text, i) => {
            const xPos = alignments[i] === 'right'
                ? x + columnWidths[i] - 6  // More padding for amount
                : alignments[i] === 'center'
                ? x + (columnWidths[i] / 2)
                : x + 4;  // Left padding for text
            
            doc.text(text.toString(), xPos, y + 5, { 
                align: alignments[i],
                maxWidth: columnWidths[i] - 8
            });
            x += columnWidths[i];
        });

        totalAmount += expense.amount;
        y += 7;
    });

    try {
        y += 5;
        doc.setFillColor(245, 245, 245);
        doc.rect(startX, y, tableWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        
        const totalSection = tableWidth - columnWidths[4];
        doc.text('Total:', startX + totalSection + 5, y + 5);
        doc.text(formatAmount(totalAmount), startX + tableWidth - 6, y + 5, { 
            align: 'right',
            maxWidth: columnWidths[4] - 8
        });
    } catch (err) {
        console.error('Error drawing total row:', err);
    }

    y += 20;
    [
        ['Claimed By', employeeDetails.empName],
        ['Checked By', ''],
        ['Authorized By', employeeDetails.reportingHead]
    ].forEach((sig, i) => {
        const x = margin + (i * 60);
        doc.text(sig[0], x, y);
        doc.text('________________', x, y + 10);
        doc.text(sig[1] || '', x, y + 15);
    });

    expenses.forEach(expense => {
        if (expense.attachment) {
            doc.addPage();
            doc.text('Attachment for: ' + expense.details, margin, margin);
            doc.text('Date: ' + new Date(expense.date).toLocaleDateString(), margin, margin + 7);

            if (expense.attachment.startsWith('data:image')) {
                try {
                    doc.addImage(expense.attachment, 'JPEG', margin, margin + 15, pageWidth - (margin * 2), 0);
                } catch (err) {
                    doc.text('Error loading image attachment', margin, margin + 15);
                }
            } else {
                doc.text('PDF attachment available in web view', margin, margin + 15);
            }
        }
    });

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
