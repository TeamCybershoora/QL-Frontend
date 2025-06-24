import React, { useState, useRef } from 'react'
import { CAvatar } from '@coreui/react'
import avatar8 from './../../assets/images/avatars/8.jpg'
import Cookies from 'js-cookie'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const AppHeaderDropdown = () => {
  const [profilePic, setProfilePic] = useState(Cookies.get('piclink') || avatar8)
  const [showCard, setShowCard] = useState(false)
  const [editing, setEditing] = useState({ address: false, phone: false, gst: false })

  const [formData, setFormData] = useState({
    email: Cookies.get('email') || '',
    address: Cookies.get('address') || '',
    phone: Cookies.get('phone') || '',
    gst: Cookies.get('gst') || '',
  })
const picLink = Cookies.get('piclink') || ''
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleAvatarClick = () => setShowCard(true)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const data = new FormData()
    data.append('file', file)
    data.append('email', formData.email)
    setLoading(true)

    axios.post('https://ql-backend.onrender.com/upload/profile', data)
      .then(res => {
        const imageUrl = res.data.picLink
        Cookies.set('piclink', imageUrl)
        setProfilePic(imageUrl)
        toast.success('Profile picture updated!')
      })
      .catch(() => toast.error('Upload failed'))
      .finally(() => setLoading(false))
  }

  const handleEdit = (field) => setEditing({ ...editing, [field]: true })

  const handleSave = (field) => {
    const endpoint = field === 'address' ? 'address'
                   : field === 'phone'   ? 'phone'
                   : field === 'gst'     ? 'gst'
                   : ''

    axios.post(`https://ql-backend.onrender.com/update/${endpoint}`, {
      email: formData.email,
      [field]: formData[field]
    })
      .then(res => {
        const updatedValue = res.data.user[field]
        Cookies.set(field, updatedValue)
        setFormData(prev => ({ ...prev, [field]: updatedValue }))
        toast.success(`${field} updated!`)
        setEditing(prev => ({ ...prev, [field]: false }))
      })
      .catch(err => {
        console.error(err)
        toast.error(`Failed to update ${field}`)
      })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <>
      <div onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
        <CAvatar src={profilePic} size="md" />
      </div>

      {/* Slide-in Card */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: showCard ? 0 : '-320px',
          width: '320px',
          height: '100%',
          background: '#f8f9fa',
          boxShadow: '-4px 0 10px rgba(0,0,0,0.1)',
          padding: '25px',
          transition: 'right 0.4s ease-in-out',
          zIndex: 1000,
          borderTopLeftRadius: '12px',
          borderBottomLeftRadius: '12px',
          fontFamily: "'Segoe UI', sans-serif"
        }}
      >
        {/* Close Button */}
        <div style={{ textAlign: 'right', marginBottom: '10px' }}>
          <button
            onClick={() => setShowCard(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#555'
            }}
          >×</button>
        </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img
              src={picLink || avatar8}
              alt="avatar"
              onClick={() => fileInputRef.current.click()}
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                border: '3px solid #007bff',
                objectFit: 'cover',
                cursor: 'pointer',
                boxShadow: '0 0 8px rgba(0, 123, 255, 0.5)'
              }}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <p style={{ marginTop: '10px', color: '#007bff', fontSize: '14px' }}>Click image to change</p>
          </div>

          {/* Editable Fields */}
        {['address', 'phone', 'gst'].map((field) => (
          <div key={field} style={{ marginBottom: '18px' }}>
            <label style={{ fontWeight: 600, color: '#333', fontSize: '14px', textTransform: 'capitalize' }}>
              {field === 'gst' ? 'GST No.' : field}
            </label><br />
            {editing[field] ? (
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <input
                  name={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  placeholder={`Enter ${field}`}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSave(field)}
                  style={{
                    border: 'none',
                    background: '#28a745',
                    color: 'white',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >✓</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ color: '#444' }}>{formData[field] || 'Not set'}</span>
                <button
                  onClick={() => handleEdit(field)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#007bff'
                  }}
                >✏️</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ToastContainer position="top-right" autoClose={2000} hideProgressBar theme="colored" />
    </>
  )
}

export default AppHeaderDropdown
