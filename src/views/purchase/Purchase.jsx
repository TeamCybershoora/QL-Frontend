import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Table, Form, Button, Tab, Nav, Modal, Pagination
} from 'react-bootstrap';
import { FaDownload, FaPrint, FaTrashAlt, FaCalendarAlt } from 'react-icons/fa';
import { getFolderHandle } from '../FolderDB.jsx';
import jsPDF from 'jspdf';
import html22canvas from 'html2canvas'; // Corrected typo here, assuming it was meant to be html2canvas
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Cookies from 'js-cookie';
import ExcelJS from "exceljs";
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';
// No need to import a separate CSS file anymore

function Purchase() {
  const [key, setKey] = useState('bill');
  const [startDate, setStartDate] = useState(new Date('2025-01-01'));
  const [endDate, setEndDate] = useState(new Date('2025-12-31'));
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [purchaseData, setPurchaseData] = useState([]);
  const [nextIdNo, setNextIdNo] = useState("00101");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [newPurchase, setNewPurchase] = useState({
    inventory: '',
    maxProducts: '',
    mobile: '',
    amountPerPiece: '',
    mode: ''
  });

  const loadPurchaseData = async () => {
    const folderAccess = Cookies.get("folderAccess");
    if (!folderAccess || folderAccess !== "true") {
      console.warn("Folder access not granted. Cannot load purchase data.");
      setPurchaseData([]);
      setNextIdNo("00101");
      return;
    }

    let dirHandle;
    try {
      dirHandle = await getFolderHandle();
      if (!dirHandle) throw new Error("No folder handle found in IDB.");
    } catch (err) {
      console.warn("Could not get folder handle:", err.message);
      setPurchaseData([]);
      setNextIdNo("00101");
      return;
    }

    try {
      const fileHandle = await dirHandle.getFileHandle("purchase.xlsx", { create: false });
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Purchase");
      const tempPurchase = [];
      let maxID = 100;

      if (sheet) {
        sheet.eachRow((row, index) => {
          if (index === 1) return;
          const values = row.values.slice(1);
          if (values.length >= 8) {
            const [id, inventory, maxProducts, mobile, amount, mode, dateStr, status] = values;

            if (id && !isNaN(parseInt(id))) {
              tempPurchase.push({
                id: String(id).padStart(5, '0'),
                inventory,
                maxProducts,
                mobile,
                amount,
                mode,
                date: new Date(dateStr),
                status: status || "Unpaid"
              });
              maxID = Math.max(maxID, parseInt(id));
            }
          }
        });
      }
      tempPurchase.sort((a, b) => parseInt(b.id) - parseInt(a.id));

      setPurchaseData(tempPurchase);
      setNextIdNo((maxID + 1).toString().padStart(5, '0'));
    } catch (err) {
      console.warn("Error loading purchase.xlsx:", err.message);
      setPurchaseData([]);
      setNextIdNo("00101");
    }
  };

  useEffect(() => {
    loadPurchaseData();
  }, []);

  const togglePaymentStatus = async (itemToUpdate) => {
    const updatedStatus = itemToUpdate.status === "Paid" ? "Unpaid" : "Paid";

    const updatedPurchaseData = purchaseData.map(item =>
      item.id === itemToUpdate.id ? { ...item, status: updatedStatus } : item
    );
    setPurchaseData(updatedPurchaseData);

    const folderAccess = Cookies.get("folderAccess");
    if (folderAccess !== "true") {
      toast.error("Folder access not granted.");
      return;
    }

    try {
      const dirHandle = await getFolderHandle();
      const fileHandle = await dirHandle.getFileHandle("purchase.xlsx", { create: false });
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      let sheet = workbook.getWorksheet("Purchase");
      if (!sheet) {
        toast.error("Purchase sheet not found in Excel file.");
        return;
      }

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const idInRow = String(row.getCell(1).value).padStart(5, '0');
        if (idInRow === itemToUpdate.id) {
          row.getCell(8).value = updatedStatus;
          return false;
        }
      });

      const writable = await fileHandle.createWritable();
      await workbook.xlsx.write(writable);
      await writable.close();

      toast.success(`✅ Payment status for ID ${itemToUpdate.id} updated to ${updatedStatus}.`);

    } catch (err) {
      console.error("❌ Excel update error:", err);
      toast.error("⚠️ Couldn't update payment status. Close Excel if open and try again.");
    }
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    setShowDeleteConfirm(false);

    if (!itemToDelete) return;

    const folderAccess = Cookies.get("folderAccess");
    if (folderAccess !== "true") {
      toast.error("Folder access not granted. Cannot delete purchase data.");
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
      const fileHandle = await dirHandle.getFileHandle("purchase.xlsx");
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      let sheet = workbook.getWorksheet("Purchase");
      if (!sheet) {
        toast.error("Purchase sheet not found in Excel file.");
        return;
      }

      let rowToDeleteNumber = -1;
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const idInRow = String(row.getCell(1).value).padStart(5, '0');
        if (idInRow === itemToDelete.id) {
          rowToDeleteNumber = rowNumber;
          return false;
        }
      });

      if (rowToDeleteNumber !== -1) {
        sheet.spliceRows(rowToDeleteNumber, 1);
      } else {
        toast.warn("Purchase ID not found in Excel file.");
        return;
      }

      const writable = await fileHandle.createWritable();
      await workbook.xlsx.write(writable);
      await writable.close();

      toast.success(`✅ Purchase ID ${itemToDelete.id} deleted successfully!`);

      await loadPurchaseData();
      setItemToDelete(null);

    } catch (err) {
      console.error("❌ Excel deletion error:", err);
      toast.error("⚠️ Couldn't delete purchase data. Close Excel if open and try again.");
    }
  };

  const handleSave = async () => {
    let dirHandle;
    const folderAccess = Cookies.get("folderAccess");

    if (
      !newPurchase.inventory ||
      !newPurchase.maxProducts ||
      !newPurchase.mobile ||
      !newPurchase.amountPerPiece ||
      !newPurchase.mode
    ) {
      toast.error("Please fill in all purchase details.");
      return;
    }

    const maxProductsNum = parseFloat(newPurchase.maxProducts);
    const amountPerPieceNum = parseFloat(newPurchase.amountPerPiece);

    if (isNaN(maxProductsNum) || maxProductsNum <= 0) {
      toast.error("Max Products must be a valid positive number.");
      return;
    }
    if (isNaN(amountPerPieceNum) || amountPerPieceNum <= 0) {
      toast.error("Amount per piece must be a valid positive number.");
      return;
    }
    if (newPurchase.mobile.length !== 10 || !/^\d+$/.test(newPurchase.mobile)) {
        toast.error("Mobile number must be 10 digits.");
        return;
    }

    const totalAmountCalculated = (maxProductsNum * amountPerPieceNum).toFixed(2);

    try {
      if (folderAccess !== "true") throw new Error("Folder access denied");
      dirHandle = await getFolderHandle();
      if (!dirHandle) throw new Error("No folder handle in storage.");
      const permission = await dirHandle.queryPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        const request = await dirHandle.requestPermission({ mode: "readwrite" });
        if (request !== "granted") throw new Error("Permission denied for folder.");
      }
    } catch (err) {
      toast.error("⚠️ Folder access is required to save the file: " + err.message);
      return;
    }

    let fileHandle;
    try {
      fileHandle = await dirHandle.getFileHandle("purchase.xlsx", { create: true });
    } catch (err) {
      toast.error("Error accessing file: " + err.message);
      return;
    }

    const workbook = new ExcelJS.Workbook();
    let sheet;

    try {
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);
      sheet = workbook.getWorksheet("Purchase");
      if (!sheet) sheet = workbook.addWorksheet("Purchase");
    } catch (err) {
      sheet = workbook.addWorksheet("Purchase");
    }

    const HEADER = ["ID", "Inventory", "Max Products", "Mobile", "Amount", "Payment Mode", "Date", "Payment Status"];

    if (sheet.rowCount === 0 || sheet.getRow(1).values.slice(1).join(',') !== HEADER.join(',')) {
      sheet.spliceRows(1, sheet.rowCount);
      sheet.addRow(HEADER);
    }

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    const newEntryData = [
      nextIdNo,
      newPurchase.inventory,
      newPurchase.maxProducts,
      newPurchase.mobile,
      totalAmountCalculated,
      newPurchase.mode,
      formattedDate,
      "Unpaid"
    ];

    sheet.addRow(newEntryData);

    try {
      const freshHandle = await dirHandle.getFileHandle("purchase.xlsx", { create: true });
      const writable = await freshHandle.createWritable();
      await workbook.xlsx.write(writable);
      await writable.close();
    } catch (err) {
      toast.error("⚠️ Failed to write to file. Close Excel if open and try again.");
      console.error("Write Error:", err);
      return;
    }

    toast.success("✅ Purchase saved successfully!");

    await loadPurchaseData();

    setNewPurchase({
      inventory: '',
      maxProducts: '',
      mobile: '',
      amountPerPiece: '',
      mode: ''
    });
    setShowAddModal(false);
  };

  const exportRow = (item) => {
    const slipWidth = 80;
    const baseHeight = 50;
    const fieldsCount = 7;
    const lineHeight = 7;
    const estimatedHeight = baseHeight + (fieldsCount * lineHeight);

    const doc = new jsPDF({
      unit: "mm",
      format: [slipWidth, estimatedHeight],
    });

    let y = 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Purchase Receipt", slipWidth / 2, y, { align: "center" });
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(item.date).toLocaleDateString()}`, 10, y);
    y += 6;

    doc.line(5, y, slipWidth - 5, y);
    y += 6;

    const row = (label, value) => {
      doc.text(`${label}:`, 10, y);
      doc.text(`${value}`, slipWidth - 10, y, { align: "right" });
      y += lineHeight;
    };

    row("Purchase ID", item.id);
    row("Inventory", item.inventory);
    row("Max Products", item.maxProducts);
    row("Total Amount", `₹ ${item.amount}`);
    row("Mobile", item.mobile);
    row("Mode", item.mode);
    row("Status", item.status);

    y += 2;
    doc.line(5, y, slipWidth - 5, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for your purchase!", slipWidth / 2, y, { align: "center" });

    doc.save(`Purchase_${item.id}.pdf`);
  };

  const exportAll = () => {
    html2canvas(document.querySelector("#purchase-table")).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, 'PNG', 5, 5, 200, canvas.height * (200 / canvas.width));
      pdf.save("Purchase_Report.pdf");
    });
  };

  const filteredPurchases = purchaseData.filter(item => {
    const itemDate = new Date(item.date);
    const matchesDate = itemDate >= startDate && itemDate <= endDate;
    const matchesSearch =
      item.id?.toLowerCase().includes(search.toLowerCase()) ||
      item.inventory?.toLowerCase().includes(search.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const totalAmount = filteredPurchases.reduce((acc, item) => {
    return acc + (parseFloat(item.amount) || 0);
  }, 0);

  Cookies.set("totalAmountPurchases", totalAmount.toString(), { expires: 365 });

  const unpaidPurchases = filteredPurchases.filter(item => item.status === "Unpaid");

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPurchases = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);


  return (
    <Container fluid style={purchaseStyles.container}>
      <h2 style={purchaseStyles.heading}>Purchase</h2>

      <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
        <Nav variant="tabs">
          <Nav.Item><Nav.Link eventKey="bill">All Purchases</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="payment">Unpaid Purchases</Nav.Link></Nav.Item>
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey="bill">
            <Row className="mt-3" style={purchaseStyles.filterRow}>
              <Col xs={12} md={3} className="mb-3 mb-md-0">
                <Form.Control type="text" placeholder="Search ID or Inventory..." value={search} onChange={(e) => setSearch(e.target.value)} style={purchaseStyles.searchInput} />
              </Col>
              <Col xs={12} md={4} className="mb-3 mb-md-0">
                <div style={purchaseStyles.datePickerContainer}>
                  <FaCalendarAlt style={purchaseStyles.calendarIcon} />
                  <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(dates) => {
                      const [start, end] = dates;
                      setStartDate(start);
                      setEndDate(end || start);
                    }}
                    className="form-control" // Keep Bootstrap class for basic styling
                    style={purchaseStyles.datePicker}
                    placeholderText="Select date range"
                  />
                </div>
              </Col>
              <Col xs={12} md={3} className="mb-3 mb-md-0 text-md-start text-center">
                <Button variant="primary" className="w-100 w-md-auto" style={purchaseStyles.addButton} onClick={() => setShowAddModal(true)}>Add Purchase</Button>
              </Col>
              <Col xs={12} md={2} className="text-md-end text-center">
                <motion.button
                    // whileHover aur transition ko hata sakte hain agar aapko sirf CSS shine chahiye
                    // ya retain kar sakte hain agar aapko shine ke saath scale effect bhi chahiye
                    whileHover={{ scale: 1.05 }} // Scale effect (optional, if you want it with shine)
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="btn btn-primary w-100 w-md-auto export-button-shine" // **Yeh naya class add karein**
                    // style={purchaseStyles.exportButton} // Yeh style object ko hata sakte hain agar saare styles CSS class mein hain
                    onClick={exportAll}
                >
                    <FaDownload style={purchaseStyles.iconSpacing} />Export
                </motion.button>
            </Col>
            </Row>

            <div id="purchase-table" style={purchaseStyles.tableContainer}>
              <Table responsive bordered hover>
                <thead style={purchaseStyles.tableHeader}>
                  <tr>
                    <th>ID</th>
                    <th>Inventory</th>
                    <th>Max Products</th>
                    <th>Mobile No.</th>
                    <th>Total Amount</th>
                    <th>Payment Mode</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPurchases.length === 0 ? (
                    <tr><td colSpan="8" style={purchaseStyles.noData}>No data found</td></tr>
                  ) : (
                    currentPurchases.map((item) => (
                      <tr key={item.id}>
                        <td data-label="ID">{item.id}</td>
                        <td data-label="Inventory">{item.inventory}</td>
                        <td data-label="Max Products">{item.maxProducts}</td>
                        <td data-label="Mobile No.">{item.mobile}</td>
                        <td data-label="Total Amount">₹ {item.amount}</td>
                        <td data-label="Payment Mode" style={purchaseStyles.paymentMode}>{item.mode}</td>
                        <td data-label="Payment Status" style={purchaseStyles.paymentStatusCell}>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            style={item.status === "Paid" ? purchaseStyles.paidButton : purchaseStyles.unpaidButton}
                            onClick={() => togglePaymentStatus(item)}
                          >
                            {item.status}
                          </motion.button>
                        </td>
                        <td data-label="Action">
                          <div style={purchaseStyles.actionButtonsContainer}>
                            <Button size="sm" variant="light" onClick={() => exportRow(item)} style={purchaseStyles.actionButton}>
                              <FaPrint />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => confirmDelete(item)} style={purchaseStyles.actionButton}>
                              <FaTrashAlt />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" style={purchaseStyles.totalCell}>Total</td>
                    <td style={purchaseStyles.totalAmount}>₹ {totalAmount.toFixed(2)}</td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              </Table>
              {totalPages > 1 && (
                <Pagination className="justify-content-center mt-3">
                  <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
                  {[...Array(totalPages).keys()].map(number => (
                    <Pagination.Item key={number + 1} active={number + 1 === currentPage} onClick={() => paginate(number + 1)}>
                      {number + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} />
                </Pagination>
              )}
            </div>
          </Tab.Pane>
          <Tab.Pane eventKey="payment">
            <div style={purchaseStyles.tableContainer}>
              <Table responsive bordered hover>
                <thead style={purchaseStyles.tableHeader}>
                  <tr>
                    <th>ID</th>
                    <th>Inventory</th>
                    <th>Max Products</th>
                    <th>Mobile No.</th>
                    <th>Total Amount</th>
                    <th>Payment Mode</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidPurchases.length === 0 ? (
                    <tr><td colSpan="8" style={purchaseStyles.noData}>No unpaid purchases found</td></tr>
                  ) : (
                    unpaidPurchases.map((item) => (
                      <tr key={item.id}>
                        <td data-label="ID">{item.id}</td>
                        <td data-label="Inventory">{item.inventory}</td>
                        <td data-label="Max Products">{item.maxProducts}</td>
                        <td data-label="Mobile No.">{item.mobile}</td>
                        <td data-label="Total Amount">₹ {item.amount}</td>
                        <td data-label="Payment Mode" style={purchaseStyles.paymentMode}>{item.mode}</td>
                        <td data-label="Payment Status" style={purchaseStyles.paymentStatusCell}>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            style={item.status === "Paid" ? purchaseStyles.paidButton : purchaseStyles.unpaidButton}
                            onClick={() => togglePaymentStatus(item)}
                          >
                            {item.status}
                          </motion.button>
                        </td>
                        <td data-label="Action">
                          <div style={purchaseStyles.actionButtonsContainer}>
                            <Button size="sm" variant="light" onClick={() => exportRow(item)} style={purchaseStyles.actionButton}>
                              <FaPrint />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <AnimatePresence>
        {showAddModal && (
          <Modal show centered size="lg" onHide={() => setShowAddModal(false)} backdrop="static">
            <motion.div key="modal" initial={{ y: "-100vh", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100vh", opacity: 0 }} transition={{ type: "spring", damping: 25 }}>
              <Modal.Header closeButton>
                <Modal.Title style={purchaseStyles.modalTitle}>Add Purchase</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Row style={purchaseStyles.modalRow}>
                    <Col><Form.Control value={nextIdNo} readOnly style={purchaseStyles.formControl} /></Col>
                    <Col><Form.Control placeholder="Item Name" value={newPurchase.inventory} onChange={(e) => setNewPurchase({ ...newPurchase, inventory: e.target.value })} style={purchaseStyles.formControl} /></Col>
                  </Row>
                  <Row style={purchaseStyles.modalRow}>
                    <Col><Form.Control placeholder="Number Of Products" type="number" value={newPurchase.maxProducts} onChange={(e) => setNewPurchase({ ...newPurchase, maxProducts: e.target.value })} style={purchaseStyles.formControl} /></Col>
                    <Col><Form.Control placeholder="Mobile No." type="tel" value={newPurchase.mobile} onChange={(e) => setNewPurchase({ ...newPurchase, mobile: e.target.value })} style={purchaseStyles.formControl} /></Col>
                  </Row>
                  <Row style={purchaseStyles.modalRow}>
                    <Col>
                      <Form.Control
                        placeholder="Amount per piece"
                        type="number"
                        value={newPurchase.amountPerPiece}
                        onChange={(e) => setNewPurchase({ ...newPurchase, amountPerPiece: e.target.value })}
                        style={purchaseStyles.formControl}
                      />
                    </Col>
                    <Col>
                      <Form.Select value={newPurchase.mode} onChange={(e) => setNewPurchase({ ...newPurchase, mode: e.target.value })} style={purchaseStyles.formControl}>
                        <option value="">Select Payment Mode</option>
                        <option value="Online">Online</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                      </Form.Select>
                    </Col>
                  </Row>
                  <div className="text-end">
                    <Button variant="success" onClick={handleSave} style={purchaseStyles.saveButton}>Save Purchase</Button>
                  </div>
                </Form>
              </Modal.Body>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {itemToDelete && (
            <p>Are you sure you want to delete **Purchase ID {itemToDelete.id}** for **{itemToDelete.inventory}**?</p>
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
// --- Styles Object ---
const purchaseStyles = {
  container: {
    padding: '1.5rem',
  },
  heading: {
    marginBottom: '1.5rem',
    fontWeight: 'bold',
  },
  filterRow: {
    marginTop: '1.5rem',
    alignItems: 'center',
  },
  searchInput: {
    // Add any specific styles for search input here
    // Example: border: '1px solid #ccc', borderRadius: '4px', padding: '0.375rem 0.75rem',
  },
  datePickerContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: '0.5rem',
  },
  datePicker: {
    // Add any specific styles for date picker here
    // Example: width: '100%', padding: '0.375rem 0.75rem', borderRadius: '4px', border: '1px solid #ccc',
  },
  addButton: {
    // Bootstrap handles most of this, but if you need custom margin:
    // marginLeft: '5rem', // You had this, but for responsiveness, consider Bootstrap's ms-auto or utility classes
  },
  
  iconSpacing: {
    marginRight: '0.5rem',
  },
  tableContainer: {
    marginTop: '1rem',
    overflowX: 'auto', // Ensures responsiveness for tables
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  paymentMode: {
    color: '#198754', // Bootstrap success color
  },
  paymentStatusCell: {
    border: '1px solid #dee2e6',
    padding: '0.25rem 0.5rem',
    textAlign: 'center', // Center the button within the cell
  },
  paidButton: {
    backgroundColor: '#28a745', // Green
    color: '#fff',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    minWidth: '90%', // Ensure button takes up most of the space
    transition: 'background-color 0.2s ease-in-out, transform 0.1s ease-in-out',
  },
  unpaidButton: {
    backgroundColor: '#dc3545', // Red
    color: '#fff',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    minWidth: '90%',
    transition: 'background-color 0.2s ease-in-out, transform 0.1s ease-in-out',
  },
  actionButtonsContainer: {
    display: 'flex',
    gap: '0.5rem', // Space between action buttons
    alignItems: 'center',
    justifyContent: 'center', // Center action buttons within their cell
  },
  actionButton: {
    // No specific styles here as gap handles spacing
  },
  noData: {
    textAlign: 'center',
    color: '#6c757d', // Muted text color
  },
  totalCell: {
    textAlign: 'end',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#0d6efd', // Primary blue color
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  modalRow: {
    marginBottom: '1rem', // Bootstrap mb-3 equivalent
  },
  formControl: {
    // Add any specific styles for form controls in modal
    // Example: border: '1px solid #ced4da', borderRadius: '0.25rem', padding: '0.375rem 0.75rem',
  },
  saveButton: {
    // Add any specific styles for save button in modal
  },
};
export default Purchase;