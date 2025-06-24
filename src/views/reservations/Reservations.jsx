import React, { useState } from 'react';
import { Container, Button, Row, Col, Badge } from 'react-bootstrap';

const generateCalendar = (startDate) => {
  const dates = [];
  for (let i = 0; i < 4; i++) {
    const current = new Date(startDate);
    current.setDate(current.getDate() + i);
    dates.push({
      day: current.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      date: current.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()
    });
  }
  return dates;
};

const dummyData = {
  '29 APR': [
    { id: 'L-301', status: 'available' },
    { id: 'L-302', status: 'booked' },
    { id: 'L-303', status: 'booked' },
    { id: 'L-304', status: 'available' },
    { id: 'L-305', status: 'booked' },
    { id: 'S-501', status: 'booked' },
    { id: 'S-502', status: 'booked' },
    { id: 'S-503', status: 'available' }
  ],
  '30 APR': [
    { id: 'L-301', status: 'booked' },
    { id: 'L-302', status: 'available' },
    { id: 'L-303', status: 'available' },
    { id: 'L-304', status: 'booked' },
    { id: 'L-305', status: 'available' },
    { id: 'S-501', status: 'booked' },
    { id: 'S-502', status: 'available' },
    { id: 'S-503', status: 'booked' }
  ]
};

const Reservations = () => {
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const calendarDates = generateCalendar(baseDate);
  const selectedDate = calendarDates[selectedDateIndex]?.date;

  const loungeTables = dummyData[selectedDate] || [];
  const occupiedTimes = Array(12).fill('01:00 PM - 02:30 PM');

  const filteredTables = showAvailableOnly
    ? loungeTables.filter(t => t.status === 'available')
    : loungeTables;

  const getColor = (status) => {
    return status === 'available' ? '#4CAF50' : '#BDBDBD';
  };

  return (
    <Container fluid style={{ padding: '20px', fontFamily: 'Segoe UI' }}>
      {/* Calendar */}
      <Row className="mb-4 justify-content-center align-items-center">
        <Col xs="auto">
          <Button variant="light" onClick={() => {
            const newDate = new Date(baseDate);
            newDate.setDate(newDate.getDate() - 1);
            setBaseDate(newDate);
          }}>←</Button>
        </Col>
        {calendarDates.map((item, index) => (
          <Col xs="auto" key={index}>
            <div
              onClick={() => { setSelectedDateIndex(index); setShowAvailableOnly(false); }}
              style={{
                backgroundColor: index === selectedDateIndex ? '#2155FF' : '#F0F0F0',
                color: index === selectedDateIndex ? 'white' : 'black',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                fontWeight: 600
              }}
            >
              <div>{item.day}</div>
              <div>{item.date}</div>
            </div>
          </Col>
        ))}
        <Col xs="auto">
          <Button variant="light" onClick={() => {
            const newDate = new Date(baseDate);
            newDate.setDate(newDate.getDate() + 1);
            setBaseDate(newDate);
          }}>→</Button>
        </Col>
      </Row>

      {/* Lounge Reservation */}
      <Row className="mb-3 justify-content-between">
        <Col><h4>Lounge Reservation</h4></Col>
        <Col className="text-end">
          <Button variant="outline-primary" size="sm" onClick={() => setShowAvailableOnly(!showAvailableOnly)}>
            {showAvailableOnly ? 'Show All' : 'Show Available'}
          </Button>
        </Col>
      </Row>

      <Row className="mb-4 g-3">
        {filteredTables.map((table, i) => (
          <Col xs={6} md={3} lg={2} key={i}>
            <div style={{
              backgroundColor: getColor(table.status),
              borderRadius: '8px',
              padding: '10px',
              textAlign: 'center',
              fontWeight: 'bold',
              color: 'white',
              cursor: 'default'
            }}>
              {table.id}
            </div>
          </Col>
        ))}
      </Row>

      <Row className="mb-3">
        <Col>
          <Badge bg="success" className="me-3">Available</Badge>
          <Badge bg="secondary">Booked</Badge>
        </Col>
      </Row>

      {/* Tables Occupied */}
      <Row className="mb-3">
        <Col><h4>Tables Occupied</h4></Col>
      </Row>
      <Row className="g-3">
        {occupiedTimes.map((time, idx) => (
          <Col xs={8} md={5} lg={3} key={idx}>
            <div style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px',
              textAlign: 'center',
              borderRadius: '8px',
              fontWeight: 500
            }}>{time}</div>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Reservations;
