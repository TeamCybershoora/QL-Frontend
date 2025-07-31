/* eslint-disable react/react-in-jsx-scope */
import { saveFolderHandle } from "../FolderDB";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Container, Row, Col, Card, Form } from 'react-bootstrap';
// FaFacebookF, FaTwitter, FaGoogle, FaGithub imported but not used, can be removed if not needed later.
// import { FaFacebookF, FaTwitter, FaGoogle, FaGithub } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from "js-cookie";
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// Import the new CSS file
import './Login.css'; // <--- NEW LINE

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

  const [resendCount, setResendCount] = useState(Number(Cookies.get("resendCount") || 0));
  const [cooldown, setCooldown] = useState(0);

  const handleGoogleLogin = async (credentialResponse) => {
    const token = credentialResponse.credential;
    const decoded = jwtDecode(token);

    // Optional: console.log(decoded); // for debugging

    try {
      const res = await axios.post(`${API_BASE}/auth/google`, { token });
      const { token: jwtToken, user } = res.data;

      Cookies.set("token", jwtToken, { expires: 7 });
      Cookies.set("firstName", user.firstName, { expires: 7 });
      Cookies.set("lastName", user.lastName, { expires: 7 });
      Cookies.set("email", user.email, { expires: 7 });
      Cookies.set("picLink", user.picLink || "", { expires: 7 });

      toast.success("Login successful!");

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
            await saveFolderHandle(dirHandle);
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
    } catch (error) {
      toast.error("Invalid credentials!");
      setShowForgot(true);
    }
  };


  useEffect(() => {
    // This background style remains here as it applies to the body element globally
    document.body.style.background = 'radial-gradient(circle at top left,#3b3b98, #000)';
    return () => { document.body.style.background = ''; };
  }, []);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) clearInterval(timer);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

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
              await saveFolderHandle(dirHandle);
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
    if (resendCount >= 3) {
      toast.warn("You’ve reached the max OTP limit. Try again after 12 hours.");
      return;
    }

    axios.post(`${API_BASE}/send/otp`, { email })
      .then(() => {
        toast.success("OTP sent to your email!");
        setStep("otp");
        const newCount = resendCount + 1;
        setResendCount(newCount);
        Cookies.set("resendCount", newCount, { expires: 0.5 }); // 12 hours
        setCooldown(30); // 30s timer
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

  // Common framer-motion hover/tap properties for buttons
  const buttonHover = {
    scale: 1.03, // Slightly grow
    backgroundColor: '#42a5f5', // Lighter blue on hover for professional look
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.3)', // Stronger, more professional shadow
  };
  const buttonTap = {
    scale: 0.97, // Subtle press effect
  };
  const buttonTransition = {
    type: "spring",
    stiffness: 400,
    damping: 10
  };

  const getLeftText = () => {
    switch (step) {
      case "login":
        return (<><h1>Welcome Back<br /><span>to Your Dashboard</span></h1><p style={{ color: '#aaa' }}>Please login to continue.</p></>);
      case "email":
        return (<><h1>Forgot Password?<br /><span>Reset It Here</span></h1><p style={{ color: '#aaa' }}>Enter your registered email to receive OTP.</p></>);
      case "otp":
        return (<><h1>Verify OTP<br /><span>to Continue</span></h1><p style={{ color: '#aaa' }}>Check your email for the OTP code.</p></>);
      case "reset":
        return (<><h1>Set New Password<br /><span>to Finish</span></h1><p style={{ color: '#aaa' }}>Enter a strong new password.</p></>);
      default:
        return null;
    }
  }

  return (
    <Container fluid className="background-radial-gradient overflow-hidden login-container">
      {/* Blobs will be handled by CSS classes for responsiveness */}
      <div className="purple-blob top-left"></div>
      <div className="purple-blob bottom-right"></div>
      <ToastContainer />
      <div className="login-wrapper">
        {/* Text Column */}
        <div className="text-section">
          <motion.div >
            {getLeftText()}
          </motion.div>
        </div>

        {/* Login/Form Column */}
        <div className="form-section">
          <AnimatePresence mode="wait">
            {step === "login" && (
              <motion.div key="login" variants={formVariants} initial="initialDown" animate="animate" exit="exitUp" transition={{ duration: 1 }}>
                <Card className="shadow-lg rounded login-card">
                  <Card.Body className="login-card-body">
                    <Form className="login-form" onSubmit={handleLogin}>
                      <Form.Group className="mb-3">
                        <Form.Control type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Control type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      </Form.Group>

                      {showForgot && (
                        <div className="text-end mb-3">
                          <small className="forgot-password-link" onClick={() => setStep("email")}>Forgot Password?</small>
                        </div>
                      )}

                      <motion.button
                        type="submit"
                        className="signup-button btn btn-primary login-button"
                        style={{ width: '100%' }}
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        transition={buttonTransition}
                      >
                        Login
                      </motion.button>
                      <div className="signup-alt">
                        <div className="text-center mt-3">
                          <small>Don&#39;t have an account? <a onClick={() => navigate('/')} className="register-link">Register Now</a></small>
                        </div>
                        <hr />
                        <div className="text-center mt-3">
                        <GoogleLogin
                          onSuccess={handleGoogleLogin}
                          onError={() => toast.error("Login Failed")}
                        />
                      </div>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            )}

            {step === "email" && (
              <motion.div key="email" variants={formVariants} initial="initialUp" animate="animate" exit="exitDown" transition={{ duration: 1 }}>
                <Card className="shadow-lg rounded email-otp-reset-card">
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3" style={{ marginTop: '5%' }}>
                        <Form.Control type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </Form.Group>
                      <motion.button
                        onClick={sendOtp}
                        className="signup-button btn btn-primary send-otp-button"
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        transition={buttonTransition}
                      >
                        Send OTP
                      </motion.button>
                      
                      <span className="go-to-login-link" onClick={() => setStep("login")} onMouseOver={(e) => e.currentTarget.querySelector('span.text').style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.querySelector('span.text').style.textDecoration = 'none'}>
                        <span style={{ marginRight: '4px' }}>👈</span>
                        <span className="text">Go to login</span>
                      </span>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" variants={formVariants} initial="initialDown" animate="animate" exit="exitUp" transition={{ duration: 1 }}>
                <Card className="shadow-lg rounded email-otp-reset-card">
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Control type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                      </Form.Group>
                      <motion.button
                        onClick={verifyOtp}
                        className="signup-button btn btn-primary verify-otp-button"
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        transition={buttonTransition}
                      >
                        Verify OTP
                      </motion.button>

                      <div className="otp-links-container">
                        <span className="go-to-login-link" onClick={() => setStep("login")} onMouseOver={(e) => e.currentTarget.querySelector('span.text').style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.querySelector('span.text').style.textDecoration = 'none'}>
                          <span style={{ marginRight: '4px' }}>👈</span>
                          <span className="text">Go to login</span>
                        </span>

                        <span
                          className="resend-otp-link"
                          style={{ color: cooldown === 0 && resendCount < 3 ? "blue" : "gray", cursor: cooldown === 0 && resendCount < 3 ? "pointer" : "not-allowed", textDecoration: cooldown === 0 && resendCount < 3 ? 'underline' : 'none'}}
                          onClick={() => {if (cooldown === 0 && resendCount < 3) sendOtp();}}>
                          Resend OTP {cooldown > 0 && `(${cooldown}s)`}
                        </span>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            )}

            {step === "reset" && (
              <motion.div key="reset" variants={formVariants} initial="initialUp" animate="animate" exit="exitDown" transition={{ duration: 1 }}>
                <Card className="shadow-lg rounded reset-card">
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Control type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Control type="password" placeholder="Confirm Password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
                      </Form.Group>
                      <motion.button
                        onClick={resetPassword}
                        className="signup-button btn btn-primary reset-password-button"
                        whileHover={buttonHover}
                        whileTap={buttonTap}
                        transition={buttonTransition}
                      >
                        Reset Password
                      </motion.button>
                      <span className="go-to-login-link" onClick={() => setStep("login")} onMouseOver={(e) => e.currentTarget.querySelector('span.text').style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.querySelector('span.text').style.textDecoration = 'none'}>
                        <span style={{ marginRight: '4px' }}>👈</span>
                        <span className="text">Go to login</span>
                      </span>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Container>
  );
}

export default Login;