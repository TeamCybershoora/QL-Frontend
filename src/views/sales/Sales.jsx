import React, { useEffect, useState } from 'react';
import {Container, Row, Col, Table, Form, Button, Tab, Nav, Modal} from 'react-bootstrap';
import { FaCalendarAlt, FaDownload, FaPrint } from 'react-icons/fa';
import { saveFolderHandle, getFolderHandle } from '../FolderDB.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Cookies from 'js-cookie';
import ExcelJS from "exceljs";
import qr from "../../assets/qr.jpg";
import { AnimatePresence, motion } from 'framer-motion';

function Sales() {
  const [key, setKey] = useState('bill');
  const [startDate, setStartDate] = useState(new Date('2025-01-01'));
  const [endDate, setEndDate] = useState(new Date('2025-12-31'));
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [nextBillNo, setNextBillNo] = useState("00101");

  const [customer, setCustomer] = useState({
    id: '', name: '', billNo: '', mobile: '', amount: '', mode: ''
  });

  const [items, setItems] = useState([{ name: '', price: '' }]);

  useEffect(() => {
    const total = items.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    setCustomer(prev => ({ ...prev, amount: total.toFixed(2) }));
  }, [items]);

  useEffect(() => {
    (async () => {
      const folderAccess = Cookies.get("folderAccess");
      if (folderAccess !== "true") return;

      let dirHandle;
      try {
        dirHandle = await getFolderHandle();
        if (!dirHandle) throw new Error("No folder handle found");
      } catch (err) {
        return;
      }

      try {
        const fileHandle = await dirHandle.getFileHandle("sales.xlsx", { create: true });
        const file = await fileHandle.getFile();
        const buffer = await file.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        let sheet = workbook.getWorksheet("Sales");
        if (!sheet) return;

        const rows = [];
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const values = row.values.slice(1); // skip ExcelJS internal 0th index

          const [id, name, billNo, mobile, amount, mode, itemsStr, dateStr] = values;

          const items = (itemsStr || '').split(", ").map(i => {
            const [name, price] = i.split(" - ");
            return { name: name?.trim(), price: price?.trim() };
          });

          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            rows.push({ id, name, billNo, mobile, amount, mode, items, date: parsedDate });
          }
        });

        setSalesData(rows);

        // Update next bill no
        const billNos = rows.map(row => parseInt(row.billNo)).filter(Boolean);
        const maxBillNo = Math.max(...billNos, 100);
        setNextBillNo((maxBillNo + 1).toString().padStart(5, '0'));

      } catch (err) {
        alert("Could not load sales data. Please check the file."); 
      }
    })();
  }, []);


  const handleAddItem = () => setItems([...items, { name: '', price: '' }]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

 const handleSave = async () => {
  let dirHandle;
  const folderAccess = Cookies.get("folderAccess");

  try {
    if (folderAccess === "true") {
      dirHandle = await getFolderHandle();
      if (!dirHandle) throw new Error("No folder handle found");
      const permission = await dirHandle.queryPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        const request = await dirHandle.requestPermission({ mode: "readwrite" });
        if (request !== "granted") throw new Error("Permission denied");
      }
    }
  } catch (err) {
    alert("Folder access is required to save the file.");
    return;
  }

  let fileHandle;
  try {
    fileHandle = await dirHandle.getFileHandle("sales.xlsx", { create: true });
  } catch (err) {
    alert("Could not access sales.xlsx file.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  let sheet;
  const HEADER = ["ID", "Customer Name", "Bill No", "Mobile", "Amount", "Mode", "Items", "Date"];
  const today = new Date().toISOString().slice(0, 10);

  try {
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    sheet = workbook.getWorksheet("Sales");
    if (!sheet) sheet = workbook.addWorksheet("Sales");
  } catch (err) {
    sheet = workbook.addWorksheet("Sales");
  }

  const newRow = [
    customer.id,
    customer.name,
    nextBillNo,
    customer.mobile,
    customer.amount,
    customer.mode,
    items.map(itm => `${itm.name} - ${itm.price}`).join(", "),
    today,
  ];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const validData = [];

  sheet.eachRow((row, index) => {
    const cells = row.values.slice(1);
    if (index === 1 || cells[0] === "ID" || typeof cells[0] === "string") return;
    
    const rowDate = new Date(cells[7]);
    if (!isNaN(rowDate) && rowDate >= cutoffDate) {
      validData.push(cells);
    }
  });

  validData.push(newRow);

  // Remove exact duplicates using Set
  const seen = new Set();
  const finalData = validData.filter((row) => {
    const key = row.join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Clear old data, insert fresh
  sheet.spliceRows(2, sheet.rowCount - 1);
  if (!sheet.getRow(1).values.includes("ID")) {
    sheet.insertRow(1, HEADER);
  }

  finalData.forEach((row) => sheet.addRow(row));

  const writable = await fileHandle.createWritable();
  await workbook.xlsx.write(writable);
  await writable.close();

  alert("Sale saved successfully!");
  setCustomer({ id: '', name: '', billNo: '', mobile: '', amount: '', mode: '' });
  setItems([{ name: '', price: '' }]);
  setShowModal(false);

  // Update frontend state
  const updatedData = finalData.map((r) => ({
    id: r[0],
    name: r[1],
    billNo: r[2],
    mobile: r[3],
    amount: r[4],
    mode: r[5],
    items: r[6]?.split(", ").map(it => {
      const [name, price] = it.split(" - ");
      return { name, price };
    }),
    date: new Date(r[7])
  }));

  setSalesData(updatedData);
  const billNos = updatedData.map(s => parseInt(s.billNo)).filter(n => !isNaN(n));
  const maxBill = billNos.length > 0 ? Math.max(...billNos) : 100;
  setNextBillNo((maxBill + 1).toString().padStart(5, '0'));
  // Store total sales in cookies
const totalSales = updatedData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
Cookies.set("totalSalesAmount", totalSales.toFixed(2), { expires: 30 });  // Expires in 30 days

window.location.reload(); // Reload to reflect changes
};

const exportRow = (item) => {
  const perItemHeight = 12;
  const headerHeight = 120;
  const footerHeight = 120;
  const spacing = 20;

  const totalHeight = headerHeight + (item.items.length * perItemHeight) + spacing + footerHeight;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: [165, totalHeight] // 58mm width
  });

  let y = 20;
  const maxWidth = 155;

  // Get values from cookies
  const businessName = Cookies.get('businessName') || 'The Quantum Restaurant';
  const address = Cookies.get('address') || '123 Foodie Street, Taste City';
  const phone = Cookies.get('phone') || '+91-9876543210';
  const gst = Cookies.get('gst') || '22AAAAA0000A1Z5';

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(businessName.toUpperCase(), maxWidth / 2, y, { align: "center" });
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(address, maxWidth / 2, y, { align: "center" });
  y += 10;
  doc.text(`Phone: ${phone}`, maxWidth / 2, y, { align: "center" });
  y += 10;
  doc.text(`GSTIN: ${gst}`, maxWidth / 2, y, { align: "center" });
  y += 12;

  doc.setLineWidth(0.3);
  doc.line(10, y, maxWidth - 10, y);
  y += 8;

  // Customer Info
  doc.setFontSize(9);
  doc.text(`Bill No: ${item.billNo}`, 12, y);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, maxWidth - 12, y, { align: "right" });
  y += 12;
  doc.text(`Customer: ${item.name}`, 12, y);
  y += 10;
  doc.text(`Mobile: ${item.mobile}`, 12, y);
  y += 12;

  doc.setLineWidth(0.2);
  doc.line(10, y, maxWidth - 10, y);
  y += 10;

  // Items Header
  doc.setFont("helvetica", "bold");
  doc.text("Item", 12, y);
  doc.text("₹", maxWidth - 12, y, { align: "right" });
  y += 10;

  // Items List
  doc.setFont("helvetica", "normal");
  item.items.forEach((itm, i) => {
    doc.text(`${i + 1}. ${itm.name}`, 12, y);
    doc.text(`${itm.price}`, maxWidth - 12, y, { align: "right" });
    y += perItemHeight;
  });

  y += 4;
  doc.setLineWidth(0.2);
  doc.line(10, y, maxWidth - 10, y);
  y += 10;

  // Total
  doc.setFont("helvetica", "bold");
  doc.text("Total:", 12, y);
  doc.text(`₹${item.amount}`, maxWidth - 12, y, { align: "right" });
  y += 12;

  // Payment Mode
  doc.setFont("helvetica", "normal");
  doc.text(`Paid via: ${item.mode}`, 12, y);
  y += 18;

  // QR Code if available
  if (typeof qr !== 'undefined' && qr) {
    doc.addImage(qr, 'jpg', 55, y, 50, 50);
    y += 60;
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text("Thank you! Visit again ", maxWidth / 2, y, { align: "center" });
  y += 10;
  doc.text("Created by Quantum Ledger", maxWidth / 2, y, { align: "center" });

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
    const matchesDate = item.date >= startDate && item.date <= endDate;
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase()) || item.id?.toLowerCase().includes(search.toLowerCase());
    return matchesDate && matchesSearch;
  });

  return (
    <Container fluid className="p-4">
      <h2 className="mb-3 fw-bold">Sales</h2>

      <Row className="mb-3 text-center">
        <Col md={6}>
          <div className="border p-3 rounded shadow-sm">
            <h6 className="mb-0">Revenue this month</h6>
            <h4>₹10,398 <span className="text-success">+ ₹498</span></h4>
          </div>
        </Col>
        <Col md={6}>
          <div className="border p-3 rounded shadow-sm">
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
            <Row className="mt-3 align-items-center">
              <Col md={3}><Form.Control type="text" placeholder="Search name or reservation ID..." value={search} onChange={(e) => setSearch(e.target.value)} /></Col>
              <Col md={4}>
                <div className="d-flex align-items-center">
                  <FaCalendarAlt className="me-2" />
                  <DatePicker selectsRange startDate={startDate} endDate={endDate} onChange={(dates) => {
                    const [start, end] = dates;
                    setStartDate(start);
                    setEndDate(end || start);
                  }}  className="form-control me-3" placeholderText="Select date range" />
                </div>
              </Col>
              <Col md={3}><Button variant="primary" style={{ marginLeft: "5rem" }} onClick={() => setShowModal(true)}>Generate Bill</Button></Col>
              <Col md={2} className="text-end"><Button variant="primary" onClick={exportAll} style={{ marginRight: "2rem" }}><FaDownload className="me-2" />Export</Button></Col>
            </Row>

            <div id="sales-table" className="mt-4">
              <Table responsive bordered hover>
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Customer Name</th>
                    <th>Bill No.</th>
                    <th>Customer Mobile no.</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Payment Mode</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr><td colSpan="8" className="text-center text-muted">No data found</td></tr>
                  ) : (
                    filteredSales.map((item, index) => (
                      <tr key={index}>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.billNo}</td>
                        <td>{item.mobile}</td>
                        <td>
                          <ul className="list-unstyled mb-0">
                            {item.items.map((itm, idx) => (
                              <li key={idx}>{itm.name} - {itm.price}</li>))}
                          </ul>
                        </td>
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
              </Table>
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
                    <Col><Form.Control placeholder="Customer ID" onChange={(e) => setCustomer({ ...customer, id: e.target.value })} /></Col>
                    <Col><Form.Control placeholder="Customer Name" onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></Col>
                  </Row>
                  <Row className="mb-3">
                    <Col><Form.Control value={nextBillNo} readOnly /></Col>
                    <Col><Form.Control placeholder="Mobile No." onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })} /></Col>
                  </Row>
                  <Row className="mb-3">
                    <Col><Form.Control placeholder="Amount" value={customer.amount} readOnly/></Col>
                    <Col>
                      <Form.Select onChange={(e) => setCustomer({ ...customer, mode: e.target.value })}>
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
                      <Col><Form.Control placeholder="Price" value={item.price} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} /></Col>
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
    </Container>
  );
}

export default Sales;
