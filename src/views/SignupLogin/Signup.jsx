/* eslint-disable react/react-in-jsx-scope */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Container, Row, Col, Card, Form } from 'react-bootstrap';
import { FaFacebookF, FaTwitter, FaGoogle, FaGithub } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useSpring, animated } from 'react-spring';
import Cookies from 'js-cookie';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

function Signup() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    document.body.style.background = 'radial-gradient(circle at top left,#3b3b98, #000)';
    return () => { document.body.style.background = ''; };
  }, []);

  const [leftRef, leftInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [cardRef, cardInView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const leftTextAnimation = useSpring({ opacity: leftInView ? 1 : 0, transform: leftInView ? 'translateX(0)' : 'translateX(-100%)', config: { duration: 800 } });
  const cardAnimation = useSpring({ opacity: cardInView ? 1 : 0, transform: cardInView ? 'translateY(0)' : 'translateY(100%)', config: { duration: 800 } });

  const handleSendOtp = () => {
    axios.post(`${API_BASE}/send/otp/signup`, { email }).then(() => {
      toast.success("OTP sent to your email!"); setOtpSent(true); 
    }).catch(() => toast.error("Failed to send OTP"));
  };

  const handleVerifyOtp = () => {
    axios.post(`${API_BASE}/check/otp`, { email, otp }).then(res => {
      if (res.data.success) { toast.success("Email verified successfully!"); setIsEmailVerified(true); }
      else toast.error("Invalid OTP");
    }).catch(() => toast.error("Verification failed"));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = (e) => {
    e.preventDefault();
    if (!isEmailVerified) return toast.warn("Please verify your email first!");
    axios.post(`${API_BASE}/signup`, { firstName, lastName, email, password })
  .then((res) => {
    try {
      console.log("Signup Response:", res);
      const user = res.data.user;
      if (!user) throw new Error("User not found in response");

      Cookies.set("token", res.data.token, { expires: 365 });
      Cookies.set("firstName", user.firstName, { expires: 365 });
      Cookies.set("lastName", user.lastName, { expires: 365 });
      Cookies.set("email", user.email, { expires: 365 });
      Cookies.set("picLink", user.picLink || "", { expires: 365 });

      toast.success("Signup successful!");
      navigate("/login");
    } catch (err) {
      console.error("Frontend error during signup:", err);
      toast.error("Signup failed client!");
    }
  }).catch((err) => {
    console.error("Axios error:", err.response || err.message);
    toast.error("Signup failed server!");
  });
  }
  return (
    <Container fluid style={{ overflow: 'hidden', height: '100vh', position: 'relative' }}>
      {/* Purple circles */}
      {/* Blended circles with gradient fading to match background */}
      <div style={{ position: 'absolute', top: 0, left: "35rem", width: '200px', height: '200px', background: 'radial-gradient(circle at center, rgba(128, 0, 128, 1), transparent 70%)', borderRadius: '50%', zIndex: 0,
      }}></div>
      
      <div style={{ position: 'absolute', bottom: 0, right: '5rem', width: '250px', height: '250px', background: 'radial-gradient(circle at center, rgba(128, 0, 128, 1), transparent 70%)', borderRadius: '50%', zIndex: 0,
      }}></div>
      <Row className="justify-content-center" style={{ padding: '20px' }}>
        <Col md={6} ref={leftRef} style={{ zIndex: 1 }}>
          <animated.div style={{
            ...leftTextAnimation,
            padding: '4rem',
            color: '#000',
            textAlign: 'center',
            ...(window.innerWidth < 768 ? { padding: '2rem' } : {})
          }}>
            <h1 style={{ fontWeight: 'bold', marginTop: '8rem', color: 'white' }}>
              The best offer<br /><span>for your business</span>
            </h1>
            <p style={{ color: '#aaa' }}>Lorem ipsum dolor sit amet consectetur adipisicing elit...</p>
          </animated.div>
        </Col>

        <Col md={6} ref={cardRef} style={{ zIndex: 1 , marginTop: '5rem' }}>
          <animated.div style={cardAnimation}>
            <Card style={{
              maxWidth: '500px',
              width: "70%",
              boxShadow: '0 0 20px rgba(0,0,0,0.2)',
              borderRadius: '1rem',
              backgroundColor: '#fff',
              zIndex: 2,
              ...(window.innerWidth < 768 ? { marginTop: '-4rem', marginBottom:"-4" } : {})
            }}>
              <Card.Body style={{ padding: '2rem' }}>
                <Form onSubmit={handleSignup}>
                  <Row className="mb-3">
                    <Col>
                      <Form.Control type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ backgroundColor: 'white', color: 'black' }} />
                    </Col>
                    <Col>
                      <Form.Control type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ backgroundColor: 'white', color: 'black' }} />
                    </Col>
                  </Row>

                  <Form.Group className="mb-3" style={{ position: 'relative' }}>
                    <Form.Control type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEmailVerified} style={{ backgroundColor: 'white', color: 'black' }} />
                    {!isEmailVerified && !otpSent && isValidEmail(email) && (
                      <Button variant="secondary" size="sm" onClick={handleSendOtp} style={{
                        position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', width: '80px'
                      }}>Verify</Button>
                    )}
                  </Form.Group>

                  {otpSent && !isEmailVerified && (
                    <Row className="mb-3">
                      <Col xs={8}>
                        <Form.Control type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ backgroundColor: 'white', color: 'black' }} />
                      </Col>
                      <Col xs={4}>
                        <Button onClick={handleVerifyOtp} style={{ width: '100%' }}>Verify OTP</Button>
                      </Col>
                    </Row>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Control type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ backgroundColor: 'white', color: 'black' }} />
                  </Form.Group>

                  <Button type="submit" style={{ width: '100%', backgroundColor: '#1266f1', border: 'none' }}>Sign Up</Button>

                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <small>Already have an account? <a style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>Log in</a></small>
                    <hr />
                    <small>or sign up with:</small>
                    <div style={{ marginTop: '0.5rem' }}>
                      <Button variant="link" style={{ color: '#1266f1', margin: '0 5px' }}><FaFacebookF /></Button>
                      <Button variant="link" style={{ color: '#1266f1', margin: '0 5px' }}><FaGoogle /></Button>
                      <Button variant="link" style={{ color: '#1266f1', margin: '0 5px' }}><FaTwitter /></Button>
                      <Button variant="link" style={{ color: '#1266f1', margin: '0 5px' }}><FaGithub /></Button>
                    </div>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </animated.div>
        </Col>
      </Row>
      <ToastContainer />
    </Container>
  );
}

export default Signup;
