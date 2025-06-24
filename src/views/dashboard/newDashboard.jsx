/* eslint-disable react/react-in-jsx-scope */
import { Row, Col } from 'react-bootstrap';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const profitData = [
  { month: 'Jan', profit: 850 },
  { month: 'Feb', profit: 920 },
  { month: 'Mar', profit: 1100 },
  { month: 'Apr', profit: 1450 },
  { month: 'May', profit: 800 },
  { month: 'Jun', profit: 1900 },
  { month: 'Jul', profit: 2400 },
  { month: 'Aug', profit: 2200 },
  { month: 'Sep', profit: 2000 },
  { month: 'Oct', profit: 2700 },
  { month: 'Nov', profit: 3000 },
  { month: 'Dec', profit: 2500 },
];

const expensesData = [
  { name: 'Internet', value: 1200 },
  { name: 'Electricity', value: 1800 },
  { name: 'Transactions', value: 900 },
  { name: 'Rental', value: 2500 },
  { name: 'Food', value: 1600 },
  { name: 'Others', value: 1000 },
];

const incomeExpenseData = [
  { name: 'JAN', income: 5000, expense: 2000 },
  { name: 'FEB', income: 7000, expense: 3000 },
  { name: 'MAR', income: 10000, expense: 4000 },
  { name: 'APR', income: 7000, expense: 2500 },
  { name: 'MAY', income: 8000, expense: 3000 },
  { name: 'JUN', income: 6000, expense: 2000 },
];

const COLORS = ['#6C63FF', '#FF6F61', '#00B5A1', '#FFB400', '#B2FF00', '#FF8A65'];
const totalExpense = expensesData.reduce((acc, curr) => acc + curr.value, 0);

function formatMoney(value) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
}

// eslint-disable-next-line react/prop-types
const CustomCursor = ({ points, chartHeight }) => {
  const { x, y } = points?.[0] || {};
  if (x === undefined || y === undefined) return null;

  return (
    <g>
      <line x1={x - 3} x2={x - 3} y1={0} y2={chartHeight} stroke="white" strokeOpacity={0.5} strokeWidth={10} />
      <line x1={x + 3} x2={x + 3} y1={0} y2={chartHeight} stroke="white" strokeOpacity={0.5} strokeWidth={10} />
      <line x1={x} x2={x} y1={0} y2={chartHeight} stroke="#2196F3" strokeWidth={3} />
      <circle cx={x} cy={y} r={7} fill="#2196F3" stroke="#fff" strokeWidth={2} />
    </g>
  );
};

function DashboardCards() {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#F7F9FC', minHeight: '100vh' }}>
      <Row className="g-4">
        {/* Profit Chart Card */}
        <Col xs={12} md={6} lg={6} xl={6}>
          <div style={cardStyle}>
            <h2 style={cardHeading}>Monthly Profit Overview</h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={profitData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis tickFormatter={formatMoney} tick={{ fontSize: 12, fill: '#666' }} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip formatter={(value) => `₹${value}`} cursor={<CustomCursor chartHeight={250} />} />
                <Area type="monotone" dataKey="profit" stroke="#4CAF50" fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Expense Donut Chart Card */}
        <Col xs={12} md={6} lg={6} xl={6}>
          <div style={cardStyle}>
            <h2 style={cardHeading}>Expense Breakdown</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={expensesData}
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={5}
                  >
                    {expensesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ flex: 1, paddingLeft: '1rem' }}>
                {expensesData.map((entry, index) => (
                  <div key={entry.name} style={{ fontSize: '14px', marginBottom: '8px', color: '#666' }}>
                    <span style={{
                      width: 12, height: 12,
                      backgroundColor: COLORS[index],
                      display: 'inline-block', marginRight: 6,
                      borderRadius: '50%'
                    }}></span>
                    {entry.name} – {((entry.value / totalExpense) * 100).toFixed(1)}%
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>

        {/* Income & Expense Bar Chart Card */}
        <Col xs={12} md={6} lg={6} xl={6}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={cardHeading}>Income & Expense</h2>
              <select style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option>Last 6 months</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ color: '#4CAF50', fontWeight: '600' }}>
                TOTAL INCOME<br />₹50,000 <span style={{ fontSize: '12px', color: '#81C784' }}>+4.51%</span>
              </div>
              <div style={{ color: '#FF9800', fontWeight: '600' }}>
                TOTAL EXPENSE<br />₹10,000 <span style={{ fontSize: '12px', color: '#EF5350' }}>-2.41%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incomeExpenseData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="#00C853" radius={[10, 10, 0, 0]} />
                <Bar dataKey="expense" fill="#FF6F00" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        {/* Stock Availability Card */}
        <Col xs={12} md={6} lg={6} xl={6}>
          <div style={cardStyle}>
            <h2 style={cardHeading}>Stock Availability</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>TOTAL ASSET</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>₹50,000</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>TOTAL PRODUCT</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>150</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ flex: 1, height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '60%', height: '8px', backgroundColor: '#00BCD4', display: 'inline-block' }}></div>
                <div style={{ width: '25%', height: '8px', backgroundColor: '#E91E63', display: 'inline-block' }}></div>
                <div style={{ width: '15%', height: '8px', backgroundColor: '#FF9800', display: 'inline-block' }}></div>
              </div>
            </div>
            <div style={{ color: '#555', fontWeight: '600', marginBottom: '8px' }}>LOW STOCK</div>
            <div style={{ fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Pizza Base</span>
                <span style={{ color: '#888' }}>Qty: 3 <button style={{ marginLeft: '6px', color: '#2196F3', border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Order</button></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Burger Bun</span>
                <span style={{ color: '#888' }}>Qty: 2 <button style={{ marginLeft: '6px', color: '#2196F3', border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Order</button></span>
              </div>
            </div>
          </div>
        </Col>

      </Row>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  height: '100%',
};

const cardHeading = {
  fontSize: '18px',
  fontWeight: '600',
  marginBottom: '1rem',
  color: '#333',
};

export default DashboardCards;
