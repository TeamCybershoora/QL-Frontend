// Your imports remain the same
import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Table, Form, Button, Tab, Nav, Modal
} from 'react-bootstrap';
import { FaSearch, FaCalendarAlt, FaDownload, FaPrint } from 'react-icons/fa';
import { saveFolderHandle, getFolderHandle } from '../FolderDB.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Cookies from 'js-cookie';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { AnimatePresence, motion } from 'framer-motion';

function Purchase() {
  const [key, setKey] = useState('bill');
  const [startDate, setStartDate] = useState(new Date('2025-01-01'));
  const [endDate, setEndDate] = useState(new Date('2025-12-31'));
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [purchaseData, setPurchaseData] = useState([]);

  const [purchase, setPurchase] = useState({
    id: '',
    inventory: '',
    maxProducts: '',
    mobile: '',
    amount: '',
    mode: ''
  });

  useEffect(() => {
    (async () => {
      const folderAccess = Cookies.get("folderAccess");
      if (!folderAccess || folderAccess !== "true") return;

      let dirHandle;
      try {
        dirHandle = await getFolderHandle();
        if (!dirHandle) throw new Error("No folder handle in IDB");
      } catch (err) {
        console.warn("Could not get folder handle:", err.message);
        return;
      }

      try {
        const fileHandle = await dirHandle.getFileHandle("purchase.xlsx", { create: true });
        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.getWorksheet("Purchase");
        const tempPurchase = [];

        sheet?.eachRow((row, index) => {
          if (index === 1) return;
          const [id, inventory, maxProducts, mobile, amount, mode, dateStr] = row.values.slice(1);
          if (id === "ID") return; // skip duplicate header if any
          tempPurchase.push({ id, inventory, maxProducts, mobile, amount, mode, date: new Date(dateStr) });
        });

        setPurchaseData(tempPurchase);
      } catch (err) {
        console.warn("Error loading file:", err.message);
      }
    })();
  }, []);

 const handleSave = async () => {
  let dirHandle;
  const folderAccess = Cookies.get("folderAccess");

  try {
    if (folderAccess === "true") {
      dirHandle = await getFolderHandle();
      if (!dirHandle) throw new Error("No folder handle in storage.");
      const permission = await dirHandle.queryPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        const request = await dirHandle.requestPermission({ mode: "readwrite" });
        if (request !== "granted") throw new Error("Permission denied for folder.");
      }
    }
  } catch (err) {
    alert("Folder access denied.");
    return;
  }

  let fileHandle;
  try {
    fileHandle = await dirHandle.getFileHandle("purchase.xlsx", { create: true });
  } catch (err) {
    alert("Error accessing file.");
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

  const HEADER = ["ID", "Inventory", "Max Products", "Mobile", "Amount", "Payment Mode", "Date"];
  const today = new Date().toISOString().split("T")[0];

  const newEntry = [
    purchase.id,
    purchase.inventory,
    purchase.maxProducts,
    purchase.mobile,
    purchase.amount,
    purchase.mode,
    today,
  ];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const validData = [];

  sheet.eachRow((row, index) => {
    const cells = row.values.slice(1);

    if (index === 1 || cells[0] === "ID" || typeof cells[0] === "string") return;

    const rowDate = new Date(cells[6]);
    if (!isNaN(rowDate) && rowDate >= cutoffDate) {
      validData.push(cells);
    }
  });

  validData.push(newEntry);

  // Remove exact duplicates
  const seen = new Set();
  const finalData = validData.filter((row) => {
    const key = row.join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Clear previous data rows only, keep or add header
  sheet.spliceRows(2, sheet.rowCount - 1);
  if (!sheet.getRow(1).values.includes("ID")) {
    sheet.insertRow(1, HEADER);
  }

  finalData.forEach((row) => sheet.addRow(row));

  const writable = await fileHandle.createWritable();
  await workbook.xlsx.write(writable);
  await writable.close();

  const updatedData = finalData.map((r) => ({
    id: r[0],
    inventory: r[1],
    maxProducts: r[2],
    mobile: r[3],
    amount: r[4],
    mode: r[5],
    date: new Date(r[6]),
  }));

  setPurchaseData(updatedData);
  setShowModal(false);
  window.location.reload();
};
const exportRow = (item) => {
  const slipWidth = 80; // mm

  // Estimate height: 10 lines base + 7 lines per row
  const baseHeight = 50; // header + footer
  const rowsCount = 6; // total fields we're displaying
  const lineHeight = 7;
  const estimatedHeight = baseHeight + (rowsCount * lineHeight);

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
  row("Mobile", item.mobile);
  row("Amount", `₹ ${item.amount}`);
  row("Mode", item.mode);

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
      pdf.addImage(imgData, 'PNG', 5, 5);
      pdf.save("Purchase_Report.pdf");
    });
  };
  
  const filteredPurchases = purchaseData.filter(item => {
    const matchesDate = item.date >= startDate && item.date <= endDate;
    const matchesSearch = item.id?.toLowerCase().includes(search.toLowerCase()) || item.inventory?.toLowerCase().includes(search.toLowerCase());
    return matchesDate && matchesSearch;
  });
  const totalAmount = filteredPurchases.reduce((acc, item) => {
  return acc + (parseFloat(item.amount) || 0);
}, 0);
Cookies.set("totalAmountPurchases", totalAmount.toString(), { expires: 365 });
  return (
    <Container fluid className="p-4">
      <h2 className="mb-3 fw-bold">Purchase</h2>

      <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
        <Nav variant="tabs">
          <Nav.Item><Nav.Link eventKey="bill">Bill</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="payment">Payment Done</Nav.Link></Nav.Item>
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey="bill">
            <Row className="mt-3 align-items-center">
              <Col md={3}>
                <Form.Control type="text" placeholder="Search ID or Inventory..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </Col>
              <Col md={4}>
                <div className="d-flex align-items-center">
                  <FaCalendarAlt className="m-2" />
                  <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(dates) => {
                      const [start, end] = dates;
                      setStartDate(start);
                      setEndDate(end || start);
                    }}
                    className="form-control me-3"
                    placeholderText="Select date range"
                  />
                </div>
              </Col>
              <Col md={3}>
                <Button variant="primary" style={{ marginLeft: "5rem" }} onClick={() => setShowModal(true)}>Add Purchase</Button>
              </Col>
              <Col md={2} className="text-end">
                <Button variant="primary" onClick={exportAll}><FaDownload className="me-2" />Export</Button>
              </Col>
            </Row>

            <div id="purchase-table" className="mt-4">
              <Table responsive bordered hover>
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Inventory</th>
                    <th>Max Products</th>
                    <th>Mobile No.</th>
                    <th>Total Amount</th>
                    <th>Payment Mode</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.length === 0 ? (
                    <tr><td colSpan="7" className="text-center text-muted">No data found</td></tr>
                  ) : (
                    filteredPurchases.map((item, index) => (
                      <tr key={index}>
                        <td>{item.id}</td>
                        <td>{item.inventory}</td>
                        <td>{item.maxProducts}</td>
                        <td>{item.mobile}</td>
                        <td>{item.amount}</td>
                        <td className="text-success">{item.mode}</td>
                        <td>
                          <Button size="sm" variant="light" onClick={() => exportRow(item)}>
                            <FaPrint />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">Total</td>
                    <td className="fw-bold text-primary">₹ {totalAmount.toFixed(2)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </Tab.Pane>
          <Tab.Pane eventKey="payment">
            <div className="text-center mt-4 text-muted">No Payment Done</div>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <AnimatePresence>
        {showModal && (
          <Modal show centered size="lg" onHide={() => setShowModal(false)} backdrop="static">
            <motion.div key="modal" initial={{ y: "-100vh", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100vh", opacity: 0 }} transition={{ type: "spring", damping: 25 }}>
              <Modal.Header closeButton>
                <Modal.Title className="fw-bold">Add Purchase</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Row className="mb-3">
                    <Col><Form.Control placeholder="ID" onChange={(e) => setPurchase({ ...purchase, id: e.target.value })} /></Col>
                    <Col><Form.Control placeholder="Inventory" onChange={(e) => setPurchase({ ...purchase, inventory: e.target.value })} /></Col>
                  </Row>
                  <Row className="mb-3">
                    <Col><Form.Control placeholder="Max Products" onChange={(e) => setPurchase({ ...purchase, maxProducts: e.target.value })} /></Col>
                    <Col><Form.Control placeholder="Mobile No." onChange={(e) => setPurchase({ ...purchase, mobile: e.target.value })} /></Col>
                  </Row>
                  <Row className="mb-3">
                    <Col><Form.Control placeholder="Amount" onChange={(e) => setPurchase({ ...purchase, amount: e.target.value })} /></Col>
                    <Col>
                      <Form.Select onChange={(e) => setPurchase({ ...purchase, mode: e.target.value })}>
                        <option value="">Select Payment Mode</option>
                        <option value="Online">Online</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                      </Form.Select>
                    </Col>
                  </Row>
                  <div className="text-end">
                    <Button variant="success" onClick={handleSave}>Save Purchase</Button>
                  </div>
                </Form>
              </Modal.Body>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </Container>
  );
}

export default Purchase;
