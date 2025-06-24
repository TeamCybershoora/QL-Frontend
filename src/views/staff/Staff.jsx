import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Image, Modal, Form, Dropdown } from 'react-bootstrap';
import { FaUserTie, FaUsers, FaPlus } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import axios from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

function StaffList() {
  const [activeTab, setActiveTab] = useState('chef');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [tiltStyle, setTiltStyle] = useState({});
  const [chefs, setChefs] = useState([]);
  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', mobile: '', address: '', imgFile: null, _id: '' });

  const email = Cookies.get('email');

  const fetchData = () => {
    axios
      .get(`${API_BASE}/get/persons?email=${email}`)
      .then((res) => {
        setChefs(res.data.chefs || []);
        setMembers(res.data.members || []);
      })
      .catch(console.error);
  };

  useEffect(fetchData, []);

  const handleAddClick = () => {
    setForm({ name: '', mobile: '', address: '', imgFile: null, _id: '' });
    setEditMode(false);
    setModalOpen(true);
  };

  const handleSave = () => {
    const payload = new FormData();
    payload.append('email', email);
    payload.append('type', activeTab);
    payload.append('name', form.name);
    payload.append('mobile', form.mobile);
    payload.append('address', form.address);
    if (form.imgFile) payload.append('img', form.imgFile);

    if (editMode) {
      payload.append('_id', form._id);
      axios
        .put(`${API_BASE}/edit/person`, payload)
        .then(() => {
          Swal.fire('Updated!', 'Staff updated successfully', 'success');
          fetchData();
          setModalOpen(false);
        })
        .catch(() => Swal.fire('Error', 'Update failed', 'error'));
    } else {
      axios
        .post(`${API_BASE}/add/person`, payload)
        .then(() => {
          Swal.fire('Saved!', 'Staff added successfully', 'success');
          fetchData();
          setModalOpen(false);
        })
        .catch(() => Swal.fire('Error', 'Save failed', 'error'));
    }
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      mobile: item.mobile,
      address: item.address,
      imgFile: null,
      _id: item._id
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the staff permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${API_BASE}/delete/person`, { data: { email, _id: id } })
          .then(() => {
            Swal.fire('Deleted!', 'Staff deleted successfully.', 'success');
            fetchData();
          })
          .catch(() => Swal.fire('Error', 'Delete failed', 'error'));
      }
    });
  };

  const mouseMove = (e, id) => {
    if (hoveredCard === id) {
      const r = e.currentTarget.getBoundingClientRect(),
        x = e.clientX - r.left,
        y = e.clientY - r.top;
      setTiltStyle({
        transform: `rotateX(${-(y - r.height / 2) / 15}deg) rotateY(${(x - r.width / 2) / 15}deg) scale(1.02)`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      });
    }
  };

  const renderList = (list) => (
    <Row className="g-4">
      {list.map((item, idx) => (
        <Col key={idx} xs={12} sm={6} md={4} lg={3}>
          <Card
            onMouseEnter={() => setHoveredCard(item._id)}
            onMouseMove={(e) => mouseMove(e, item._id)}
            onMouseLeave={() => {
              setHoveredCard(null);
              setTiltStyle({});
            }}
            style={{
              borderRadius: '15px',
              overflow: 'hidden',
              backgroundColor: hoveredCard === item._id ? '#f8f9fa' : '#fff',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              transition: 'transform .2s ease, box-shadow .2s ease',
              ...(hoveredCard === item._id ? tiltStyle : {}),
            }}
          >
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '1.2rem 0' }}>
              <Image
                src={item.img}
                roundedCircle
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  border: '3px solid #007bff',
                }}
              />
              <Dropdown style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
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
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleEdit(item)}>Edit</Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDelete(item._id)}>Delete</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <Card.Body className="text-center p-3">
              <Card.Title className="fw-bold">{item.name}</Card.Title>
              <Card.Text>📞 {item.mobile} — 📍 {item.address}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );

  return (
    <Container fluid style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Button
          variant={activeTab === 'chef' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveTab('chef')}
        >
          <FaUserTie /> Chefs
        </Button>
        <Button
          variant={activeTab === 'member' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveTab('member')}
        >
          <FaUsers /> Members
        </Button>
      </div>

      <Row className="mb-4 align-items-center">
        <Col xs={6} className="fw-semibold">
          {activeTab === 'chef' ? `Total Chefs: ${chefs.length}` : `Total Members: ${members.length}`}
        </Col>
        <Col xs={6} className="text-end">
          <Button variant="success" onClick={handleAddClick}>
            <FaPlus /> Add {activeTab === 'chef' ? 'Chef' : 'Member'}
          </Button>
        </Col>
      </Row>

      {activeTab === 'chef' ? renderList(chefs) : renderList(members)}

      <Modal show={modalOpen} onHide={() => setModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit' : 'Add'} {activeTab === 'chef' ? 'Chef' : 'Member'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Control
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control
              placeholder="Mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Form.Group>
          <Form.Group className="mb-3" style={{ fontWeight: 'bold' }}>
            Upload Image
            <Form.Control
              type="file"
              onChange={(e) => setForm({ ...form, imgFile: e.target.files[0] })}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
          <Button variant="primary" onClick={handleSave}>{editMode ? 'Update' : 'Save'}</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default StaffList;
