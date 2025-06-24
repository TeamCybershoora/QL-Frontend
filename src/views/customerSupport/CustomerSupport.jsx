import React from 'react';
import { Container, Row, Col, Button, Card, InputGroup, FormControl } from 'react-bootstrap';
import qlLogo from '../../assets/QL_Logo.svg';

const CustomerSupport = () => {
  const sections = [
    { title: 'Getting Started', desc: 'Start off on the right foot! Not the left one!' },
    { title: 'Account Settings', desc: 'You are a special snowflake and so is your account!' },
    { title: 'Billing', desc: 'That feel when you look at your bank account' },
    { title: 'Interface', desc: 'What does this button do ####?' },
    { title: 'Trust & Safety', desc: 'Keep this safe & sound for you and your buddies' },
    { title: 'F.A.Q', desc: 'All you can eat self-serve problem solving' },
    { title: 'Community', desc: 'Bringing people together from all over the world' },
    { title: 'Server Setup', desc: 'Almost as exciting as interior decorating' }
  ];

  const styles = {
    container: { paddingTop: '2rem', paddingBottom: '2rem' },
    logo: { maxWidth: '180px', height: 'auto' },
    sectionTitle: { color: '#0d6efd', fontSize: '0.9rem', fontWeight: '600' },
    sectionText: { fontSize: '0.85rem', color: '#6c757d' },
    card: { height: '100%', textAlign: 'center', boxShadow: '0 0.1rem 0.3rem rgba(0,0,0,0.1)', border: 'none' },
    searchGroup: { maxWidth: '500px', marginTop: '1rem' },
    mainTitle: { fontWeight: '700' },
    subHeading: { fontWeight: '600' },
    mutedText: { color: '#6c757d' }
  };

  return (
    <div style={styles.container}>
      <Container fluid>
      <Card
        style={{
            border: 'none',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            marginBottom: '2rem',
            backgroundColor: '#ffffff'
        }}
        >
            <Row className="align-items-center justify-content-between">
                <Col xs={12} md={6} className="text-md-start text-center">
                <h2 style={{ fontWeight: '700', marginBottom: '1rem' }}>
                    Welcome to Quatumledger Support!
                </h2>
                <InputGroup style={{ maxWidth: '450px', margin: '0 auto' }} className="mx-md-0">
                    <FormControl placeholder="How can we help you?" />
                    <Button variant="primary">Contact us!</Button>
                </InputGroup>
                </Col>
                <Col xs={12} md={4} className="text-center mt-4 mt-md-0">
                <img src={qlLogo} alt="Quatumledger Logo" style={{ maxWidth: '160px', height: 'auto' }} />
                </Col>
            </Row>
        </Card>
        <Row className="pt-4 pb-2">
          <Col xs={12} className="text-center">
            <h5 style={styles.subHeading}>Need help? We&apos;ve got your back</h5>
            <p style={styles.mutedText}>Perhaps you can find the answers in our collections</p>
          </Col>
        </Row>

        <Row className="g-4 px-4 pb-5 justify-content-center">
          {sections.map((section, idx) => (
            <Col key={idx} xs={12} sm={6} md={4} lg={3}>
              <Card style={styles.card}>
                <Card.Body>
                  <Card.Title style={styles.sectionTitle}>{section.title}</Card.Title>
                  <Card.Text style={styles.sectionText}>{section.desc}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default CustomerSupport;
