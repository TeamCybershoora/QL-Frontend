import React from 'react';
import { Container, Row, Col, Card, ProgressBar, Table, Button, Nav } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Report = () => {
  // Bar Chart Data
  const barData = {
    labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
    datasets: [
      {
        label: 'Total Income',
        data: [5000, 6500, 9500, 7000, 6000, 6800],
        backgroundColor: 'limegreen',
      },
      {
        label: 'Total Expenses',
        data: [2000, 2500, 2800, 2200, 3000, 2700],
        backgroundColor: 'orange',
      },
    ],
  };

  const pieData = {
    labels: ['Internet', 'Electricity', 'Transactions', 'Rental Cost', 'Foods', 'Other'],
    datasets: [
      {
        label: 'Expenses',
        data: [1500, 1200, 1000, 900, 300, 100],
        backgroundColor: ['#A020F0', '#00FF9D', '#00D0FF', '#FFD000', '#FF7F50', '#FF4500'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container fluid className="mt-3 px-4">
      <Row>

        {/* Main Content */}
        <Col md={6}>
        <Row >
          <h4 className="mb-4">Report</h4>

          {/* Income & Expense */}
          <Card className="mb-4">
            <Card.Body>
              <h5>Income & Expense</h5>
              <Bar data={barData} options={{ responsive: true }} />
            </Card.Body>
          </Card>
          </Row>
          <Row>
              <Card className="mb-4">
                <Card.Body>
                  <h5>Stock Availability</h5>
                  <p>Total Asset: ₹50,000</p>
                  <p>Total Product: 150</p>
                  <ProgressBar>
                    <ProgressBar now={70} variant="info" label="Available" key={1} />
                    <ProgressBar now={20} variant="warning" label="Low Stock" key={2} />
                    <ProgressBar now={10} variant="danger" label="Out of Stock" key={3} />
                  </ProgressBar>

                  <Table className="mt-3" bordered hover>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Pizza Base</td>
                        <td>3</td>
                        <td><Button variant="primary" size="sm">Order</Button></td>
                      </tr>
                      <tr>
                        <td>Burger Bun</td>
                        <td>2</td>
                        <td><Button variant="primary" size="sm">Order</Button></td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
          </Row>
        </Col>
            {/* Doughnut Chart */}
            <Col md={6}>
              <Card className="mb-4">
                <Card.Body>
                  <h5>Expenses</h5>
                  <Doughnut data={pieData} />
                  <div className="mt-3">
                    <ul className="list-unstyled">
                      {pieData.labels.map((label, idx) => (
                        <li key={idx}>
                          <span style={{ color: pieData.datasets[0].backgroundColor[idx] }}>⬤</span> {label} - ₹{pieData.datasets[0].data[idx]}
                        </li>
                      ))}
                    </ul>
                    <h6 className="mt-2">Total Expense: ₹5000.32</h6>
                  </div>
                </Card.Body>
              </Card>
            </Col>

           
          </Row>
    </Container>
  );
};

export default Report;
