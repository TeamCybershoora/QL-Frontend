import React, { useEffect, useState } from 'react';
import CIcon from '@coreui/icons-react';
import {
  cilSpeedometer,
  cilUser,
  cilGroup,
  cilChart,
  cilLink,
  cilChatBubble,
  cilCalendar,
  cilHeadphones,
  cilCreditCard,
  cilCart,
  cilCheck ,
  cilChartLine,
  cilAddressBook,
  cilPencil
} from '@coreui/icons';
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react';
import { GiKnifeFork } from 'react-icons/gi';
import axios from 'axios';
import Cookies from 'js-cookie'; // Ensure you have js-cookie installed

const Nav = () => {
  const [businessName, setBusinessName] = useState('Pizza Hub');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const email = Cookies.get('email');

useEffect(() => {
  axios.get('https://ql-backend.onrender.com/business/name', {
    params: { email },          // Query param ke through bheja email
    withCredentials: true       // agar cookies bhi chahiye backend ko
  })
  .then((res) => {
    setBusinessName(res.data.name);check 
  })
  .catch((err) => {
    console.error('Failed to fetch business name:', err);
  });
}, []);


  const handleEdit = () => {
    setEditedName(businessName);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedName.trim()) {
      axios.post('https://ql-backend.onrender.com/update/business/name', 
        { name: editedName, email },     // body me email and name dono bhejo
        { withCredentials: true }
      )
      .then(() => {
        setBusinessName(editedName);
        Cookies.set('businessName', editedName); // Update cookie if needed
      })
      .catch((err) => {
        console.error('Failed to update name:', err);
      });
    }
    setIsEditing(false);
  };
  
  return [
    {
        component: CNavTitle,
        name: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GiKnifeFork size={20} color="black" />
              {isEditing ? (
                <>
                  <input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    autoFocus
                    style={{
                      fontSize: '1rem',
                      border: '1px solid #888',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      maxWidth: '10rem',
                      outline: 'none',
                      backgroundColor: '#f9f9f9',
                      color: '#333',
                    }}
                  />
                  <CIcon
                    icon={cilCheck} // ✅ right tick icon
                    size="sm"
                    onClick={handleSave}
                    style={{
                      cursor: 'pointer',
                      color: 'green',
                      fontSize: '1rem',
                      marginLeft: '0.2rem',
                    }}
                  />
                </>
              ) : (
                <strong style={{ fontSize: '22px', color: 'black' }}>{businessName}</strong>
              )}
            </span>
            {!isEditing && (
              <CIcon
                icon={cilPencil}
                size="sm"
                onClick={handleEdit}
                style={{
                  cursor: 'pointer',
                  marginLeft: '8px',
                  color: 'black',
                  fontSize: '18px',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#007bff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
              />
            )}
          </div>
        ),
      },
      
    {
      component: CNavItem,
      name: 'Dashboard',
      to: '/dashboard',
      icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" style={{ color: 'black' }} />,
      badge: {
        color: 'info',
        text: 'NEW',
      },
    },
    {
      component: CNavTitle,
      name: (
        <strong style={{ fontSize: '1rem', color: '#070750' }}>
          Business
        </strong>
    ),
    },    
    {
      component: CNavItem,
      name: 'Staff',
      to: '/staff',
      icon: <CIcon icon={cilGroup} customClassName="nav-icon" style={{ color: 'black' }}/>,
    },
    {
      component: CNavItem,
      name: 'Reservations',
      to: '/reservations',
      icon: <CIcon icon={cilCalendar} customClassName="nav-icon" style={{ color: 'black' }}/>,
    },
    {
      component: CNavTitle,
      name: (
          <strong style={{ fontSize: '1rem', color: '#070750' }}>
            Finance
          </strong>
      ),
    },
    {
      component: CNavItem,
      name: 'Accounts',
      to: '/Accounts',
      icon: <CIcon icon={cilAddressBook} customClassName="nav-icon" style={{ color: 'black' }}/>,
    },
    {
      component: CNavItem,
      name: 'Sales',
      to: 'Sales',
      icon: <CIcon icon={cilChartLine} customClassName="nav-icon" style={{ color: 'black' }}/>,
    },
    {
      component: CNavItem,
      name: 'Purchase',
      to: '/Purchase',
      icon: <CIcon icon={cilCart} customClassName="nav-icon" style={{ color: 'black' }}/>,
    },
    {
      component: CNavItem,
      name: 'Payment Method',
      to: '/PaymentMethod',
      icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" style={{ color: 'black' }}/>,
    },
    {
      component: CNavItem,
      name: 'Report',
      to: '/report',
      icon: <CIcon icon={cilChart} customClassName="nav-icon" style={{ color: 'black' }} />,
    },
    {
      component: CNavItem,
      name: 'Customer Support',
      to: '/CustomerSupport',
      icon: <CIcon icon={cilHeadphones} customClassName="nav-icon" style={{ color: 'black' }}/>,
    },
  ];
};

export default Nav;
