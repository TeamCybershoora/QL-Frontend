/* eslint-disable react/react-in-jsx-scope */
import { saveFolderHandle } from "../FolderDB"; // path adjust kar lena
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Container, Row, Col, Card, Form } from 'react-bootstrap';
import { FaFacebookF, FaTwitter, FaGoogle, FaGithub } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from "js-cookie";
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE_URL;


function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState("login");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    document.body.style.background = 'radial-gradient(circle at top left,#3b3b98, #000)';
    return () => { document.body.style.background = ''; };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post(`${API_BASE}/login`, { email, password })
      .then((res) => {
        const user = res.data.user;
        Cookies.set("token", res.data.token, { expires: 7 });
        Cookies.set("firstName", user.firstName, { expires: 7 });
        Cookies.set("lastName", user.lastName, { expires: 7 });
        Cookies.set("email", user.email, { expires: 7 });
        Cookies.set("picLink", user.picLink || "", { expires: 7 });
  
        toast.success("Login successful!");
  
        // SweetAlert2 popup
        Swal.fire({
          title: 'Allow access to local folder?',
          text: 'We need permission to store data in your local system folder.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Allow',
          cancelButtonText: 'Deny',
          reverseButtons: true
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const dirHandle = await window.showDirectoryPicker();
              await saveFolderHandle(dirHandle); // Save to IndexedDB ✅
              Cookies.set("folderAccess", true, { expires: 365 });
              Cookies.set("dirName", dirHandle.name, { expires: 365 });
              console.log("Folder access granted:", dirHandle);
              navigate("/dashboard");
            } catch (err) {
              toast.error("Folder access denied!");
              navigate("/dashboard");
            }          
          } else {
            Cookies.set("folderAccess", false, { expires: 365 });
            navigate("/dashboard");
          }
        });
      })
      .catch(() => {
        toast.error("Invalid credentials!");
        setShowForgot(true);
      });
  };
  

  const sendOtp = () => {
    axios.post(`${API_BASE}/send/otp`, { email })
      .then(() => {
        toast.success("OTP sent to your email!");
        setStep("otp");
      })
      .catch(() => {
        toast.error("Failed to send OTP. Try again!");
      });
  };

  const verifyOtp = () => {
    axios.post(`${API_BASE}/check/otp`, { email, otp })
      .then(() => {
        toast.success("OTP verified!");
        setStep("reset");
      })
      .catch(() => {
        toast.error("Invalid OTP. Please try again!");
      });
  };

  const resetPassword = () => {
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match!");
      return;
    }

    axios.post(`${API_BASE}/reset/password`, { email, newPassword: newPass })
      .then(() => {
        toast.success("Password reset successful!");
        setStep("login");
        setShowForgot(false);
      })
      .catch(() => {
        toast.error("Failed to reset password. Try again!");
      });
  };

  const formVariants = {
    initialUp: { opacity: 0, y: -500 },
    initialDown: { opacity: 0, y: 500 },
    animate: { opacity: 1, y: 0 },
    exitUp: { opacity: 0, y: -500 },
    exitDown: { opacity: 0, y: 500 },
  };

  const getLeftText = () => {
    switch (step) {
      case "login":
        return (
          <>
            <h1>Welcome Back<br /><span>to Your Dashboard</span></h1>
            <p style={{ color: '#aaa' }}>Please login to continue.</p>
          </>
        );
      case "email":
        return (
          <>
            <h1>Forgot Password?<br /><span>Reset It Here</span></h1>
            <p style={{ color: '#aaa' }}>Enter your registered email to receive OTP.</p>
          </>
        );
      case "otp":
        return (
          <>
            <h1>Verify OTP<br /><span>to Continue</span></h1>
            <p style={{ color: '#aaa' }}>Check your email for the OTP code.</p>
          </>
        );
      case "reset":
        return (
          <>
            <h1>Set New Password<br /><span>to Finish</span></h1>
            <p style={{ color: '#aaa' }}>Enter a strong new password.</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container fluid className="background-radial-gradient overflow-hidden"  style={{ overflow: 'hidden', height: '100vh', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: "35rem", width: '200px', height: '200px', background: 'radial-gradient(circle at center, rgba(128, 0, 128, 1), transparent 70%)', borderRadius: '50%', zIndex: 0,
      }}></div>
      
      <div style={{ position: 'absolute', bottom: 0, right: '5rem', width: '250px', height: '250px', background: 'radial-gradient(circle at center, rgba(128, 0, 128, 1), transparent 70%)', borderRadius: '50%', zIndex: 0,
      }}></div>
      <ToastContainer />
      <Row className="justify-content-center">
        <Col md={6} className="text-column text-center text-md-left" style={{ fontWeight: 'bold', marginTop: '14rem', color: 'white' }}>
          <motion.div
            initial={{ opacity: 0, x: -1000 }}
            animate={{ opacity: 1, x: 10 }}
            transition={{ duration: 1 }}
            key={step}
          >
            {getLeftText()}
          </motion.div>
        </Col>

        <Col md={6} className="login-column" style={{ zIndex: 1 , marginTop: '9rem' }}>
          <AnimatePresence mode="wait">
            {step === "login" && (
              <motion.div
                key="login"
                variants={formVariants}
                initial="initialDown"
                animate="animate"
                exit="exitUp"
                transition={{ duration: 1 }}
              >
                <Card className="shadow-lg rounded" style={{ width: '65%', marginLeft: '5%' }}>
                  <Card.Body>
                    <Form className="login-form" onSubmit={handleLogin}>
                      <Form.Group className="mb-3">
                        <Form.Control type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Control type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      </Form.Group>

                      {showForgot && (
                        <div className="text-end mb-3">
                          <small
                            style={{ cursor: 'pointer', color: 'blue' }}
                            onClick={() => setStep("email")}
                          >
                            Forgot Password?
                          </small>
                        </div>
                      )}

                      <Button type="submit" className="signup-button" style={{ width: "100%" }}>Login</Button>

                      <div className="signup-alt">
                        <div className="text-center mt-3">
                          <small>Don&#39;t have an account? <a onClick={() => navigate('/')} style={{ color: 'blue', cursor: 'pointer' }}>Register Now</a></small>
                        </div>
                        <hr />
                        <small>or login with:</small>
                        <div className="social-icons">
                          <Button variant="link" className="social-icon facebook"><FaFacebookF /></Button>
                          <Button variant="link" className="social-icon google"><FaGoogle /></Button>
                          <Button variant="link" className="social-icon twitter"><FaTwitter /></Button>
                          <Button variant="link" className="social-icon github"><FaGithub /></Button>
                        </div>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            )}

            {step === "email" && (
              <motion.div key="email" variants={formVariants} initial="initialUp" animate="animate" exit="exitDown" transition={{ duration: 1 }}>
                <Card className="shadow-lg rounded" style={{ width: '60%', marginLeft: '5%', marginTop: '12%' }}>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3" style={{ marginTop: '5%' }}>
                        <Form.Control type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </Form.Group>
                      <Button onClick={sendOtp} className="signup-button" style={{ width: "100%" }}>Send OTP</Button>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" variants={formVariants} initial="initialDown" animate="animate" exit="exitUp" transition={{ duration: 1 }}>
                <Card className="shadow-lg rounded" style={{ width: '60%', marginLeft: '5%', marginTop: '12%' }}>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Control type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                      </Form.Group>
                      <Button onClick={verifyOtp} className="signup-button" style={{ width: "100%" }}>Verify OTP</Button>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            )}

            {step === "reset" && (
              <motion.div key="reset" variants={formVariants} initial="initialUp" animate="animate" exit="exitDown" transition={{ duration: 1 }}>
                <Card className="shadow-lg rounded" style={{ width: '65%', marginLeft: '5%' , marginTop: '10%'}}>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Control type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Control type="password" placeholder="Confirm Password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                      </Form.Group>
                      <Button onClick={resetPassword} className="signup-button" style={{ width: "100%" }}>Reset Password</Button>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
