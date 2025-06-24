import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Modal, Form, FloatingLabel, Spinner, Dropdown
} from 'react-bootstrap';
import { BsThreeDotsVertical } from 'react-icons/bs';
import axios from 'axios';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');
const API_BASE = import.meta.env.VITE_API_BASE_URL; 

  

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchAccounts = () => {
    setLoading(true);
    const email = Cookies.get('email');
    axios.get(`${API_BASE}/accounts?email=${email}`, { withCredentials: true })
      .then(res => setAccounts(res.data.accounts || []))
      .catch(err => console.error('Error fetching accounts:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddOrEdit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const email = Cookies.get('email');

    const url = editing
      ? `${API_BASE}/edit/accounts`
      : `${API_BASE}/add/accounts`

    const payload = {
      email,
      category,
      amount,
      month,
      ...(editing && { oldCategory: currentCategory })
    };

    axios.post(url, payload, { withCredentials: true })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: editing ? 'Account updated' : 'Account added',
          timer: 1200,
          showConfirmButton: false
        });
        fetchAccounts();
        setShowModal(false);
        resetForm();
      })
      .catch(err => {
        console.error(editing ? 'Edit error' : 'Add error', err);
        Swal.fire('Error', 'Something went wrong', 'error');
      })
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (categoryToDelete) => {
    Swal.fire({
      title: 'Delete this account?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        const email = Cookies.get('email');
        axios.post(`${API_BASE}/delete/accounts`, {
          email,
          category: categoryToDelete
        }, { withCredentials: true })
          .then(() => {
            Swal.fire('Deleted!', '', 'success');
            fetchAccounts();
          })
          .catch(err => {
            console.error('Delete error:', err);
            Swal.fire('Error', 'Could not delete account', 'error');
          });
      }
    });
  };

  const resetForm = () => {
    setCategory('');
    setAmount('');
    setMonth('');
    setEditing(false);
    setCurrentCategory('');
  };

  const startEdit = (acc) => {
    setEditing(true);
    setShowModal(true);
    setCategory(acc.category);
    setAmount(acc.amount);
    setMonth(acc.month || '');
    setCurrentCategory(acc.category);
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h4>Accounts</h4>
        <Button onClick={() => { setShowModal(true); resetForm(); }}>+ Add Account</Button>
      </div>

      {loading ? (
        <div className="text-center my-5"><Spinner animation="border" /></div>
      ) : accounts.length === 0 ? (
        <p className="text-center text-muted mt-5">No records found.</p>
      ) : (
        <Row className="mt-4">
          {accounts.map((acc, idx) => (
            <Col md={4} key={idx} className="mb-3">
              <Card className="p-3 h-100">
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="fw-bold text-uppercase">{acc.category}</div>
                    <div className="fw-bold fs-5">₹{acc.amount}</div>
                    <div className="fw-bold text-muted">Month: {acc.month || '-'}</div>
                  </div>
                  <Dropdown align="end">
                    <Dropdown.Toggle
                    as="span"
                    style={{
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <BsThreeDotsVertical />
                    <style>{`
                      .dropdown-toggle::after {
                        display: none !important;
                      }
                    `}</style>
                  </Dropdown.Toggle>
                  <AnimatePresence>
                    <Dropdown.Menu
                      as={motion.div}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="shadow"
                    >
                      <Dropdown.Item onClick={() => startEdit(acc)}>Edit</Dropdown.Item>
                      <Dropdown.Item onClick={() => handleDelete(acc.category)}>Delete</Dropdown.Item>
                    </Dropdown.Menu>
                  </AnimatePresence>
                </Dropdown>
                </div>
                <hr />
                <div className="text-muted mt-2">Monthly recurring {acc.category}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Modal.Header closeButton>
            <Modal.Title>{editing ? "Edit Account" : "Add Account"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleAddOrEdit}>
              <FloatingLabel label="Account Category" className="mb-3">
                <Form.Control
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </FloatingLabel>

              <FloatingLabel label="Monthly Amount (₹)" className="mb-3">
                <Form.Control
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </FloatingLabel>

              <FloatingLabel label="Select Month" className="mb-3">
                <Form.Select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                >
                  <option value="">-- Select Month --</option>
                  {months.map((m, i) => (
                    <option key={i} value={m}>{m}</option>
                  ))}
                </Form.Select>
              </FloatingLabel>

              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? (editing ? "Updating..." : "Adding...") : (editing ? "Edit Account" : "Add Account")}
              </Button>
            </Form>
          </Modal.Body>
        </motion.div>
      </Modal>
    </Container>
  );
};

export default Accounts;
