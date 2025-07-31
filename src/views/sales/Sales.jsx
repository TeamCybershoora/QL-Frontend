import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Form, Button, Tab, Nav, Modal, Pagination } from 'react-bootstrap'; // Added Pagination
import { FaCalendarAlt, FaDownload, FaPrint, FaTrashAlt } from 'react-icons/fa';
import { getFolderHandle } from '../FolderDB.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Cookies from 'js-cookie';
import ExcelJS from "exceljs";
import qr from "../../assets/qr.jpg";
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';

function Sales() {
  const [key, setKey] = useState('bill');
  const [startDate, setStartDate] = useState(new Date('2025-01-01'));
  const [endDate, setEndDate] = useState(new Date('2025-12-31'));
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [nextBillNo, setNextBillNo] = useState("00101");

  // New states for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can adjust this number

  const [customer, setCustomer] = useState({
    id: '', name: '', billNo: '', mobile: '', amount: '', mode: ''
  });

  const [items, setItems] = useState([{ name: '', price: '' }]);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    setCustomer(prev => ({ ...prev, amount: total.toFixed(2) }));
  }, [items]);

  // Function to load sales data from Excel
  const loadSalesData = async () => {
    const folderAccess = Cookies.get("folderAccess");
    if (folderAccess !== "true") {
      console.warn("Folder access not granted. Cannot load sales data.");
      setSalesData([]); // Clear data if no access
      setNextBillNo("00101"); // Reset bill no
      return;
    }

    let dirHandle;
    try {
      dirHandle = await getFolderHandle();
      if (!dirHandle) throw new Error("No folder handle found in IDB.");
    } catch (err) {
      console.warn("Could not get folder handle:", err.message);
      setSalesData([]);
      setNextBillNo("00101");
      return;
    }

    try {
      const fileHandle = await dirHandle.getFileHandle("sales.xlsx", { create: false }); // Do not create if it doesn't exist
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      let sheet = workbook.getWorksheet("Sales");
      if (!sheet) {
        setSalesData([]);
        setNextBillNo("00101");
        return; // No sheet, no data
      }

      const tempSales = []; // Use a temporary array to build data
      let maxBill = 100;
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const values = row.values.slice(1);

        // Ensure we have enough values before destructuring
        if (values.length >= 8) { // Minimum 8 values for sales data
          const [tableNo, name, billNo, mobile, amount, mode, itemsStr, dateStr, status] = values;

          const parsedItems = (itemsStr || '').split(", ").map(i => {
            const [itemName, itemPrice] = i.split(" - ");
            return { name: itemName?.trim(), price: itemPrice?.trim() };
          });

          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            tempSales.push({
              id: tableNo,
              name,
              billNo: String(billNo).padStart(5, '0'), // Ensure billNo is 5 digits
              mobile,
              amount,
              mode,
              items: parsedItems,
              date: parsedDate,
              status: status || "Unpaid"
            });
            maxBill = Math.max(maxBill, parseInt(billNo || 100)); // Update max bill no
          }
        }
      });

      // Sort data: Latest date first, then latest bill number if dates are same
      tempSales.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        // Sort by date descending
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        // If dates are the same, sort by bill number descending
        return parseInt(b.billNo) - parseInt(a.billNo);
      });

      setSalesData(tempSales);
      setNextBillNo((maxBill + 1).toString().padStart(5, '0'));
    } catch (err) {
      console.warn("Error loading sales.xlsx:", err.message);
      setSalesData([]);
      setNextBillNo("00101");
    }
  };

  useEffect(() => {
    loadSalesData();
  }, []); // Run once on component mount

  const handleAddItem = () => setItems([...items, { name: '', price: '' }]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const handleSave = async () => {
    const folderAccess = Cookies.get("folderAccess");
    let dirHandle;

    // Input validation
    if (!customer.id || !customer.name || !customer.mobile || !customer.amount || !customer.mode || items.some(item => !item.name || !item.price)) {
      toast.error("Please fill in all customer and item details.");
      return;
    }

    // Basic numerical validation for amount and price
    if (isNaN(parseFloat(customer.amount)) || parseFloat(customer.amount) <= 0) {
      toast.error("Total Amount must be a valid positive number.");
      return;
    }
    for (const item of items) {
      if (isNaN(parseFloat(item.price)) || parseFloat(item.price) < 0) {
        toast.error("Item prices must be valid non-negative numbers.");
        return;
      }
    }
    if (customer.mobile.length !== 10 || !/^\d+$/.test(customer.mobile)) {
      toast.error("Mobile number must be 10 digits.");
      return;
    }

    try {
      if (folderAccess !== "true") throw new Error("Folder access denied");
      dirHandle = await getFolderHandle();
      if (!dirHandle) throw new Error("No folder handle");

      const perm = await dirHandle.queryPermission({ mode: "readwrite" });
      if (perm !== "granted") {
        const req = await dirHandle.requestPermission({ mode: "readwrite" });
        if (req !== "granted") throw new Error("Permission denied for folder.");
      }
    } catch (err) {
      toast.error("⚠️ Folder access is required to save the file: " + err.message);
      return;
    }

    const workbook = new ExcelJS.Workbook();
    let sheet;
    const HEADER = ["Table No.", "Customer Name", "Bill No", "Mobile", "Amount", "Mode", "Items", "Date", "Payment Status"];
    const today = new Date().toISOString().slice(0, 10);

    try {
      const fileHandle = await dirHandle.getFileHandle("sales.xlsx", { create: true });
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      sheet = workbook.getWorksheet("Sales");
      if (!sheet) sheet = workbook.addWorksheet("Sales");
    } catch (err) { // If file is empty or corrupted, create new sheet
      console.warn("Could not load sales.xlsx, creating new sheet:", err.message);
      sheet = workbook.addWorksheet("Sales");
    }

    // Ensure header is present and correct
    if (sheet.rowCount === 0 || sheet.getRow(1).values.slice(1).join(',') !== HEADER.join(',')) {
        sheet.spliceRows(1, sheet.rowCount); // Clear existing content if header is wrong or missing
        sheet.addRow(HEADER);
    }

    const newRowData = [
      customer.id,
      customer.name,
      nextBillNo, // Use the generated nextBillNo
      customer.mobile,
      customer.amount,
      customer.mode,
      items.map(itm => `${itm.name} - ${itm.price}`).join(", "),
      today,
      "Unpaid"
    ];

    sheet.addRow(newRowData);

    try {
      const freshHandle = await dirHandle.getFileHandle("sales.xlsx", { create: true });
      const writable = await freshHandle.createWritable();
      await workbook.xlsx.write(writable);
      await writable.close();
    } catch (err) {
      toast.error("⚠️ Failed to write to file. Close Excel if open and try again.");
      console.error("Write Error:", err);
      return;
    }

    toast.success("✅ Sale saved successfully!");

    // Re-load data after save to ensure table and bill numbers are updated
    await loadSalesData();

    // Reset form
    setCustomer({ id: '', name: '', billNo: '', mobile: '', amount: '', mode: '' });
    setItems([{ name: '', price: '' }]);
    setShowModal(false);
  };

  const togglePaymentStatus = async (itemToUpdate) => {
    const updatedStatus = itemToUpdate.status === "Paid" ? "Unpaid" : "Paid";

    const updatedSales = salesData.map(item =>
      item.billNo === itemToUpdate.billNo ? { ...item, status: updatedStatus } : item
    );
    setSalesData(updatedSales);

    const folderAccess = Cookies.get("folderAccess");
    if (folderAccess !== "true") return;

    try {
      const dirHandle = await getFolderHandle();
      const fileHandle = await dirHandle.getFileHandle("sales.xlsx", { create: true });
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      let sheet = workbook.getWorksheet("Sales");
      if (!sheet) return;

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const billNoInRow = String(row.getCell(3).value).padStart(5, '0'); // Ensure matching format
        if (billNoInRow === itemToUpdate.billNo) {
          row.getCell(9).value = updatedStatus;
        }
      });

      const writable = await fileHandle.createWritable();
      await workbook.xlsx.write(writable);
      await writable.close();

      toast.success(`Payment status for Bill No. ${itemToUpdate.billNo} updated to ${updatedStatus}.`);

    } catch (err) {
      console.error("❌ Excel update error:", err);
      toast.error("⚠️ Couldn't update payment status. Close Excel if open and try again.");
    }
  };

  // Function to open the delete confirmation modal
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  // Function to handle the actual deletion after confirmation
  const executeDelete = async () => {
    setShowDeleteConfirm(false); // Close the confirmation modal

    if (!itemToDelete) return; // Should not happen if modal is opened correctly

    const folderAccess = Cookies.get("folderAccess");
    if (folderAccess !== "true") {
      toast.error("Folder access not granted. Cannot delete sales data.");
      return;
    }

    let dirHandle;
    try {
      dirHandle = await getFolderHandle();
      if (!dirHandle) throw new Error("No folder handle found in IDB.");
    } catch (err) {
      toast.error("Error accessing folder for deletion: " + err.message);
      return;
    }

    try {
      const fileHandle = await dirHandle.getFileHandle("sales.xlsx");
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      let sheet = workbook.getWorksheet("Sales");
      if (!sheet) {
        toast.error("Sales sheet not found in Excel file.");
        return;
      }

      let rowToDeleteNumber = -1;
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const billNoInRow = String(row.getCell(3).value).padStart(5, '0'); // Ensure matching format
        if (billNoInRow === itemToDelete.billNo) {
          rowToDeleteNumber = rowNumber;
          return false;
        }
      });

      if (rowToDeleteNumber !== -1) {
        sheet.spliceRows(rowToDeleteNumber, 1);
      } else {
        toast.warn("Bill not found in Excel file.");
        return;
      }

      const writable = await fileHandle.createWritable();
      await workbook.xlsx.write(writable);
      await writable.close();

      toast.success(`✅ Bill No. ${itemToDelete.billNo} deleted successfully!`);

      await loadSalesData();
      setItemToDelete(null); // Clear item after successful deletion

    } catch (err) {
      console.error("❌ Excel deletion error:", err);
      toast.error("⚠️ Couldn't delete sales data. Close Excel if open and try again.");
    }
  };

 const exportRow = (item) => {
    const slipWidth = 165; // 58mm in points (approx 58 * 2.83465)
    const marginX = 10; // Left/right margin
    const contentWidth = slipWidth - (2 * marginX);

    const baseLineHeight = 12; // Base line height for text rows
    const sectionSpacing = 15; // Space between major sections

    let currentY = 20; // Starting Y position

    // Get values from cookies with fallbacks
    const businessName = Cookies.get('businessName') || 'The Quantum Restaurant';
    const address = Cookies.get('address') || '123 Foodie Street, Taste City';
    const phone = Cookies.get('phone') || '+91-9876543210';
    const gst = Cookies.get('gst') || '22AAAAA0000A1Z5';
    // UPI details for QR code
    const upiName = Cookies.get('upiName') || 'A Aabhash Singh';
    const upiId = Cookies.get('upiId') || 'aabhashsingh2004@okhdfcbank';


    // Calculate dynamic height based on content
    let calculatedHeight = 0;

    // Header content height
    calculatedHeight += baseLineHeight * 4; // Business name, address, phone, GSTIN
    calculatedHeight += sectionSpacing; // Space after header line

    // Customer Info content height
    calculatedHeight += baseLineHeight * 3; // Bill No/Date, Customer, Mobile
    calculatedHeight += sectionSpacing; // Space after customer info line

    // Items list height
    calculatedHeight += baseLineHeight; // "Item" header
    calculatedHeight += item.items.length * baseLineHeight; // Each item's height
    calculatedHeight += sectionSpacing; // Space after items line

    // Total and Payment Mode height
    calculatedHeight += baseLineHeight * 2; // Total, Paid via
    calculatedHeight += sectionSpacing; // Space before UPI details

    // UPI Name and ID height
    calculatedHeight += baseLineHeight * 2; // UPI Name, UPI ID
    calculatedHeight += 5; // Small extra space

    // QR Code height
    const qrCodeSize = 90; // Increased QR code size
    if (typeof qr !== 'undefined' && qr) {
        calculatedHeight += qrCodeSize; // Add QR code height
        calculatedHeight += sectionSpacing; // Space after QR code
    }

    // Footer height
    calculatedHeight += baseLineHeight * 2; // Thank you, Created by
    calculatedHeight += 20; // Some extra padding at the bottom

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: [slipWidth, calculatedHeight]
    });

    // --- Drawing the content ---

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(businessName.toUpperCase(), slipWidth / 2, currentY, { align: "center" });
    currentY += baseLineHeight;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(address, slipWidth / 2, currentY, { align: "center" });
    currentY += baseLineHeight;
    doc.text(`Phone: ${phone}`, slipWidth / 2, currentY, { align: "center" });
    currentY += baseLineHeight;
    doc.text(`GSTIN: ${gst}`, slipWidth / 2, currentY, { align: "center" });
    currentY += baseLineHeight;

    doc.setLineWidth(0.3);
    doc.line(marginX, currentY, slipWidth - marginX, currentY);
    currentY += sectionSpacing;

    // Customer Info
    doc.setFontSize(9);
    doc.text(`Bill No: ${item.billNo}`, marginX, currentY);
    doc.text(`Date: ${new Date(item.date).toLocaleDateString()}`, slipWidth - marginX, currentY, { align: "right" });
    currentY += baseLineHeight;
    doc.text(`Customer: ${item.name}`, marginX, currentY);
    currentY += baseLineHeight;
    doc.text(`Mobile: ${item.mobile}`, marginX, currentY);
    currentY += baseLineHeight;

    doc.setLineWidth(0.2);
    doc.line(marginX, currentY, slipWidth - marginX, currentY);
    currentY += sectionSpacing;

    // Items Header
    doc.setFont("helvetica", "bold");
    doc.text("Item", marginX, currentY);
    doc.text("₹", slipWidth - marginX, currentY, { align: "right" });
    currentY += baseLineHeight; // Move past the header line

    // Items List
    doc.setFont("helvetica", "normal");
    item.items.forEach((itm) => {
        // Ensure item name and price are displayed on the same line
        doc.text(`${itm.name}`, marginX, currentY);
        doc.text(`${parseFloat(itm.price || 0).toFixed(2)}`, slipWidth - marginX, currentY, { align: "right" }); // Format price
        currentY += baseLineHeight;
    });

    currentY += 4; // Small extra spacing before line
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY, slipWidth - marginX, currentY);
    currentY += sectionSpacing;

    // Total
    doc.setFont("helvetica", "normal");
    doc.text("Total:", marginX, currentY);
    doc.text(`₹${parseFloat(item.amount || 0).toFixed(2)}`, slipWidth - marginX, currentY, { align: "right" });
    currentY += baseLineHeight;

    // Payment Mode
    doc.setFont("helvetica", "normal");
    doc.text(`Paid via: ${item.mode}`, marginX, currentY);
    currentY += baseLineHeight;
    currentY += sectionSpacing; // Space before UPI details

    // UPI Details (added these for completeness, as they appear on the slip)
    doc.setFontSize(8);

    // QR Code if available
    if (typeof qr !== 'undefined' && qr) {
        const qrX = (slipWidth - qrCodeSize) / 2; // Center the QR code
        doc.addImage(qr, 'jpg', qrX, currentY, qrCodeSize, qrCodeSize);
        currentY += qrCodeSize; // Advance Y by QR code height
        currentY += sectionSpacing; // Space after QR code
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("Thank you! Visit again ", slipWidth / 2, currentY, { align: "center" });
    currentY += baseLineHeight;
    doc.text("Created by Quantum Ledger", slipWidth / 2, currentY, { align: "center" });

    doc.save(`Bill_${item.billNo}.pdf`);
};

  const exportAll = () => {
    html2canvas(document.querySelector("#sales-table")).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, 'PNG', 5, 5);
      pdf.save("Sales_Report.pdf");
    });
  };

  const filteredSales = salesData.filter(item => {
    const itemDate = new Date(item.date);
    const matchesDate = itemDate >= startDate && itemDate <= endDate;
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) || item.id?.toLowerCase().includes(search.toLowerCase());
    return matchesDate && matchesSearch;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);


  return (
    <Container fluid className="p-4">
      <h2 className="mb-3 fw-bold">Sales</h2>

      <Row className="mb-3 text-center">
        <Col md={6}>
          <div style={salesStyles.card}>
            <h6 className="mb-0">Revenue this month</h6>
            <h4>₹10,398 <span className="text-success">+ ₹498</span></h4>
          </div>
        </Col>
        <Col md={6}>
          <div style={salesStyles.card}>
            <h6 className="mb-0">Profit this month</h6>
            <h4>₹3,982 <span className="text-success">+ ₹198</span></h4>
          </div>
        </Col>
      </Row>

      <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
        <Nav variant="tabs">
          <Nav.Item><Nav.Link eventKey="bill">Bill</Nav.Link></Nav.Item>
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey="bill">
            <Row className="mt-3 align-items-center sales-filter-row">
              <Col xs={12} md={3} className="mb-3 mb-md-0">
                <Form.Control type="text" placeholder="Search name or table number..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </Col>
              <Col xs={12} md={4} className="mb-3 mb-md-0">
                <div style={salesStyles.datePickerContainer}>
                  <FaCalendarAlt className="me-2" />
                  <DatePicker selectsRange startDate={startDate} endDate={endDate} onChange={(dates) => {
                    const [start, end] = dates;
                    setStartDate(start);
                    setEndDate(end || start);
                  }} className="form-control me-3" placeholderText="Select date range" />
                </div>
              </Col>
              <Col xs={12} md={3} className="mb-3 mb-md-0 text-md-start text-center">
                <Button variant="primary" className="w-100 w-md-auto" style={salesStyles.generateBillButton} onClick={() => setShowModal(true)}>Generate Bill</Button>
              </Col>
              <Col xs={12} md={2} className="text-md-end text-center">
                <Button variant="primary" className="w-100 w-md-auto" onClick={exportAll} style={salesStyles.exportButton}><FaDownload className="me-2" />Export</Button>
              </Col>
            </Row>

            <div id="sales-table" className="mt-4" style={salesStyles.tableContainer}> {/* Added salesStyles.tableContainer here */}
              <Table responsive bordered hover>
                <thead className="table-light">
                  <tr>
                    <th>Table No.</th>
                    <th>Customer Name</th>
                    <th>Bill No.</th>
                    <th>Customer Mobile no.</th>
                    <th style={{ width: '20%' }}>Items</th>
                    <th>Total Amount</th>
                    <th>Payment Mode</th>
                    <th className="border px-2 py-1">Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSales.length === 0 ? (
                    <tr><td colSpan="9" className="text-center text-muted">No data found</td></tr>
                  ) : (
                    currentSales.map((item, index) => (
                      <tr key={item.billNo}>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.billNo}</td>
                        <td>{item.mobile}</td>
                        <td>
                          <ul style={salesStyles.unstyledList}>
                            {item.items.map((itm, idx) => (
                              <li key={idx}>{itm.name} - {itm.price}</li>))}
                          </ul>
                        </td>
                        <td>{item.amount}</td>
                        <td className="text-success">{item.mode}</td>
                        <td className="border px-2 py-1">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            style={item.status === "Paid" ? salesStyles.paidButton : salesStyles.unpaidButton}
                            onClick={() => togglePaymentStatus(item)}
                          >
                            {item.status || "Unpaid"}
                          </motion.button>
                        </td>
                        <td>
                          <div style={salesStyles.actionButtonsContainer}>
                            <Button size="sm" variant="light" onClick={() => exportRow(item)} style={salesStyles.actionButton}>
                              <FaPrint />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => confirmDelete(item)} style={salesStyles.actionButton}>
                              <FaTrashAlt />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Pagination className="justify-content-center mt-3">
                  <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                  {[...Array(totalPages).keys()].map(number => (
                    <Pagination.Item key={number + 1} active={number + 1 === currentPage} onClick={() => paginate(number + 1)}>
                      {number + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                </Pagination>
              )}
            </div>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <AnimatePresence>
        {showModal && (
          <Modal show centered size="lg" onHide={() => setShowModal(false)} backdrop="static">
            <motion.div key="modal" initial={{ y: "-100vh", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100vh", opacity: 0 }} transition={{ type: "spring", damping: 25 }}>
              <Modal.Header closeButton>
                <Modal.Title className="fw-bold">Generate Bill</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Row className="mb-3">
                    <Col><Form.Control placeholder="Table Number" value={customer.id} onChange={(e) => setCustomer({ ...customer, id: e.target.value })} /></Col>
                    <Col><Form.Control placeholder="Customer Name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></Col>
                  </Row>
                  <Row className="mb-3">
                    <Col><Form.Control value={nextBillNo} readOnly /></Col>
                    <Col><Form.Control placeholder="Mobile No." type="tel" value={customer.mobile} onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })} /></Col>
                  </Row>
                  <Row className="mb-3">
                    <Col><Form.Control placeholder="Amount" value={customer.amount} readOnly/></Col>
                    <Col>
                      <Form.Select value={customer.mode} onChange={(e) => setCustomer({ ...customer, mode: e.target.value })}>
                        <option value="">Select Payment Mode</option>
                        <option value="Online">Online</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  <hr />
                  <h5 className="mb-3">Items</h5>
                  {items.map((item, idx) => (
                    <Row key={idx} className="mb-2">
                      <Col><Form.Control placeholder="Item Name" value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} /></Col>
                      <Col><Form.Control placeholder="Price" type="number" value={item.price} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} /></Col>
                    </Row>
                  ))}
                  <Button variant="secondary" onClick={handleAddItem} className="mb-3">+ Add More Item</Button>

                  <div className="text-end">
                    <Button variant="success" onClick={handleSave}>Generate and Save</Button>
                  </div>
                </Form>
              </Modal.Body>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {itemToDelete && (
            <p>Are you sure you want to delete **Bill No. {itemToDelete.billNo}** for **{itemToDelete.name}**?</p>
          )}
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={executeDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

// Styles object defined below the component for clarity
const salesStyles = {
  card: {
    border: '1px solid #dee2e6',
    padding: '1rem',
    borderRadius: '0.25rem',
    boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
    backgroundColor: '#f8f9fa'
  },
  datePickerContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  generateBillButton: {
    // Adjusted for better responsiveness
  },
  exportButton: {
    // Adjusted for better responsiveness
  },
  paidButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    minWidth: '90%',
    transition: 'background-color 0.2s ease-in-out, transform 0.1s ease-in-out',
  },
  unpaidButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    minWidth: '90%',
    transition: 'background-color 0.2s ease-in-out, transform 0.1s ease-in-out',
  },
  unstyledList: {
    listStyle: 'none',
    marginBottom: '0',
    paddingLeft: '0'
  },
  actionButtonsContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    // No longer need marginRight due to gap in container
  },
  tableContainer: {
    overflowX: 'auto', // Ensures horizontal scrolling on small screens
  }
};

export default Sales;