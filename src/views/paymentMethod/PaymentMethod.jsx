import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Modal } from 'react-bootstrap';
import { FaCcPaypal, FaGooglePay, FaPhone } from 'react-icons/fa';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const Payment = () => {
  const MySwal = withReactContent(Swal);
  const [method, setMethod] = useState('card'); // Default: Credit/Debit Card
  const [showScanner, setShowScanner] = useState(false);
  const [animate, setAnimate] = useState(true); // Trigger animation on first render

  useEffect(() => {
    const timeout = setTimeout(() => setAnimate(false), 600);
    return () => clearTimeout(timeout);
  }, []);

  const showSuccess = () => {
    MySwal.fire({
      icon: 'success',
      title: 'Payment Successful!',
      text: 'Thank you for your order.',
      confirmButtonColor: '#28a745'
    });
  };

  const handlePay = () => {
    if (method === 'card' || method === 'paypal') {
      showSuccess();
    } else {
      setShowScanner(true);
      setTimeout(() => {
        setShowScanner(false);
        showSuccess();
      }, 3000);
    }
  };

  const handleMethodChange = (value) => {
    if (value !== method) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600); // match animation duration
      setMethod(value);
    }
  };

  // Inline style for rotation animation
  const animationStyle = {
    transition: 'transform 0.6s ease-in-out',
    transform: animate ? 'rotateY(360deg)' : 'none'
  };

  return (
    <Container className="mt-5">
      <Row>
        {/* Left Column: Payment Methods */}
        <Col md={4}>
          <h5 className="mb-3">Select Payment Method</h5>

          <Card className="mb-3" border={method === 'card' ? 'success' : ''}>
            <Card.Body>
              <Form.Check
                type="radio"
                label="Credit / Debit Card"
                name="payment"
                checked={method === 'card'}
                onChange={() => handleMethodChange('card')}
              />
            </Card.Body>
          </Card>

          <Card className="mb-3" border={method === 'paypal' ? 'success' : ''}>
            <Card.Body>
              <Form.Check
                type="radio"
                label={<span><FaCcPaypal className="me-2" /> PayPal</span>}
                name="payment"
                checked={method === 'paypal'}
                onChange={() => handleMethodChange('paypal')}
              />
            </Card.Body>
          </Card>

          <Card className="mb-3" border={method === 'gpay' ? 'success' : ''}>
            <Card.Body>
              <Form.Check
                type="radio"
                label={<span><FaGooglePay className="me-2" /> Google Pay</span>}
                name="payment"
                checked={method === 'gpay'}
                onChange={() => handleMethodChange('gpay')}
              />
            </Card.Body>
          </Card>

          <Card className="mb-3" border={method === 'phonepe' ? 'success' : ''}>
            <Card.Body>
              <Form.Check
                type="radio"
                label={<span><FaPhone className="me-2" /> PhonePe</span>}
                name="payment"
                checked={method === 'phonepe'}
                onChange={() => handleMethodChange('phonepe')}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column with rotating content and vertical line */}
        <Col
          md={8}
          style={{
            borderLeft: '2px solid #dee2e6',
            paddingLeft: '30px'
          }}
        >
          <div style={animationStyle}>
            {method === 'card' && (
              <Card className="p-4">
                <h5>Enter Card Details</h5>
                <Form.Group className="mb-3 mt-3">
                  <Form.Label>Card Number</Form.Label>
                  <Form.Control type="text" placeholder="1234 5678 9012 3456" />
                </Form.Group>
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Expiry</Form.Label>
                      <Form.Control type="text" placeholder="MM/YY" />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>CVV</Form.Label>
                      <Form.Control type="password" placeholder="***" />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="success" onClick={handlePay}>Pay with Card</Button>
              </Card>
            )}

            {method === 'paypal' && (
              <Card className="p-4">
                <h5>PayPal Payment</h5>
                <Form.Group className="mb-3 mt-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" placeholder="Enter PayPal Email" />
                </Form.Group>
                <Button variant="success" onClick={handlePay}>Pay with PayPal</Button>
              </Card>
            )}

            {(method === 'gpay' || method === 'phonepe') && (
              <Card className="p-4 text-center">
                <h5>Scan & Pay with {method === 'gpay' ? 'Google Pay' : 'PhonePe'}</h5>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PayNow"
                  alt="QR Code"
                  className="my-3"
                />
                <p>Use your {method === 'gpay' ? 'Google Pay' : 'PhonePe'} app to complete the payment.</p>
                <Button variant="success" onClick={handlePay}>I Have Paid</Button>
              </Card>
            )}
          </div>
        </Col>
      </Row>

      {/* Modal: Processing Scanner */}
      <Modal show={showScanner} centered>
        <Modal.Body className="text-center">
          <p>Processing Payment...</p>
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PayNow"
            alt="Scanning"
            style={{ width: '200px' }}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Payment;
